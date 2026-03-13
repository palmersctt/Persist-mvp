import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import SessionProvider from "../src/components/SessionProvider";
import VisitTracker from "../src/components/VisitTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PERSISTWORK — Your calendar has a lot to say about you",
  description: "PERSISTWORK reads your calendar, scores your day, and finds the quote that fits. Three numbers, one laugh, zero judgment.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PERSISTWORK"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FBF7F2"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* ── FOUC fix: preconnect + preload fonts before first paint ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Lora:ital@0;1&display=swap"
        />
        {/* Hide body until fonts are ready, max 300ms fallback */}
        <style dangerouslySetInnerHTML={{ __html: `
          body { visibility: hidden }
          .fonts-loaded body { visibility: visible }
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function() {
              document.documentElement.classList.add('fonts-loaded');
            });
          } else {
            document.documentElement.classList.add('fonts-loaded');
          }
          // Safety fallback: never hide content more than 300ms
          setTimeout(function() {
            document.documentElement.classList.add('fonts-loaded');
          }, 300);
        `}} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <VisitTracker />
          {children}
          <Analytics />
        </SessionProvider>
      </body>
    </html>
  );
}