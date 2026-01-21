"use client";

import Image from "next/image";

export interface ImageBackgroundProps {
  /** Image source path */
  src: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Overlay opacity (0-100) */
  overlayOpacity?: number;
  /** Gradient direction */
  gradient?: "top" | "bottom" | "both" | "radial" | "none";
  /** Whether to blur the image */
  blur?: boolean;
  /** Priority loading for above-fold images */
  priority?: boolean;
  /** Additional className for the container */
  className?: string;
  /** Children to render on top */
  children?: React.ReactNode;
}

/**
 * Reusable image background component with customizable overlay and gradient.
 * This pattern can be used for user-customizable backgrounds in the app.
 */
export default function ImageBackground({
  src,
  alt = "Background",
  overlayOpacity = 70,
  gradient = "both",
  blur = false,
  priority = false,
  className = "",
  children,
}: ImageBackgroundProps) {
  // Convert opacity to tailwind-compatible value
  const opacityClass = Math.round(overlayOpacity / 5) * 5; // Round to nearest 5

  // Generate gradient overlay based on direction
  const getOverlayClasses = () => {
    const baseOpacity = opacityClass;
    const midOpacity = Math.round(baseOpacity * 0.7);

    switch (gradient) {
      case "both":
        return ""; // Use inline style for complex gradient
      case "top":
        return `bg-gradient-to-b from-background/${baseOpacity} via-background/${midOpacity} to-transparent`;
      case "bottom":
        return `bg-gradient-to-t from-background/${baseOpacity} via-background/${midOpacity} to-transparent`;
      case "radial":
        return ""; // Use inline style
      case "none":
        return `bg-background/${baseOpacity}`;
      default:
        return "";
    }
  };

  // For complex gradients, use inline styles with rgba
  const getOverlayStyle = (): React.CSSProperties | undefined => {
    // Dark theme base color (near black)
    const darkColor = "10, 10, 15"; // RGB values for #0a0a0f

    const opacity = overlayOpacity / 100;
    const midOpacity = opacity * 0.65;
    const lowOpacity = opacity * 0.5;

    switch (gradient) {
      case "both":
        return {
          background: `linear-gradient(to bottom,
            rgba(${darkColor}, ${opacity}) 0%,
            rgba(${darkColor}, ${midOpacity}) 25%,
            rgba(${darkColor}, ${lowOpacity}) 50%,
            rgba(${darkColor}, ${midOpacity}) 75%,
            rgba(${darkColor}, ${opacity}) 100%
          )`,
        };
      case "radial":
        return {
          background: `radial-gradient(ellipse at center,
            rgba(${darkColor}, ${lowOpacity}) 0%,
            rgba(${darkColor}, ${opacity}) 100%
          )`,
        };
      default:
        return undefined;
    }
  };

  const overlayStyle = getOverlayStyle();
  const overlayClasses = getOverlayClasses();

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

      {/* Overlay with gradient */}
      <div
        className={`absolute inset-0 ${overlayClasses}`}
        style={overlayStyle}
      />

      {/* Content */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Preset configurations for common use cases
 */
export const backgroundPresets = {
  hero: {
    overlayOpacity: 70,
    gradient: "both" as const,
    priority: true,
  },
  section: {
    overlayOpacity: 85,
    gradient: "both" as const,
  },
  subtle: {
    overlayOpacity: 92,
    gradient: "radial" as const,
    blur: true,
  },
};
