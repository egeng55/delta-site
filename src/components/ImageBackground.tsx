"use client";

import Image from "next/image";

export interface ImageBackgroundProps {
  src: string;
  alt?: string;
  overlayOpacity?: number;
  blur?: boolean;
  priority?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Reusable image background component with gradient overlay.
 */
export default function ImageBackground({
  src,
  alt = "Background",
  overlayOpacity = 70,
  blur = false,
  priority = false,
  className = "",
  children,
}: ImageBackgroundProps) {
  const opacity = overlayOpacity / 100;
  const midOpacity = opacity * 0.65;

  // Using the dark theme background color (#0a0a0f = rgb(10, 10, 15))
  const gradientStyle = {
    background: `linear-gradient(to bottom,
      rgba(10, 10, 15, ${opacity}) 0%,
      rgba(10, 10, 15, ${midOpacity}) 40%,
      rgba(10, 10, 15, ${midOpacity}) 60%,
      rgba(10, 10, 15, ${opacity}) 100%
    )`,
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={src}
          alt={alt}
          fill
          className={`object-cover ${blur ? "blur-sm scale-105" : ""}`}
          priority={priority}
          sizes="100vw"
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0" style={gradientStyle} />

      {/* Content */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}
