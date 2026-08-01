export type UserProfile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  tax_id: string | null
  tax_type: 'pf' | 'pj' | 'mei' | null
  business_name: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type Plan = {
  id: number
  slug: 'free' | 'pro' | 'studio'
  name: string
  description: string
  price_cents: number
  currency: string
  interval: string
  commission_rate: number
  featured_badge: boolean
  api_access: boolean
  white_label: boolean
  priority_support: boolean
  features: string[]
  active: boolean
}

export type Subscription = {
  id: number
  plan_id: number
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing'
  current_period_end: string
  external_id: string | null
  provider: 'mercado_pago' | 'stripe' | null
  cancel_at_period_end: boolean
}