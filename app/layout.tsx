import type { Metadata } from "next";
import type { Viewport } from "next";
import { Fraunces } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "Sweet Messages",
  description: "A private bank of morning and night messages for iPhone Shortcuts.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sweet Messages"
  },
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#f6f1e8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fraunces.variable}>
      <body>{children}</body>
    </html>
  );
}
