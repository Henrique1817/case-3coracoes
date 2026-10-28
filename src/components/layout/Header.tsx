"use client";

import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { NAV } from "@/data/site";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled ? "border-b border-coffee-100 bg-cream-100/90 backdrop-blur" : "bg-transparent"
      }`}
    >
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-lg focus:bg-wine-600 focus:px-3 focus:py-2 focus:text-cream-50"
      >
        Pular para o conteúdo
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" className="group flex items-baseline gap-2" aria-label="Case 3corações por Henrique Miguel, início">
          <span className="font-serif text-lg font-semibold tracking-tight text-wine-600">
            Case 3corações
          </span>
          <span className="hidden text-sm text-coffee-500 sm:inline">· por Henrique Miguel</span>
        </Link>

        <nav aria-label="Seções" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-coffee-600 transition-colors hover:bg-coffee-50 hover:text-coffee-800"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="rounded-full border border-coffee-100 bg-cream-50 px-4 py-1.5 text-sm font-medium lg:hidden"
          aria-expanded={open}
          aria-controls="menu-mobile"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Fechar" : "Menu"}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="menu-mobile"
            aria-label="Seções"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-coffee-100 bg-cream-100 lg:hidden"
          >
            <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-1 px-5 pb-4">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-coffee-700 hover:bg-coffee-50"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>

      <motion.div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-wine-600"
        style={{ scaleX: progress }}
      />
    </header>
  );
}
