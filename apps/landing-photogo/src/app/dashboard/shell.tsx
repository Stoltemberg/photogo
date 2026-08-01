'use client'

import { useEffect, useState } from 'react'
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
  ChevronLeft,
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

  // Load collapsed state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_KEY)
      if (stored === 'true') setCollapsed(true)
    } catch {}
  }, [])

  // Save collapsed state
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? 'true' : 'false')
    } catch {}
  }, [collapsed])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const accountLabel = accountType === 'pf' ? 'Pessoa Física' : accountType === 'mei' ? 'MEI' : 'Pessoa Jurídica'

  const sidebarWidth = collapsed ? 'w-16' : 'w-64'

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 flex h-16 items-center justify-between border-b border-ink-900/5 bg-paper-50 px-4 dark:border-paper-100/5 dark:bg-ink-950">
        <Link href="/dashboard" className="flex items-center gap-2 font-mono font-semibold text-ink-900 dark:text-paper-50">
          <Camera className="h-6 w-6 text-sunset-500" />
          {!collapsed && <span>PhotoGo</span>}
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 dark:text-paper-200 dark:hover:bg-ink-800"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:sticky top-0 left-0 z-40 h-screen ${sidebarWidth} flex-shrink-0 border-r border-ink-900/5 bg-paper-50 transition-all duration-300 ease-out dark:border-paper-100/5 dark:bg-ink-900`}
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className={`flex h-16 items-center gap-2 border-b border-ink-900/5 px-4 dark:border-paper-100/5 ${
              collapsed ? 'justify-center' : 'px-6'
            }`}>
              <Link href="/dashboard" className="flex items-center gap-2 font-mono font-semibold text-ink-900 dark:text-paper-50 overflow-hidden">
                <Camera className="h-6 w-6 flex-shrink-0 text-sunset-500" />
                {!collapsed && <span className="truncate">PhotoGo</span>}
              </Link>
            </div>

            {/* User info */}
            <div className={`p-4 border-b border-ink-900/5 dark:border-paper-100/5 ${
              collapsed ? 'px-2' : ''
            }`}>
              <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={userName} className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 flex-shrink-0 rounded-full bg-sunset-500/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-sunset-500" />
                  </div>
                )}
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900 dark:text-paper-50">{userName}</p>
                    <p className="truncate text-xs text-ink-500">{accountLabel}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 scrollbar-thin">
              <ul className="space-y-1">
                {navItems.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                  return (
                    <li key={href} className="relative group">
                      <Link
                        href={href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 rounded-lg text-sm transition-all duration-200 ${
                          collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
                        } ${
                          isActive
                            ? 'bg-sunset-500/10 text-sunset-600 font-medium'
                            : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-paper-200 dark:hover:bg-ink-800 dark:hover:text-paper-50'
                        }`}
                      >
                        <Icon className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                        {!collapsed && (
                          <>
                            {label}
                            {isActive && <ChevronRight className="h-4 w-4 ml-auto animate-page-enter" />}
                          </>
                        )}
                      </Link>

                      {/* Tooltip when collapsed */}
                      {collapsed && (
                        <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-medium text-paper-50 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 z-50 dark:bg-paper-50 dark:text-ink-900">
                          {label}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* Collapse button + Logout */}
            <div className="border-t border-ink-900/5 p-3 dark:border-paper-100/5">
              {/* Collapse toggle - desktop only */}
              <button
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
                className="hidden lg:flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-500 hover:bg-ink-100 hover:text-ink-700 transition-all duration-200 dark:text-paper-300 dark:hover:bg-ink-800 dark:hover:text-paper-100"
              >
                {collapsed ? (
                  <PanelLeftOpen className="h-4 w-4 mx-auto" />
                ) : (
                  <>
                    <PanelLeftClose className="h-4 w-4" />
                    <span>Recolher</span>
                  </>
                )}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-all duration-200 dark:hover:bg-red-500/10 ${
                  collapsed ? 'justify-center' : ''
                }`}
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>Sair</span>}
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
        <main className="flex-1 min-w-0 transition-all duration-300">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl animate-page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
