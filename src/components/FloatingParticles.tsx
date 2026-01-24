"use client";

import { motion, easeInOut, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
}

export default function FloatingParticles({ count = 20 }: { count?: number }) {
  const prefersReducedMotion = useReducedMotion();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 10 + 10,
        delay: Math.random() * 5,
        drift: Math.random() * 50 - 25,
      });
    }
    // Intentional: seed particle state once per count change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticles(newParticles);
  }, [count]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
        className="absolute rounded-full bg-primary/20"
        style={{
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          width: particle.size,
          height: particle.size,
        }}
        data-testid="particle"
        data-drift={particle.drift}
        animate={{
          y: [0, -100, 0],
          x: [0, particle.drift, 0],
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.5, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: easeInOut,
          }}
        />
      ))}
    </div>
  );
}
