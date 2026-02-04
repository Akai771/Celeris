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
  const connectionIdRef = useRef<string | null>(null); // Ref to track connectionId without stale closures
  const dataChannelRef = useRef<RTCDataChannel | null>(null); // Ref to track dataChannel without stale closures
  const fileChunks = useRef<Uint8Array[]>([]);
  const currentFileInfo = useRef<{ name: string, type: string, size: number } | null>(null);
  const bytesReceived = useRef<number>(0);
  const pendingCandidates = useRef<RTCIceCandidate[]>([]); // Queue for ICE candidates before signaling is ready
  const setupDataChannelRef = useRef<((channel: RTCDataChannel) => RTCDataChannel) | null>(null); // Ref to avoid stale closure
  const hasRemotePeer = useRef<boolean>(false); // Track if we've connected with a remote peer (received answer/offer)

  // Custom setter for connectionId that updates both state and ref
  const updateConnectionId = useCallback((id: string | null) => {
    connectionIdRef.current = id;
    setConnectionId(id);
  }, []);

  // Send any queued ICE candidates
  const flushPendingCandidates = useCallback(() => {
    while (pendingCandidates.current.length > 0 && signalingConnection.current?.readyState === WebSocket.OPEN) {
      const candidate = pendingCandidates.current.shift();
      if (candidate) {
        try {
          signalingConnection.current.send(JSON.stringify({
            type: 'candidate',
            candidate: candidate,
            connectionId: connectionIdRef.current
          }));
          console.log('Sent queued ICE candidate');
        } catch (err) {
          console.error('Error sending queued ICE candidate:', err);
        }
      }
    }
  }, []);

  // Clean up function to reset everything
  const cleanupConnection = useCallback(() => {
    console.log("Cleaning up WebRTC connection");
    
    // Close data channel - use ref to avoid stale closures
    if (dataChannelRef.current) {
      try {
        console.log(`Closing data channel with state: ${dataChannelRef.current.readyState}`);
        if (dataChannelRef.current.readyState === 'open' || dataChannelRef.current.readyState === 'connecting') {
          dataChannelRef.current.close();
        }
      } catch (err) {
        console.error("Error closing data channel:", err);
      }
      dataChannelRef.current = null;
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
    dataChannelRef.current = null; // Update ref
    setDataChannel(null);
    setConnectionState(ConnectionState.DISCONNECTED);
    fileChunks.current = [];
    currentFileInfo.current = null;
    bytesReceived.current = 0;
    hasRemotePeer.current = false; // Reset remote peer tracking
    pendingCandidates.current = []; // Clear pending candidates
    
    console.log("Connection cleanup complete");
  }, []); // No dependencies - uses refs which are always current

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
          
          const candidateMessage = {
            type: 'candidate',
            candidate: event.candidate,
            connectionId: connectionIdRef.current // Use ref instead of state
          };
          
          if (signalingConnection.current?.readyState === WebSocket.OPEN) {
            try {
              signalingConnection.current.send(JSON.stringify(candidateMessage));
              console.log("ICE candidate sent to signaling server");
            } catch (err) {
              console.error('Error sending ICE candidate:', err);
              // Queue for later
              pendingCandidates.current.push(event.candidate);
            }
          } else {
            console.warn('Signaling connection not open, queuing ICE candidate');
            pendingCandidates.current.push(event.candidate);
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
        console.log('ICE connection state changed to:', pc.iceConnectionState, '| hasRemotePeer:', hasRemotePeer.current);
        
        switch (pc.iceConnectionState) {
          case 'checking':
            console.log("ICE checking - connection attempt in progress");
            break;
          case 'connected':
          case 'completed':
            console.log("ICE connected/completed - connection established");
            setConnectionState(ConnectionState.CONNECTED);
            setError(null); // Clear any previous errors
            break;
          case 'failed':
            // Only mark as failed if we actually have a remote peer
            // If no remote peer yet, this is just ICE gathering timeout - not a real failure
            if (hasRemotePeer.current) {
              console.log("ICE failed with remote peer - connection attempt failed");
              setTimeout(() => {
                if (pc.iceConnectionState === 'failed') {
                  console.log("ICE still failed after timeout, marking as FAILED");
                  setConnectionState(ConnectionState.FAILED);
                  setError('Connection failed - please check your connection and try again');
                }
              }, 3000);
            } else {
              console.log("ICE failed but no remote peer yet - waiting for peer to join");
              // Don't set error - we're still waiting for the peer
            }
            break;
          case 'disconnected':
            console.log("ICE disconnected - connection may recover automatically");
            // Don't change state to DISCONNECTED yet, as it might recover
            // Set a timeout to change state if it doesn't recover
            setTimeout(() => {
              if (pc.iceConnectionState === 'disconnected') {
                console.log("ICE still disconnected after timeout, marking as DISCONNECTED");
                setConnectionState(ConnectionState.DISCONNECTED);
              }
            }, 5000); // 5 second recovery window
            break;
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
        console.log('Connection state changed to:', pc.connectionState, '| hasRemotePeer:', hasRemotePeer.current);
        
        switch (pc.connectionState) {
          case 'connected':
            console.log("Connection established");
            setConnectionState(ConnectionState.CONNECTED);
            setError(null); // Clear any previous errors
            break;
          case 'failed':
            // Only mark as failed if we have a remote peer
            if (hasRemotePeer.current) {
              console.log("Connection failed with remote peer - checking if it recovers");
              setTimeout(() => {
                if (pc.connectionState === 'failed') {
                  console.log("Connection still failed after timeout");
                  setConnectionState(ConnectionState.FAILED);
                  setError('Connection failed - please check your connection and try again');
                }
              }, 3000);
            } else {
              console.log("Connection state 'failed' but no remote peer yet - ignoring");
            }
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
        // Use ref to get the current setupDataChannel function (avoids stale closure)
        if (setupDataChannelRef.current) {
          setupDataChannelRef.current(channel);
        }
      };

      console.log("Peer connection initialized successfully");
      return pc;
    } catch (err) {
      const error = err as Error;
      console.error('Error creating peer connection:', error);
      setError(`Failed to create peer connection: ${error.message || 'Unknown error'}`);
      return null;
    }
  }, []); // No dependencies - uses refs which are always current

  // Set up and configure the data channel
  const setupDataChannel = useCallback((channel: RTCDataChannel) => {
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      console.log('Data channel is open');
      setConnectionState(ConnectionState.CONNECTED);
      dataChannelRef.current = channel; // Update ref
      setDataChannel(channel);
    };

    channel.onclose = () => {
      console.log('Data channel closed');
      setConnectionState(ConnectionState.DISCONNECTED);
      dataChannelRef.current = null; // Update ref
      setDataChannel(null);
    };

    channel.onerror = (event: Event) => {
      // RTCErrorEvent has an error property, but it may not be present in all browsers
      const rtcEvent = event as RTCErrorEvent;
      
      // Check if this is an actual error with details
      if (rtcEvent.error && rtcEvent.error.message) {
        const errorMessage = rtcEvent.error.message;
        console.warn('Data channel error:', errorMessage);
        // Only set error state for critical errors
        if (errorMessage.toLowerCase().includes('fatal') || 
            errorMessage.toLowerCase().includes('failed')) {
          setError(`Data channel error: ${errorMessage}`);
        }
      } else {
        // Non-fatal or browser-specific event, just log for debugging
        console.log('Data channel event:', event.type, '(non-critical)');
      }
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

  // Store setupDataChannel in ref so initPeerConnection can access it
  setupDataChannelRef.current = setupDataChannel;

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
      console.log(`Connecting to signaling server at ${signalingUrl} with ID: ${connectionIdRef.current}`);
      
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
        // Note: Don't send join/register here - let createConnection or joinConnection handle it
        // This prevents duplicate messages and ensures proper registration vs join flow
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
          if (message.connectionId && message.connectionId !== connectionIdRef.current && 
              connectionIdRef.current !== null) {
            console.log(`Ignoring message for different connection ID: ${message.connectionId}`);
            return;
          }

          if (message.type === 'joined' || message.type === 'registered') {
            console.log(`Connection ${message.type} with ID: ${message.connectionId}`);
            // Flush any pending ICE candidates after registration confirmation
            flushPendingCandidates();
            return;
          }

          // Handle peer-joined (receiver joined, sender should resend offer)
          if (message.type === 'peer-joined') {
            console.log('Peer joined the connection, resending offer if we are the sender');
            // Resend offer if we have a peer connection with local description
            if (peerConnection.current && peerConnection.current.localDescription) {
              console.log('Resending existing offer to new peer');
              ws.send(JSON.stringify({
                type: 'offer',
                offer: peerConnection.current.localDescription,
                connectionId: connectionIdRef.current
              }));
              // Also flush any pending candidates
              flushPendingCandidates();
            }
            return;
          }

          // Handle peer-disconnected
          if (message.type === 'peer-disconnected') {
            console.log('Peer disconnected from the connection');
            // Optionally handle peer disconnection
            return;
          }

          if (message.type === 'offer' && peerConnection.current) {
            console.log('Processing offer - setting hasRemotePeer = true');
            hasRemotePeer.current = true; // We now have a remote peer
            
            try {
              await peerConnection.current.setRemoteDescription(new RTCSessionDescription(message.offer));
              const answer = await peerConnection.current.createAnswer();
              await peerConnection.current.setLocalDescription(answer);
              
              console.log('Created answer, sending to peer');
              ws.send(JSON.stringify({
                type: 'answer',
                answer: answer,
                connectionId: connectionIdRef.current
              }));
            } catch (err) {
              const error = err as Error;
              console.error('Error processing offer:', error);
              setError(`Error processing offer: ${error.message}`);
            }
          }
          else if (message.type === 'answer' && peerConnection.current) {
            console.log('Processing answer - setting hasRemotePeer = true');
            hasRemotePeer.current = true; // We now have a remote peer
            
            try {
              await peerConnection.current.setRemoteDescription(new RTCSessionDescription(message.answer));
              console.log('Set remote description from answer - connection should establish now');
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
  }, [signalingUrl, flushPendingCandidates]);

  // Create a connection as initiator (sender)
  const createConnection = useCallback(async () => {
    try {
      if (!connectionIdRef.current) {
        console.error("Cannot create connection without connectionId");
        setError("Connection ID is required");
        return false;
      }
      
      console.log(`Creating connection as initiator with ID: ${connectionIdRef.current}`);
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
        connectionId: connectionIdRef.current
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
        connectionId: connectionIdRef.current
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
  }, [cleanupConnection, connectToSignalingServer, initPeerConnection, setupDataChannel]);

  // Join an existing connection (receiver)
  const joinConnection = useCallback(async () => {
    try {
      if (!connectionIdRef.current) {
        console.error("Cannot join connection without connectionId");
        setError('Connection ID is required to join a connection');
        return false;
      }
      
      console.log(`Joining connection as receiver with ID: ${connectionIdRef.current}`);
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
        connectionId: connectionIdRef.current
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
  }, [cleanupConnection, connectToSignalingServer, initPeerConnection]);

  // Send a file
  const sendFile = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (!dataChannel || dataChannel.readyState !== 'open') {
        setError('Data channel is not open');
        reject(new Error('Data channel is not open'));
        return;
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
              // Read the next chunk - use setTimeout to avoid blocking
              setTimeout(readChunk, 0);
            } else {
              // Signal completion
              dataChannel.send(JSON.stringify({ type: 'file-complete' }));
              console.log('File sent successfully');
              resolve(true);
            }
          } else if (dataChannel.readyState !== 'open') {
            reject(new Error('Data channel closed during transfer'));
          }
        };
        
        reader.onerror = (e) => {
          console.error('Error reading file:', e);
          setError('Error reading file');
          reject(new Error('Error reading file'));
        };
        
        // Function to read chunks
        const readChunk = () => {
          const slice = file.slice(offset, offset + chunkSize);
          reader.readAsArrayBuffer(slice);
        };
        
        // Start reading
        readChunk();
      } catch (err) {
        const error = err as Error;
        console.error('Error sending file:', error);
        setError(`Failed to send file: ${error.message || 'Unknown error'}`);
        reject(error);
      }
    });
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
    setConnectionId: updateConnectionId, // Use the wrapper that updates both state and ref
    createConnection,
    joinConnection,
    sendFile,
    closeConnection
  };
}