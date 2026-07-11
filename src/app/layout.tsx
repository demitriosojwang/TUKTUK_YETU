import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tuktuk-yetu.vercel.app"),
  title: "TUKTUK YETU — Electric Tuk Tuk Fare Collection · Kenya",
  description: "Kenya's hands-free fare collection platform for electric tuk tuks. Passengers pick their stage and pay via M-Pesa — drivers focus on driving.",
  keywords: ["TUKTUK YETU", "Kenya", "electric tuk tuk", "M-Pesa", "matatu", "fare collection", "Nairobi", "Mombasa", "Likoni"],
  authors: [{ name: "TUKTUK YETU" }],
  applicationName: "TUKTUK YETU",
  generator: "Next.js",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/logo-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/logo-192.png", sizes: "192x192", type: "image/png" },
      { url: "/maskable-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "TUKTUK YETU",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  openGraph: {
    title: "TUKTUK YETU — Fare Collection Made Easy",
    description: "Kenya's hands-free fare collection platform for electric tuk tuks. Passengers pick their stage and pay via M-Pesa — drivers focus on driving.",
    siteName: "TUKTUK YETU",
    type: "website",
    images: [{ url: "/logo-512.png", width: 512, height: 512, alt: "TUKTUK YETU logo" }],
  },
  twitter: {
    card: "summary",
    title: "TUKTUK YETU",
    description: "Fare collection made easy · Kenya",
    images: ["/logo-512.png"],
  },
};

// Viewport with theme-color so the browser chrome matches our Kenyan green
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#006B3F" },
    { media: "(prefers-color-scheme: dark)", color: "#004A2B" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
