import { useRef, useState, useCallback, useEffect } from "react";

// Define types for file transfer
interface FileMetadata {
  name: string;
  type: string;
  size: number;
}

interface FileProgress {
  receivedSize: number;
  totalSize: number;
  percentage: number;
}

export enum ConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ERROR = "error"
}

export function useWebRTC(signalingUrl: string) {
    const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
    const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
    const [remoteConnectionId, setRemoteConnectionId] = useState<string | null>(null);
    const [transferProgress, setTransferProgress] = useState<FileProgress | null>(null);
    const [receivedFiles, setReceivedFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const signalingRef = useRef<WebSocket | null>(null);
    const receivedChunksRef = useRef<ArrayBuffer[]>([]);
    const currentFileMetadataRef = useRef<FileMetadata | null>(null);
    
    // Cleanup function to reset state
    const cleanup = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        
        if (signalingRef.current && signalingRef.current.readyState === WebSocket.OPEN) {
            signalingRef.current.close();
            signalingRef.current = null;
        }
        
        // Reset state
        setConnectionState(ConnectionState.DISCONNECTED);
        setDataChannel(null);
        setTransferProgress(null);
        receivedChunksRef.current = [];
        currentFileMetadataRef.current = null;
        setError(null);
    }, []);

    // Initialize the WebRTC connection
    const createConnection = useCallback(async () => {
        // Don't create a new connection if one already exists
        if (connectionState === ConnectionState.CONNECTING || 
            connectionState === ConnectionState.CONNECTED) {
            console.warn("Connection already active or in progress");
            return;
        }
        
        try {
            setConnectionState(ConnectionState.CONNECTING);
            
            // Create WebSocket connection for signaling
            const ws = new WebSocket(signalingUrl);
            signalingRef.current = ws;
            
            // Create RTCPeerConnection
            const configuration = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            };
            
            const peerConnection = new RTCPeerConnection(configuration);
            peerConnectionRef.current = peerConnection;
            
            // Create data channel for file transfer
            const channel = peerConnection.createDataChannel("fileTransfer", {
                ordered: true,
                maxRetransmits: 30
            });
            
            // Configure the data channel
            channel.binaryType = "arraybuffer";
            channel.bufferedAmountLowThreshold = 65535; // 64 KB
            
            // Set up event handlers for the data channel
            channel.onopen = () => {
                console.log("Data channel opened");
                setConnectionState(ConnectionState.CONNECTED);
                setDataChannel(channel);
            };
            
            channel.onclose = () => {
                console.log("Data channel closed");
                setConnectionState(ConnectionState.DISCONNECTED);
                setDataChannel(null);
            };
            
            channel.onerror = (error) => {
                console.error("Data channel error:", error);
                setError(`Data channel error: ${error}`);
                setConnectionState(ConnectionState.ERROR);
            };
            
            // Handle receiving data
            channel.onmessage = (event) => {
                // Check if it's file metadata (JSON) or binary data
                if (typeof event.data === 'string') {
                    try {
                        const metadata = JSON.parse(event.data) as FileMetadata;
                        console.log("Received file metadata:", metadata);
                        
                        // Store the metadata for the file being received
                        currentFileMetadataRef.current = metadata;
                        
                        // Initialize progress and received chunks
                        setTransferProgress({
                            receivedSize: 0,
                            totalSize: metadata.size,
                            percentage: 0
                        });
                        
                        receivedChunksRef.current = [];
                    } catch (error) {
                        console.error("Error parsing file metadata:", error);
                    }
                } else if (event.data instanceof ArrayBuffer) {
                    // Handle received file chunk
                    if (currentFileMetadataRef.current) {
                        // Add the chunk to our collection
                        receivedChunksRef.current.push(event.data);
                        
                        // Update progress
                        const receivedSize = receivedChunksRef.current.reduce(
                            (total, chunk) => total + chunk.byteLength, 
                            0
                        );
                        
                        const totalSize = currentFileMetadataRef.current.size;
                        const percentage = Math.min(
                            Math.round((receivedSize / totalSize) * 100),
                            100
                        );
                        
                        setTransferProgress({
                            receivedSize,
                            totalSize,
                            percentage
                        });
                        
                        // Check if transfer is complete
                        if (receivedSize >= totalSize) {
                            // All chunks received, reconstruct the file
                            const completeBuffer = new Uint8Array(totalSize);
                            let offset = 0;
                            
                            for (const chunk of receivedChunksRef.current) {
                                completeBuffer.set(new Uint8Array(chunk), offset);
                                offset += chunk.byteLength;
                            }
                            
                            // Create a Blob and then a File from the buffer
                            const blob = new Blob([completeBuffer], {
                                type: currentFileMetadataRef.current.type || 'application/octet-stream'
                            });
                            
                            const file = new File(
                                [blob],
                                currentFileMetadataRef.current.name || 'received-file',
                                {
                                    type: currentFileMetadataRef.current.type || 'application/octet-stream'
                                }
                            );
                            
                            // Add the file to the received files list
                            setReceivedFiles(prev => [...prev, file]);
                            
                            // Reset state for next file
                            receivedChunksRef.current = [];
                            currentFileMetadataRef.current = null;
                            setTransferProgress(null);
                        }
                    } else {
                        console.error("Received file chunk with no metadata");
                    }
                }
            };
            
            // Set up WebSocket event handlers for signaling
            ws.onopen = () => {
                console.log("Signaling WebSocket connected");
            };
            
            ws.onclose = () => {
                console.log("Signaling WebSocket closed");
                if (connectionState !== ConnectionState.CONNECTED) {
                    // Only set to disconnected if we're not already connected via WebRTC
                    // (WebRTC can continue working after signaling is done)
                    setConnectionState(ConnectionState.DISCONNECTED);
                    setError("Signaling server connection closed");
                }
            };
            
            ws.onerror = (event) => {
                console.error("Signaling WebSocket error:", event);
                setError("Signaling server connection error");
                setConnectionState(ConnectionState.ERROR);
            };
            
            // Handle signaling messages
            ws.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    // Only process messages for our connection ID
                    if (data.connectionId && data.connectionId !== remoteConnectionId) {
                        return;
                    }
                    
                    if (data.type === "offer") {
                        console.log("Received offer");
                        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
                        const answer = await peerConnection.createAnswer();
                        await peerConnection.setLocalDescription(answer);
                        
                        ws.send(JSON.stringify({
                            type: "answer",
                            answer,
                            connectionId: remoteConnectionId
                        }));
                    } else if (data.type === "answer") {
                        console.log("Received answer");
                        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                    } else if (data.type === "candidate") {
                        console.log("Received ICE candidate");
                        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                    }
                } catch (error) {
                    console.error("Error processing signaling message:", error);
                    setError(`Signaling error: ${error.message}`);
                }
            };
            
            // ICE candidate handling
            peerConnection.onicecandidate = (event) => {
                if (event.candidate && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: "candidate",
                        candidate: event.candidate,
                        connectionId: remoteConnectionId
                    }));
                }
            };
            
            peerConnection.oniceconnectionstatechange = () => {
                console.log("ICE connection state:", peerConnection.iceConnectionState);
                
                switch (peerConnection.iceConnectionState) {
                    case "connected":
                    case "completed":
                        setConnectionState(ConnectionState.CONNECTED);
                        break;
                    case "failed":
                    case "disconnected":
                    case "closed":
                        setConnectionState(ConnectionState.DISCONNECTED);
                        break;
                }
            };
            
            // Create and send offer if we're the initiating side
            if (remoteConnectionId) {
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: "offer",
                        offer,
                        connectionId: remoteConnectionId
                    }));
                }
            }
            
            // Set data channel for access outside
            setDataChannel(channel);
            
        } catch (error) {
            console.error("Error creating WebRTC connection:", error);
            setError(`Connection error: ${error.message}`);
            setConnectionState(ConnectionState.ERROR);
            cleanup();
        }
    }, [connectionState, remoteConnectionId, signalingUrl, cleanup]);
    
    // Close the connection
    const closeConnection = useCallback(() => {
        cleanup();
    }, [cleanup]);
    
    // Send a file over the data channel
    const sendFile = useCallback(async (file: File) => {
        if (!dataChannel || dataChannel.readyState !== "open") {
            throw new Error("Data channel is not open");
        }
        
        // First send metadata
        const metadata: FileMetadata = {
            name: file.name,
            type: file.type,
            size: file.size
        };
        
        // Send metadata as JSON
        dataChannel.send(JSON.stringify(metadata));
        
        // Initialize progress
        setTransferProgress({
            receivedSize: 0,
            totalSize: file.size,
            percentage: 0
        });
        
        // Read and send the file in chunks
        const chunkSize = 64 * 1024; // 64 KB chunks
        let offset = 0;
        
        const reader = new FileReader();
        
        // This will read a chunk of the file and send it
        const readNextChunk = () => {
            const slice = file.slice(offset, offset + chunkSize);
            reader.readAsArrayBuffer(slice);
        };
        
        // When a chunk is loaded, send it
        reader.onload = (e) => {
            if (e.target?.result instanceof ArrayBuffer) {
                dataChannel.send(e.target.result);
                
                // Update progress
                offset += e.target.result.byteLength;
                const percentage = Math.min(
                    Math.round((offset / file.size) * 100),
                    100
                );
                
                setTransferProgress({
                    receivedSize: offset,
                    totalSize: file.size,
                    percentage
                });
                
                // Continue if there's more to send
                if (offset < file.size) {
                    // Check if the buffer is getting full
                    if (dataChannel.bufferedAmount > dataChannel.bufferedAmountLowThreshold) {
                        // Wait for buffer to drain before continuing
                        const onBufferedAmountLow = () => {
                            dataChannel.removeEventListener('bufferedamountlow', onBufferedAmountLow);
                            readNextChunk();
                        };
                        
                        dataChannel.addEventListener('bufferedamountlow', onBufferedAmountLow);
                    } else {
                        // Buffer is not full, continue immediately
                        readNextChunk();
                    }
                } else {
                    // Transfer complete
                    console.log("File transfer complete");
                    
                    // Reset progress after a short delay
                    setTimeout(() => {
                        setTransferProgress(null);
                    }, 1000);
                }
            }
        };
        
        reader.onerror = (error) => {
            console.error("Error reading file:", error);
            setError(`Error reading file: ${error}`);
            setTransferProgress(null);
        };
        
        // Start the process
        readNextChunk();
    }, [dataChannel]);
    
    // Clean up on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);
    
    return {
        connectionState,
        createConnection,
        closeConnection,
        dataChannel,
        setRemoteConnectionId,
        sendFile,
        transferProgress,
        receivedFiles,
        error
    };
}