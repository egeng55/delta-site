import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Delta Personal Intelligence",
  description:
    "A private personal-intelligence preview for owner-authorized context, bounded reasoning, feedback, and better next actions over time.",
  keywords: ["personal intelligence", "AI", "context", "reasoning", "feedback"],
  icons: {
    icon: [
      { url: "/delta-logo.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: "/icon.png",
  },
  openGraph: {
    title: "Delta Personal Intelligence",
    description:
      "Personal intelligence built around context, state, action, feedback, and learning.",
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
