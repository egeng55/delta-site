import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import GlobalEffects from "@/components/GlobalEffects";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Delta - AI Health Intelligence",
  description:
    "Your AI-powered health companion that learns your patterns, understands your goals, and provides personalized guidance for lasting results.",
  keywords: ["health", "AI", "fitness", "wellness", "personal trainer", "nutrition"],
  icons: {
    icon: [
      { url: "/delta-logo.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: "/icon.png",
  },
  openGraph: {
    title: "Delta - AI Health Intelligence",
    description:
      "Transform your health journey with AI that understands you.",
    type: "website",
    images: ["/icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <GlobalEffects />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
