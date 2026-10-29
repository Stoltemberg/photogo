# frozen_string_literal: true

# Migration: create spree_payment_splits table
#
# Per-child-order bookkeeping of the ONE gateway payment.
# No cloned Payment rows — gateway object stays singular.
# Created at split, one per child order, unique index on (payment_id, order_id).

class CreateSpreePaymentSplits < ActiveRecord::Migration[7.2]
  def change
    create_table :spree_payment_splits do |t|
      t.string   :prefix_id,        null: false
      t.references :payment,        null: false, foreign_key: { to_table: :spree_payments }, index: true
      t.references :order,          null: false, foreign_key: { to_table: :spree_orders },   index: true
      t.references :order_group,               foreign_key: { to_table: :spree_order_groups }, index: true
      t.decimal  :authorized_amount, null: false, precision: 10, scale: 2, default: 0.0
      t.decimal  :captured_amount,   null: false, precision: 10, scale: 2, default: 0.0
      t.decimal  :refunded_amount,   null: false, precision: 10, scale: 2, default: 0.0
      t.string   :currency,          null: false, default: 'BRL'
      t.timestamps
      t.datetime :deleted_at
    end

    add_index :spree_payment_splits, [:payment_id, :order_id], unique: true, name: 'idx_payment_splits_payment_order_unique'
    add_index :spree_payment_splits, :prefix_id, unique: true
    add_index :spree_payment_splits, :deleted_at
  end
end
