"use client";

import { Camera, Menu, Moon, Sun, X, Monitor } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme, type Theme } from "@/lib/theme-context";

const navLinks = [
  { href: "#features", label: "Recursos" },
  { href: "#photographers", label: "Para Fotógrafos" },
  { href: "#buyers", label: "Para Compradores" },
  { href: "#pricing", label: "Planos" },
  { href: "#faq", label: "FAQ" },
];

export function Header() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close theme menu when clicking outside
  useEffect(() => {
    if (!themeMenuOpen) return
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('[data-theme-menu]')) setThemeMenuOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [themeMenuOpen])

  const themeOptions: { id: Theme; label: string; icon: React.ElementType }[] = [
    { id: 'light', label: 'Claro', icon: Sun },
    { id: 'dark', label: 'Escuro', icon: Moon },
    { id: 'system', label: 'Sistema', icon: Monitor },
  ]

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-ink-900/5 bg-paper-50/80 backdrop-blur-md dark:border-paper-100/5 dark:bg-ink-950/80"
          : "bg-transparent"
      }`}
    >
      <div className="container-wide flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-mono text-lg font-semibold tracking-tight">
          <Camera className="h-6 w-6 text-sunset-500" strokeWidth={1.75} />
          <span>PhotoGo</span>
        </Link>

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
          {/* Theme selector */}
          <div className="relative" data-theme-menu>
            <button
              type="button"
              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              aria-label="Selecionar tema"
              className="rounded-full p-2 text-ink-700 transition hover:bg-paper-100 dark:text-paper-200 dark:hover:bg-ink-800"
            >
              {resolvedTheme === "dark" ? (
                <Moon className="h-5 w-5" strokeWidth={1.75} />
              ) : (
                <Sun className="h-5 w-5" strokeWidth={1.75} />
              )}
            </button>

            {themeMenuOpen && (
              <div className="animate-page-enter absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-xl border border-ink-900/5 bg-paper-50 shadow-xl dark:border-paper-100/10 dark:bg-ink-900">
                <div className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-ink-500">
                  Tema
                </div>
                {themeOptions.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setTheme(id)
                      setThemeMenuOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition ${
                      theme === id
                        ? 'bg-sunset-500/10 text-sunset-500 font-medium'
                        : 'text-ink-700 hover:bg-paper-100 dark:text-paper-200 dark:hover:bg-ink-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                    {label}
                    {theme === id && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sunset-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link href="/explorar" className="hidden md:inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-ink-600 transition hover:text-ink-900 dark:text-paper-200 dark:hover:text-paper-50">
            Explorar
          </Link>

          <a href="#early-access" className="hidden btn-primary md:inline-flex">
            Acesso Antecipado
          </a>

          <Link href="/auth/login" className="hidden md:inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ink-600 transition hover:text-ink-900 dark:text-paper-200 dark:hover:text-paper-50">
            Entrar
          </Link>

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
            <Link href="/explorar" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm text-ink-700 hover:bg-paper-100 dark:text-paper-200 dark:hover:bg-ink-800">
              Explorar
            </Link>
            <a href="#early-access" className="btn-primary mt-3 w-full">
              Acesso Antecipado
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
