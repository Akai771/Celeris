"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Database, Lock, Eye, UserCheck, Globe } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function PrivacyPolicy() {
  const headerRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation
      gsap.from(headerRef.current, {
        opacity: 0,
        y: -30,
        duration: 0.8,
        ease: "power3.out"
      });

      // Section animations
      const sections = sectionsRef.current?.querySelectorAll('[data-section]');
      if (sections) {
        sections.forEach((section, index) => {
          gsap.from(section, {
            scrollTrigger: {
              trigger: section,
              start: "top 85%",
              toggleActions: "play none none none"
            },
            opacity: 0,
            y: 40,
            duration: 0.8,
            delay: index * 0.1,
            ease: "power3.out"
          });
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-background text-foreground">

      {/* Header Section */}
      <section className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-32 pb-12 sm:pb-16 max-w-4xl">
        <div ref={headerRef} className="text-center mb-12 sm:mb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/60 mb-3 sm:mb-4 font-medium">
            Legal
          </p>
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-4 sm:mb-6">
            Privacy <span className="text-primary">Policy</span>
          </h1>
          <p className="text-muted-foreground text-xs sm:text-base md:text-lg">
            Last updated: February 6, 2026
          </p>
        </div>

        {/* Introduction */}
        <div className="mb-12 sm:mb-16 p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-card border border-border">
          <p className="text-muted-foreground leading-relaxed">
            At Celeris, we take your privacy seriously. This Privacy Policy explains how we handle your data 
            when you use our peer-to-peer file transfer service. Since Celeris operates on a direct 
            device-to-device transfer model, we never store or access your files.
          </p>
        </div>

        {/* Content Sections */}
        <div ref={sectionsRef} className="space-y-8">
          {/* Section 1 */}
          <div data-section className="group">
            <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300">
              <div className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5 sm:mt-1">
                <Database size={20} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 group-hover:text-primary transition-colors duration-300">
                  Data We Collect
                </h2>
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>
                    Celeris uses peer-to-peer (P2P) technology, meaning your files are transferred directly 
                    between devices without being stored on our servers. However, to facilitate connections, 
                    we temporarily process the following:
                  </p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Connection IDs:</strong> Temporary identifiers used to establish P2P connections (automatically deleted after session ends)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">IP Addresses:</strong> Required for WebRTC connection establishment (not stored permanently)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Technical Logs:</strong> Basic connection logs for debugging and service improvement (no file content or names)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Device Information:</strong> Browser type, operating system for compatibility purposes</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div data-section className="group">
            <div className="flex items-start gap-4 p-8 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300">
              <div className="w-10 h-10 flex items-center justify-center text-primary flex-shrink-0 mt-1">
                <Shield size={24} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">
                  How We Use Your Data
                </h2>
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>
                    Your data is used exclusively to facilitate peer-to-peer file transfers. Specifically:
                  </p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>To establish WebRTC connections between sender and receiver</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>To provide connection status updates and error reporting</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>To improve service reliability and performance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>To troubleshoot technical issues</span>
                    </li>
                  </ul>
                  <p className="font-medium text-foreground pt-2">
                    Important: We never access, view, analyze, or store the content of your transferred files.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div data-section className="group">
            <div className="flex items-start gap-4 p-8 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300">
              <div className="w-10 h-10 flex items-center justify-center text-primary flex-shrink-0 mt-1">
                <Lock size={24} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">
                  Data Security
                </h2>
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>
                    We implement industry-standard security measures to protect your data:
                  </p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">End-to-End Encryption:</strong> All file transfers use WebRTC's built-in encryption</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">No Server Storage:</strong> Files never touch our servers - direct P2P transfers only</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Secure Connections:</strong> HTTPS/WSS protocols for signaling server communication</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Temporary Data:</strong> Connection IDs and session data are automatically deleted</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div data-section className="group">
            <div className="flex items-start gap-4 p-8 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300">
              <div className="w-10 h-10 flex items-center justify-center text-primary flex-shrink-0 mt-1">
                <Eye size={24} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">
                  Data Sharing & Third Parties
                </h2>
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>
                    We do not sell, trade, or rent your personal information to third parties. Limited data 
                    may be shared only in these circumstances:
                  </p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Service Providers:</strong> Hosting and infrastructure partners who help operate Celeris</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Legal Requirements:</strong> When required by law or to protect our legal rights</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Business Transfers:</strong> In the event of a merger or acquisition</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div data-section className="group">
            <div className="flex items-start gap-4 p-8 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300">
              <div className="w-10 h-10 flex items-center justify-center text-primary flex-shrink-0 mt-1">
                <UserCheck size={24} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">
                  Your Rights
                </h2>
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>You have the following rights regarding your data:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Disconnect Anytime:</strong> Close your browser or disconnect to end the session immediately</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Automatic Deletion:</strong> All connection data is deleted when sessions end</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">No Account Required:</strong> No sign-up means no stored personal information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Access & Control:</strong> You maintain complete control over what you share</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6 */}
          <div data-section className="group">
            <div className="flex items-start gap-4 p-8 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300">
              <div className="w-10 h-10 flex items-center justify-center text-primary flex-shrink-0 mt-1">
                <Globe size={24} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">
                  International Data Transfers
                </h2>
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>
                    Celeris is accessible globally. When you use our service, your connection data may be 
                    processed through our signaling servers. We ensure appropriate safeguards are in place 
                    for international data transfers in compliance with applicable laws including GDPR.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 7 */}
          <div data-section className="group">
            <div className="flex items-start gap-4 p-8 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300">
              <div className="w-10 h-10 flex items-center justify-center text-primary flex-shrink-0 mt-1">
                <Shield size={24} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">
                  Cookies & Tracking
                </h2>
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>
                    Celeris uses minimal tracking technologies:
                  </p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Essential Cookies:</strong> Required for basic functionality (connection management)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Local Storage:</strong> Temporary session data stored locally on your device</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">No Analytics:</strong> We do not use third-party analytics or advertising cookies</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 8 */}
          <div data-section className="group">
            <div className="flex items-start gap-4 p-8 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300">
              <div className="w-10 h-10 flex items-center justify-center text-primary flex-shrink-0 mt-1">
                <UserCheck size={24} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">
                  Changes to This Policy
                </h2>
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>
                    We may update this Privacy Policy from time to time. Any changes will be posted on this 
                    page with an updated "Last updated" date. We encourage you to review this policy 
                    periodically to stay informed about how we protect your data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            If you have any questions about this Privacy Policy or how we handle your data, 
            please reach out to us:
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="https://github.com/akai771/celeris/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors duration-300"
            >
              <span className="font-medium">GitHub Issues</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Bottom Padding */}
      <div className="pb-32" />
    </div>
  );
}
