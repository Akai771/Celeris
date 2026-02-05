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
              src="/logo.png" 
              alt="GitIntro Logo" 
              className="w-8 h-8 rounded-lg"
            />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              GitIntro
            </span>
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
          <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">Celeris</h1>
        </div>
        </Link>
        <div className="flex flex-row">
          <CustomToggle />
        </div>
      </div>
    </header>
  );
}
