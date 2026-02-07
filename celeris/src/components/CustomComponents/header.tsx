"use client";

import { Github, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useThemeToggle } from "@/components/CustomComponents/skiper26";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const { setCrazyDarkTheme, setCrazyLightTheme , isDark } = useThemeToggle({
    variant: "circle",
    start: "top-right",
  });

  const CustomToggle = () => {
    return (
      <div className="flex gap-2">
        {isDark ? (
          <Button variant="ghost" size="icon" onClick={setCrazyLightTheme}>
            <Sun />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={setCrazyDarkTheme}>
            <Moon />
          </Button>
        )}
      </div>
    );
  };

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm border-b border-border/40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 cursor-pointer">
            <img 
              src={isDark ? "/logo_Dark.svg" : "/logo_Light.svg"}
              alt="Celeris Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-bold">Celeris</span>
          </Link>
          <CustomToggle />
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center cursor-pointer">
          <div className="flex items-center gap-3">
            <img 
              src={isDark ? "/logo_Dark.svg" : "/logo_Light.svg"}
              alt="Celeris Logo" 
              className="w-8 h-8 object-contain"
            />
          </div>
        </Link>
        <div className="flex flex-row">
          <CustomToggle />
        </div>
      </div>
    </header>
  );
}
