import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Image, TrendingUp, DollarSign, Eye, ArrowUpRight, Clock } from 'lucide-react'

export default async function DashboardHome() {
  const supabase = await createClient()

  // Fetch sales data from Supabase
  const { data: sales } = await supabase
    .from('user_subscriptions')
    .select('plan_id, status, current_period_end')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
    .single()

  // Fetch portfolio count
  const { count: portfolioCount } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })

  const stats = [
    { label: 'Fotos no portfólio', value: portfolioCount || 0, icon: Image, color: 'text-blue-500' },
    { label: 'Vendas este mês', value: 0, icon: TrendingUp, color: 'text-green-500' },
    { label: 'Receita total', value: 'R$ 0,00', icon: DollarSign, color: 'text-sunset-500' },
    { label: 'Visualizações', value: 0, icon: Eye, color: 'text-purple-500' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-mono text-2xl font-semibold text-ink-900 dark:text-paper-50">
          Visão geral
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Acompanhe seus números e desempenho
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-ink-900/5 bg-paper-50 p-5 dark:border-paper-100/5 dark:bg-ink-900"
          >
            <div className="flex items-center justify-between">
              <span className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-ink-300" />
            </div>
            <p className="mt-4 text-2xl font-mono font-bold text-ink-900 dark:text-paper-50">{value}</p>
            <p className="text-xs text-ink-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-6 dark:border-paper-100/5 dark:bg-ink-900">
          <h3 className="font-mono text-lg font-semibold text-ink-900 dark:text-paper-50 mb-4">
            Ações rápidas
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/portfolio"
              className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
            >
              <Image className="h-4 w-4" />
              Enviar fotos
            </Link>
            <Link
              href="/dashboard/planos"
              className="rounded-xl border border-ink-900/10 px-4 py-2 text-sm text-ink-700 hover:bg-ink-100 dark:border-paper-100/10 dark:text-paper-200 dark:hover:bg-ink-800"
            >
              Ver planos
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-6 dark:border-paper-100/5 dark:bg-ink-900">
          <h3 className="font-mono text-lg font-semibold text-ink-900 dark:text-paper-50 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-ink-400" />
            Atividade recente
          </h3>
          <p className="text-sm text-ink-500">
            Nenhuma atividade ainda. Comece enviando suas primeiras fotos!
          </p>
        </div>
      </div>
    </div>
  )
}