"use client";

import { Camera, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "#features", label: "Recursos" },
  { href: "#photographers", label: "Para Fotógrafos" },
  { href: "#buyers", label: "Para Compradores" },
  { href: "#pricing", label: "Planos" },
  { href: "#faq", label: "FAQ" },
];

export function Header() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("photogo-theme");
    if (stored === "light" || stored === "dark" || stored === "system") {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("photogo-theme", next);

    // Use the View Transitions API for a smooth cross-fade when available.
    // Falls back to the CSS transitions defined in globals.css otherwise.
    const toggle = () => {
      document.documentElement.classList.toggle("dark", next === "dark");
      document.documentElement.style.colorScheme = next;
    };

    if (typeof document.startViewTransition === "function") {
      document.startViewTransition(toggle);
    } else {
      toggle();
    }
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all ${
        scrolled
          ? "border-b border-ink-900/5 bg-paper-50/80 backdrop-blur-md dark:border-paper-100/5 dark:bg-ink-950/80"
          : "bg-transparent"
      }`}
    >
      <div className="container-wide flex h-16 items-center justify-between">
        <a href="#" className="flex items-center gap-2 font-mono text-lg font-semibold tracking-tight">
          <Camera className="h-6 w-6 text-sunset-500" strokeWidth={1.75} />
          <span>PhotoGo</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-ink-600 transition hover:text-ink-900 dark:text-paper-200 dark:hover:text-paper-50"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className="rounded-full p-2 text-ink-700 transition hover:bg-paper-100 dark:text-paper-200 dark:hover:bg-ink-800"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" strokeWidth={1.75} />
            ) : (
              <Moon className="h-5 w-5" strokeWidth={1.75} />
            )}
          </button>

          <a href="#early-access" className="hidden btn-primary md:inline-flex">
            Acesso Antecipado
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="rounded-full p-2 md:hidden"
          >
            {open ? (
              <X className="h-5 w-5" strokeWidth={1.75} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink-900/5 bg-paper-50 dark:border-paper-100/5 dark:bg-ink-950 md:hidden">
          <nav className="container-wide flex flex-col py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-ink-700 hover:bg-paper-100 dark:text-paper-200 dark:hover:bg-ink-800"
              >
                {link.label}
              </a>
            ))}
            <a href="#early-access" className="btn-primary mt-3 w-full">
              Acesso Antecipado
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
