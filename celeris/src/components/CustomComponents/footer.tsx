import { Github, Heart, Linkedin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeToggle } from "@/components/CustomComponents/skiper26";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "Transfer Files", path: "/share/transfer" },
      { name: "Receive Files", path: "/share/receive" },
    ],
    resources: [
      { name: "GitHub Repository", href: "https://github.com/akai771/celeris" },
      { name: "Report Issue", href: "https://github.com/akai771/celeris/issues" },
    ],
    legal: [
      { name: "Privacy Policy", path: "/legal/privacy" },
      { name: "Terms & Conditions", path: "/legal/terms" },
    ],
  };

  const { isDark } = useThemeToggle({
      variant: "circle",
      start: "top-right",
    });

  return (
    <footer className="bg-background">
      <div className="container bg-muted-foreground/10 md:rounded-xl md:mb-12 mx-auto px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
               <img 
                 src={isDark ? "/logo_Dark.svg" : "/logo_Light.svg"}
                 alt="Celeris Logo" 
                 className="w-8 h-8 object-contain"
               />
                <span className="text-xl font-bold text-primary">
                    Celeris
                </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Fast, secure, and private peer-to-peer file sharing. No servers, no storage, just direct transfers.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.path}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.path}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Connect</h3>
            <div className="flex space-x-3">
              <a
                href="https://github.com/akai771"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-9 h-9 rounded-md bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4 text-foreground transition-all ease-in-out duration-300 group-hover:text-primary" />
              </a>
              <a
                href="https://www.linkedin.com/in/rishabh-shetty18/"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-9 h-9 rounded-md bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4 text-foreground transition-all ease-in-out duration-300 group-hover:text-primary" />
              </a>
              <a
                href="mailto:rishabh.shetty123@gmail.com"
                className="group w-9 h-9 rounded-md bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4 text-foreground transition-all ease-in-out duration-300 group-hover:text-primary" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-4 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Celeris. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-primary fill-primary animate-pulse" />
              <span>by <Button variant="link" size="sm" className="p-0 cursor-pointer" onClick={() => window.open("https://github.com/akai771", "_blank")}>Akai771</Button></span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
