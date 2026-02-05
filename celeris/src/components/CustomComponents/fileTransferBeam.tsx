"use client";

import React, { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { FileVideo2, Files, Images, FileCode2, FileAudio2 } from "lucide-react";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 border-border bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export default function AnimatedBeam_Test({
  className,
}: {
  className?: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const div1Ref = useRef<HTMLDivElement>(null);
    const div2Ref = useRef<HTMLDivElement>(null);
    const div3Ref = useRef<HTMLDivElement>(null);
    const div4Ref = useRef<HTMLDivElement>(null);
    const div5Ref = useRef<HTMLDivElement>(null);
    const div6Ref = useRef<HTMLDivElement>(null);
    const div7Ref = useRef<HTMLDivElement>(null);


  return (
    <div className={cn("relative flex h-[400px] sm:h-[450px] md:h-[500px] w-full items-center justify-center overflow-hidden rounded-lg bg-transparent p-4 sm:p-6 md:p-10",className,)} ref={containerRef}>
      <div className="flex size-full flex-row items-stretch justify-between gap-8 sm:gap-16 md:gap-[20dvh] lg:gap-[30dvh] w-4xl">
        <div className="flex flex-col justify-center">
          <Circle ref={div1Ref} className="size-12 sm:size-14 md:size-16">
            <Icons.user />
          </Circle>
        </div>
        <div className="flex flex-col justify-center gap-2 sm:gap-3 md:gap-4">
          <Circle ref={div2Ref} className="size-10 sm:size-11 md:size-12">
            <FileVideo2 className="text-black"/>
          </Circle>
          <Circle ref={div3Ref} className="size-10 sm:size-11 md:size-12">
            <FileAudio2 className="text-black"/>
          </Circle>
          <Circle ref={div4Ref} className="size-10 sm:size-11 md:size-12">
            <Files className="text-black"/>
          </Circle>
          <Circle ref={div5Ref} className="size-10 sm:size-11 md:size-12">
            <Images className="text-black"/>
          </Circle>
          <Circle ref={div6Ref} className="size-10 sm:size-11 md:size-12">
            <FileCode2 className="text-black"/>
          </Circle>
        </div>
        <div className="flex flex-col justify-center">
          <Circle ref={div7Ref} className="size-12 sm:size-14 md:size-16">
            <Icons.user />
          </Circle>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div2Ref}
        curvature={120}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div3Ref}
        curvature={70}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div4Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div5Ref}
        curvature={-70}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div6Ref}
        curvature={-120}
      />
      


      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div7Ref}
        curvature={10}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div7Ref}
        curvature={10}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div4Ref}
        toRef={div7Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div7Ref}
        curvature={-10}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div7Ref}
        curvature={-10}
      />
    </div>
  );
}

const Icons = {
  user: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#000000"
      strokeWidth="2"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};
