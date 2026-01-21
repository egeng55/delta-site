"use client";

import Image from "next/image";

export interface ImageBackgroundProps {
  src: string;
  alt?: string;
  /** Overlay intensity: "light" (60%), "medium" (75%), "heavy" (85%) */
  overlay?: "light" | "medium" | "heavy";
  blur?: boolean;
  priority?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Reusable image background component with gradient overlay.
 * Uses the same Tailwind gradient pattern as the Research page.
 */
export default function ImageBackground({
  src,
  alt = "Background",
  overlay = "medium",
  blur = false,
  priority = false,
  className = "",
  children,
}: ImageBackgroundProps) {
  // Use the exact same gradient classes that work on Research page
  const getGradientClasses = () => {
    switch (overlay) {
      case "light":
        return "bg-gradient-to-b from-background/70 via-background/50 to-background/70";
      case "medium":
        return "bg-gradient-to-b from-background/80 via-background/60 to-background";
      case "heavy":
        return "bg-gradient-to-b from-background/90 via-background/75 to-background";
      default:
        return "bg-gradient-to-b from-background/80 via-background/60 to-background";
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Image + Gradient (same structure as Research page) */}
      <div className="absolute inset-0">
        <Image
          src={src}
          alt={alt}
          fill
          className={`object-cover ${blur ? "blur-sm scale-105" : ""}`}
          priority={priority}
          sizes="100vw"
        />
        <div className={`absolute inset-0 ${getGradientClasses()}`} />
      </div>

      {/* Content */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}
