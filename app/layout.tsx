import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "TypeFlow — Typing Practice in English & Arabic",
  description:
    "Improve your English typing speed and accuracy with real-world sentences translated to Arabic. Practice daily conversations, tech jargon, travel phrases and more.",
  applicationName: "TypeFlow",
  keywords: ["typing practice", "English Arabic", "typing speed", "WPM", "typing test", "تعلم الانجليزية"],
  authors: [{ name: "TypeFlow" }],
  metadataBase: new URL(APP_URL),

  // Open Graph — controls how the link looks when shared on WhatsApp, Facebook, etc.
  openGraph: {
    title: "TypeFlow — Typing Practice in English & Arabic",
    description:
      "Master English typing with Arabic translations. Track your WPM, unlock levels, and build real-world vocabulary.",
    url: APP_URL,
    siteName: "TypeFlow",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TypeFlow — Typing Practice App",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // Twitter / X card
  twitter: {
    card: "summary_large_image",
    title: "TypeFlow — Typing Practice in English & Arabic",
    description: "Master English typing with Arabic translations.",
    images: ["/og-image.png"],
  },

  // PWA manifest
  manifest: "/manifest.json",

  // Favicon
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#facc15",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
