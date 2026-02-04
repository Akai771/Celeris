"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import { 
  ChevronLeft, 
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
  AlertTriangle
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
import { transferFile } from "@/lib/transferFile";
import { Progress } from "@/components/ui/progress";

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

function FilePreview({ file }: { file: File }) {
  if (file.type.startsWith("image/")) {
    return (
      <img
        src={URL.createObjectURL(file)}
        alt={file.name}
        className="w-full h-full object-cover rounded"
      />
    );
  }

  if (file.type.startsWith("video/")) {
    return (
      <video
        src={URL.createObjectURL(file)}
        className="w-full h-full object-cover rounded"
        muted
      />
    );
  }

  if (file.type === "application/pdf") {
    return (
      <embed
        src={URL.createObjectURL(file)}
        type="application/pdf"
        className="w-full h-full rounded"
      />
    );
  }

  return <div className="mt-2">{getFileTypeIcon(file)}</div>;
}

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
  } = useWebRTC("ws://localhost:8080");
  
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
    console.log("Generated connection ID:", newConnectionId);
    
    setConnectionId(newConnectionId);
    setWebRTCConnectionId(newConnectionId);
    
    // Use absolute URL with protocol to ensure it works correctly when copied
    const baseUrl = window.location.origin;
    setTransferLink(`${baseUrl}/share/receive?id=${newConnectionId}`);
    
    console.log("Transfer link:", `${baseUrl}/share/receive?id=${newConnectionId}`);
    
    // Cleanup on unmount
    return () => {
      console.log("Transfer component unmounting, closing connection");
      closeConnection();
    };
  }, []);
  
  // Update UI state based on connection state
  useEffect(() => {
    if (webRTCError) {
      console.log("WebRTC error received:", webRTCError, "Current UI state:", uiState);
      
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
    console.log("Connection state changed to:", connectionState, "UI state:", uiState);
    
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
          console.log("Disconnected while connected/transferring");
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
      await sendFile(file);
      
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
    setTransferLink(`http://localhost:3000/share/receive?id=${newConnectionId}`);
    
    // Close the modal
    setModalOpen(false);
  };

  // Navigation back button
  const BackButton = () => (
    <Link href="/">
      <button className="p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500">
        <ChevronLeft />
      </button>
    </Link>
  );

  const totalSize = getTotalFileSize(files);

  // Render connection status indicator
  const renderConnectionStatus = () => {
    switch (uiState) {
      case ConnectionUIState.IDLE:
        return <span className="text-gray-400">Not connected</span>;
      case ConnectionUIState.CREATING:
      case ConnectionUIState.CONNECTING:
        return (
          <span className="text-yellow-400 flex items-center">
            <RefreshCw className="animate-spin h-4 w-4 mr-2" />
            Establishing connection...
          </span>
        );
      case ConnectionUIState.READY:
        return <span className="text-yellow-400">Waiting for peer...</span>;
      case ConnectionUIState.CONNECTED:
        return (
          <span className="text-green-400 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Connected
          </span>
        );
      case ConnectionUIState.TRANSFERRING:
        return <span className="text-blue-400">Transferring files...</span>;
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

  // Prevent hydration errors by not rendering until mounted on client
  if (!isMounted) {
    return null;
  }

  return (
    <>
      <div className="p-4">
        <BackButton />

        <div className="min-h-[10dvh] flex flex-col items-start sm:items-center justify-start sm:justify-center">
          <BlurFade delay={0} className="items-start sm:items-center flex flex-col sm:text-center">
            <h1 className="mont text-3xl sm:text-4xl font-bold">
              Transfer Files <span className="yellowtail text-orange-400">Effortlessly</span>
            </h1>
          </BlurFade>

          <BlurFade delay={0.5}>
            <span className="mont text-base sm:text-lg text-gray-400 mt-2 sm:mt-1">
              Upload files to generate a secure link for direct sharing.
            </span>
          </BlurFade>
          
          {/* Connection status indicator */}
          <div className="w-full flex justify-center my-2">
            {renderConnectionStatus()}
          </div>
          
          <div
            {...getRootProps()}
            className="relative px-4 rounded-md w-full max-w-[102dvh] h-[60dvh] bg-[#252525] flex items-center justify-center cursor-pointer"
          >
            <input {...getInputProps()} />
            {!files.length ? (
              <p className="mont text-stone-500 text-center px-2">
                Drag &amp; drop files here, or click to select files
              </p>
            ) : (
              <ScrollArea className="h-[53dvh] w-[100dvh] rounded-md">
                <div className="flex flex-wrap gap-4 justify-start mt-5 px-2">
                  {files.map((file, i) => (
                    <div
                      key={i}
                      className="relative flex flex-col items-center justify-center w-36 sm:w-40 h-36 sm:h-40 bg-[#2d2d2d] rounded-md p-2 hover:bg-[#3a3a3a] transition duration-200 group"
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
          <div className="flex flex-col items-start sm:items-center gap-3 mt-5 w-full sm:w-auto">
            {!!files.length && (
              <div className="flex items-center gap-2 rounded-lg bg-gray-800/50 px-3 py-2 text-sm w-full sm:w-auto">
                <div className="text-gray-400">
                  {files.length === 1 ? (
                    <FileIcon className="h-4 w-4" />
                  ) : (
                    <Files className="h-4 w-4" />
                  )}
                </div>
                <div className="text-gray-300">
                  <span>
                    {files.length} file{files.length !== 1 ? "s" : ""}
                  </span>
                  {files.length > 0 && (
                    <>
                      <span className="mx-2 text-gray-500">•</span>
                      <span className="font-medium">{formatFileSize(totalSize)}</span>
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <Button
                className="mont font-bold hover:bg-orange-500 transition-all ease-in-out w-full sm:w-auto flex items-center justify-center"
                onClick={toggleModal}
                disabled={uiState === ConnectionUIState.CREATING || uiState === ConnectionUIState.CONNECTING}
              >
                Transfer <Rocket className="w-5 ml-2" />
              </Button>
              {!!files.length && (
                <Button
                  variant="destructive"
                  className="mont font-bold transition-all ease-in-out w-full sm:w-auto"
                  onClick={handleRemoveAllFiles}
                >
                  Remove All
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={toggleModal}>
        <DialogContent className="sm:max-w-xl w-full bg-[#1d1d1d] text-white border-none p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-white">
              <span className="mont text-lg font-bold">
                Your link is <span className="yellowtail text-orange-400 text-2xl">ready</span>
              </span>
            </DialogTitle>
            <DialogDescription className="mont text-gray-400 text-sm mt-2">
              Copy, scan, or share this link to start transferring files.
            </DialogDescription>
          </DialogHeader>
          
          {/* Current connection status */}
          <div className="bg-black/30 rounded-md p-3 mb-4">
            <h3 className="font-medium text-sm mb-1">Connection Status</h3>
            <div className="flex justify-between items-center">
              <div>{renderConnectionStatus()}</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetConnection}
                className="text-xs"
              >
                <RefreshCw className="mr-1 h-3 w-3" /> Reset
              </Button>
            </div>
            
            {error && (
              <div className="mt-2 text-sm text-red-400 flex items-start">
                <AlertTriangle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                className="flex-1 p-2 bg-[#252525] text-stone-500 rounded text-sm"
                value={transferLink}
                readOnly
              />
              <Button
                className="mont font-bold hover:bg-orange-500 whitespace-nowrap text-white w-full sm:w-auto flex items-center gap-2"
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
              <span className="mont text-sm font-bold text-orange-400">Share via</span>
              <div className="flex flex-row items-center justify-center gap-5 text-gray-400 mt-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=Transfer%20files%20effortlessly%20with%20Celeris%20at%20${transferLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-orange-400"
                >
                  <BsTwitterX size={20} />
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${transferLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-orange-400"
                >
                  <Facebook />
                </a>
                <a
                  href={`https://wa.me/?text=Transfer%20files%20effortlessly%20with%20Celeris%20at%20${transferLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-orange-400"
                >
                  <FaWhatsapp size={25} />
                </a>
              </div>
            </div>

            <div className="border-t border-stone-700 pt-3 flex flex-col gap-2">
              <label htmlFor="emailInput" className="mont text-stone-400 text-sm">
                Send link via email:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="emailInput"
                  type="email"
                  placeholder="Recipient email"
                  className="mont text-sm flex-1 p-2 rounded bg-[#252525] text-stone-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button
                  className="mont font-bold hover:bg-orange-500 whitespace-nowrap text-white w-full sm:w-auto"
                  onClick={sendEmail}
                >
                  Send Email
                </Button>
              </div>
            </div>
            
            {/* Button to manually start transfer */}
            <div className="border-t border-stone-700 pt-3 mt-2">
              <Button
                className="mont font-bold bg-orange-500 hover:bg-orange-600 w-full py-6 text-white"
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
        <div className="text-white">Loading...</div>
      </div>
    }>
      <TransferContent />
    </Suspense>
  );
}