import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://deltahealthintelligence.com"),
  title: "Delta | Personal Intelligence OS",
  description:
    "Personal context, source-backed research, and governed engineering. Delta connects the evidence to your next move, with owner control and honest uncertainty.",
  keywords: ["personal intelligence", "AI", "context", "reasoning", "feedback"],
  icons: {
    icon: [
      { url: "/delta-logo.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: "/icon.png",
  },
  openGraph: {
    title: "Delta | Personal Intelligence OS",
    description:
      "Your context. Connected to what comes next. Explore Delta's personal intelligence operating system and request-based private preview.",
    type: "website",
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
        {children}
      </body>
    </html>
  );
}
