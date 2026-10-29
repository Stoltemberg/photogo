# frozen_string_literal: true

# Supabase Schema — Auth + Plans + Subscriptions
#
# Migration 1: Perfil do usuário (estende auth.users via trigger)
# Migration 2: Planos (Free/Pro/Studio)
# Migration 3: Assinaturas (stripe_customer_id, status, current_period_end)
# Migration 4: RLS Policies

class CreateSupabaseAuthSchema < ActiveRecord::Migration[7.2]
  def change
    # ─────────────────────────────────────────────────────────────
    # 1. Perfil do usuário (público, linked to auth.users)
    # ─────────────────────────────────────────────────────────────
    create_table :profiles do |t|
      t.uuid :id, null: false, primary_key: true, default: -> { 'gen_random_uuid()' }
      t.references :user, null: false, type: :uuid, foreign_key: { to_table: :users }, index: true
      t.string :full_name
      t.string :avatar_url
      t.string :phone
      t.string :tax_id # CPF/CNPJ
      t.string :tax_type # pf, pj, mei
      t.string :business_name # para PJ
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    add_index :profiles, :user_id, unique: true

    # ─────────────────────────────────────────────────────────────
    # 2. Planos de assinatura
    # ─────────────────────────────────────────────────────────────
    create_table :plans do |t|
      t.string :slug, null: false
      t.string :name, null: false
      t.text :description
      t.integer :price_cents, null: false, default: 0
      t.string :currency, null: false, default: 'BRL'
      t.string :interval, null: false, default: 'month' # month, year
      t.integer :interval_count, default: 1
      t.integer :trial_period_days, default: 0

      # Limites do plano
      t.integer :max_products, default: -1 # -1 = ilimitado
      t.integer :max_storage_mb, default: -1
      t.decimal :commission_rate, precision: 5, scale: 4, default: 0.15
      t.boolean :featured_badge, default: false
      t.boolean :api_access, default: false
      t.boolean :white_label, default: false
      t.boolean :priority_support, default: false

      # Metadados
      t.jsonb :features, default: []
      t.jsonb :metadata, default: {}

      t.boolean :active, default: true
      t.integer :position, default: 0
      t.timestamps
    end

    add_index :plans, :slug, unique: true
    add_index :plans, :active

    # ─────────────────────────────────────────────────────────────
    # 3. Assinaturas
    # ─────────────────────────────────────────────────────────────
    create_table :subscriptions do |t|
      t.references :user, null: false, type: :uuid, foreign_key: { to_table: :users }, index: true
      t.references :plan, null: false, foreign_key: true, index: true
      t.string :status, null: false, default: 'active'
      # active, past_due, canceled, unpaid, trialing, paused

      # IDs externos (Stripe, Mercado Pago)
      t.string :external_id # stripe_customer_id ou mp_preapproval_id
      t.string :provider # stripe, mercado_pago

      # Período atual
      t.datetime :current_period_start
      t.datetime :current_period_end
      t.datetime :trial_start
      t.datetime :trial_end

      # Cancelamento
      t.boolean :cancel_at_period_end, default: false
      t.datetime :canceled_at
      t.datetime :ended_at

      # Quantidades
      t.integer :quantity, default: 1

      # Metadados
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :subscriptions, :status
    add_index :subscriptions, :external_id
    add_index :subscriptions, [:user_id, :status]

    # ─────────────────────────────────────────────────────────────
    # 4. Histórico de faturas/pagamentos
    # ─────────────────────────────────────────────────────────────
    create_table :invoices do |t|
      t.references :subscription, null: false, foreign_key: true, index: true
      t.references :user, null: false, type: :uuid, foreign_key: { to_table: :users }, index: true
      t.string :external_id # stripe_invoice_id ou mp_payment_id
      t.string :provider
      t.string :status # draft, open, paid, void, uncollectible
      t.integer :amount_cents, null: false
      t.integer :amount_paid_cents, default: 0
      t.integer :amount_due_cents, default: 0
      t.string :currency, null: false, default: 'BRL'
      t.datetime :due_date
      t.datetime :paid_at
      t.datetime :period_start
      t.datetime :period_end
      t.string :hosted_invoice_url
      t.string :invoice_pdf_url
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    add_index :invoices, :status
    add_index :invoices, :external_id

    # ─────────────────────────────────────────────────────────────
    # 5. Uso do plano (métricas para billing baseado em uso)
    # ─────────────────────────────────────────────────────────────
    create_table :usage_records do |t|
      t.references :subscription, null: false, foreign_key: true, index: true
      t.references :user, null: false, type: :uuid, foreign_key: { to_table: :users }, index: true
      t.string :metric, null: false # products_uploaded, storage_mb, api_calls
      t.integer :quantity, default: 1
      t.datetime :recorded_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    add_index :usage_records, [:subscription_id, :metric]
    add_index :usage_records, :recorded_at
  end
end