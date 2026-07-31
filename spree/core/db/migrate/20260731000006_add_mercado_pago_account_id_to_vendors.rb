# frozen_string_literal: true

# Adiciona coluna mercado_pago_account_id na tabela spree_vendors
# para suportar split payments do Mercado Pago (análogo ao stripe_account_id).

class AddMercadoPagoAccountIdToVendors < ActiveRecord::Migration[7.2]
  def change
    add_column :spree_vendors, :mercado_pago_account_id, :string
    add_index  :spree_vendors, :mercado_pago_account_id, unique: true
  end
end
