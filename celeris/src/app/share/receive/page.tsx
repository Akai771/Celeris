"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  X,
  Upload,
  FileIcon,
  LinkIcon,
  Copy,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BlurFade from "@/components/ui/blur-fade";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { BorderBeam } from "@/components/ui/border-beam";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FileReceiver } from "@/lib/transferFile";
import { useWebRTC } from "@/hooks/useWebRTC";

// Define connection states for UI feedback
enum ConnectionUIState {
  IDLE = "idle",
  JOINING = "joining",
  WAITING = "waiting",
  CONNECTED = "connected",
  RECEIVING = "receiving",
  COMPLETE = "complete",
  ERROR = "error"
}

// Format file size for display
function formatFileSize(size: number): string {
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + " MB";
  return (size / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

export default function Receive() {
  // Router and navigation
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Connection state
  const [uiState, setUIState] = useState<ConnectionUIState>(ConnectionUIState.IDLE);
  const [connectionIdInput, setConnectionIdInput] = useState<string>("");
  const [connectionId, setConnectionId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  // File state
  const [receivedFiles, setReceivedFiles] = useState<File[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<{[key: string]: number}>({});
  const fileReceiverRef = useRef<FileReceiver | null>(null);
  
  // Dialog state
  const [isConnectDialogOpen, setConnectDialogOpen] = useState<boolean>(false);
  const [isStatusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);
  
  // WebRTC hook
  const { 
    connectionState,
    dataChannel,
    error: webRTCError,
    setConnectionId: setWebRTCConnectionId,
    joinConnection,
    closeConnection
  } = useWebRTC("ws://localhost:8080");
  
  // Initialize from URL parameter
  useEffect(() => {
    const id = searchParams.get("id");
    console.log("URL connection ID:", id);
    
    if (id && id.trim() !== "") {
      console.log("Setting connection ID from URL:", id);
      setConnectionId(id);
      setConnectionIdInput(id);
      
      // Slight delay to ensure the WebRTC hook is fully initialized
      setTimeout(() => {
        console.log("Connecting with ID from URL:", id);
        handleConnect(id);
      }, 500);
    }
  }, []);
  
  // Watch for WebRTC errors
  useEffect(() => {
    if (webRTCError) {
      setError(webRTCError);
      setUIState(ConnectionUIState.ERROR);
      
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: webRTCError,
      });
    }
  }, [webRTCError]);
  
  // Initialize the file receiver when data channel is ready
  useEffect(() => {
    if (dataChannel && !fileReceiverRef.current) {
      // Create file receiver with callbacks for progress and completion
      fileReceiverRef.current = new FileReceiver(
        // Progress callback
        (progress) => {
          if (fileReceiverRef.current?.fileInfo) {
            setDownloadProgress(prev => ({
              ...prev, 
              [fileReceiverRef.current!.fileInfo!.name]: progress
            }));
          }
        },
        // File complete callback
        (file) => {
          // Add to received files
          setReceivedFiles(prev => [...prev, file]);
          
          toast({
            title: "File Received",
            description: `Successfully received ${file.name}`,
          });
        }
      );
      
      // Set up data channel message handler
      dataChannel.onmessage = (event) => {
        // Set UI state to receiving when data starts coming in
        setUIState(ConnectionUIState.RECEIVING);
        
        // Process the message
        if (fileReceiverRef.current) {
          fileReceiverRef.current.processMessage(event.data);
        }
      };
    }
  }, [dataChannel]);
  
  // Update UI based on connection state changes
  useEffect(() => {
    switch (connectionState) {
      case "new":
        setUIState(ConnectionUIState.IDLE);
        break;
      case "connecting":
        setUIState(ConnectionUIState.JOINING);
        break;
      case "connected":
        setUIState(ConnectionUIState.CONNECTED);
        setStatusDialogOpen(true);
        
        toast({
          title: "Connection Established",
          description: "Ready to receive files.",
        });
        break;
      case "disconnected":
      case "failed":
        if (uiState !== ConnectionUIState.COMPLETE) {
          setUIState(ConnectionUIState.ERROR);
          if (connectionState === "failed") {
            toast({
              variant: "destructive",
              title: "Connection Failed",
              description: "Could not establish connection with peer.",
            });
          }
        }
        break;
    }
  }, [connectionState, uiState]);
  
  // Handle connecting to a peer
  const handleConnect = async (id?: string) => {
    const connId = id || connectionIdInput;
    
    if (!connId.trim()) {
      toast({
        variant: "destructive",
        title: "No Connection ID",
        description: "Please enter a connection ID or use a valid link.",
      });
      return;
    }
    
    try {
      setUIState(ConnectionUIState.JOINING);
      setConnectionId(connId);
      setWebRTCConnectionId(connId);
      setConnectDialogOpen(false);
      
      // Join the WebRTC connection
      const success = await joinConnection();
      
      if (success) {
        setUIState(ConnectionUIState.WAITING);
      } else {
        throw new Error("Failed to join connection");
      }
    } catch (err) {
      setUIState(ConnectionUIState.ERROR);
      setError(err instanceof Error ? err.message : "Unknown error");
      
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect. Please check the connection ID and try again.",
      });
    }
  };
  
  // Disconnect from current session
  const handleDisconnect = () => {
    closeConnection();
    fileReceiverRef.current?.reset();
    setStatusDialogOpen(false);
    
    // If no files were received, reset completely
    if (receivedFiles.length === 0) {
      setUIState(ConnectionUIState.IDLE);
      setConnectionId("");
      setConnectionIdInput("");
      router.push("/share/receive");
    } else {
      setUIState(ConnectionUIState.COMPLETE);
    }
  };
  
  // Save a received file to disk
  const saveFile = (file: File) => {
    // Create a URL for the file
    const url = URL.createObjectURL(file);
    
    // Create a download link
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    
    // Trigger the download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: `Saving ${file.name} to your device`,
    });
  };
  
  // Save all received files
  const saveAllFiles = () => {
    if (receivedFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "No Files",
        description: "No files have been received yet.",
      });
      return;
    }
    
    // Save each file
    receivedFiles.forEach(file => saveFile(file));
  };
  
  // Start a new session
  const startNewSession = () => {
    closeConnection();
    fileReceiverRef.current?.reset();
    setUIState(ConnectionUIState.IDLE);
    setConnectionId("");
    setConnectionIdInput("");
    setReceivedFiles([]);
    setDownloadProgress({});
    setError(null);
    router.push("/share/receive");
  };
  
  // Render connection status indicator
  const renderConnectionStatus = () => {
    switch (uiState) {
      case ConnectionUIState.IDLE:
        return <span className="text-gray-400">Not connected</span>;
      case ConnectionUIState.JOINING:
      case ConnectionUIState.WAITING:
        return (
          <span className="text-yellow-400 flex items-center">
            <RefreshCw className="animate-spin h-4 w-4 mr-2" />
            {uiState === ConnectionUIState.JOINING ? "Joining connection..." : "Waiting for files..."}
          </span>
        );
      case ConnectionUIState.CONNECTED:
        return (
          <span className="text-green-400 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Connected
          </span>
        );
      case ConnectionUIState.RECEIVING:
        return <span className="text-blue-400">Receiving files...</span>;
      case ConnectionUIState.COMPLETE:
        return (
          <span className="text-green-400 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Transfer complete
          </span>
        );
      case ConnectionUIState.ERROR:
        return (
          <span className="text-red-400 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Connection error
          </span>
        );
    }
  };

  // Back button for navigation
  const BackButton = () => (
    <Link href="/">
      <button className="p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500">
        <ChevronLeft />
      </button>
    </Link>
  );
  
  return (
    <>
      <div className="p-4">
        <BackButton />
        <div className="min-h-[80dvh] flex flex-col items-center justify-center">
          <BlurFade delay={0} className="items-center justify-center flex flex-col">
            <h1 className="mont text-4xl font-bold">
              Receive Files with <span className="yellowtail text-orange-400 text-5xl">Ease</span>
            </h1>
          </BlurFade>
          <BlurFade delay={0.5}>
            <span className="mont text-lg text-gray-400">
              Enter a connection ID or paste a link to start receiving files.
            </span>
          </BlurFade>
          
          {/* Connection status indicator */}
          <div className="w-full flex justify-center my-2">
            {renderConnectionStatus()}
          </div>
          
          <div className="relative flex flex-col items-center justify-center bg-[#252525] w-[100dvh] h-[50dvh] p-4 rounded-md mt-5">
            {receivedFiles.length > 0 ? (
              <div className="scrollBar w-full h-[70vh] overflow-y-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[70dvh]">File Name</TableHead>
                      <TableHead className="w-[15dvh]">Size</TableHead>
                      <TableHead className="w-[15dvh]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivedFiles.map((file, index) => (
                      <TableRow key={index} className="hover:bg-[#303030]">
                        <TableCell className="font-medium mont text-orange-400">
                          {file.name}
                        </TableCell>
                        <TableCell className="text-xs mont">
                          {formatFileSize(file.size)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex items-center gap-1 hover:bg-orange-500/20 hover:text-orange-400"
                            onClick={() => saveFile(file)}
                          >
                            <Download className="h-4 w-4" />
                            <span className="text-xs">Save</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                {uiState === ConnectionUIState.IDLE ? (
                  <div className="text-center">
                    <FileIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="mont text-gray-400 mb-6">
                      No files received yet. Connect to start receiving files.
                    </p>
                    <Button 
                      className="mont font-bold bg-orange-500 hover:bg-orange-600 mb-4"
                      onClick={() => setConnectDialogOpen(true)}
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Enter Connection ID
                    </Button>
                  </div>
                ) : uiState === ConnectionUIState.JOINING || uiState === ConnectionUIState.WAITING ? (
                  <div className="text-center">
                    <RefreshCw className="w-16 h-16 text-orange-400 mx-auto mb-4 animate-spin" />
                    <p className="mont text-gray-300 mb-2">
                      {uiState === ConnectionUIState.JOINING ? "Joining connection..." : "Waiting for sender..."}
                    </p>
                    <p className="mont text-gray-500 text-sm">
                      Connection ID: {connectionId}
                    </p>
                  </div>
                ) : uiState === ConnectionUIState.ERROR ? (
                  <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <p className="mont text-red-400 mb-2">
                      Connection Error
                    </p>
                    <p className="mont text-gray-400 text-sm mb-6">
                      {error || "Failed to establish connection. Please try again."}
                    </p>
                    <Button 
                      className="mont font-bold bg-orange-500 hover:bg-orange-600"
                      onClick={startNewSession}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                    <p className="mont text-gray-300 mb-2">
                      Ready to receive files
                    </p>
                    <p className="mont text-gray-500 text-sm">
                      Waiting for sender to transfer files...
                    </p>
                  </div>
                )}
              </div>
            )}
            <BorderBeam
              size={150}
              duration={10}
              className="z-40"
              colorFrom="#ff7b00"
              colorTo="#fcbb7e"
            />
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 mt-5">
            {receivedFiles.length > 0 && (
              <Button 
                className="mont font-bold transition-all ease-in-out hover:bg-orange-500"
                onClick={saveAllFiles}
              >
                Download All <Download className="w-5 ml-2" />
              </Button>
            )}
            
            {(uiState === ConnectionUIState.CONNECTED || 
              uiState === ConnectionUIState.RECEIVING || 
              uiState === ConnectionUIState.COMPLETE) && (
              <Button 
                variant="outline" 
                className="mont font-bold transition-all ease-in-out"
                onClick={startNewSession}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                New Session
              </Button>
            )}
            
            {(uiState === ConnectionUIState.IDLE || uiState === ConnectionUIState.ERROR) && (
              <Button 
                className="mont font-bold transition-all ease-in-out hover:bg-orange-500"
                onClick={() => setConnectDialogOpen(true)}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Connect
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Connection dialog */}
      <Dialog open={isConnectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="bg-[#1d1d1d] text-white border-none">
          <DialogHeader>
            <DialogTitle className="mont text-lg font-bold">
              Enter Connection ID
            </DialogTitle>
            <DialogDescription className="mont text-gray-400 text-sm">
              Enter the connection ID or paste the link provided by the sender.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-2">
            <Input
              placeholder="Connection ID or full link"
              className="bg-[#252525] border-gray-700 text-white mont focus-visible:ring-orange-500"
              value={connectionIdInput}
              onChange={(e) => {
                const value = e.target.value;
                // Extract ID if it's a URL
                if (value.includes('?id=')) {
                  try {
                    const url = new URL(value);
                    const id = url.searchParams.get('id');
                    if (id) {
                      setConnectionIdInput(id);
                      return;
                    }
                  } catch {}
                }
                setConnectionIdInput(value);
              }}
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConnectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="mont font-bold bg-orange-500 hover:bg-orange-600"
              onClick={() => handleConnect()}
              disabled={!connectionIdInput.trim()}
            >
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Connection status dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="bg-[#1d1d1d] text-white border-none">
          <DialogHeader>
            <DialogTitle className="mont text-lg font-bold">
              Connection Established
            </DialogTitle>
            <DialogDescription className="mont text-gray-400 text-sm">
              You are now connected to the sender. Waiting for files...
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-black/30 rounded-md p-3 mb-4">
            <h3 className="font-medium text-sm mb-1">Connection Info</h3>
            <div className="flex justify-between items-center">
              <div className="text-sm flex items-center gap-2">
                <span className="text-gray-400">ID:</span>
                <code className="bg-black/30 px-2 py-1 rounded text-orange-400">
                  {connectionId}
                </code>
                <button 
                  className="text-gray-400 hover:text-white"
                  onClick={() => navigator.clipboard.writeText(connectionId)}
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              <div className="text-green-400 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Connected
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              className="mont"
            >
              <X className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}