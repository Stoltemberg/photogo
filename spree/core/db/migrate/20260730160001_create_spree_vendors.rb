# frozen_string_literal: true

# Migration: create spree_vendors table
#
# PhotoGo — Fase 1. Implements the `Spree::Vendor` marketplace seller per
# `docs/plans/6.0-multi-vendor-marketplace.md`. The class name `Spree::Vendor`
# is what the 7 `if defined?(Spree::VendorConcern)` hooks in core expect.
#
# Lifecycle state machine, team membership, and the full OrderGroup split
# are layered on top in the matching model file.

class CreateSpreeVendors < ActiveRecord::Migration[7.2]
  def change
    create_table :spree_vendors do |t|
      t.string   :name,                          null: false
      t.string   :slug,                          null: false
      t.string   :status,           null: false, default: 'pending'
      # pending | invited | onboarding | ready_for_review | approved | rejected | suspended | canceled

      t.string   :contact_email
      t.string   :billing_email

      t.text     :about                  # sanitized HTML (per 6.0-rich-text-descriptions.md)
      t.text     :about_html             # write target — sanitized HTML persisted separately

      # PhotoGo-specific photographer metadata — JSONB, indexed for lookups
      t.jsonb    :metadata,                  null: false, default: {}

      # Comission / payout configuration
      t.string   :payouts_schedule_interval  # 'daily'|'weekly'|'biweekly'|'monthly'|'manual' (nil = store default)

      # Lifecycle timestamps (legacy module's state machine ports here)
      t.datetime :terms_accepted_at
      t.datetime :holiday_mode_until

      # Brazil tax compliance
      t.string   :tax_type                    # 'pf' | 'pj' | 'mei'
      t.string   :tax_id                      # CPF (11), CNPJ (14), or MEI (CNPJ)
      t.string   :stripe_account_id           # Stripe Connect Express account id (acct_*)
      t.string   :payout_provider        # 'system' | 'stripe_connect'

      t.timestamps
      t.datetime :deleted_at
    end

    add_index :spree_vendors, :slug, unique: true
    add_index :spree_vendors, :status
    add_index :spree_vendors, :tax_id, unique: true
    add_index :spree_vendors, :stripe_account_id, unique: true
    add_index :spree_vendors, :deleted_at
    add_index :spree_vendors, :metadata, using: :gin
  end
end
