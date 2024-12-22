"use client";

import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import { ChevronLeft, Trash2, Rocket, Twitter, Facebook, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlurFade from "@/components/ui/blur-fade";
import { Card } from "@/components/ui/card";
import { BorderBeam } from "@/components/ui/border-beam";
import LinkGenerator from "./LinkGenerator";
import { toast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import {QRCodeSVG} from "qrcode.react";

export default function Transfer() {
  const [files, setFiles] = useState<File[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [transferLink, setTransferLink] = useState("");
  const [copyText, setCopyText] = useState("Copy Link");

  useEffect(() => {
    const LinkValue = LinkGenerator();
    setTransferLink(`http://localhost:3000/share/receive?id=${LinkValue}`);
  }, []);

  const toggleModal = () => {
    if (files.length > 0) {
      setModalOpen((prev) => !prev);
    } else {
      toast({
        variant: "destructive",
        title: "No files to transfer",
        description: "Please upload files to generate a transfer link.",
      })
    }
  };

  const handleDrop = (acceptedFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
  };

  const handleRemoveAllFiles = () => {
    setFiles([]);
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleDrop,
  });

  const BackButton = () => {
    return (
      <Link href="/">
        <button>
          <ChevronLeft />
        </button>
      </Link>
    );
  };

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopyText(`Copied!`);
  };

  const LinkBox = () => {
    return (<>
    {isModalOpen && (
      <div className="fixed inset-0 flex items-center justify-center bg-zinc-900 bg-opacity-60 z-50">
        <Card className="flex flex-col bg-black p-5 border-0">
              <div className="flex flex-row items-center justify-between ">
                <span className="mont text-lg font-bold text-white">Your link is <span className="yellowtail text-orange-400 text-2xl">ready</span></span>
                <button onClick={toggleModal}><X className="w-5 text-white mb-10 hover:text-gray-300" /></button>
              </div>
              <div className="flex flex-row items-center justify-center gap-1">
                <input type="text" className="w-[35dvh] p-2 bg-[#252525] text-stone-500 rounded" value={transferLink} readOnly />
                <Button className="mont font-bold transition-all ease-in-out hover:bg-orange-500" onClick={() => copyToClipboard(transferLink)}>{copyText}</Button>
              </div>
              <div className="border border-stone-600 mt-5 "/>
              <div className="flex flex-col items-center justify-center gap-3 mt-5">
                <QRCodeSVG value={transferLink} size={150} className="border-2 rounded"/>
                <span className="mont text-sm font-bold text-orange-400">Share via</span>
                <div className="flex flex-row items-center justify-center gap-5 text-gray-400">
                  <a href={`https://twitter.com/intent/tweet?text=Transfer%20files%20effortlessly%20with%20Celeris%20at%20${transferLink}`} target="_blank" rel="noopener noreferrer" className="hover:text-orange-400"><Twitter/></a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${transferLink}`} target="_blank" rel="noopener noreferrer" className="hover:text-orange-400"><Facebook/></a>
                  <a href={`https://wa.me/?text=Transfer%20files%20effortlessly%20with%20Celeris%20at%20${transferLink}`} target="_blank" rel="noopener noreferrer" className="hover:text-orange-400"><MessageCircle/></a>
                </div>
                <span className="mont text-xs text-stone-500">Share the link with the recipient to start the transfer.</span>

              </div>
        </Card>
      </div>
    )}   
  </>);
  };

  return (
    <>
      <div className="p-4">
        <BackButton />
        <div className="min-h-[80dvh] flex flex-col items-center justify-center">
          <BlurFade delay={0} className="items-center justify-center flex flex-col">
            <h1 className="mont text-4xl font-bold">Transfer Files <span className="yellowtail text-orange-400">Effortlessly</span></h1>
          </BlurFade>
          <BlurFade delay={.5}>
            <span className="mont text-lg text-gray-400">Upload files to generate a secure link for direct sharing.</span>
          </BlurFade>
          <div {...getRootProps()} className="relative p-6 rounded-md w-[100dvh] h-[50dvh] bg-[#252525] mt-5 flex items-center justify-center cursor-pointer">
            {files.length === 0 ? (<>
              <input {...getInputProps()} />
              <p className="mont text-stone-500">Drag & drop files here, or click to select files</p>
              </>) : (
             <div className="w-full h-full flex flex-col items-center justify-start gap-5">
             <div className="scrollBar w-full h-[70vh] overflow-y-scroll">
               {files.length > 0 && (
                  <Table className="w-full">
                   <TableHeader>
                     <TableRow className="hover:bg-0">
                       <TableHead className="w-[70dvh]">File Name</TableHead>
                       <TableHead className="w-[20dvh]">Size</TableHead>
                       <TableHead onClick={()=>handleRemoveAllFiles()} className="rounded text-white hover:bg-red-700"><Trash2 size={15}/></TableHead>
                     </TableRow>
                   </TableHeader>
                   {files.map((file) => (
                      <TableBody key={file.name}>
                       <TableRow className="hover:bg-0">
                         <TableCell className="font-medium mont text-orange-400">{file.name}</TableCell>
                         <TableCell className="text-xs mont">{(file.size / 1000).toFixed(2)} KB</TableCell>
                         <TableCell className="text-right hover:text-red-400" onClick={() => handleRemoveFile(file)}><Trash2 size={15}/></TableCell>
                       </TableRow>
                       </TableBody>
                     ))}
                  </Table>
               )}
             </div>
           </div>
           
            )}
            <BorderBeam size={150} duration={10} className="z-40" colorFrom="#ff7b00" colorTo="#fcbb7e" />
          </div>
          <Button className="mt-5 mont font-bold transition-all ease-in-out hover:bg-orange-500" onClick={toggleModal}>Transfer<Rocket className="w-5"/></Button>
          <LinkBox />
        </div>
      </div>
    </>
  );
}
