"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

// Different page transition variants
const pageVariants = {
  // Circular reveal from center
  circleReveal: {
    initial: {
      opacity: 0,
      clipPath: "circle(0% at 50% 50%)",
    },
    animate: {
      opacity: 1,
      clipPath: "circle(150% at 50% 50%)",
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: {
      opacity: 0,
      clipPath: "circle(0% at 50% 50%)",
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  },

  // Slide up with fade
  slideUp: {
    initial: {
      opacity: 0,
      y: 100,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: {
      opacity: 0,
      y: -50,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  },

  // Scale with blur effect
  scaleBlur: {
    initial: {
      opacity: 0,
      scale: 0.95,
      filter: "blur(10px)",
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: {
      opacity: 0,
      scale: 1.05,
      filter: "blur(10px)",
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  },
};

// Overlay animation for dramatic effect
const overlayVariants = {
  initial: {
    scaleY: 1,
  },
  animate: {
    scaleY: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.1,
    },
  },
  exit: {
    scaleY: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative">
      {/* Page transition overlay */}
      <motion.div
        key={`overlay-${pathname}`}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={overlayVariants}
        className="fixed inset-0 z-[100] bg-gradient-to-br from-primary via-primary-dark to-accent origin-top pointer-events-none"
      />

      {/* Secondary overlay for layered effect */}
      <motion.div
        key={`overlay2-${pathname}`}
        initial={{ scaleY: 1 }}
        animate={{
          scaleY: 0,
          transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.2,
          }
        }}
        className="fixed inset-0 z-[99] bg-background origin-top pointer-events-none"
      />

      {/* Page content */}
      <motion.main
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants.slideUp}
      >
        {children}
      </motion.main>
    </div>
  );
}
