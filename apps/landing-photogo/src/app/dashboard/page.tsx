import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowRight, Camera } from 'lucide-react'
import Link from 'next/link'
import { LogoutButton } from './logout-button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <header className="border-b border-ink-900/5 bg-paper-50/80 backdrop-blur-md dark:border-paper-100/5 dark:bg-ink-950/80">
        <div className="container-wide flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-mono text-lg font-semibold">
            <Camera className="h-6 w-6 text-sunset-500" strokeWidth={1.75} />
            <span className="text-ink-900 dark:text-paper-100">PhotoGo</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-ink-600 dark:text-paper-200">
              Olá, {user.user_metadata?.full_name || user.email?.split('@')[0]}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="container-wide py-12">
        <h1 className="text-4xl font-mono font-semibold text-ink-900 dark:text-paper-100">
          Bem-vindo ao seu painel
        </h1>
        <p className="mt-4 text-lg text-ink-600 dark:text-paper-200">
          Gerencie suas fotos, vendas e assinaturas.
        </p>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardCard title="Meu portfólio" description="Gerencie suas fotos e licenças" href="/dashboard/portfolio" />
          <DashboardCard title="Vendas" description="Histórico de vendas e repasses" href="/dashboard/vendas" />
          <DashboardCard title="Assinatura" description="Plano atual e faturas" href="/dashboard/assinatura" />
          <DashboardCard title="Perfil" description="Nome, bio, dados fiscais" href="/dashboard/perfil" />
          <DashboardCard title="Configurações" description="Pix, notificações, senha" href="/dashboard/configuracoes" />
          <DashboardCard title="Ajuda & Suporte" description="FAQ e contato" href="/dashboard/ajuda" />
        </div>
      </main>
    </div>
  )
}

function DashboardCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-ink-900/5 bg-paper-50 p-8 transition hover:-translate-y-1 hover:border-sunset-500/20 hover:shadow-lg dark:border-paper-100/5 dark:bg-ink-900"
    >
      <h3 className="font-mono text-xl font-semibold text-ink-900 dark:text-paper-100 group-hover:text-sunset-500 transition">
        {title}
      </h3>
      <p className="mt-2 text-sm text-ink-600 dark:text-paper-200">{description}</p>
      <ArrowRight className="mt-6 h-5 w-5 text-ink-400 group-hover:text-sunset-500 transition" strokeWidth={1.5} />
    </Link>
  )
}