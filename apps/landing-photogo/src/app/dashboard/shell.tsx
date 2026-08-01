'use client'

import { useState } from 'react'
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
          PhotoGo
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
            sidebarOpen ? 'block' : 'hidden'
          } lg:block fixed lg:sticky top-0 left-0 z-40 h-screen w-64 flex-shrink-0 border-r border-ink-900/5 bg-paper-50 dark:border-paper-100/5 dark:bg-ink-900`}
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 px-6 border-b border-ink-900/5 dark:border-paper-100/5">
              <Link href="/dashboard" className="flex items-center gap-2 font-mono font-semibold text-ink-900 dark:text-paper-50">
                <Camera className="h-6 w-6 text-sunset-500" />
                PhotoGo
              </Link>
            </div>

            {/* User info */}
            <div className="p-4 border-b border-ink-900/5 dark:border-paper-100/5">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-sunset-500/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-sunset-500" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900 dark:text-paper-50">{userName}</p>
                  <p className="truncate text-xs text-ink-500">{accountLabel}</p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto p-3">
              <ul className="space-y-1">
                {navItems.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                          isActive
                            ? 'bg-sunset-500/10 text-sunset-600 font-medium'
                            : 'text-ink-600 hover:bg-ink-100 dark:text-paper-200 dark:hover:bg-ink-800'
                        }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {label}
                        {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* Logout */}
            <div className="border-t border-ink-900/5 p-3 dark:border-paper-100/5">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl animate-page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}