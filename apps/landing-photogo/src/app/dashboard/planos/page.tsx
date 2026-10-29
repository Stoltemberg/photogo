'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, Loader2, CreditCard, Sparkles, Zap, Building } from 'lucide-react'
import { PageTransition } from '@/components/animations/PageTransition'


type Plan = {
  id: string
  name: string
  price_monthly: number
  commission_rate: number
  max_photos: number
  features: string[]
}

type Subscription = {
  plan_id: string
  status: string
  current_period_end: string
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price_monthly: 0,
    commission_rate: 6,
    max_photos: 50,
    features: [
      'Até 50 fotos no portfólio',
      'Comissão de 6% por venda',
      'Painel de vendas',
      'Pagamento via Pix',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price_monthly: 16.90,
    commission_rate: 4.5,
    max_photos: 500,
    features: [
      'Até 500 fotos no portfólio',
      'Comissão reduzida de 4,5%',
      'Página de fotógrafo personalizada',
      'Estatísticas avançadas',
      'Pagamento via Pix e cartão',
      'Suporte prioritário',
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    price_monthly: 49.90,
    commission_rate: 2,
    max_photos: -1,
    features: [
      'Fotos ilimitadas no portfólio',
      'Comissão mínima de 2%',
      'Página personalizada + domínio próprio',
      'Estatísticas em tempo real',
      'Múltiplos usuários da equipe',
      'API de integração',
      'Suporte dedicado 24/7',
    ],
  },
]

const planIcons: Record<string, React.ElementType> = {
  free: Sparkles,
  pro: Zap,
  studio: Building,
}

export default function PlanosPage() {
  const supabase = createClient()
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [changing, setChanging] = useState<string | null>(null)

  useEffect(() => {
    const loadSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('user_subscriptions')
        .select('plan_id, status, current_period_end')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setCurrentSubscription(data as Subscription)
      }
      setLoading(false)
    }

    loadSubscription()
  }, [supabase])

  const handleUpgrade = async (planId: string) => {
    setChanging(planId)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update subscription in Supabase
      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          plan_id: planId,
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })

      if (error) throw error

      setCurrentSubscription({
        plan_id: planId,
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
    } catch (err) {
      console.error('Erro ao alterar plano:', err)
    } finally {
      setChanging(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sunset-500" />
      </div>
    )
  }

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-semibold text-ink-900 dark:text-paper-50">
          Assinatura & Planos
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Gerencie seu plano e comissões
        </p>
      </div>

      {/* Current plan */}
      {currentSubscription && (
        <div className="rounded-2xl border border-sunset-500/20 bg-sunset-500/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-500">Plano atual</p>
              <p className="mt-1 font-mono text-xl font-bold text-sunset-600 capitalize">
                {plans.find((p) => p.id === currentSubscription.plan_id)?.name || currentSubscription.plan_id}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-500">Renovação</p>
              <p className="mt-1 text-sm text-ink-700 dark:text-paper-200">
                {new Date(currentSubscription.current_period_end).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = planIcons[plan.id] || CreditCard
          const isCurrent = currentSubscription?.plan_id === plan.id
          const isPopular = plan.id === 'pro'

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-6 ${
                isCurrent
                  ? 'border-sunset-500 bg-sunset-500/5'
                  : isPopular
                    ? 'border-sunset-500/30 bg-paper-50 dark:bg-ink-900'
                    : 'border-ink-900/5 bg-paper-50 dark:border-paper-100/5 dark:bg-ink-900'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sunset-500 px-3 py-1 text-xs font-medium text-white">
                  Mais popular
                </div>
              )}

              <div className="flex items-center gap-2">
                <Icon className="h-6 w-6 text-sunset-500" />
                <h3 className="font-mono text-xl font-bold text-ink-900 dark:text-paper-50">
                  {plan.name}
                </h3>
              </div>

              <div className="mt-4">
                <span className="text-3xl font-mono font-bold text-ink-900 dark:text-paper-50">
                  R$ {plan.price_monthly.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-sm text-ink-500">/mês</span>
              </div>

              <div className="mt-4 rounded-xl bg-ink-100 px-4 py-2 dark:bg-ink-800">
                <span className="text-xs text-ink-500">Comissão por venda</span>
                <p className="font-mono font-bold text-sunset-500">{plan.commission_rate}%</p>
              </div>

              <ul className="mt-6 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-ink-600 dark:text-paper-200">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || changing === plan.id}
                className={`mt-6 w-full rounded-xl py-2.5 text-sm font-medium transition ${
                  isCurrent
                    ? 'cursor-default bg-ink-100 text-ink-400 dark:bg-ink-800'
                    : 'btn-primary'
                }`}
              >
                {isCurrent
                  ? 'Plano atual'
                  : changing === plan.id
                    ? 'Alterando...'
                    : plan.price_monthly === 0
                      ? 'Usar plano Free'
                      : `Assinar ${plan.name}`}
              </button>
            </div>
          )
        })}
      </div>
    </PageTransition>
  )
}