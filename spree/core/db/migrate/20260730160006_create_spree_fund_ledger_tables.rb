# frozen_string_literal: true

# Migration: create fund ledger tables
#
# Two-level fund ledger per `docs/plans/6.0-multi-vendor-marketplace.md`:
#
# Level 1 — VendorTransfer: per-order, on-fulfillment.
#   Credits the vendor's balance with what they earned (sale − commission − commission VAT).
#   One `earning` transfer per fulfilled vendor order.
#   One `refund_reversal` per refunded order line, linked via reversed_from.
#
# Level 2 — VendorPayout: per-interval, scheduled.
#   Sweeps vendor's accumulated unpaid transfers into one bank settlement.
#   One payout per interval per vendor per currency.

class CreateSpreeFundLedgerTables < ActiveRecord::Migration[7.2]
  def change
    # ──────────────── VendorTransfer (Level 1 — on-fulfillment) ────────────────
    create_table :spree_vendor_transfers do |t|
      t.string   :prefix_id,   null: false
      t.references :vendor,    null: false, foreign_key: { to_table: :spree_vendors }, index: true
      t.references :order,     null: false, foreign_key: { to_table: :spree_orders },  index: true
      t.references :payout,                  foreign_key: { to_table: :spree_vendor_payouts }, index: true, null: true  # nil until settled
      t.references :reversed_from,           foreign_key: { to_table: :spree_vendor_transfers }, index: true, null: true
      t.string   :kind,        null: false, default: 'earning'  # 'earning' | 'refund_reversal'
      t.string   :status,      null: false, default: 'pending'  # pending | processing | completed | failed
      t.decimal  :amount,      null: false, precision: 10, scale: 2
      t.string   :currency,    null: false, default: 'BRL'
      t.string   :provider,    null: false, default: 'system'   # 'system' | 'stripe_connect'
      t.string   :reference                                        # provider txn id (Stripe transfer id); nil for manual
      t.timestamps
      t.datetime :deleted_at
    end

    add_index :spree_vendor_transfers, :prefix_id, unique: true
    add_index :spree_vendor_transfers, :deleted_at
    # One earning transfer per vendor order (partial unique index)
    add_index :spree_vendor_transfers, :order_id,
      unique: true,
      where: "kind = 'earning'",
      name: 'idx_vendor_transfers_order_earning_unique'
    add_index :spree_vendor_transfers, :reference,
      unique: true,
      where: "reference IS NOT NULL",
      name: 'idx_vendor_transfers_reference_unique'
    add_index :spree_vendor_transfers, [:vendor_id, :currency, :status],
      name: 'idx_vendor_transfers_vendor_currency_status'

    # ──────────────── VendorPayout (Level 2 — scheduled) ────────────────
    create_table :spree_vendor_payouts do |t|
      t.string   :prefix_id,   null: false
      t.references :vendor,    null: false, foreign_key: { to_table: :spree_vendors }, index: true
      t.string   :status,      null: false, default: 'pending'  # pending | processing | completed | failed
      t.decimal  :amount,      null: false, precision: 10, scale: 2, default: 0.0
      t.string   :currency,    null: false, default: 'BRL'
      t.datetime :period_start
      t.datetime :period_end
      t.string   :provider,    null: false, default: 'system'
      t.string   :reference                                        # provider payout id; nil for manual
      t.timestamps
      t.datetime :deleted_at
    end

    add_index :spree_vendor_payouts, :prefix_id, unique: true
    add_index :spree_vendor_payouts, :deleted_at
    add_index :spree_vendor_payouts, [:vendor_id, :currency], name: 'idx_vendor_payouts_vendor_currency'
    add_index :spree_vendor_payouts, :reference,
      unique: true,
      where: "reference IS NOT NULL",
      name: 'idx_vendor_payouts_reference_unique'
  end
end
