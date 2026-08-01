import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Image, TrendingUp, DollarSign, Eye, ArrowUpRight, Clock, Plus, Camera } from 'lucide-react'
import { PageTransition, StaggeredList } from '@/components/animations/PageTransition'
import { AnimatedNumber } from '@/components/animations/AnimatedNumber'

export default async function DashboardHome() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id || ''

  // Real stats
  const { count: portfolioCount } = await supabase
    .from('photos')
    .select('*', { count: 'exact', head: true })
    .eq('photographer_id', userId)

  const { data: sales } = await supabase
    .from('sales')
    .select('amount, status')
    .eq('photographer_id', userId)

  const totalRevenue = (sales || [])
    .filter((s) => s.status === 'paid')
    .reduce((sum, s) => sum + Number(s.amount || 0), 0)
  const paidSales = (sales || []).filter((s) => s.status === 'paid').length
  const pendingRevenue = (sales || [])
    .filter((s) => s.status === 'pending')
    .reduce((sum, s) => sum + Number(s.amount || 0), 0)

  const stats = [
    {
      label: 'Fotos no portfólio',
      value: portfolioCount || 0,
      icon: Image,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Vendas concluídas',
      value: paidSales,
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Receita total',
      value: totalRevenue,
      icon: DollarSign,
      color: 'text-sunset-500',
      bg: 'bg-sunset-500/10',
      format: (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`,
    },
    {
      label: 'Pendente',
      value: pendingRevenue,
      icon: Clock,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      format: (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`,
    },
  ]

  const cards = stats.map((stat) => ({
    label: stat.label,
    value: stat.value,
    icon: stat.icon,
    color: stat.color,
    bg: stat.bg,
    format: stat.format || ((n: number) => n.toString()),
  }))

  return (
    <PageTransition className="space-y-8">
      <div>
        <h1 className="font-mono text-2xl font-semibold text-ink-900 dark:text-paper-50">
          Visão geral
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Acompanhe seus números e desempenho
        </p>
      </div>

      {/* Stats — com contadores animados */}
      <StaggeredList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" delayStep={80}>
        {cards.map(({ label, value, icon: Icon, color, bg, format }) => (
          <div
            key={label}
            className="group rounded-2xl border border-ink-900/5 bg-paper-50 p-5 hover-lift dark:border-paper-100/5 dark:bg-ink-900"
          >
            <div className="flex items-center justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <Icon className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-ink-300 transition-all duration-300 group-hover:text-sunset-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
            <p className="mt-4 text-2xl font-mono font-bold text-ink-900 dark:text-paper-50">
              <AnimatedNumber value={value} format={format} duration={1200} />
            </p>
            <p className="text-xs text-ink-500 mt-1">{label}</p>
          </div>
        ))}
      </StaggeredList>

      {/* Quick actions */}
      <StaggeredList className="grid grid-cols-1 lg:grid-cols-2 gap-6" delayStep={120}>
        <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-6 hover-lift dark:border-paper-100/5 dark:bg-ink-900">
          <h3 className="font-mono text-lg font-semibold text-ink-900 dark:text-paper-50 mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-sunset-500" />
            Ações rápidas
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/portfolio"
              className="btn-primary group/btn flex items-center gap-2 px-4 py-2 text-sm"
            >
              <Image className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
              Enviar fotos
            </Link>
            <Link
              href="/dashboard/planos"
              className="rounded-xl border border-ink-900/10 px-4 py-2 text-sm text-ink-700 hover:bg-ink-100 hover:border-sunset-500/30 transition-all duration-200 dark:border-paper-100/10 dark:text-paper-200 dark:hover:bg-ink-800"
            >
              Ver planos
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-6 hover-lift dark:border-paper-100/5 dark:bg-ink-900">
          <h3 className="font-mono text-lg font-semibold text-ink-900 dark:text-paper-50 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-ink-400" />
            Atividade recente
          </h3>
          {paidSales > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-ink-600 dark:text-paper-200">
                Você tem {paidSales} {paidSales === 1 ? 'venda concluída' : 'vendas concluídas'}.
              </p>
              <Link
                href="/dashboard/vendas"
                className="text-xs text-sunset-500 hover:underline inline-flex items-center gap-1"
              >
                Ver todas as vendas →
              </Link>
            </div>
          ) : (
            <div className="text-center py-4">
              <Camera className="h-8 w-8 text-ink-300 mx-auto animate-float" />
              <p className="mt-2 text-sm text-ink-500">
                Nenhuma atividade ainda.
              </p>
              <p className="text-xs text-ink-400">
                Comece enviando suas primeiras fotos!
              </p>
            </div>
          )}
        </div>
      </StaggeredList>
    </PageTransition>
  )
}
