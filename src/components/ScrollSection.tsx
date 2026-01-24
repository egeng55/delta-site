"use client";

import { motion, useScroll, useTransform, easeOut } from "framer-motion";
import { useRef, ReactNode, memo } from "react";

interface ScrollSectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  animation?: "fade" | "slide-up" | "slide-left" | "slide-right" | "scale" | "parallax";
}

export default function ScrollSection({
  children,
  className = "",
  id,
  animation = "fade",
}: ScrollSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [100, 0, 0, -100]);
  const x = useTransform(scrollYProgress, [0, 0.3], [-100, 0]);
  const xRight = useTransform(scrollYProgress, [0, 0.3], [100, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.8]);
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const getAnimationProps = () => {
    switch (animation) {
      case "slide-up":
        return { opacity, y };
      case "slide-left":
        return { opacity, x };
      case "slide-right":
        return { opacity, x: xRight };
      case "scale":
        return { opacity, scale };
      case "parallax":
        return { y: parallaxY };
      case "fade":
      default:
        return { opacity };
    }
  };

  return (
    <motion.section
      ref={ref}
      id={id}
      style={getAnimationProps()}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// Simpler component for items that animate on scroll into view
interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: ScrollRevealProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: 30 };
      case "down":
        return { opacity: 0, y: -30 };
      case "left":
        return { opacity: 0, x: 30 };
      case "right":
        return { opacity: 0, x: -30 };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: false, margin: "-100px", amount: 0.3 }}
      transition={{ duration: 0.5, delay, ease: easeOut }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Page transition wrapper
interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}

// Stagger container for children animations
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.1,
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, margin: "-50px", amount: 0.25 }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Individual stagger item (memoized for performance in lists)
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export const StaggerItem = memo(function StaggerItem({ children, className = "" }: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: easeOut },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
});
