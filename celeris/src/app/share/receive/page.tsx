"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlurFade from "@/components/ui/blur-fade";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { BorderBeam } from "@/components/ui/border-beam";


export default function Recieve() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [connectionId, setConnectionId] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get("id")
    if (!id) {
      setShowModal(true);
    } else {
      setConnectionId(id || "");
    }
  }, [searchParams]);
  
  

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleConnect = () => {
    if (connectionId) {
      router.push(`${connectionId}`);
      setShowModal(false);
    }
  };

  console.log(connectionId);

  const BackButton = () => (
    <Link href="/">
      <button>
        <ChevronLeft />
      </button>
    </Link>
  );

  const files = [
    { name: "example.txt", size: 1024 },
    { name: "example2.txt", size: 2048 },
  ];

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
            <span className="mont text-lg text-gray-400">Paste a link or scan a QR code to start downloading.</span>
          </BlurFade>
          <div className="relative flex flex-col items-center justify-center bg-[#252525] w-[100dvh] h-[50dvh] p-4 rounded-md mt-5">
            <div className="scrollBar w-full h-[70vh] overflow-y-scroll">
              {files.length > 0 && (
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-0">
                      <TableHead className="w-[70dvh]">File Name</TableHead>
                      <TableHead className="w-[20dvh]">Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  {files.map((file) => (
                    <TableBody key={file.name}>
                      <TableRow className="hover:bg-0">
                        <TableCell className="font-medium mont text-orange-400">{file.name}</TableCell>
                        <TableCell className="text-xs mont">{(file.size / 1000).toFixed(2)} KB</TableCell>
                      </TableRow>
                    </TableBody>
                  ))}
                </Table>
              )}
            </div>
            <BorderBeam size={150} duration={10} className="z-40" colorFrom="#ff7b00" colorTo="#fcbb7e" />
          </div>
          <Button className="mt-5 mont font-bold transition-all ease-in-out hover:bg-orange-500">
            Download<Download className="w-5" />
          </Button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-black p-4 rounded-md w-96">
              <h1 className="mont text-xl font-bold">Enter Connection URL</h1>
              <input
                type="text"
                className="mont w-full p-2 mt-2 rounded-md bg-[#252525] text-orange-400"
                value={connectionId}
                onChange={(e) => setConnectionId(e.target.value)}
              />
              <div className="flex items-center justify-end mt-4">
                <Button className="mont mr-2 hover:bg-orange-400" onClick={() => router.push("/")}>
                  Cancel
                </Button>
                <Button onClick={handleConnect} className="mont hover:bg-orange-400">Connect</Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
