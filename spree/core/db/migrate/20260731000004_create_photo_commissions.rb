# frozen_string_literal: true

# Fase 4 — Comissões e Payouts via Stripe Connect
#
# Migration: photo_commissions
#   - order_id (FK spree_orders)
#   - vendor_id (FK spree_vendors)
#   - amount_cents (integer, total commission amount in cents)
#   - currency (string, default 'BRL')
#   - status (enum: pending, paid) – default pending
#   - stripe_transfer_id (string, optional – Stripe Transfer identifier)
#   - timestamps

class CreatePhotoCommissions < ActiveRecord::Migration[7.2]
  def change
    create_table :photo_commissions do |t|
      t.references :order,  null: false, foreign_key: { to_table: :spree_orders },    index: true
      t.references :vendor, null: false, foreign_key: { to_table: :spree_vendors },   index: true
      t.integer    :amount_cents, null: false, default: 0
      t.string     :currency,     null: false, default: 'BRL'
      t.string     :status,       null: false, default: 'pending'
      t.string     :stripe_transfer_id
      t.timestamps
    end

    add_index :photo_commissions, :status
    add_index :photo_commissions, :stripe_transfer_id, unique: true
  end
end
