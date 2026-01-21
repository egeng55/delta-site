"use client";

import { motion, useMotionValue, useSpring, easeInOut, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useRef, useState, useCallback } from "react";

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

// Hamburger icon component
function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="w-5 h-4 relative flex flex-col justify-between">
      <motion.span
        animate={isOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.15 }}
        className="w-full h-0.5 bg-foreground block origin-center"
      />
      <motion.span
        animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.1 }}
        className="w-full h-0.5 bg-foreground block"
      />
      <motion.span
        animate={isOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.15 }}
        className="w-full h-0.5 bg-foreground block origin-center"
      />
    </div>
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [etTime, setEtTime] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [mobileMenuOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleNavClick = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <>
      {/* Logo - Fixed top left */}
      <motion.div
        className="fixed left-4 md:left-8 top-4 md:top-8 z-50"
      >
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5, ease: easeInOut }}
              className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-primary/25 animate-pulse-glow"
            >
              <Image
                src="/delta-logo.svg"
                alt="Delta"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </motion.div>
          </motion.div>
        </Link>
      </motion.div>

      {/* Desktop Nav - Fixed left, vertically centered (hidden on mobile) */}
      <motion.nav
        className="fixed left-8 top-1/2 -translate-y-1/2 z-50 hidden md:block"
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

      {/* Desktop Auth buttons - Fixed top right (hidden on mobile) */}
      <motion.div
        className="fixed right-8 top-8 z-50 hidden md:flex flex-col items-end gap-3"
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

      {/* Mobile Menu Button - Fixed top right (visible only on mobile) */}
      <div ref={menuRef} className="md:hidden fixed right-4 top-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          <HamburgerIcon isOpen={mobileMenuOpen} />
        </button>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 w-48 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
            >
              <nav className="py-2">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={handleNavClick}
                    className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "text-primary bg-primary/5"
                        : "text-muted hover:text-foreground hover:bg-border/50"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="border-t border-border py-2 px-4">
                {user ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted">
                      Hi, <span className="text-foreground font-medium">{user.name.split(" ")[0]}</span>
                    </p>
                    <button
                      onClick={() => { logout(); handleNavClick(); }}
                      className="text-sm font-medium text-muted hover:text-foreground transition-colors"
                    >
                      Log out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/login"
                      onClick={handleNavClick}
                      className="text-sm font-medium text-muted hover:text-foreground transition-colors"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={handleNavClick}
                      className="text-sm font-medium text-muted hover:text-foreground transition-colors"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>

              <div className="border-t border-border py-2 px-4">
                <span className="text-xs text-muted">ET {etTime || "—"}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
