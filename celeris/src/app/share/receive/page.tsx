"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Download, FileIcon, Loader2, CheckCircle, XCircle, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlurFade from "@/components/ui/blur-fade";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { BorderBeam } from "@/components/ui/border-beam";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useWebRTC, ConnectionState } from "@/hooks/useWebRTC";
import { toast } from "@/hooks/use-toast";

// Reuse the formatFileSize function
function formatFileSize(size: number): string {
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + " MB";
  return (size / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

function ConnectionStatusIndicator({ state }: { state: ConnectionState }) {
  switch (state) {
    case ConnectionState.CONNECTED:
      return (
        <div className="flex items-center gap-2 text-green-500">
          <CheckCircle size={16} />
          <span>Connected</span>
        </div>
      );
    case ConnectionState.CONNECTING:
      return (
        <div className="flex items-center gap-2 text-blue-500">
          <Loader2 size={16} className="animate-spin" />
          <span>Connecting...</span>
        </div>
      );
    case ConnectionState.DISCONNECTED:
      return (
        <div className="flex items-center gap-2 text-gray-400">
          <XCircle size={16} />
          <span>Disconnected</span>
        </div>
      );
    case ConnectionState.ERROR:
      return (
        <div className="flex items-center gap-2 text-red-500">
          <XCircle size={16} />
          <span>Connection Error</span>
        </div>
      );
    default:
      return null;
  }
}

export default function Receive() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connectionId, setConnectionId] = useState("");
  const [inputConnectionId, setInputConnectionId] = useState("");
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  
  const { 
    connectionState, 
    createConnection, 
    closeConnection, 
    setRemoteConnectionId,
    receivedFiles,
    transferProgress,
    error
  } = useWebRTC("ws://localhost:8080");

  // Handle URL connection ID
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setConnectionId(id);
      setInputConnectionId(id);
    }
  }, [searchParams]);

  // Create connection when ID is available
  useEffect(() => {
    if (connectionId && connectionState === ConnectionState.DISCONNECTED) {
      setRemoteConnectionId(connectionId);
      createConnection();
    }
  }, [connectionId, connectionState, setRemoteConnectionId, createConnection]);

  // Handle errors and connection status changes
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: error
      });
    }
    
    if (connectionState === ConnectionState.CONNECTED) {
      toast({
        variant: "default",
        title: "Connected",
        description: "Connected to the sender. Files will appear as they are transferred."
      });
    }
  }, [error, connectionState]);

  const handleDisconnect = () => {
    closeConnection();
    router.push("/");
  };

  const handleConnect = () => {
    if (inputConnectionId) {
      setConnectionId(inputConnectionId);
      setShowConnectModal(false);
      
      // Create the connection
      setRemoteConnectionId(inputConnectionId);
      createConnection();
    } else {
      toast({
        variant: "destructive",
        title: "Missing Connection ID",
        description: "Please enter a valid connection ID."
      });
    }
  };

  const handleRetry = () => {
    closeConnection();
    setTimeout(() => {
      setRemoteConnectionId(connectionId);
      createConnection();
    }, 500);
  };

  const downloadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllFiles = () => {
    if (receivedFiles.length === 0) return;
    
    // For a single file, use the direct method
    if (receivedFiles.length === 1) {
      downloadFile(receivedFiles[0]);
      return;
    }
    
    // For multiple files, we would need to zip them
    // This is a simplified approach that downloads them one by one
    receivedFiles.forEach(file => {
      downloadFile(file);
    });
    
    toast({
      variant: "default",
      title: "Downloading Files",
      description: "Your files are being downloaded."
    });
  };

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
            <div className="mont text-lg text-gray-400 mt-4 flex flex-col sm:flex-row items-center gap-3">
              <span>
                {connectionId 
                  ? "Connected with ID: " + connectionId.substring(0, 4) + "..." + connectionId.substring(connectionId.length - 4) 
                  : "Paste a link or enter a connection ID to start receiving."
                }
              </span>
              <ConnectionStatusIndicator state={connectionState} />
              
              {connectionState !== ConnectionState.CONNECTING && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={connectionId ? handleRetry : () => setShowConnectModal(true)}
                  className="flex items-center gap-1"
                >
                  <RefreshCw size={14} />
                  {connectionId ? "Retry Connection" : "Connect Manually"}
                </Button>
              )}
            </div>
          </BlurFade>
          
          <div className="relative flex flex-col items-center justify-center bg-[#252525] w-[100dvh] h-[50dvh] p-4 rounded-md mt-5">
            {transferProgress && (
              <div className="absolute top-4 left-4 right-4 bg-[#1a1a1a] rounded-md p-3 space-y-2 z-10">
                <div className="flex justify-between text-sm">
                  <span>Receiving file...</span>
                  <span>{transferProgress.percentage}%</span>
                </div>
                <Progress value={transferProgress.percentage} className="h-2" />
                <div className="text-xs text-gray-400 text-right">
                  {formatFileSize(transferProgress.receivedSize)} / {formatFileSize(transferProgress.totalSize)}
                </div>
              </div>
            )}
            
            <ScrollArea className="w-full h-[70vh] overflow-y-auto">
              {receivedFiles.length > 0 ? (
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-0">
                      <TableHead className="w-[70dvh]">File Name</TableHead>
                      <TableHead className="w-[20dvh]">Size</TableHead>
                      <TableHead className="w-[10dvh]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivedFiles.map((file, index) => (
                      <TableRow key={index} className="hover:bg-[#2a2a2a]">
                        <TableCell className="font-medium mont text-orange-400">{file.name}</TableCell>
                        <TableCell className="text-xs mont">{formatFileSize(file.size)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-0 h-8 w-8"
                            onClick={() => downloadFile(file)}
                          >
                            <Download size={16} className="text-orange-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  {connectionState === ConnectionState.CONNECTED ? (
                    <>
                      <FileIcon size={48} />
                      <p className="mt-4 text-center">Waiting for files to be sent...</p>
                    </>
                  ) : connectionState === ConnectionState.CONNECTING ? (
                    <>
                      <Loader2 size={48} className="animate-spin text-orange-400" />
                      <p className="mt-4 text-center">Establishing connection...</p>
                    </>
                  ) : connectionState === ConnectionState.ERROR ? (
                    <>
                      <XCircle size={48} className="text-red-500" />
                      <p className="mt-4 text-center">Connection error. Please try again.</p>
                    </>
                  ) : (
                    <>
                      <FileIcon size={48} />
                      <p className="mt-4 text-center">Connect to start receiving files.</p>
                    </>
                  )}
                </div>
              )}
            </ScrollArea>
            <BorderBeam size={150} duration={10} className="z-40" colorFrom="#ff7b00" colorTo="#fcbb7e" />
          </div>
          
          {receivedFiles.length > 0 && (
            <Button
              className="mt-5 mont font-bold transition-all ease-in-out hover:bg-orange-500 flex items-center gap-2"
              onClick={downloadAllFiles}
            >
              Download All <Download className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="outline"
            className="mt-3 mont text-sm"
            onClick={handleDisconnect}
          >
            Disconnect & Return Home
          </Button>
        </div>
      </div>

      {/* Connect Manually Dialog */}
      <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
        <DialogContent className="bg-[#1d1d1d] text-white border-none">
          <DialogHeader>
            <DialogTitle>Enter Connection ID</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the connection ID from the sender to establish a connection.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <input
              type="text"
              className="w-full p-2 bg-[#252525] text-white rounded"
              value={inputConnectionId}
              onChange={(e) => setInputConnectionId(e.target.value)}
              placeholder="Enter connection ID or full URL"
            />
            <div className="text-xs text-gray-500 mt-2">
              The connection ID is typically included in the URL shared by the sender.
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setShowConnectModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnect}>
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-black">
          <DialogHeader>
            <DialogTitle>Connection Status</DialogTitle>
            <DialogDescription>
              {connectionState === ConnectionState.CONNECTED 
                ? "Connected successfully. You can now receive files."
                : connectionState === ConnectionState.CONNECTING
                ? "Establishing connection..."
                : connectionState === ConnectionState.ERROR
                ? "Connection error. Please try again."
                : "Disconnected. Please reconnect to continue."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center my-4">
            <ConnectionStatusIndicator state={connectionState} />
          </div>
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}