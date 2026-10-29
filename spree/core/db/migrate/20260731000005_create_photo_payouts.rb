# frozen_string_literal: true

# Fase 4 – Payouts via Stripe Connect
# Migration: photo_payouts
#   - vendor_id (FK spree_vendors)
#   - amount_cents (integer, total payout amount in cents)
#   - currency (string, default 'BRL')
#   - status (enum: scheduled, processing, paid, failed) – default scheduled
#   - stripe_payout_id (string, Stripe Payout identifier)
#   - scheduled_at (datetime – when payout is scheduled to run)
#   - timestamps

class CreatePhotoPayouts < ActiveRecord::Migration[7.2]
  def change
    create_table :photo_payouts do |t|
      t.references :vendor, null: false, foreign_key: { to_table: :spree_vendors }, index: true
      t.integer    :amount_cents, null: false, default: 0
      t.string     :currency,     null: false, default: 'BRL'
      t.string     :status,       null: false, default: 'scheduled'
      t.string     :stripe_payout_id
      t.datetime   :scheduled_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.timestamps
    end

    add_index :photo_payouts, :status
    add_index :photo_payouts, :stripe_payout_id, unique: true
  end
end
