import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
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
  title: "PERSISTWORK — Your workday, decoded",
  description: "Focus, Strain, and Balance — three daily scores read from your calendar. The focus you got, the load you carried, the recovery you didn't.",
  openGraph: {
    title: "PERSISTWORK — Your workday, decoded",
    description: "Focus, Strain, and Balance — three daily scores read from your calendar. The focus you got, the load you carried, the recovery you didn't.",
    url: "https://www.persistwork.com",
    siteName: "PERSISTWORK",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "PERSISTWORK — Your workday, decoded",
    description: "Focus, Strain, and Balance — three daily scores read from your calendar. The focus you got, the load you carried, the recovery you didn't."
  },
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
  themeColor: "#0B0B0C"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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