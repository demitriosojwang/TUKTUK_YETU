import type { Metadata } from "next";
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
  title: "TUKTUK YETU — Electric Tuk Tuk Fare Collection · Kenya",
  description: "Kenya's hands-free fare collection platform for electric tuk tuks. Passengers pick their stage and pay via M-Pesa — drivers focus on driving.",
  keywords: ["TUKTUK YETU", "Kenya", "electric tuk tuk", "M-Pesa", "matatu", "fare collection", "Nairobi"],
  authors: [{ name: "TUKTUK YETU" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "TUKTUK YETU",
    description: "Electric tuk tuk fare collection · Kenya",
    siteName: "TUKTUK YETU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TUKTUK YETU",
    description: "Electric tuk tuk fare collection · Kenya",
  },
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
