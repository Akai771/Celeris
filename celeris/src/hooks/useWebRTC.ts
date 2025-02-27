import { useEffect, useRef, useState, useCallback } from "react";

// Define connection states for better status tracking
enum ConnectionState {
  NEW = "new",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  FAILED = "failed"
}

export function useWebRTC(signalingUrl: string) {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.NEW);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receivedFiles, setReceivedFiles] = useState<File[]>([]);

  // Create refs to hold persistent values across renders
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const signalingConnection = useRef<WebSocket | null>(null);
  const fileChunks = useRef<Uint8Array[]>([]);
  const currentFileInfo = useRef<{ name: string, type: string, size: number } | null>(null);
  const bytesReceived = useRef<number>(0);

  // Clean up function to reset everything
  const cleanupConnection = useCallback(() => {
    console.log("Cleaning up WebRTC connection");
    
    // Close data channel
    if (dataChannel) {
      try {
        console.log(`Closing data channel with state: ${dataChannel.readyState}`);
        if (dataChannel.readyState === 'open' || dataChannel.readyState === 'connecting') {
          dataChannel.close();
        }
      } catch (err) {
        console.error("Error closing data channel:", err);
      }
    }
    
    // Close peer connection
    if (peerConnection.current) {
      try {
        console.log(`Closing peer connection with state: ${peerConnection.current.connectionState}`);
        // Remove all event listeners to prevent memory leaks
        peerConnection.current.onicecandidate = null;
        peerConnection.current.oniceconnectionstatechange = null;
        peerConnection.current.onicegatheringstatechange = null;
        peerConnection.current.onconnectionstatechange = null;
        peerConnection.current.onnegotiationneeded = null;
        peerConnection.current.ondatachannel = null;
        
        // Close the connection
        peerConnection.current.close();
      } catch (err) {
        console.error("Error closing peer connection:", err);
      } finally {
        peerConnection.current = null;
      }
    }
    
    // Close signaling connection
    if (signalingConnection.current) {
      try {
        console.log(`Closing signaling connection with state: ${signalingConnection.current.readyState}`);
        if (signalingConnection.current.readyState === WebSocket.OPEN || 
            signalingConnection.current.readyState === WebSocket.CONNECTING) {
          // Remove event listeners
          signalingConnection.current.onopen = null;
          signalingConnection.current.onclose = null;
          signalingConnection.current.onerror = null;
          signalingConnection.current.onmessage = null;
          
          // Close the connection
          signalingConnection.current.close();
        }
      } catch (err) {
        console.error("Error closing signaling connection:", err);
      } finally {
        signalingConnection.current = null;
      }
    }
    
    // Reset state
    setDataChannel(null);
    setConnectionState(ConnectionState.DISCONNECTED);
    fileChunks.current = [];
    currentFileInfo.current = null;
    bytesReceived.current = 0;
    
    console.log("Connection cleanup complete");
  }, [dataChannel]);

  // Initialize WebRTC peer connection
  const initPeerConnection = useCallback(() => {
    try {
      console.log("Initializing WebRTC peer connection");
      
      // Configure ICE servers for better connectivity
      const configuration: RTCConfiguration = {
        iceServers: [
          // Use multiple STUN servers to improve connectivity chances
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ],
        // These options help improve connection robustness
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle' as RTCBundlePolicy,
        rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy
      };

      const pc = new RTCPeerConnection(configuration);
      peerConnection.current = pc;
      
      // Log negotiation needed events
      pc.onnegotiationneeded = () => {
        console.log("Negotiation needed event fired");
      };

      // Handle ICE candidate events
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("ICE candidate generated:", event.candidate.candidate ? event.candidate.candidate.substr(0, 50) + '...' : 'empty');
          
          if (signalingConnection.current?.readyState === WebSocket.OPEN) {
            try {
              signalingConnection.current.send(JSON.stringify({
                type: 'candidate',
                candidate: event.candidate,
                connectionId: connectionId
              }));
              console.log("ICE candidate sent to signaling server");
            } catch (err) {
              console.error('Error sending ICE candidate:', err);
              setError('Failed to send ICE candidate');
            }
          } else {
            console.warn('Signaling connection not open, cannot send ICE candidate');
          }
        } else {
          console.log("ICE candidate gathering complete");
        }
      };
      
      // Track ICE gathering state
      pc.onicegatheringstatechange = () => {
        console.log('ICE gathering state:', pc.iceGatheringState);
      };

      // Track connection state changes
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state changed to:', pc.iceConnectionState);
        
        switch (pc.iceConnectionState) {
          case 'checking':
            console.log("ICE checking - connection attempt in progress");
            break;
          case 'connected':
          case 'completed':
            console.log("ICE connected/completed - connection established");
            setConnectionState(ConnectionState.CONNECTED);
            break;
          case 'failed':
            console.log("ICE failed - connection attempt failed");
            setConnectionState(ConnectionState.FAILED);
            setError('Connection failed - please check your connection and try again');
            break;
          case 'disconnected':
            console.log("ICE disconnected - connection may recover automatically");
            // Don't change state to DISCONNECTED yet, as it might recover
            // Set a timeout to change state if it doesn't recover
            const disconnectTimeout = setTimeout(() => {
              if (pc.iceConnectionState === 'disconnected') {
                console.log("ICE still disconnected after timeout, marking as DISCONNECTED");
                setConnectionState(ConnectionState.DISCONNECTED);
              }
            }, 5000); // 5 second recovery window
            
            // Clear the timeout if component unmounts
            return () => clearTimeout(disconnectTimeout);
          case 'closed':
            console.log("ICE closed - connection terminated");
            setConnectionState(ConnectionState.DISCONNECTED);
            break;
          default:
            console.log(`Unhandled ICE connection state: ${pc.iceConnectionState}`);
            break;
        }
      };
      
      // Track connection state (newer API)
      pc.onconnectionstatechange = () => {
        console.log('Connection state changed to:', pc.connectionState);
        
        switch (pc.connectionState) {
          case 'connected':
            console.log("Connection established");
            setConnectionState(ConnectionState.CONNECTED);
            break;
          case 'failed':
            console.log("Connection failed");
            setConnectionState(ConnectionState.FAILED);
            setError('Connection failed - please check your connection and try again');
            break;
          case 'closed':
            console.log("Connection closed");
            setConnectionState(ConnectionState.DISCONNECTED);
            break;
        }
      };

      // Handle data channels that are created by the remote peer
      pc.ondatachannel = (event) => {
        console.log("Data channel received from remote peer:", event.channel.label);
        const channel = event.channel;
        setupDataChannel(channel);
      };

      console.log("Peer connection initialized successfully");
      return pc;
    } catch (err) {
      const error = err as Error;
      console.error('Error creating peer connection:', error);
      setError(`Failed to create peer connection: ${error.message || 'Unknown error'}`);
      return null;
    }
  }, [connectionId]);

  // Set up and configure the data channel
  const setupDataChannel = useCallback((channel: RTCDataChannel) => {
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      console.log('Data channel is open');
      setConnectionState(ConnectionState.CONNECTED);
      setDataChannel(channel);
    };

    channel.onclose = () => {
      console.log('Data channel closed');
      setConnectionState(ConnectionState.DISCONNECTED);
      setDataChannel(null);
    };

    channel.onerror = (event) => {
      console.error('Data channel error:', event);
      setError('Data channel error occurred');
    };

    // Handle incoming file data
    channel.onmessage = (event) => {
      const data = event.data;
      
      // If data is a string, it's file metadata
      if (typeof data === 'string') {
        try {
          const fileInfo = JSON.parse(data);
          if (fileInfo.type === 'file-info') {
            // Store file info for later use
            currentFileInfo.current = {
              name: fileInfo.name,
              type: fileInfo.mimeType,
              size: fileInfo.size
            };
            
            // Reset for new file
            fileChunks.current = [];
            bytesReceived.current = 0;
            
            console.log(`Receiving file: ${fileInfo.name}, size: ${fileInfo.size} bytes`);
          } else if (fileInfo.type === 'file-complete') {
            // File transfer complete, reconstruct the file
            finalizeFileTransfer();
          }
        } catch (err) {
          console.error('Error processing file metadata:', err);
        }
      } 
      // If data is binary, it's file content
      else if (data instanceof ArrayBuffer) {
        // Store the chunk
        fileChunks.current.push(new Uint8Array(data));
        bytesReceived.current += data.byteLength;
        
        // Log progress for large files
        if (currentFileInfo.current && currentFileInfo.current.size > 1000000) {
          const progress = Math.round((bytesReceived.current / currentFileInfo.current.size) * 100);
          if (progress % 10 === 0) {
            console.log(`File transfer progress: ${progress}%`);
          }
        }
      }
    };

    return channel;
  }, []);

  // Reconstruct and save the received file
  const finalizeFileTransfer = useCallback(() => {
    if (!currentFileInfo.current || fileChunks.current.length === 0) {
      console.error('No file data to finalize');
      return;
    }

    try {
      // Calculate total size and create a buffer
      const totalSize = fileChunks.current.reduce((total, chunk) => total + chunk.length, 0);
      const fileBuffer = new Uint8Array(totalSize);
      
      // Copy all chunks into the file buffer
      let offset = 0;
      for (const chunk of fileChunks.current) {
        fileBuffer.set(chunk, offset);
        offset += chunk.length;
      }
      
      // Create file from buffer
      const file = new File(
        [fileBuffer.buffer], 
        currentFileInfo.current.name, 
        { type: currentFileInfo.current.type }
      );
      
      console.log(`File received: ${file.name}, size: ${file.size} bytes`);
      
      // Add to received files list
      setReceivedFiles(prev => [...prev, file]);
      
      // Reset for next file
      fileChunks.current = [];
      currentFileInfo.current = null;
      bytesReceived.current = 0;
    } catch (err) {
      console.error('Error finalizing file transfer:', err);
      setError('Failed to reconstruct received file');
    }
  }, []);

  // Connect to the signaling server
  const connectToSignalingServer = useCallback(() => {
    try {
      console.log(`Connecting to signaling server at ${signalingUrl} with ID: ${connectionId}`);
      
      // Close existing connection if any
      if (signalingConnection.current && signalingConnection.current.readyState === WebSocket.OPEN) {
        console.log('Closing existing signaling connection');
        signalingConnection.current.close();
      }
      
      const ws = new WebSocket(signalingUrl);
      signalingConnection.current = ws;

      ws.onopen = () => {
        console.log('Connected to signaling server');
        setConnectionState(ConnectionState.CONNECTING);
        
        // If we already have a connection ID, send a join message
        if (connectionId) {
          console.log(`Sending join message for ID: ${connectionId}`);
          try {
            ws.send(JSON.stringify({
              type: 'join',
              connectionId: connectionId
            }));
          } catch (err) {
            console.error('Error sending join message:', err);
          }
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from signaling server');
        if (connectionState !== ConnectionState.CONNECTED) {
          setConnectionState(ConnectionState.DISCONNECTED);
        }
      };

      ws.onerror = (event) => {
        console.error('Signaling server error:', event);
        setError('Failed to connect to signaling server');
        setConnectionState(ConnectionState.FAILED);
      };

      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          
          console.log('Received message type:', message.type, 
                      message.connectionId ? `for connection: ${message.connectionId}` : '');
          
          // Process welcome message from server
          if (message.type === 'welcome') {
            console.log('Received welcome message from server, client ID:', message.clientId);
            return;
          }
          
          // Only process messages for our connection ID
          if (message.connectionId && message.connectionId !== connectionId && 
              connectionId !== null) {
            console.log(`Ignoring message for different connection ID: ${message.connectionId}`);
            return;
          }

          if (message.type === 'joined' || message.type === 'registered') {
            console.log(`Connection ${message.type} with ID: ${message.connectionId}`);
            return;
          }

          if (message.type === 'offer' && peerConnection.current) {
            console.log('Processing offer');
            
            try {
              await peerConnection.current.setRemoteDescription(new RTCSessionDescription(message.offer));
              const answer = await peerConnection.current.createAnswer();
              await peerConnection.current.setLocalDescription(answer);
              
              console.log('Created answer, sending to peer');
              ws.send(JSON.stringify({
                type: 'answer',
                answer: answer,
                connectionId: connectionId
              }));
            } catch (err) {
              const error = err as Error;
              console.error('Error processing offer:', error);
              setError(`Error processing offer: ${error.message}`);
            }
          }
          else if (message.type === 'answer' && peerConnection.current) {
            console.log('Processing answer');
            try {
              await peerConnection.current.setRemoteDescription(new RTCSessionDescription(message.answer));
              console.log('Set remote description from answer');
            } catch (err) {
              const error = err as Error;
              console.error('Error setting remote description from answer:', error);
              setError(`Error processing answer: ${error.message}`);
            }
          }
          else if (message.type === 'candidate' && peerConnection.current) {
            console.log('Adding ICE candidate');
            try {
              if (message.candidate) {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(message.candidate));
                console.log('Added ICE candidate');
              } else {
                console.warn('Received empty ICE candidate');
              }
            } catch (err) {
              console.error('Error adding ICE candidate:', err);
              // Don't set error state for ICE candidate issues as they can be non-fatal
            }
          }
          else if (message.type === 'error') {
            console.error('Received error from signaling server:', message.message);
            setError(`Server error: ${message.message}`);
          }
        } catch (err) {
          const error = err as Error;
          console.error('Error handling signaling message:', error);
          console.error('Raw message:', typeof event.data === 'string' ? event.data.substring(0, 100) : 'non-string data');
          setError(`Error processing signaling message: ${error.message}`);
        }
      };

      return ws;
    } catch (err) {
      const error = err as Error;
      console.error('Error connecting to signaling server:', error);
      setError(`Failed to connect to signaling server: ${error.message}`);
      return null;
    }
  }, [connectionId, connectionState]);

  // Create a connection as initiator (sender)
  const createConnection = useCallback(async () => {
    try {
      if (!connectionId) {
        console.error("Cannot create connection without connectionId");
        setError("Connection ID is required");
        return false;
      }
      
      console.log(`Creating connection as initiator with ID: ${connectionId}`);
      setConnectionState(ConnectionState.CONNECTING);
      setError(null);
      
      // Ensure any existing connections are closed
      cleanupConnection();
      
      // Initialize WebSocket
      const ws = connectToSignalingServer();
      if (!ws) {
        throw new Error('Failed to connect to signaling server');
      }
      
      // We need to wait for the WebSocket to be ready before continuing
      await new Promise<void>((resolve, reject) => {
        const checkReady = () => {
          if (signalingConnection.current?.readyState === WebSocket.OPEN) {
            resolve();
          } else if (signalingConnection.current?.readyState === WebSocket.CLOSED || 
                    signalingConnection.current?.readyState === WebSocket.CLOSING) {
            reject(new Error('Signaling connection closed'));
          } else {
            // Check again in 100ms
            setTimeout(checkReady, 100);
          }
        };
        
        // Start checking
        checkReady();
        
        // Set a timeout
        setTimeout(() => reject(new Error('Timed out waiting for signaling connection')), 5000);
      });
      
      console.log("Signaling connection established, initializing peer connection");
      
      // Initialize RTCPeerConnection
      const pc = initPeerConnection();
      if (!pc) {
        throw new Error('Failed to initialize peer connection');
      }
      
      // Register with the signaling server
      console.log("Sending register message");
      signalingConnection.current?.send(JSON.stringify({
        type: 'register',
        connectionId: connectionId
      }));

      // Create data channel
      console.log("Creating data channel");
      const channel = pc.createDataChannel('fileTransfer', {
        ordered: true
      });
      
      setupDataChannel(channel);
      
      // Create and send offer
      console.log("Creating offer");
      const offer = await pc.createOffer();
      console.log("Setting local description");
      await pc.setLocalDescription(offer);
      
      console.log("Sending offer to signaling server");
      signalingConnection.current?.send(JSON.stringify({
        type: 'offer',
        offer: offer,
        connectionId: connectionId
      }));
      
      console.log("Connection setup complete");
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error creating connection:', error);
      setError(`Failed to create connection: ${error.message || 'Unknown error'}`);
      setConnectionState(ConnectionState.FAILED);
      cleanupConnection();
      return false;
    }
  }, [cleanupConnection, connectToSignalingServer, connectionId, initPeerConnection, setupDataChannel]);

  // Join an existing connection (receiver)
  const joinConnection = useCallback(async () => {
    try {
      if (!connectionId) {
        console.error("Cannot join connection without connectionId");
        setError('Connection ID is required to join a connection');
        return false;
      }
      
      console.log(`Joining connection as receiver with ID: ${connectionId}`);
      setConnectionState(ConnectionState.CONNECTING);
      setError(null);
      
      // Ensure any existing connections are closed
      cleanupConnection();
      
      // Initialize WebSocket
      const ws = connectToSignalingServer();
      if (!ws) {
        throw new Error('Failed to connect to signaling server');
      }
      
      // We need to wait for the WebSocket to be ready before continuing
      await new Promise<void>((resolve, reject) => {
        const checkReady = () => {
          if (signalingConnection.current?.readyState === WebSocket.OPEN) {
            resolve();
          } else if (signalingConnection.current?.readyState === WebSocket.CLOSED || 
                    signalingConnection.current?.readyState === WebSocket.CLOSING) {
            reject(new Error('Signaling connection closed'));
          } else {
            // Check again in 100ms
            setTimeout(checkReady, 100);
          }
        };
        
        // Start checking
        checkReady();
        
        // Set a timeout
        setTimeout(() => reject(new Error('Timed out waiting for signaling connection')), 5000);
      });
      
      console.log("Signaling connection established, initializing peer connection");
      
      // Initialize RTCPeerConnection
      const pc = initPeerConnection();
      if (!pc) {
        throw new Error('Failed to initialize peer connection');
      }
      
      // Send join message to signaling server
      console.log("Sending join message to signaling server");
      signalingConnection.current?.send(JSON.stringify({
        type: 'join',
        connectionId: connectionId
      }));
      
      console.log("Join connection setup complete, waiting for offer");
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error joining connection:', error);
      setError(`Failed to join connection: ${error.message || 'Unknown error'}`);
      setConnectionState(ConnectionState.FAILED);
      cleanupConnection();
      return false;
    }
  }, [cleanupConnection, connectToSignalingServer, connectionId, initPeerConnection]);

  // Send a file
  const sendFile = useCallback((file: File) => {
    if (!dataChannel || dataChannel.readyState !== 'open') {
      setError('Data channel is not open');
      return false;
    }

    try {
      // Send file metadata first
      const fileInfo = {
        type: 'file-info',
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size
      };
      
      dataChannel.send(JSON.stringify(fileInfo));
      console.log(`Sending file: ${file.name}, size: ${file.size} bytes`);
      
      // Read and send file in chunks
      const chunkSize = 16 * 1024; // 16 KB chunks
      let offset = 0;
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target && e.target.result && dataChannel.readyState === 'open') {
          dataChannel.send(e.target.result as ArrayBuffer);
          
          offset += chunkSize;
          
          if (offset < file.size) {
            // Read the next chunk
            readChunk();
          } else {
            // Signal completion
            dataChannel.send(JSON.stringify({ type: 'file-complete' }));
            console.log('File sent successfully');
          }
        }
      };
      
      reader.onerror = (e) => {
        console.error('Error reading file:', e);
        setError('Error reading file');
      };
      
      // Function to read chunks
      const readChunk = () => {
        const slice = file.slice(offset, offset + chunkSize);
        reader.readAsArrayBuffer(slice);
      };
      
      // Start reading
      readChunk();
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error sending file:', error);
      setError(`Failed to send file: ${error.message || 'Unknown error'}`);
      return false;
    }
  }, [dataChannel]);

  // Close connection
  const closeConnection = useCallback(() => {
    console.log('Closing connection');
    cleanupConnection();
    return true;
  }, [cleanupConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupConnection();
    };
  }, [cleanupConnection]);

  return {
    connectionState,
    dataChannel,
    error,
    receivedFiles,
    setConnectionId,
    createConnection,
    joinConnection,
    sendFile,
    closeConnection
  };
}