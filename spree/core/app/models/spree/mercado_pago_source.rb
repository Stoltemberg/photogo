# frozen_string_literal: true

module Spree
  # Payment source para Mercado Pago — armazena os dados de retorno do pagamento.
  #
  # Campos:
  #   - payment_id: ID do pagamento no Mercado Pago (ex: "1234567890")
  #   - payment_method_id: método usado ("pix", "visa", "mastercard", "boleto")
  #   - installments: número de parcelas (1-12) para cartão
  #   - token: token do cartão (tokenizado pelo SDK JS do MP)
  #   - status: status do pagamento (approved, pending, rejected)
  #   - qr_code: código Copia-e-Cola para Pix
  #   - pix_expires_at: expiração do QR code do Pix
  #
  class MercadoPagoSource < Spree.base_class
    belongs_to :payment_method, class_name: 'Spree::PaymentMethod'

    validates :payment_id, presence: true, allow_nil: true

    # Retorna true se é pagamento Pix
    def pix?
      payment_method_id == 'pix'
    end

    # Retorna true se é cartão de crédito
    def credit_card?
      %w[visa mastercard amex elo hipercard].include?(payment_method_id)
    end

    # Retorna true se é boleto
    def boleto?
      payment_method_id == 'boleto'
    end

    # Human-readable description of the payment method
    def method_description
      case payment_method_id
      when 'pix'    then 'Pix'
      when 'boleto' then 'Boleto Bancário'
      when 'visa'   then 'Cartão Visa'
      when 'mastercard' then 'Cartão Mastercard'
      when 'amex'   then 'Cartão American Express'
      when 'elo'    then 'Cartão Elo'
      when 'hipercard' then 'Cartão Hipercard'
      else payment_method_id&.humanize || 'Mercado Pago'
      end
    end
  end
end
