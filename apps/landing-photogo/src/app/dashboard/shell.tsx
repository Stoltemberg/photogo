'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Camera,
  LayoutDashboard,
  Image,
  TrendingUp,
  CreditCard,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/dashboard/portfolio', label: 'Meu Portfólio', icon: Image },
  { href: '/dashboard/vendas', label: 'Vendas', icon: TrendingUp },
  { href: '/dashboard/planos', label: 'Assinatura', icon: CreditCard },
  { href: '/dashboard/perfil', label: 'Perfil', icon: User },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings },
  { href: '/dashboard/ajuda', label: 'Ajuda & Suporte', icon: HelpCircle },
]

const COLLAPSED_KEY = 'photogo-sidebar-collapsed'

export function DashboardShell({
  children,
  userName,
  avatarUrl,
  accountType,
  userEmail,
}: {
  children: React.ReactNode
  userName: string
  avatarUrl: string
  accountType: string
  userEmail: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const prevCollapsed = useRef(collapsed)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(COLLAPSED_KEY)
      if (stored === 'true') setCollapsed(true)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? 'true' : 'false')
    } catch {}

    if (prevCollapsed.current !== collapsed && prevCollapsed.current !== undefined && mounted) {
      setFlashing(true)
      const t = setTimeout(() => setFlashing(false), 600)
      return () => clearTimeout(t)
    }
    prevCollapsed.current = collapsed
  }, [collapsed, mounted])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const accountLabel = accountType === 'pf' ? 'Pessoa Física' : accountType === 'mei' ? 'MEI' : 'Pessoa Jurídica'

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 flex h-16 items-center justify-between border-b border-ink-900/5 bg-paper-50 px-4 dark:border-paper-100/5 dark:bg-ink-950">
        <Link href="/dashboard" className="flex items-center gap-2 font-mono font-semibold text-ink-900 dark:text-paper-50">
          <Camera className="h-6 w-6 text-sunset-500" />
          <span>PhotoGo</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 dark:text-paper-200 dark:hover:bg-ink-800"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <div className="flex">
        {/* Sidebar — fixed width with transition */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:sticky top-0 left-0 z-40 h-screen flex-shrink-0 border-r border-ink-900/5 bg-paper-50 sidebar-transition dark:border-paper-100/5 dark:bg-ink-900 ${
            flashing ? 'sidebar-flash' : ''
          }`}
          style={{
            width: collapsed ? '4rem' : '16rem',
          }}
        >
          <div className="flex h-full w-full flex-col overflow-hidden">
            {/* Logo */}
            <div className={`flex h-16 items-center border-b border-ink-900/5 dark:border-paper-100/5 sidebar-transition ${
              collapsed ? 'justify-center px-0' : 'gap-2 px-6'
            }`}>
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 font-mono font-semibold text-ink-900 dark:text-paper-50 ${
                  collapsed ? 'justify-center' : ''
                }`}
              >
                <Camera className="h-6 w-6 flex-shrink-0 text-sunset-500" />
                <span
                  className="truncate"
                  style={{
                    maxWidth: collapsed ? '0px' : '200px',
                    opacity: collapsed ? 0 : 1,
                    marginLeft: collapsed ? '0px' : undefined,
                    transition: 'opacity 220ms ease-out, max-width 320ms cubic-bezier(0.32, 0.72, 0, 1)',
                  }}
                >
                  PhotoGo
                </span>
              </Link>
            </div>

            {/* User info */}
            <div className={`border-b border-ink-900/5 dark:border-paper-100/5 sidebar-transition ${
              collapsed ? 'p-2 flex justify-center' : 'p-4'
            }`}>
              <div className={`flex items-center sidebar-transition ${collapsed ? 'justify-center gap-0' : 'gap-3'}`}>
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={userName}
                    className={`flex-shrink-0 rounded-full object-cover sidebar-transition ${
                      collapsed ? 'h-9 w-9' : 'h-10 w-10'
                    }`}
                  />
                ) : (
                  <div className={`flex-shrink-0 rounded-full bg-sunset-500/10 flex items-center justify-center sidebar-transition ${
                    collapsed ? 'h-9 w-9' : 'h-10 w-10'
                  }`}>
                    <User className={`text-sunset-500 sidebar-transition ${collapsed ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  </div>
                )}
                <div
                  className="overflow-hidden"
                  style={{
                    maxWidth: collapsed ? '0px' : '160px',
                    opacity: collapsed ? 0 : 1,
                    transform: collapsed ? 'translateX(-6px)' : 'translateX(0)',
                    transition: 'opacity 200ms ease-out 80ms, transform 280ms cubic-bezier(0.32, 0.72, 0, 1), max-width 320ms cubic-bezier(0.32, 0.72, 0, 1)',
                  }}
                >
                  <p className="truncate text-sm font-medium text-ink-900 dark:text-paper-50">{userName}</p>
                  <p className="truncate text-xs text-ink-500">{accountLabel}</p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin sidebar-transition" style={{ padding: collapsed ? '0.5rem' : '0.5rem' }}>
              <ul className="space-y-1">
                {navItems.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                  return (
                    <li key={href} className="relative group">
                      <Link
                        href={href}
                        onClick={() => setSidebarOpen(false)}
                        className={`relative flex items-center gap-3 rounded-lg text-sm sidebar-transition ${
                          collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
                        } ${
                          isActive
                            ? 'bg-sunset-500/10 text-sunset-600 font-medium'
                            : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-paper-200 dark:hover:bg-ink-800 dark:hover:text-paper-50'
                        }`}
                        title={collapsed ? label : undefined}
                      >
                        {/* Active indicator bar */}
                        {isActive && !collapsed && (
                          <span
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-sunset-500"
                            style={{
                              animation: 'sidebar-content-in 320ms cubic-bezier(0.32, 0.72, 0, 1) both',
                            }}
                          />
                        )}
                        <Icon
                          className={`flex-shrink-0 sidebar-transition ${
                            collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4'
                          } ${isActive ? 'scale-110' : ''}`}
                          style={{
                            transition: 'transform 250ms cubic-bezier(0.32, 0.72, 0, 1), width 320ms ease, height 320ms ease',
                          }}
                        />
                        <span
                          className="overflow-hidden whitespace-nowrap"
                          style={{
                            maxWidth: collapsed ? '0px' : '200px',
                            opacity: collapsed ? 0 : 1,
                            transform: collapsed ? 'translateX(-4px)' : 'translateX(0)',
                            transition: 'opacity 200ms ease-out 80ms, transform 280ms cubic-bezier(0.32, 0.72, 0, 1), max-width 320ms cubic-bezier(0.32, 0.72, 0, 1)',
                          }}
                        >
                          {label}
                        </span>
                        {!collapsed && isActive && (
                          <ChevronRight
                            className="h-4 w-4 ml-auto"
                            style={{
                              animation: 'sidebar-content-in 320ms cubic-bezier(0.32, 0.72, 0, 1) both',
                            }}
                          />
                        )}
                      </Link>

                      {/* Tooltip when collapsed */}
                      {collapsed && (
                        <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 whitespace-nowrap rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-medium text-paper-50 opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1 z-50 dark:bg-paper-50 dark:text-ink-900">
                          {label}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* Collapse button + Logout */}
            <div className="border-t border-ink-900/5 p-2 dark:border-paper-100/5">
              {/* Collapse toggle - desktop only */}
              <button
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
                className={`toggle-btn hidden lg:flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-500 hover:bg-ink-100 hover:text-ink-700 sidebar-transition dark:text-paper-300 dark:hover:bg-ink-800 dark:hover:text-paper-100 ${
                  collapsed ? 'justify-center' : ''
                }`}
              >
                <span className="flex items-center" key={collapsed ? 'open' : 'closed'}>
                  {collapsed ? (
                    <PanelLeftOpen className="h-4 w-4 icon-pivot" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4 icon-pivot" />
                  )}
                </span>
                <span
                  className="overflow-hidden whitespace-nowrap"
                  style={{
                    maxWidth: collapsed ? '0px' : '200px',
                    opacity: collapsed ? 0 : 1,
                    transform: collapsed ? 'translateX(-4px)' : 'translateX(0)',
                    transition: 'opacity 200ms ease-out 80ms, transform 280ms cubic-bezier(0.32, 0.72, 0, 1), max-width 320ms cubic-bezier(0.32, 0.72, 0, 1)',
                  }}
                >
                  Recolher
                </span>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 sidebar-transition dark:hover:bg-red-500/10 ${
                  collapsed ? 'justify-center' : ''
                }`}
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                <span
                  className="overflow-hidden whitespace-nowrap"
                  style={{
                    maxWidth: collapsed ? '0px' : '200px',
                    opacity: collapsed ? 0 : 1,
                    transform: collapsed ? 'translateX(-4px)' : 'translateX(0)',
                    transition: 'opacity 200ms ease-out 80ms, transform 280ms cubic-bezier(0.32, 0.72, 0, 1), max-width 320ms cubic-bezier(0.32, 0.72, 0, 1)',
                  }}
                >
                  Sair
                </span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 lg:hidden animate-page-enter"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main
          className="flex-1 min-w-0"
          style={{
            marginLeft: 0,
            transition: 'padding-left 320ms cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl animate-page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
