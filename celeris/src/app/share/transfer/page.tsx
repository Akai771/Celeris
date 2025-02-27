"use client";

import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import { ChevronLeft, Trash2, Rocket, Facebook, FileCode2, FileSpreadsheet, FileText, FileVideo2, FileIcon, FileArchive, FileAudio2, Files, Image, Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import BlurFade from "@/components/ui/blur-fade";
import { BorderBeam } from "@/components/ui/border-beam";
import LinkGenerator from "./LinkGenerator";
import { toast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FaRegFilePdf } from "react-icons/fa6";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useWebRTC, ConnectionState } from "@/hooks/useWebRTC";
import { Progress } from "@/components/ui/progress";

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
      return <Image size={40} className="text-orange-400" />;
    case "pdf":
      return <FaRegFilePdf size={40} className="text-orange-400" />;
    case "doc":
    case "docx":
      return <FileText size={40} className="text-orange-400" />;
    case "xls":
    case "xlsx":
      return <FileSpreadsheet size={40} className="text-orange-400" />;
    case "py":
    case "js":
    case "ts":
    case "tsx":
    case "html":
    case "css":
      return <FileCode2 size={40} className="text-orange-400" />;
    case "mp4":
    case "mov":
    case "avi":
      return <FileVideo2 size={40} className="text-orange-400" />;
    case "zip":
    case "rar":
    case "7z":
      return <FileArchive size={40} className="text-orange-400" />;
    case "mp3":
    case "wav":
    case "flac":
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

