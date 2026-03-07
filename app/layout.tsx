import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import SessionProvider from "../src/components/SessionProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Persistwork — Your calendar has a lot to say about you",
  description: "Persistwork reads your calendar, scores your day, and finds the quote that fits. Three numbers, one laugh, zero judgment.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Persist"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1C1917"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${lora.variable} antialiased`}
      >
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}