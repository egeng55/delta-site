"use client";

import { motion, easeInOut, easeOut } from "framer-motion";

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}

// Text that reveals letter by letter
export function AnimatedText({
  text,
  className = "",
  delay = 0,
  staggerDelay = 0.03,
}: AnimatedTextProps) {
  const letters = text.split("");

  return (
    <motion.span
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          variants={{
            hidden: { opacity: 0, y: 50 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.4,
                ease: easeInOut,
              },
            },
          }}
          className="inline-block"
          style={{ whiteSpace: letter === " " ? "pre" : "normal" }}
        >
          {letter}
        </motion.span>
      ))}
    </motion.span>
  );
}

// Text that reveals word by word
export function AnimatedWords({
  text,
  className = "",
  delay = 0,
  staggerDelay = 0.1,
}: AnimatedTextProps) {
  const words = text.split(" ");

  return (
    <motion.span
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={{
            hidden: { opacity: 0, y: 30, rotateX: -90 },
            visible: {
              opacity: 1,
              y: 0,
              rotateX: 0,
              transition: {
                duration: 0.5,
                ease: easeInOut,
              },
            },
          }}
          className="inline-block mr-[0.25em]"
          style={{ transformOrigin: "bottom" }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

// Counting number animation
interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 2,
  className = "",
}: AnimatedCounterProps) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: false, amount: 0.4 }}
      className={className}
    >
      {prefix}
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false, amount: 0.4 }}
      >
        <Counter from={0} to={target} duration={duration} />
      </motion.span>
      {suffix}
    </motion.span>
  );
}

function Counter({ from, to, duration }: { from: number; to: number; duration: number }) {
  return (
    <motion.span
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      transition={{ duration }}
    >
      <motion.span
        initial={{
          // @ts-expect-error Custom motion value used for counting
          count: from
        }}
        whileInView={{
          // @ts-expect-error Custom motion value used for counting
          count: to
        }}
        viewport={{ once: false, amount: 0.4 }}
        transition={{ duration, ease: easeOut }}
      >
        {/* Use a callback to render the count */}
        <CountDisplay from={from} to={to} duration={duration} />
      </motion.span>
    </motion.span>
  );
}

function CountDisplay({ from, to, duration }: { from: number; to: number; duration: number }) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      setCount(Math.floor(from + (to - from) * easeOutQuart(progress)));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [from, to, duration]);

  return <>{count}</>;
}

function easeOutQuart(x: number): number {
  return 1 - Math.pow(1 - x, 4);
}

import { useState, useEffect } from "react";

// Typewriter effect
interface TypewriterProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
}

export function Typewriter({
  text,
  className = "",
  speed = 50,
  delay = 0,
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, started]);

  return (
    <span className={className}>
      {displayedText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-[2px] h-[1em] bg-primary ml-1 align-middle"
      />
    </span>
  );
}

// Gradient text with animation
interface GradientTextProps {
  text: string;
  className?: string;
}

export function GradientText({ text, className = "" }: GradientTextProps) {
  return (
    <motion.span
      className={`bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent ${className}`}
      animate={{
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: easeInOut,
      }}
    >
      {text}
    </motion.span>
  );
}
