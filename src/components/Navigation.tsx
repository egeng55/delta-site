"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useRef, useState } from "react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "Team", href: "/team" },
  { label: "Contact", href: "/contact" },
];

function MagneticLink({ href, children, isActive }: { href: string; children: React.ReactNode; isActive: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 200 };
  const xSpring = useSpring(x, springConfig);
  const ySpring = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.3);
    y.set((e.clientY - centerY) * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <Link href={href} ref={ref}>
      <motion.span
        style={{ x: xSpring, y: ySpring }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`text-sm font-medium transition-colors block ${
          isActive ? "text-primary" : "text-muted hover:text-foreground"
        }`}
      >
        {children}
      </motion.span>
    </Link>
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [etTime, setEtTime] = useState("");

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const updateTime = () => setEtTime(formatter.format(new Date()));

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Logo - Fixed top left */}
      <motion.div
        className="fixed left-8 top-8 z-50"
      >
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25 animate-pulse-glow"
            >
              <span className="text-white font-bold text-lg">δ</span>
            </motion.div>
          </motion.div>
        </Link>
      </motion.div>

      {/* Nav items - Fixed left, vertically centered */}
      <motion.nav
        className="fixed left-8 top-1/2 -translate-y-1/2 z-50"
      >
        <ul className="flex flex-col gap-3">
          {navItems.map((item) => (
            <motion.li
              key={item.label}
            >
              <MagneticLink href={item.href} isActive={isActive(item.href)}>
                <motion.span
                  className="relative"
                  whileHover={{ x: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <motion.span
                      layoutId="navIndicator"
                      className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.span>
              </MagneticLink>
            </motion.li>
          ))}
        </ul>
      </motion.nav>

      {/* Auth buttons - Fixed top right */}
      <motion.div
        className="fixed right-8 top-8 z-50 flex flex-col items-end gap-3"
      >
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted"
              >
                Hi, <span className="text-foreground font-medium">{user.name.split(" ")[0]}</span>
              </motion.span>
              <button
                onClick={logout}
                className="text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 bg-primary text-white text-sm rounded-full font-medium transition-colors hover:bg-primary-dark"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
        <span className="text-xs text-muted leading-none pt-1 pr-1">
          ET {etTime || "—"}
        </span>
      </motion.div>
    </>
  );
}
