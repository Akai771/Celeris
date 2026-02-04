// page.tsx (Splash Page)

"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import ShimmerButton from "@/components/ui/shimmer-button";
import WordFadeIn from "@/components/ui/word-fade-in";
import { DotPattern } from "@/components/ui/dot-pattern";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import TypingAnimation from "@/components/ui/typing-animation";
import { VelocityScroll } from "@/components/ui/scroll-based-velocity";
import { MagicCard } from "@/components/ui/magic-card";
import BlurFade from "@/components/ui/blur-fade";
import Testimonials from "./CustomComponents/testimonials";
import AnimatedBeam_Test from "./CustomComponents/fileTransferBeam"
import { Rocket, Infinity, LockKeyhole, Globe, HandHeart, Github, Linkedin, Twitter } from 'lucide-react';
import "./globals.css"

const features = [
  {
    Icon: Rocket,
    name: "Fast Transfers",
    description: "Send files in seconds with blazing-fast speeds.",
    background: <img className="absolute bg-black -right-20 -top-20 opacity-60" />,
    className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
  },
  {
    Icon: Infinity,
    name: "No File Size Limits",
    description: "Transfer files of any size effortlessly.",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
  },
  {
    Icon: LockKeyhole,
    name: "Privacy First",
    description: "End-to-end encryption ensures total privacy.",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4",
  },
  {
    Icon: Globe,
    name: "Global Accesibility",
    description: "Works anywhere, anytime, on any device.",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2",
  },
  {
    Icon: HandHeart,
    name: "Simple Interface",
    description: "Easy-to-navigate interface for all users.",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4",
  },
];

export default function HomePage() {
  const [isModalOpen, setModalOpen] = useState(false);
  const toggleModal = () => setModalOpen((prev) => !prev);
  const [theme, setTheme] = useState("dark");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
        <section className="splash-section-1">
          <DotPattern className={cn("[mask-image:radial-gradient(25rem_circle_at_center,white,transparent)]")}/>
          <WordFadeIn className="text-white mont font-extrabold" words="Welcome to Celeris!" delay={0.5} />
          <TypingAnimation 
            className="font-medium text-gray-300 text-lg mont" 
            text="Empowering Seamless File Transfers with Speed and Security" 
            duration={50} 
          />
          <div className="flex flex-row items-center justify-center gap-5 mt-5">
            <ShimmerButton className="mont" onClick={toggleModal}>Start a Transfer</ShimmerButton>
            {isModalOpen && (
              <div className="fixed inset-0 flex items-center justify-center bg-zinc-900 bg-opacity-30 z-50">
                <div className="bg-black rounded-lg p-6 shadow-lg max-w-2xl w-full">
                  <div className="flex flex-row items-center justify-between">
                    <h2 className="text-xl font-bold mb-4 mont">Select Action</h2>
                    <button className="pb-5 hover:text-gray-700 text-white" onClick={toggleModal}>✖</button>
                  </div>
                  <div className="flex flex-row justify-between gap-4">
                    <Link href="/share/transfer" className="w-full"><MagicCard className="cursor-pointer flex-col items-center justify-center shadow-2xl whitespace-nowrap text-2xl mont font-medium" gradientColor={theme === "dark" ? "#262626" : "#D9D9D955"}>Transfer</MagicCard></Link>
                    <Link href="/share/receive" className="w-full"><MagicCard className="cursor-pointer flex-col items-center justify-center shadow-2xl whitespace-nowrap text-2xl mont font-medium" gradientColor={theme === "dark" ? "#262626" : "#D9D9D955"}>Recieve</MagicCard></Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <VelocityScroll
            text="Feel the flow—scroll through the unmatched velocity of file transfers. Each swipe mirrors Celeris' seamless efficiency."
            default_velocity={2}
            className="text-center w-[205dvh] font-bold tracking-[-0.02em] text-white drop-shadow-sm dark:text-white md:text-3xl md:leading-[2rem]"
        />

        <section className="splash-section-1 mb-[30dvh]">
          <BlurFade delay={0.25} inView className="flex flex-col items-center justify-center">
            <span className="text-4xl font-bold mont">What is <span className="yellowtail text-orange-400 text-5xl">Celeris</span>?</span>
            <span className="mt-5 text-center w-[90dvh] mont text-gray-300">Celeris is a cutting-edge P2P file transfer application designed to simplify and secure the way you share files. Unlike traditional methods that rely on cloud storage, Celeris enables direct device-to-device transfers, ensuring your data is never stored on any server. With fast speeds, robust encryption, and a user-friendly interface, Celeris is the ideal solution for personal and professional file sharing needs</span>
            <div className="flex flex-row">
              <AnimatedBeam_Test />
            </div>
          </BlurFade>
        </section>

        <section className="splash-section-2 mb-[30dvh]">
        <BlurFade delay={0.25} inView className="flex flex-col items-center justify-center">
          <span className="text-4xl font-bold mont">Explore the Benefits of <span className="yellowtail text-orange-400 text-5xl">Celeris</span></span>
          <div className="flex flex-row mt-5">
            <BentoGrid className="lg:grid-rows-3">
              {features.map((feature) => (
                <BentoCard key={feature.name} {...feature} />
              ))}
            </BentoGrid>
          </div>
        </BlurFade>
        </section>

        <section className="splash-section-3">
          <BlurFade delay={0.25} inView className="flex flex-col items-center justify-center">
            <span className="text-4xl font-bold mont">What our <span className="yellowtail text-orange-400">Users</span> say</span>
            <Testimonials/>
          </BlurFade>
        </section>

        <div className="border border-[#252525] w-full" />
        <footer className="flex flex-row w-full h-40 items-center justify-between p-10">
          <div className="flex flex-col gap-5">
            <div className="flex flex-row items-center gap-3">
              <img className="rounded-full" width="32" alt="" src="https://placehold.co/100" />
              <span className="Mont text-3xl font-bold">Celeris</span>
            </div>
            <span className="Mont text-[#696969]">Seamless P2P File Sharing. Instantly.</span>
          </div>
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex flex-row gap-8 text-[#696969]">
                <Github size={20} className="hover:text-orange-400 cursor-pointer"/>
                <Linkedin size={20} className="hover:text-orange-400 cursor-pointer"/>
                <Twitter size={20} className="hover:text-orange-400 cursor-pointer"/>
              </div>
            </div>
            <span>All rights reserved.</span>
          </div>
        </footer>
    </main>

  );
}
