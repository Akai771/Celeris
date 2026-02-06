import type { Metadata } from "next";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/CustomComponents/theme-provider";
import Header from "@/components/CustomComponents/header";

export const metadata: Metadata = {
  title: "Celeris - Peer-to-peer File Transfer",
  description: "File Transfer Application",
  keywords: ["file transfer", "peer-to-peer", "P2P", "secure file sharing", "fast file transfer", "Celeris", "data transfer", "file sharing", "encryption", "privacy", "direct transfer"],
  creator: "Rishabh Shetty",
  authors: [
    {
      name: "Rishabh Shetty",
      url: "https://akai-dev-portfolio.vercel.app/"
    }
  ],
  openGraph: {
    title: "Celeris - Peer-to-peer File Transfer",
    description: "File Transfer Application",
    url: "https://celerisapp.com",
    siteName: "Celeris",
    images: [
      {
        url: "https://celerisapp.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Celeris - Peer-to-peer File Transfer",
      },
    ],
    locale: "en_US",
    type: "website",

},
  twitter: {
    card: "summary_large_image",
    title: "Celeris - Peer-to-peer File Transfer",
    description: "File Transfer Application",
    images: ["https://celerisapp.com/og-image.png"],
  },
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode;}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Celeris - File Transfer</title>
        <meta name="description" content="Celeris - Peer-to-peer file transfer without server storage." />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Yellowtail&display=swap" rel="stylesheet" />
        <script async src="https://ngd-api-kqesv.ondigitalocean.app/track.min.js" data-project-key="ngd_8ee71f61f5abb1d9d3c1cbefae97a7804a3789738307c8666a5fa6113926c5c8"></script>
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Header />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
