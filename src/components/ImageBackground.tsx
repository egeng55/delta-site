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
  /** Additional overlay color (uses theme background by default) */
  overlayColor?: string;
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
 *
 * Configuration options:
 * - overlayOpacity: 0-100 (default 70)
 * - gradient: "top" | "bottom" | "both" | "radial" | "none"
 * - blur: adds subtle blur to image
 */
export default function ImageBackground({
  src,
  alt = "Background",
  overlayOpacity = 70,
  gradient = "both",
  overlayColor,
  blur = false,
  priority = false,
  className = "",
  children,
}: ImageBackgroundProps) {
  // Calculate opacity as decimal
  const opacity = overlayOpacity / 100;

  // Generate gradient class based on direction
  const getGradientClass = () => {
    const baseColor = overlayColor || "var(--background)";

    switch (gradient) {
      case "top":
        return `bg-gradient-to-b from-[${baseColor}] to-transparent`;
      case "bottom":
        return `bg-gradient-to-t from-[${baseColor}] to-transparent`;
      case "both":
        return ""; // We'll use a custom gradient for both
      case "radial":
        return ""; // Custom radial gradient
      case "none":
        return "";
      default:
        return "";
    }
  };

  // Generate inline style for complex gradients
  const getGradientStyle = (): React.CSSProperties => {
    switch (gradient) {
      case "both":
        return {
          background: `linear-gradient(to bottom,
            hsl(var(--background) / ${opacity}) 0%,
            hsl(var(--background) / ${opacity * 0.6}) 30%,
            hsl(var(--background) / ${opacity * 0.6}) 70%,
            hsl(var(--background) / ${opacity}) 100%
          )`,
        };
      case "top":
        return {
          background: `linear-gradient(to bottom,
            hsl(var(--background) / ${opacity}) 0%,
            hsl(var(--background) / ${opacity * 0.3}) 50%,
            transparent 100%
          )`,
        };
      case "bottom":
        return {
          background: `linear-gradient(to top,
            hsl(var(--background) / ${opacity}) 0%,
            hsl(var(--background) / ${opacity * 0.3}) 50%,
            transparent 100%
          )`,
        };
      case "radial":
        return {
          background: `radial-gradient(ellipse at center,
            hsl(var(--background) / ${opacity * 0.4}) 0%,
            hsl(var(--background) / ${opacity}) 100%
          )`,
        };
      case "none":
        return {
          backgroundColor: `hsl(var(--background) / ${opacity})`,
        };
      default:
        return {};
    }
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
        />
      </div>

      {/* Overlay with gradient */}
      <div
        className="absolute inset-0"
        style={getGradientStyle()}
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
 * These can be used as starting points for user customization in the app
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
  card: {
    overlayOpacity: 90,
    gradient: "bottom" as const,
  },
  subtle: {
    overlayOpacity: 92,
    gradient: "radial" as const,
    blur: true,
  },
  dark: {
    overlayOpacity: 80,
    gradient: "both" as const,
  },
};
