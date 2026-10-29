# frozen_string_literal: true

# Seed para planos de assinatura do PhotoGo
#
# Rodar: rails db:seed

# Limpa planos existentes (exceto em produção com dados reais)
if Rails.env.development? || Rails.env.test?
  Plan.delete_all
  Subscription.delete_all
  Invoice.delete_all
  UsageRecord.delete_all
  puts "Cleaned existing plans/subscriptions"
end

plans = [
  {
    slug: 'free',
    name: 'Free',
    description: 'Para começar a vender sem custo fixo.',
    price_cents: 0,
    currency: 'BRL',
    interval: 'month',
    interval_count: 1,
    trial_period_days: 0,
    max_products: -1,
    max_storage_mb: -1,
    commission_rate: 0.06, # 6%
    featured_badge: false,
    api_access: false,
    white_label: false,
    priority_support: false,
    features: [
      'Comissão de 6% por venda',
      'Pagamentos via Mercado Pago (Pix + Cartão + Boleto)',
      'Catálogo ilimitado de fotos',
      'Painel do fotógrafo completo',
      'Suporte por email (tempo de resposta: 48h)',
      'Entrega digital automática (link + certificado PDF)',
      'Repasses automáticos para conta bancária'
    ],
    metadata: {
      popular: false,
      sort_order: 1
    },
    active: true,
    position: 1
  },
  {
    slug: 'pro',
    name: 'Pro',
    description: 'Para fotógrafos que vendem todo mês e querem mais lucro.',
    price_cents: 1690, # R$16,90
    currency: 'BRL',
    interval: 'month',
    interval_count: 1,
    trial_period_days: 7,
    max_products: -1,
    max_storage_mb: -1,
    commission_rate: 0.045, # 4.5%
    featured_badge: true,
    api_access: true,
    white_label: false,
    priority_support: true,
    features: [
      'Comissão reduzida: 4.5% por venda',
      'Badge "Verified Pro" no perfil',
      'Analytics avançado (vendas, visualizações, geografia)',
      'Cupons de desconto personalizados',
      'Destaque nas buscas e recomendações',
      'Suporte prioritário (resposta em 12h)',
      'Tudo do plano Free incluído'
    ],
    metadata: {
      popular: true,
      sort_order: 2,
      badge_text: 'Mais popular'
    },
    active: true,
    position: 2
  },
  {
    slug: 'studio',
    name: 'Studio',
    description: 'Para estúdios e agências que precisam de controle total.',
    price_cents: 4990, # R$49,90
    currency: 'BRL',
    interval: 'month',
    interval_count: 1,
    trial_period_days: 14,
    max_products: -1,
    max_storage_mb: -1,
    commission_rate: 0.02, # 2%
    featured_badge: true,
    api_access: true,
    white_label: true,
    priority_support: true,
    features: [
      'Comissão mínima: 2% por venda',
      'White-label opcional (domínio próprio, marca própria)',
      'Acesso à API completa (REST + Webhooks)',
      'Onboarding dedicado (gerente de conta)',
      'Garantia de 99.9% de uptime mensal',
      'Suporte via telefone/WhatsApp',
      'Múltiplos usuários na equipe',
      'Relatórios fiscais automatizados',
      'Tudo do plano Pro incluído'
    ],
    metadata: {
      popular: false,
      sort_order: 3,
      badge_text: 'Para equipes'
    },
    active: true,
    position: 3
  }
]

plans.each do |plan_attrs|
  plan = Plan.find_or_initialize_by(slug: plan_attrs[:slug])
  plan.assign_attributes(plan_attrs)
  plan.save!
  puts "Created/Updated plan: #{plan.name} (#{plan.slug})"
end

puts "Seed completed: #{Plan.count} plans created"