export default function Transfer() {
  const [files, setFiles] = useState<File[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [transferLink, setTransferLink] = useState("");
  const [copyText, setCopyText] = useState("Copy Link");
  const [email, setEmail] = useState("");
  const [connectionID, setConnectionID] = useState("");
  const [currentFileIndex, setCurrentFileIndex] = useState<number | null>(null);
  const [transferComplete, setTransferComplete] = useState(false);

  const { 
    connectionState,
    createConnection, 
    closeConnection, 
    setRemoteConnectionId, 
    sendFile,
    transferProgress 
  } = useWebRTC("ws://localhost:8080");

  useEffect(() => {
    // Generate connection ID for the transfer
    const generatedID = LinkGenerator();
    setConnectionID(generatedID);
    setTransferLink(`${window.location.origin}/share/receive?id=${generatedID}`);
  }, []);

  useEffect(() => {
    // Handle file transfer queue when connection is established
    if (connectionState === ConnectionState.CONNECTED && files.length > 0 && currentFileIndex === null && !transferComplete) {
      setCurrentFileIndex(0);
    }
  }, [connectionState, files, currentFileIndex, transferComplete]);

  useEffect(() => {
    // Process the file transfer queue
    const processFileTransfer = async () => {
      if (currentFileIndex !== null && 
          connectionState === ConnectionState.CONNECTED && 
          currentFileIndex < files.length && 
          !transferProgress) {
        
        try {
          // Send current file
          await sendFile(files[currentFileIndex]);
          
          // Wait for this file to finish transferring before moving to the next
          const checkProgress = setInterval(() => {
            if (!transferProgress) {
              clearInterval(checkProgress);
              
              // Move to next file or complete
              if (currentFileIndex + 1 < files.length) {
                setCurrentFileIndex(currentFileIndex + 1);
              } else {
                setCurrentFileIndex(null);
                setTransferComplete(true);
                toast({
                  title: "Transfer Complete",
                  description: "All files have been successfully transferred.",
                  variant: "default"
                });
              }
            }
          }, 1000);
        } catch (error) {
          console.error("Error sending file:", error);
          toast({
            title: "Transfer Failed",
            description: "There was an error transferring your files. Please try again.",
            variant: "destructive"
          });
          setCurrentFileIndex(null);
        }
      }
    };

    processFileTransfer();
  }, [currentFileIndex, connectionState, files, sendFile, transferProgress]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (accepted) => setFiles((prev) => [...prev, ...accepted]),
  });

  const handleRemoveFile = (f: File) =>
    setFiles((prev) => prev.filter((x) => x !== f));

  const handleRemoveAllFiles = () => {
    setFiles([]);
    setCurrentFileIndex(null);
    setTransferComplete(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyText("Copied!");
    setTimeout(() => setCopyText("Copy Link"), 2000);
  };

  const toggleModal = () => {
    if (!files.length) {
      toast({
        variant: "destructive",
        title: "No files to transfer",
        description: "Please upload files to generate a transfer link.",
      });
      return;
    }
    
    if (!isModalOpen) {
      // When opening modal, set the remote ID and create connection
      setRemoteConnectionId(connectionID);
      createConnection();
    } else {
      // When closing modal, close the connection
      closeConnection();
      setCurrentFileIndex(null);
      setTransferComplete(false);
    }
    
    setModalOpen(!isModalOpen);
  };

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

  const BackButton = () => (
    <Link href="/">
      <button className="p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500">
        <ChevronLeft />
      </button>
    </Link>
  );

  const totalSize = getTotalFileSize(files);

  const resetTransfer = () => {
    closeConnection();
    setCurrentFileIndex(null);
    setTransferComplete(false);
    
    // Generate a new connection ID
    const newConnectionID = LinkGenerator();
    setConnectionID(newConnectionID);
    setTransferLink(`${window.location.origin}/share/receive?id=${newConnectionID}`);
    
    setTimeout(() => {
      setRemoteConnectionId(newConnectionID);
      createConnection();
    }, 500);
  };

  return (
    <>
      <div className="p-4">
        <BackButton />

        <div className="min-h-[10dvh] flex flex-col items-start sm:items-center justify-start sm:justify-center">
          <BlurFade delay={0} className="items-start sm:items-center flex flex-col sm:text-center">
            <h1 className="mont text-3xl sm:text-4xl font-bold"> Transfer Files{" "}<span className="yellowtail text-orange-400">Effortlessly</span></h1>
          </BlurFade>

          <BlurFade delay={0.5}>
            <span className="mont text-base sm:text-lg text-gray-400 mt-2 sm:mt-1">Upload files to generate a secure link for direct sharing.</span>
          </BlurFade>
          <div {...getRootProps()} className="relative px-4 rounded-md w-full max-w-[102dvh] h-[60dvh] bg-[#252525] flex items-center justify-center cursor-pointer mt-4">
            <input {...getInputProps()} disabled={currentFileIndex !== null} />
            {!files.length ? (
              <p className="mont text-stone-500 text-center px-2">Drag &amp; drop files here, or click to select files</p>
            ) : (
              <ScrollArea className="h-[53dvh] w-[100dvh] rounded-md">
                <div className="flex flex-wrap gap-4 justify-start mt-5 px-2">
                  {files.map((file, i) => (
                    <div 
                      key={i} 
                      className={`relative flex flex-col items-center justify-center w-36 sm:w-40 h-36 sm:h-40 ${
                        currentFileIndex === i ? 'bg-[#3a3a3a] ring-2 ring-orange-400' : 
                        currentFileIndex !== null && currentFileIndex > i ? 'bg-[#2a3a2a]' : 'bg-[#2d2d2d]'
                      } rounded-md p-2 hover:bg-[#3a3a3a] transition duration-200 group`}
                    >
                      <div className="w-24 sm:w-28 h-24 sm:h-28 flex items-center justify-center mt-1 rounded overflow-hidden">
                        <FilePreview file={file} />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-400 text-center mt-1 truncate w-full" title={file.name}>{file.name}</p>
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition duration-200">
                        {formatFileSize(file.size)}
                      </div>
                      {currentFileIndex === null && (
                        <button 
                          className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition duration-200 flex items-center gap-1 text-xs sm:text-sm" 
                          onClick={(e) => { e.stopPropagation(); handleRemoveFile(file);}}
                        >
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      )}
                      {currentFileIndex === i && transferProgress && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center flex-col">
                          <Progress value={transferProgress.percentage} className="w-4/5 h-2" />
                          <p className="text-xs text-white mt-2">{transferProgress.percentage}%</p>
                        </div>
                      )}
                      {currentFileIndex !== null && currentFileIndex > i && (
                        <div className="absolute top-2 right-2 bg-green-600 rounded-full p-1">
                          <CheckCircle size={16} className="text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            <BorderBeam size={150} duration={10} className="z-40" colorFrom="#ff7b00" colorTo="#fcbb7e"/>
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
                  <span>{files.length} file{files.length !== 1 ? "s" : ""}</span>
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
                disabled={currentFileIndex !== null && !transferComplete}
              >
                {currentFileIndex !== null && !transferComplete ? (
                  <>Transferring <Loader2 className="ml-2 h-4 w-4 animate-spin" /></>
                ) : (
                  <>Transfer <Rocket className="w-5 ml-2" /></>
                )}
              </Button>
              {!!files.length && (
                <Button 
                  variant="destructive" 
                  className="mont font-bold transition-all ease-in-out w-full sm:w-auto" 
                  onClick={handleRemoveAllFiles}
                  disabled={currentFileIndex !== null && !transferComplete}
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
              <span className="mont text-lg font-bold">Your link is{" "}<span className="yellowtail text-orange-400 text-2xl">ready</span></span>
            </DialogTitle>
            <DialogDescription className="mont text-gray-400 text-sm mt-2">Copy, scan, or share this link to start transferring files.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <ConnectionStatusIndicator state={connectionState} />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetTransfer}
                disabled={connectionState === ConnectionState.CONNECTING}
                className="flex items-center gap-2"
              >
                <RefreshCw size={14} />
                Refresh Connection
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input type="text" className="flex-1 p-2 bg-[#252525] text-white rounded text-sm" value={transferLink} readOnly/>
              <Button className="mont font-bold hover:bg-orange-500 whitespace-nowrap text-white w-full sm:w-auto" onClick={() => copyToClipboard(transferLink)} >{copyText}</Button>
            </div>
            <div className="flex items-center justify-center p-4 bg-white rounded-md">
              <QRCodeSVG value={transferLink} size={150} />
            </div>
            
            {transferProgress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Transferring: {files[currentFileIndex!]?.name}</span>
                  <span>{transferProgress.percentage}%</span>
                </div>
                <Progress value={transferProgress.percentage} className="h-2" />
                <div className="text-xs text-gray-400 text-right">
                  {formatFileSize(transferProgress.receivedSize)} / {formatFileSize(transferProgress.totalSize)}
                </div>
              </div>
            )}
            
            {transferComplete && (
              <div className="bg-green-900/20 border border-green-900 rounded-md p-3 flex items-center gap-2">
                <CheckCircle className="text-green-500" size={20} />
                <span className="text-green-400">All files successfully transferred!</span>
              </div>
            )}

            <div className="text-center">
              <span className="mont text-sm font-bold text-orange-400">Share via</span>
              <div className="flex flex-row items-center justify-center gap-5 text-gray-400 mt-2">
                <a href={`https://twitter.com/intent/tweet?text=Transfer%20files%20effortlessly%20with%20Celeris%20at%20${encodeURIComponent(transferLink)}`} target="_blank" rel="noopener noreferrer" className="hover:text-orange-400"><BsTwitterX size={20} /></a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(transferLink)}`} target="_blank" rel="noopener noreferrer" className="hover:text-orange-400"><Facebook /></a>
                <a href={`https://wa.me/?text=Transfer%20files%20effortlessly%20with%20Celeris%20at%20${encodeURIComponent(transferLink)}`} target="_blank" rel="noopener noreferrer" className="hover:text-orange-400"><FaWhatsapp size={25} /></a>
              </div>
            </div>

            <div className="border-t border-stone-700 pt-3 flex flex-col gap-2">
              <label htmlFor="emailInput" className="mont text-stone-400 text-sm">Send link via email:</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input id="emailInput" type="email" placeholder="Recipient email" className="mont text-sm flex-1 p-2 rounded bg-[#252525] text-stone-300" value={email} onChange={(e) => setEmail(e.target.value)}/>
                <Button className="mont font-bold hover:bg-orange-500 whitespace-nowrap text-white w-full sm:w-auto" onClick={sendEmail}>Send Email</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}