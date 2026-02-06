"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { gsap } from "gsap";

export default function NotFound() {
  const containerRef = useRef<HTMLDivElement>(null);
  const errorCodeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      // Subtle fade-in animations
      tl.from(errorCodeRef.current, {
        opacity: 0,
        y: 20,
        duration: 1.2
      })
      .from(titleRef.current, {
        opacity: 0,
        y: 20,
        duration: 1,
      }, "-=0.8")
      .from(descRef.current, {
        opacity: 0,
        y: 15,
        duration: 0.8,
      }, "-=0.6")
      .from(buttonsRef.current?.children || [], {
        opacity: 0,
        y: 15,
        duration: 0.8,
        stagger: 0.1,
      }, "-=0.4");
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-background text-foreground flex items-center justify-center overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      
      <div 
        ref={containerRef}
        className="relative z-10 flex flex-col items-center justify-center px-6 py-20 text-center max-w-4xl mx-auto"
      >
        {/* 404 Error Code */}
        <div 
          ref={errorCodeRef}
          className="mb-8"
        >
          <div className="relative">
            <div className="text-[150px] md:text-[220px] font-bold leading-none tracking-tighter text-primary/20 select-none">
              404
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 
          ref={titleRef}
          className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
        >
          Page Not <span className="text-primary">Found</span>
        </h1>

        {/* Description */}
        <p 
          ref={descRef}
          className="text-sm md:text-lg text-muted-foreground max-w-2xl mb-12 leading-relaxed"
        >
          Oops! The page you're looking for seems to have wandered off into the digital void. 
          Let's get you back on track.
        </p>

        {/* Action Buttons */}
        <div 
          ref={buttonsRef}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Link href="/">
            <button className="group relative flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all duration-500 hover:shadow-lg hover:shadow-primary/20 w-full sm:w-auto">
              <Home size={20} className="transition-transform duration-300" />
              <span>Back to Home</span>
            </button>
          </Link>

          <Link href="/share/transfer">
            <button className="group relative flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-card border border-border text-foreground font-semibold hover:bg-accent hover:border-primary/40 transition-all duration-500 w-full sm:w-auto">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
              <span>Go to Transfer</span>
            </button>
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-16 pt-8 border-t border-border/40 w-full">
          <p className="text-sm text-muted-foreground/60 mb-4 uppercase tracking-widest">
            Quick Links
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link 
              href="/share/transfer"
              className="text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              Send Files
            </Link>
            <Link 
              href="/share/receive"
              className="text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              Receive Files
            </Link>
            <Link 
              href="/legal/privacy"
              className="text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/legal/terms"
              className="text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>

        {/* Error Code Reference */}
        <div className="mt-8">
          <p className="text-xs text-muted-foreground/40 font-mono">
            ERROR_CODE: HTTP_404_NOT_FOUND
          </p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
