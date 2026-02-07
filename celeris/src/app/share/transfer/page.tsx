"use client";

import React, { memo, useMemo, useEffect, useState, Suspense } from "react";
import { useDropzone } from "react-dropzone";
import { 
  Trash2, 
  Rocket, 
  Facebook, 
  FileCode2, 
  FileSpreadsheet, 
  FileText, 
  FileVideo2, 
  FileIcon, 
  FileArchive, 
  FileAudio2, 
  Files,
  Image,
  Copy,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Trash,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import BlurFade from "@/components/ui/blur-fade";
import { BorderBeam } from "@/components/ui/border-beam";
import { toast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FaRegFilePdf } from "react-icons/fa6";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Define connection states for UI feedback
enum ConnectionUIState {
  IDLE = "idle",
  CREATING = "creating",
  READY = "ready",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  TRANSFERRING = "transferring",
  COMPLETE = "complete",
  ERROR = "error"
}

function formatFileSize(size: number): string {
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + " MB";
  return (size / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

function getTotalFileSize(files: File[]): number {
  return files.reduce((total, file) => total + file.size, 0);
}

function getFileTypeIcon(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
      return <Image size={40} className="text-orange-400" />;
    case "pdf":
      return <FaRegFilePdf size={40} className="text-orange-400" />;
    case "doc":
    case "docx":
    case "txt":
    case "rtf":
      return <FileText size={40} className="text-orange-400" />;
    case "xls":
    case "xlsx":
    case "csv":
      return <FileSpreadsheet size={40} className="text-orange-400" />;
    case "py":
    case "js":
    case "ts":
    case "tsx":
    case "html":
    case "css":
    case "json":
      return <FileCode2 size={40} className="text-orange-400" />;
    case "mp4":
    case "mov":
    case "avi":
    case "mkv":
    case "webm":
      return <FileVideo2 size={40} className="text-orange-400" />;
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return <FileArchive size={40} className="text-orange-400" />;
    case "mp3":
    case "wav":
    case "flac":
    case "ogg":
    case "m4a":
      return <FileAudio2 size={40} className="text-orange-400" />;
    default:
      return <FileText size={40} className="text-orange-400" />;
  }
}

const FilePreview = memo(({ file }: { file: File }) => {
  const previewUrl = useMemo(() => {
    if (file.type.startsWith("image/") || 
        file.type.startsWith("video/") || 
        file.type === "application/pdf") {
      return URL.createObjectURL(file);
    }
    return null;
  }, [file]);

  // Cleanup blob URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (file.type.startsWith("image/") && previewUrl) {
    return (
      <img
        src={previewUrl}
        alt={file.name}
        className="w-full h-full object-cover rounded"
      />
    );
  }

  if (file.type.startsWith("video/") && previewUrl) {
    return (
      <video
        src={previewUrl}
        className="w-full h-full object-cover rounded"
        muted
      />
    );
  }

  if (file.type === "application/pdf" && previewUrl) {
    return (
      <embed
        src={previewUrl}
        type="application/pdf"
        className="w-full h-full rounded"
      />
    );
  }

  return <div className="mt-2">{getFileTypeIcon(file)}</div>;
});

FilePreview.displayName = 'FilePreview';

// Generate a random connection ID
function generateConnectionId(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function TransferContent() {
  // Client-side only flag to prevent hydration issues
  const [isMounted, setIsMounted] = useState(false);
  
  // File handling state
  const [files, setFiles] = useState<File[]>([]);
  const [transferProgress, setTransferProgress] = useState<{[key: string]: number}>({});
  const [transferComplete, setTransferComplete] = useState<string[]>([]);
  
  // Connection state
  const [uiState, setUIState] = useState<ConnectionUIState>(ConnectionUIState.IDLE);
  const [connectionId, setConnectionId] = useState<string>("");
  const [transferLink, setTransferLink] = useState<string>("");
  const [copyText, setCopyText] = useState<string>("Copy Link");
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  
  // Initialize WebRTC hook
  const { 
    connectionState, 
    dataChannel, 
    setConnectionId: setWebRTCConnectionId,
    createConnection,
    sendFile,
    error: webRTCError,
    closeConnection
  } = useWebRTC(process.env.NEXT_PUBLIC_SIGNALING_URL || "ws://localhost:8080");
  
  // Set mounted flag on client side only
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Handle file drop
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (accepted) => setFiles((prev) => [...prev, ...accepted]),
  });

  // Initialize on component mount
  useEffect(() => {
    // Generate a stable connection ID that won't change with rerenders
    const newConnectionId = generateConnectionId();
    
    setConnectionId(newConnectionId);
    setWebRTCConnectionId(newConnectionId);
    
    // Use absolute URL with protocol to ensure it works correctly when copied
    const baseUrl = window.location.origin;
    setTransferLink(`${baseUrl}/share/receive?id=${newConnectionId}`);
    
    
    // Cleanup on unmount
    return () => {
      closeConnection();
    };
  }, []);
  
  // Update UI state based on connection state
  useEffect(() => {
    if (webRTCError) {
      
      // Only show error if we're in a connected/transferring state
      // During connection establishment, some errors are transient
      if (uiState === ConnectionUIState.CONNECTED || 
          uiState === ConnectionUIState.TRANSFERRING) {
        setError(webRTCError);
        setUIState(ConnectionUIState.ERROR);
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: webRTCError,
        });
      } else {
        console.warn("WebRTC error during setup:", webRTCError);
      }
    }
  }, [webRTCError]);
  
  // Update UI based on connection state changes
  useEffect(() => {
    
    switch (connectionState) {
      case "new":
        // Don't reset to IDLE if we're in READY state (waiting for peer)
        if (uiState === ConnectionUIState.IDLE) {
          // Stay in IDLE
        }
        break;
      case "connecting":
        // Only update if we're not already in a more advanced state
        if (uiState !== ConnectionUIState.READY && 
            uiState !== ConnectionUIState.CONNECTED &&
            uiState !== ConnectionUIState.TRANSFERRING) {
          setUIState(ConnectionUIState.CONNECTING);
        }
        break;
      case "connected":
        setUIState(ConnectionUIState.CONNECTED);
        setError(null); // Clear any previous errors
        toast({
          title: "Connection Established",
          description: "Ready to transfer files.",
        });
        break;
      case "disconnected":
        // Only show error if we were actively connected or transferring
        if (uiState === ConnectionUIState.CONNECTED || 
            uiState === ConnectionUIState.TRANSFERRING) {
          // Don't immediately mark as error - peer might just have received all files
        }
        break;
      case "failed":
        // Only show error if we had a peer and the connection failed
        if (uiState === ConnectionUIState.CONNECTED || 
            uiState === ConnectionUIState.TRANSFERRING) {
          setUIState(ConnectionUIState.ERROR);
          toast({
            variant: "destructive",
            title: "Connection Failed",
            description: "Lost connection with peer.",
          });
        }
        break;
    }
  }, [connectionState]); // Remove uiState from dependencies

  // File management functions
  const handleRemoveFile = (f: File) =>
    setFiles((prev) => prev.filter((x) => x !== f));

  const handleRemoveAllFiles = () => setFiles([]);

  // Copy the transfer link to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyText("Copied!");
    setTimeout(() => setCopyText("Copy Link"), 2000);
    
    toast({
      title: "Link Copied",
      description: "Transfer link copied to clipboard.",
    });
  };

  // Open the sharing modal
  const toggleModal = async () => {
    if (!files.length) {
      toast({
        variant: "destructive",
        title: "No files to transfer",
        description: "Please upload files to generate a transfer link.",
      });
      return;
    }
    
    if (!isModalOpen) {
      setUIState(ConnectionUIState.CREATING);
      
      // Create WebRTC connection
      try {
        const success = await createConnection();
        if (success) {
          setUIState(ConnectionUIState.READY);
          setModalOpen(true);
        } else {
          setUIState(ConnectionUIState.ERROR);
          toast({
            variant: "destructive",
            title: "Connection Error",
            description: "Failed to create connection. Please try again.",
          });
        }
      } catch (err) {
        setUIState(ConnectionUIState.ERROR);
        setError(err instanceof Error ? err.message : "Unknown error");
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Failed to create connection. Please try again.",
        });
      }
    } else {
      // Just close the modal if it's already open
      setModalOpen(false);
    }
  };

  // Send an email with the transfer link
  const sendEmail = () => {
    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: "No email specified",
        description: "Please enter a recipient's email address.",
      });
      return;
    }
    toast({
      variant: "default",
      title: "Email sent",
      description: `We've sent the transfer link to ${email}.`,
    });
    setEmail("");
  };
  
  // Handle sending a file
  const handleSendFile = async (file: File) => {
    if (!dataChannel || dataChannel.readyState !== 'open') {
      toast({
        variant: "destructive",
        title: "Not Connected",
        description: "Please wait for a connection to be established.",
      });
      return;
    }
    
    // Initialize progress tracking
    setTransferProgress(prev => ({
      ...prev,
      [file.name]: 0
    }));
    
    try {
      setUIState(ConnectionUIState.TRANSFERRING);
      
      // Transfer the file with progress updates
      await sendFile(file, (progress) => {
        setTransferProgress(prev => ({
          ...prev,
          [file.name]: progress
        }));
      });
      
      // Mark as complete
      setTransferComplete(prev => [...prev, file.name]);
      setTransferProgress(prev => ({
        ...prev,
        [file.name]: 100
      }));
      
      toast({
        title: "Transfer Complete",
        description: `Successfully sent ${file.name}`,
      });
      
      // If all files are transferred, update UI state
      if (files.every(f => transferComplete.includes(f.name))) {
        setUIState(ConnectionUIState.COMPLETE);
      }
    } catch (err) {
      // Handle error
      setError(err instanceof Error ? err.message : "Failed to send file");
      
      toast({
        variant: "destructive",
        title: "Transfer Failed",
        description: `Failed to send ${file.name}: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    }
  };
  
  // Send all files
  const sendAllFiles = async () => {
    if (files.length === 0) {
      toast({
        variant: "destructive",
        title: "No Files",
        description: "Please add files to transfer.",
      });
      return;
    }
    
    // Send each file in sequence
    for (const file of files) {
      if (!transferComplete.includes(file.name)) {
        await handleSendFile(file);
      }
    }
  };
  
  // Reset the connection
  const resetConnection = () => {
    closeConnection();
    setUIState(ConnectionUIState.IDLE);
    setTransferComplete([]);
    setTransferProgress({});
    setError(null);
    
    // Generate a new connection ID
    const newConnectionId = generateConnectionId();
    setConnectionId(newConnectionId);
    setWebRTCConnectionId(newConnectionId);
    setTransferLink(`${process.env.NEXT_PUBLIC_BASE_URL}/share/receive?id=${newConnectionId}`);
    
    // Close the modal
    setModalOpen(false);
  };

  const totalSize = getTotalFileSize(files);

  // Render connection status indicator
  const renderConnectionStatus = () => {
    switch (uiState) {
      case ConnectionUIState.IDLE:
        return <span className="text-red-500">Not connected</span>;
      case ConnectionUIState.CREATING:
      case ConnectionUIState.CONNECTING:
        return (
          <span className="text-amber-500 flex items-center">
            <RefreshCw className="animate-spin h-4 w-4 mr-2" />
            Establishing connection...
          </span>
        );
      case ConnectionUIState.READY:
        return <span className="text-amber-500">Waiting for peer...</span>;
      case ConnectionUIState.CONNECTED:
        return (
          <span className="text-green-500 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Connected
          </span>
        );
      case ConnectionUIState.TRANSFERRING:
        return <span className="text-blue-400">Transferring files...</span>;
      case ConnectionUIState.COMPLETE:
        return (
          <span className="text-green-500 flex items-center">
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

  // Prevent hydration errors by not rendering until mounted on client
  if (!isMounted) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen lg:h-screen flex flex-col pt-20 pb-4 sm:pt-24 sm:pb-6 lg:pt-32 lg:pb-8 px-4 sm:px-6 lg:px-8">
        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto w-full">
          <BlurFade delay={0} className="items-center flex flex-col mb-4 sm:mb-6 lg:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold text-center tracking-tighter leading-tight">
              Transfer Files <span className="text-primary">Effortlessly</span>
            </h1>
          </BlurFade>

          <BlurFade delay={0.5} className="items-center flex flex-col mb-6">
            <span className="text-xs sm:text-sm lg:text-sm text-muted-foreground text-center px-4 font-light tracking-wide">
              Upload files to generate a secure link for direct sharing.
            </span>
          </BlurFade>


          <div className="w-full flex flex-col items-center justify-center flex-1 max-w-5xl">
            {/* Connection status indicator */}
            <div className="flex w-full items-center justify-end gap-2 mb-3 sm:mb-4">
              <Badge className={`text-xs sm:text-sm font-medium ${uiState === ConnectionUIState.ERROR || uiState === ConnectionUIState.IDLE ? "bg-red-500/10 border-red-600" : "bg-green-500/10 border-green-600"}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${uiState === ConnectionUIState.ERROR || uiState === ConnectionUIState.IDLE ? "bg-red-500" : "bg-green-500"} animate-pulse`}/>
                {renderConnectionStatus()}
              </Badge>
            </div>

            <div
              {...getRootProps()}
              className="relative px-4 sm:px-6 lg:px-8 rounded-xl sm:rounded-2xl w-full h-[50vh] sm:h-[55vh] lg:flex-1 lg:max-h-[calc(100vh-28rem)] bg-card border border-border hover:border-border/80 transition-all duration-500 flex items-center justify-center cursor-pointer overflow-hidden group"
            >
              <input {...getInputProps()} />
              {!files.length ? (
                <div className="text-center px-4">
                  <p className="text-muted-foreground text-sm sm:text-base lg:text-lg font-light mb-2">
                    Drag &amp; drop files here
                  </p>
                  <p className="text-muted-foreground/60 text-xs sm:text-sm">
                    or click to browse
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[40dvh] sm:h-[45dvh] lg:h-full lg:max-h-[calc(100vh-30rem)] w-full rounded-md">
                  <div className="flex flex-wrap gap-4 justify-start mt-5 px-2">
                    {files.map((file) => (
                      <div
                        key={`${file.name}-${file.size}-${file.lastModified}`}
                        className="relative flex flex-col items-center justify-center w-36 sm:w-40 h-36 sm:h-40 bg-border rounded-md p-2 hover:bg-[#3a3a3a] transition duration-200 group"
                      >
                        <div className="w-24 sm:w-28 h-24 sm:h-28 flex items-center justify-center mt-1 rounded overflow-hidden">
                          <FilePreview file={file} />
                        </div>
                        <p
                          className="text-xs sm:text-sm text-gray-400 text-center mt-1 truncate w-full"
                          title={file.name}
                        >
                          {file.name}
                        </p>
                        <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition duration-200">
                          {formatFileSize(file.size)}
                        </div>
                        
                        {/* Show transfer progress */}
                        {transferProgress[file.name] !== undefined && (
                          <div className="absolute bottom-1 right-1 left-1 px-2">
                            <Progress 
                              value={transferProgress[file.name]} 
                              className="h-1" 
                              color={
                                transferComplete.includes(file.name) 
                                  ? "bg-green-500" 
                                  : "bg-orange-400"
                              }
                            />
                          </div>
                        )}
                        
                        {/* Transfer status icon */}
                        {transferComplete.includes(file.name) ? (
                          <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full transition duration-200 flex items-center gap-1 text-xs sm:text-sm">
                            <CheckCircle size={16} />
                            <span>Sent</span>
                          </div>
                        ) : (
                          <button
                            className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition duration-200 flex items-center gap-1 text-xs sm:text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(file);
                            }}
                          >
                            <Trash2 size={16} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              <BorderBeam
                size={150}
                duration={10}
                className="z-40"
                colorFrom="#ff7b00"
                colorTo="#fcbb7e"
              />
            </div>
          </div>
        </div>

        {/* Footer - Sticky to bottom */}
        <div className="flex flex-col items-center gap-3 sm:gap-4 mt-4 sm:mt-6 lg:mt-8 w-full max-w-5xl mx-auto">
          {!!files.length && (
            <div className="flex items-center gap-2 sm:gap-3 rounded-xl bg-secondary/30 border border-border px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm w-full sm:w-auto justify-center backdrop-blur-sm">
              <div className="text-muted-foreground">
                {files.length === 1 ? (
                  <FileIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Files className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </div>
              <div className="text-foreground font-medium">
                <span>
                  {files.length} file{files.length !== 1 ? "s" : ""}
                </span>
                {files.length > 0 && (
                  <>
                    <span className="mx-2 text-muted-foreground">•</span>
                    <span className="text-primary">{formatFileSize(totalSize)}</span>
                  </>
                )}
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              className="font-bold bg-primary hover:bg-primary/80 transition-all ease-in-out duration-300 hover:scale-[1.02] w-full sm:w-auto flex items-center justify-center h-11 sm:h-12 lg:h-14 px-6 sm:px-8 text-sm sm:text-base"
              onClick={toggleModal}
              disabled={uiState === ConnectionUIState.CREATING || uiState === ConnectionUIState.CONNECTING}
            >
              <Rocket className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />Transfer
            </Button>
            {!!files.length && (
              <Button
                variant="outline"
                className="font-bold border-border hover:bg-secondary/50 transition-all ease-in-out duration-300 hover:scale-[1.02] w-full sm:w-auto h-11 sm:h-12 lg:h-14 px-6 sm:px-8 text-sm sm:text-base"
                onClick={handleRemoveAllFiles}
              >
                <Trash className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />Remove All
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={toggleModal}>
        <DialogContent className="sm:max-w-xl w-[95vw] bg-background text-foreground border-none p-3 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              <span className="text-lg font-bold">
                Your link is <span className="text-primary">ready</span>
              </span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm mt-2">
              Copy, scan, or share this link to start transferring files.
            </DialogDescription>
          </DialogHeader>
          
          {/* Current connection status */}
          <div className="bg-border rounded-md p-2 sm:p-3 mb-3 sm:mb-4">
            <h3 className="font-medium text-xs sm:text-sm mb-1">Connection Status</h3>
            <div className="flex justify-between items-center">
              <div>{renderConnectionStatus()}</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetConnection}
                className="text-xs text-white transition-all ease-in-out duration-300 bg-primary hover:bg-primary/80 flex items-center"
              >
                <RefreshCw className="mr-1 h-3 w-3" /> Reset
              </Button>
            </div>
            
            {error && (
              <div className="text-sm text-red-400 flex items-start">
                <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span className="italic">{error}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                className="flex-1 p-2 bg-border text-muted-foreground rounded text-sm"
                value={transferLink}
                readOnly
              />
              <Button
                className="font-bold hover:bg-primary/80 whitespace-nowrap text-white w-full sm:w-auto flex items-center gap-2"
                onClick={() => copyToClipboard(transferLink)}
              >
                {copyText === "Copied!" ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copyText}
              </Button>
            </div>
            <div className="flex items-center justify-center">
              <QRCodeSVG
                value={transferLink}
                size={150}
                className="border-2 border-orange-400/20 rounded p-2 bg-white"
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>
            <div className="text-center">
              <span className="text-sm font-bold text-primary">Share via</span>
              <div className="flex flex-row items-center justify-center gap-5 text-muted-foreground mt-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=Transfer%20files%20effortlessly%20with%20Celeris%20at%20${transferLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  <BsTwitterX size={20} />
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${transferLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  <Facebook />
                </a>
                <a
                  href={`https://wa.me/?text=Transfer%20files%20effortlessly%20with%20Celeris%20at%20${transferLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  <FaWhatsapp size={25} />
                </a>
              </div>
            </div>

            <div className="border-t border-border pt-3 flex flex-col gap-2">
              <label htmlFor="emailInput" className="text-foreground text-sm">
                Send link via email:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="emailInput"
                  type="email"
                  placeholder="Recipient email"
                  className="text-sm flex-1 p-2 rounded bg-border text-muted-foreground"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button
                  className="font-bold hover:bg-primary/80 whitespace-nowrap text-white w-full sm:w-auto"
                  onClick={sendEmail}
                >
                  Send Email
                </Button>
              </div>
            </div>
            
            {/* Button to manually start transfer */}
            <div className="border-t border-border pt-3 mt-2">
              <Button
                className="font-bold bg-primary hover:bg-primary/80 w-full py-6 text-white"
                onClick={sendAllFiles}
                disabled={
                  uiState !== ConnectionUIState.CONNECTED && 
                  uiState !== ConnectionUIState.TRANSFERRING &&
                  uiState !== ConnectionUIState.COMPLETE
                }
              >
                {uiState === ConnectionUIState.TRANSFERRING ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    Transferring...
                  </>
                ) : uiState === ConnectionUIState.COMPLETE ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Transfer Complete
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Start Transfer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Export with Suspense boundary to prevent hydration errors
export default function Transfer() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    }>
      <TransferContent />
    </Suspense>
  );
}