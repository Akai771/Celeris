// page.tsx (Splash Page)
"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import dynamic from "next/dynamic";
import AnimatedBeam_Test from "../components/CustomComponents/fileTransferBeam";
import { Rocket, Infinity, LockKeyhole, Globe, HandHeart, Github, Linkedin, Twitter, ChevronDown } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import "./index.css";
import Footer from "@/components/CustomComponents/footer";

// Dynamically import heavy animation components to avoid SSR/compilation issues
const Threads = dynamic(() => import("@/components/ui/react-bits/threads"), {
  ssr: false,
  loading: () => null
});

const VelocityScroll = dynamic(() => import("@/components/ui/scroll-based-velocity").then(mod => ({ default: mod.VelocityScroll })), {
  ssr: false,
  loading: () => null
});

// Stable color reference for Threads component to prevent re-renders
const THREADS_COLOR: [number, number, number] = [251/255, 146/255, 60/255];

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
    name: "Global Accessibility",
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
  {
    Icon: Globe,
    name: "Cross-Platform",
    description: "Seamlessly works across Windows, Mac, Linux, iOS and Android.",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4",
  },
];

const faqs = [
  {
    question: "How does Celeris ensure my files are secure?",
    answer: "Celeris uses peer-to-peer (P2P) technology with end-to-end encryption. Your files are transferred directly from your device to the recipient's device without being stored on any servers, ensuring complete privacy and security."
  },
  {
    question: "Is there a file size limit?",
    answer: "No! Unlike traditional file-sharing services, Celeris has no file size limits. You can transfer files of any size, whether it's a few kilobytes or several gigabytes."
  },
  {
    question: "Do I need to create an account?",
    answer: "No account required! Celeris is designed for simplicity. Just visit the website, select your files, and start transferring immediately. No sign-ups, no passwords, no hassle."
  },
  {
    question: "How fast are the transfers?",
    answer: "Transfer speeds depend on your internet connection and the recipient's connection. Since Celeris uses direct P2P transfers, you can achieve speeds that match your upload/download bandwidth without server bottlenecks."
  },
  {
    question: "Can I use Celeris on mobile devices?",
    answer: "Yes! Celeris works seamlessly across all platforms including Windows, Mac, Linux, iOS, and Android. Simply access it through your web browser on any device."
  },
  {
    question: "What happens if the connection is interrupted?",
    answer: "If the connection is interrupted during a transfer, the current file transfer will stop. You'll need to restart the transfer. We recommend maintaining a stable internet connection for best results."
  },
  {
    question: "Are my files stored anywhere?",
    answer: "Absolutely not. Celeris never stores your files on any server. Files are transferred directly between devices in real-time. Once the transfer is complete, no traces remain."
  },
  {
    question: "How long does the transfer link remain active?",
    answer: "Transfer links remain active during the session. Once both sender and receiver are connected, the transfer can begin. After the transfer completes or if either party disconnects, a new link must be generated."
  }
];

