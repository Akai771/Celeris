"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, AlertCircle, Scale, Ban, Shield, Zap } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function TermsAndConditions() {
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
            Terms & <span className="text-primary">Conditions</span>
          </h1>
          <p className="text-muted-foreground text-xs sm:text-base md:text-lg">
            Last updated: February 6, 2026
          </p>
        </div>

        {/* Introduction */}
        <div className="mb-12 sm:mb-16 p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-card border border-border">
          <p className="text-muted-foreground leading-relaxed">
            Welcome to Celeris. By accessing or using our peer-to-peer file transfer service, you agree to be 
            bound by these Terms and Conditions. Please read them carefully before using our service. If you 
            do not agree with any part of these terms, you may not use Celeris.
          </p>
        </div>

        {/* Content Sections */}
        <div ref={sectionsRef} className="space-y-8">
          {/* Section 1 */}
          <div data-section className="group">
            <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300">
              <div className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5 sm:mt-1">
                <FileText size={20} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 group-hover:text-primary transition-colors duration-300">
                  Service Description
                </h2>
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>
                    Celeris provides a peer-to-peer (P2P) file transfer platform that enables direct 
                    device-to-device file sharing. Key aspects of our service:
                  </p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Facilitation Only:</strong> We act as a connection facilitator through our signaling server</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">No Storage:</strong> Files are never stored on our servers - they transfer directly between users</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">WebRTC Technology:</strong> We use industry-standard WebRTC protocol for secure transfers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">No Registration:</strong> The service is accessible without user accounts</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div data-section className="group">
            <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300">
              <div className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5 sm:mt-1">
                <Shield size={20} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">
                  User Responsibilities
                </h2>
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>By using Celeris, you agree to:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Lawful Use:</strong> Only transfer files that you have the legal right to share</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Content Responsibility:</strong> Take full responsibility for all files you transfer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Intellectual Property:</strong> Respect copyright, trademark, and other intellectual property rights</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">No Malicious Content:</strong> Not share viruses, malware, or harmful code</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Recipient Consent:</strong> Ensure recipients consent to receiving files</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Secure Sharing:</strong> Only share transfer links with intended recipients</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div data-section className="group">
            <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300">
              <div className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5 sm:mt-1">
                <Ban size={20} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">
                  Prohibited Activities
                </h2>
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>The following activities are strictly prohibited:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>Sharing illegal, harmful, threatening, abusive, or offensive content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>Distributing copyrighted material without proper authorization</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>Transmitting malware, viruses, or any malicious code</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>Attempting to hack, disrupt, or interfere with the service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>Using the service for spam, phishing, or fraudulent activities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>Sharing content that violates privacy rights or contains personal data without consent</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>Overloading or attempting to disrupt our infrastructure</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div data-section className="group">
            <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300">
              <div className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5 sm:mt-1">
                <AlertCircle size={20} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">
                  Disclaimer of Warranties
                </h2>
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>
                    <strong className="text-foreground">Celeris is provided "AS IS" and "AS AVAILABLE"</strong> without 
                    warranties of any kind, either express or implied. We make no guarantees regarding:
                  </p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Service Availability:</strong> Uninterrupted or error-free operation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Transfer Success:</strong> Successful completion of file transfers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Data Accuracy:</strong> Accuracy or reliability of transferred data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Security:</strong> Complete protection against all security threats</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Compatibility:</strong> Operation on all devices or browsers</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div data-section className="group">
            <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300">
              <div className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5 sm:mt-1">
                <Scale size={20} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">
                  Limitation of Liability
                </h2>
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>
                    To the maximum extent permitted by law, Celeris and its operators shall not be liable for:
                  </p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Data Loss:</strong> Any loss, corruption, or alteration of transferred files</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Failed Transfers:</strong> Incomplete, interrupted, or unsuccessful file transfers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">User Content:</strong> Content shared by users of the service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Third-Party Actions:</strong> Actions of other users or third parties</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Service Interruptions:</strong> Downtime, maintenance, or technical issues</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Security Breaches:</strong> Unauthorized access or data breaches beyond our control</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span><strong className="text-foreground">Consequential Damages:</strong> Indirect, incidental, special, or consequential damages</span>
                    </li>
                  </ul>
                  <p className="pt-4 font-medium text-foreground">
                    In no event shall our total liability exceed $100 USD or the amount you paid to use 
                    the service (which is currently $0).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6 */}
          <div data-section className="group">
            <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300">
              <div className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5 sm:mt-1">
                <Zap size={20} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">
                  Service Availability
                </h2>
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>
                    We strive to maintain high availability but make no guarantees:
                  </p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>The service may be temporarily unavailable due to maintenance, updates, or technical issues</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>We reserve the right to modify, suspend, or discontinue the service at any time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>Connection quality depends on your internet connection and device capabilities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>Transfer speeds may vary based on network conditions and peer availability</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 7 */}
          <div data-section className="group">
            <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300">
              <div className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5 sm:mt-1">
                <Shield size={20} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">
                  Indemnification
                </h2>
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>
                    You agree to indemnify and hold harmless Celeris, its operators, and affiliates from any 
                    claims, damages, losses, or expenses arising from:
                  </p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>Your use or misuse of the service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>Files or content you transfer through the service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>Your violation of these Terms and Conditions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>Your violation of any laws or third-party rights</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 8 */}
          <div data-section className="group">
            <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300">
              <div className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5 sm:mt-1">
                <FileText size={20} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 group-hover:text-primary transition-colors duration-300">
                  Termination
                </h2>
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>
                    We reserve the right to:
                  </p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>Terminate or suspend access to the service for violations of these terms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>Block IP addresses or connections engaged in prohibited activities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>Take legal action for serious violations</span>
                    </li>
                  </ul>
                  <p className="pt-4">
                    You may stop using the service at any time by simply closing your browser or 
                    disconnecting from active transfers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 9 */}
          <div data-section className="group">
            <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300">
              <div className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5 sm:mt-1">
                <Scale size={20} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">
                  Governing Law
                </h2>
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>
                    These Terms and Conditions shall be governed by and construed in accordance with applicable 
                    laws. Any disputes arising from these terms or your use of Celeris shall be resolved through 
                    binding arbitration or in the courts of appropriate jurisdiction.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 10 */}
          <div data-section className="group">
            <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300">
              <div className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5 sm:mt-1">
                <FileText size={20} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 group-hover:text-primary transition-colors duration-300">
                  Changes to Terms
                </h2>
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>
                    We may update these Terms and Conditions from time to time. Changes will be posted on this 
                    page with an updated "Last updated" date. Your continued use of Celeris after changes are 
                    posted constitutes acceptance of the modified terms.
                  </p>
                  <p>
                    We encourage you to review these terms periodically to stay informed of any updates.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 11 */}
          <div data-section className="group">
            <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300">
              <div className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5 sm:mt-1">
                <Shield size={20} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">
                  Severability
                </h2>
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>
                    If any provision of these Terms and Conditions is found to be unenforceable or invalid, 
                    that provision shall be limited or eliminated to the minimum extent necessary so that these 
                    terms shall otherwise remain in full force and effect.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 sm:mt-16 p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4">Questions About These Terms?</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            If you have any questions about these Terms and Conditions, please contact us:
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

        {/* Acceptance Notice */}
        <div className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-lg sm:rounded-xl bg-muted/30 border border-border">
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            By using Celeris, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
          </p>
        </div>
      </section>

      {/* Bottom Padding */}
      <div className="pb-32" />
    </div>
  );
}