export default function HomePage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const whatIsCelerisRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const velocityRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Register GSAP plugin
    gsap.registerPlugin(ScrollTrigger);

    let timeoutId: NodeJS.Timeout;
    const handleMouseMove = (e: MouseEvent) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setMousePos({
          x: (window.innerWidth - e.pageX) / 50,
          y: (window.innerHeight - e.pageY) / 50,
        });
      }, 10);
    };

    window.addEventListener('mousemove', handleMouseMove);

    // GSAP Animations
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      tl.from(heroRef.current, {
        opacity: 0,
        y: -20,
        duration: 1,
        ease: "expo.out"
      })
      .from(titleRef.current?.children || [], {
        opacity: 0,
        y: 100,
        duration: 1.2,
        stagger: 0.1,
        ease: "expo.out"
      }, "-=0.5")
      .from(descRef.current, {
        opacity: 0,
        y: 20,
        duration: 1,
        ease: "expo.out"
      }, "-=0.8")
      .from(cardsRef.current?.children || [], {
        opacity: 0,
        y: 40,
        duration: 1,
        stagger: 0.15,
        ease: "expo.out"
      }, "-=0.6")
      .from(footerRef.current?.children || [], {
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: "expo.out"
      }, "-=0.4");

      // ScrollTrigger animations for sections
      if (velocityRef.current) {
        gsap.set(velocityRef.current, { opacity: 0, y: 50 });
        
        gsap.to(velocityRef.current, {
          scrollTrigger: {
            trigger: velocityRef.current,
            start: "top 80%",
            end: "bottom 80%",
            toggleActions: "play none none none"
          },
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "expo.out"
        });
      }

      if (whatIsCelerisRef.current) {
        const aboutLabel = whatIsCelerisRef.current.querySelector('[data-about-label]');
        const aboutTitle = whatIsCelerisRef.current.querySelector('[data-about-title]');
        const aboutDesc = whatIsCelerisRef.current.querySelector('[data-about-desc]');
        const aboutBeam = whatIsCelerisRef.current.querySelector('[data-about-beam]');
        
        // Set initial state
        gsap.set(aboutLabel, { opacity: 0, y: 20 });
        gsap.set(aboutTitle, { opacity: 0, y: 40 });
        gsap.set(aboutDesc, { opacity: 0, y: 30 });
        gsap.set(aboutBeam, { opacity: 0, scale: 0.95 });
        
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: whatIsCelerisRef.current,
            start: "top 80%",
            end: "bottom 80%",
            toggleActions: "play none none none"
          }
        });
        
        tl.to(aboutLabel, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out"
        })
        .to(aboutTitle, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out"
        }, "-=0.3")
        .to(aboutDesc, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out"
        }, "-=0.5")
        .to(aboutBeam, {
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: "power3.out"
        }, "-=0.4");
      }

      if (featuresRef.current) {
        const featureCards = featuresRef.current.querySelectorAll('[data-feature-card]');
        gsap.set(featureCards, { opacity: 0, y: 40 });
        
        gsap.to(featureCards, {
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
            end: "bottom 80%",
            toggleActions: "play none none none"
          },
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out"
        });
      }

      if (faqRef.current) {
        const faqLabel = faqRef.current.querySelector('[data-faq-label]');
        const faqTitle = faqRef.current.querySelector('[data-faq-title]');
        const faqDesc = faqRef.current.querySelector('[data-faq-desc]');
        const faqItems = faqRef.current.querySelectorAll('[data-faq-item]');
        
        // Set initial state
        gsap.set([faqLabel, faqTitle, faqDesc], { opacity: 0, y: 30 });
        gsap.set(faqItems, { opacity: 0, y: 30 });
        
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: faqRef.current,
            start: "top 80%",
            end: "bottom 80%",
            toggleActions: "play none none none"
          }
        });
        
        tl.to(faqLabel, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out"
        })
        .to(faqTitle, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out"
        }, "-=0.3")
        .to(faqDesc, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out"
        }, "-=0.5")
        .to(faqItems, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out"
        }, "-=0.4");
      }
    });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      ctx.revert();
    };
  }, []);

  return (
    <div className="relative w-full flex flex-col bg-background text-foreground overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-between items-center w-full mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-4 sm:pt-24 sm:pb-8 lg:pt-32 lg:pb-12">
        {/* Threads Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
          <Threads
            color={THREADS_COLOR}
            amplitude={5}
            distance={1}
            enableMouseInteraction
          />
        </div>

        {/* Content Container - Centered */}
        <div className="flex-1 flex flex-col justify-center items-center w-full max-w-2xl lg:max-w-5xl xl:max-w-6xl relative z-10">
          {/* Hero Text */}
          <div className="text-center mb-6 sm:mb-10 lg:mb-12">
            <h2 ref={titleRef} className="text-2xl sm:text-4xl md:text-6xl lg:text-6xl xl:text-7xl font-bold tracking-tighter leading-[1.1] mb-3 sm:mb-4 lg:mb-6">
              <div className="overflow-hidden">
                <span className="block">Seamless Transfer.</span>
              </div>
              <div className="overflow-hidden">
                <span className="block text-primary">Uncompromised Speed.</span>
              </div>
            </h2>
            <p ref={descRef} className="text-muted-foreground text-xs sm:text-md lg:text-lg font-light tracking-wide px-4 lg:px-0">
              Secure peer-to-peer sharing architecture for the modern web.
            </p>
          </div>

          {/* Interactive Cards */}
          <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 w-full lg:max-w-4xl">
            {/* Send Card */}
            <Link href="/share/transfer">
              <button className="group relative flex flex-col justify-between items-start h-36 sm:h-44 lg:h-52 w-full p-5 sm:p-7 lg:p-9 rounded-xl sm:rounded-2xl bg-card border border-border hover:bg-accent hover:border-border/80 hover:scale-[1.01] transition-all ease-in-out duration-500">
                <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-secondary border border-border flex items-center justify-center group-hover:border-primary/50 group-hover:text-primary transition-colors duration-300">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                </div>
                <div className="text-left">
                  <span className="block text-xl sm:text-2xl lg:text-2xl font-medium text-foreground mb-0.5 sm:mb-1 lg:mb-2">Send</span>
                  <span className="text-xs sm:text-sm lg:text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors">Drag & drop or browse</span>
                </div>
              </button>
            </Link>

            {/* Receive Card */}
            <Link href="/share/receive">
              <button className="group relative flex flex-col justify-between items-start h-36 sm:h-44 lg:h-52 w-full p-5 sm:p-7 lg:p-9 rounded-xl sm:rounded-2xl bg-card border border-border hover:bg-accent hover:border-border/80 hover:scale-[1.01] transition-all ease-in-out duration-500">
                <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-secondary border border-border flex items-center justify-center group-hover:border-primary/50 group-hover:text-primary transition-colors duration-300">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                </div>
                <div className="text-left">
                  <span className="block text-xl sm:text-2xl lg:text-2xl font-medium text-foreground mb-0.5 sm:mb-1 lg:mb-2">Receive</span>
                  <span className="text-xs sm:text-sm lg:text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors">Enter 10-digit key</span>
                </div>
              </button>
            </Link>
          </div>
        </div>

        {/* Footer Stats - Sticky to Bottom */}
        <footer ref={footerRef} className="relative z-10 w-full py-4 sm:py-6 lg:py-8 border-t border-border flex justify-center gap-6 sm:gap-12 md:gap-24 lg:gap-32 mt-6 sm:mt-8 lg:mt-12">
          <div className="text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1 text-[10px] sm:text-xs lg:text-sm">Encryption</div>
            <div className="font-mono text-foreground text-xs sm:text-sm lg:text-base">DTLS</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1 text-[10px] sm:text-xs lg:text-sm">Mode</div>
            <div className="font-mono text-foreground text-xs sm:text-sm lg:text-base">P2P</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1 text-[10px] sm:text-xs lg:text-sm">Limit</div>
            <div className="font-mono text-foreground text-xs sm:text-sm lg:text-base">NONE</div>
          </div>
        </footer>
      </section>

      {/* Velocity Scroll Section */}
      <div className="relative">       
        <div ref={velocityRef} className="w-full overflow-hidden relative z-10">
          <VelocityScroll
          text="Feel the flow—scroll through the unmatched velocity of file transfers. Each swipe mirrors Celeris' seamless efficiency."
          default_velocity={2}
          className="text-center font-bold tracking-[-0.02em] text-foreground/80 drop-shadow-sm md:text-3xl md:leading-[2rem]"
        />
      </div>
      </div>

      {/* About Section */}
      <section ref={whatIsCelerisRef} className="relative z-10 w-full pt-16 sm:pt-32 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center max-w-4xl mx-auto text-center">
          <p data-about-label className="text-xs uppercase tracking-[0.3em] text-muted-foreground/60 mb-3 sm:mb-4 font-medium">
            About
          </p>
          <h2 data-about-title className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 sm:mb-8">
            What is <span className="text-primary">Celeris</span>?
          </h2>
          <p data-about-desc className="text-sm sm:text-md md:text-lg text-muted-foreground leading-relaxed mb-8 sm:mb-12 max-w-3xl text-justify">
            Celeris is a cutting-edge P2P file transfer application designed to simplify and secure the way you share files. Unlike traditional methods that rely on cloud storage, Celeris enables direct device-to-device transfers, ensuring your data is never stored on any server. With fast speeds, robust encryption, and a user-friendly interface, Celeris is the ideal solution for personal and professional file sharing needs.
          </p>
          <div data-about-beam className="flex flex-row justify-center">
            <AnimatedBeam_Test />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="container mx-auto px-4 sm:px-6 py-16 sm:py-32 z-10 relative">
        <div className="flex flex-col items-center mb-8 sm:mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/60 mb-3 sm:mb-4 font-medium">
            Features
          </p>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold text-center mb-2">
            Engineered for <span className="text-primary">Velocity</span>
          </h2>
          <p className="text-sm sm:text-md md:text-lg max-w-3xl text-center text-muted-foreground font-light leading-relaxed px-2">
            Experience the next generation of peer-to-peer file sharing. 
            Limitless, serverless, and uncompromisingly secure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border/40 rounded-2xl overflow-hidden border border-border/40">
          {features.map((feature, index) => {
            const IconComponent = feature.Icon;
            return (
              <div
                key={index}
                data-feature-card
                className="group relative p-8 md:p-10 bg-background hover:bg-muted/30 transition-all duration-500"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col h-full">
                  <div className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center text-foreground/70 mb-4 sm:mb-6 group-hover:text-primary transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <IconComponent size={20} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-sm sm:text-base font-medium mb-2 sm:mb-3 tracking-tight group-hover:translate-x-1 transition-transform duration-300">
                    {feature.name}
                  </h3>
                  <p className="text-muted-foreground/70 text-sm leading-relaxed font-light group-hover:text-muted-foreground transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
                <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/0 group-hover:via-primary/40 to-transparent transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-all duration-500 pointer-events-none" />
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section ref={faqRef} className="container mx-auto px-4 sm:px-6 py-16 sm:py-32 z-10 relative">
        <div className="flex flex-col items-center mb-12 sm:mb-16">
          <p data-faq-label className="text-xs uppercase tracking-[0.3em] text-muted-foreground/60 mb-3 sm:mb-4 font-medium">
            FAQ
          </p>
          <h2 data-faq-title className="text-2xl sm:text-4xl md:text-5xl text-center font-bold tracking-tight mb-3 sm:mb-4">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <p data-faq-desc className="text-sm sm:text-md md:text-lg text-muted-foreground leading-relaxed max-w-2xl text-center px-2">
            Everything you need to know about Celeris and how it works.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              data-faq-item
              className="group border border-border rounded-xl overflow-hidden bg-card hover:border-primary/40 transition-all duration-300"
            >
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 sm:p-6 text-left transition-all duration-300"
              >
                <h3 className="text-sm sm:text-base md:text-lg font-medium pr-6 sm:pr-8 group-hover:text-primary transition-colors duration-300">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-muted-foreground flex-shrink-0 transition-all duration-300 group-hover:text-primary",
                    openFaqIndex === index && "rotate-180 text-primary"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-500 ease-in-out",
                  openFaqIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="px-6 pb-6 pt-0">
                  <div className="border-t border-border/40 pt-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Still have questions?
          </p>
          <a
            href="https://github.com/akai771/celeris/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/80 transition-all duration-300 hover:scale-105"
          >
            Ask on GitHub
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </section>

      {/*Footer */}
      <Footer />
    </div>
  );
}
