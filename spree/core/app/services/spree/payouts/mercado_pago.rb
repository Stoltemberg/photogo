# frozen_string_literal: true

# Spree::Payouts::MercadoPago — Split Payment provider via Mercado Pago.
#
# Mercado Pago Brasil suporta "Split Payments 1:1" (marketplace → seller).
# A comissão da plataforma é deduzida automaticamente do valor do vendedor.
#
# Fluxo:
#   1. Vendedor (fotógrafo) cria conta no Mercado Pago (PF ou PJ)
#   2. Marketplace envia payment com marketplace_fee + sponsor_id
#   3. Mercado Pago processa pagamento, deduz taxa MP + comissão marketplace
#   4. Repassa restante direto para conta do vendedor
#   5. Webhook notifica marketplace sobre status do pagamento
#
# Per `docs/plans/6.0-multi-vendor-marketplace.md` Decision 9:
# Padrão plugável — segue PayoutProvider::Base (mesma interface do StripeConnect).
#
module Spree
  module Payouts
    class MercadoPago < Spree::PayoutProvider::Base
      # On-fulfillment: cria split payment no Mercado Pago.
      # @param vendor_transfer [Spree::VendorTransfer] the transfer to execute
      def transfer!(vendor_transfer)
        return unless vendor_transfer.vendor.mercado_pago_account_id.present?

        # Em produção: POST /v1/payments com marketplace_fee
        # {
        #   transaction_amount: vendor_transfer.amount.to_f,
        #   payment_method_id: 'account_money',
        #   payer: { email: platform_account_email },
        #   marketplace_fee: calculate_platform_fee(vendor_transfer),
        #   sponsor_id: vendor_transfer.vendor.mercado_pago_account_id
        # }

        Rails.logger.info "[PhotoGo] MercadoPago#transfer! #{vendor_transfer.id} → #{vendor_transfer.vendor.mercado_pago_account_id}"

        vendor_transfer.update!(provider: 'mercado_pago')
        vendor_transfer.complete!
      end

      # On-interval: settle accumulated transfers into one payout.
      # No Mercado Pago, o split é feito na transação — não há payout separado.
      # O dinheiro cai direto na conta do vendedor após processamento.
      # @param vendor_payout [Spree::VendorPayout] the payout to execute
      def pay!(vendor_payout)
        # Mercado Pago repassa automaticamente após processamento do split.
        # Não há "payout" separado como no Stripe Connect.
        # Apenas registramos que o repasse foi iniciado.

        Rails.logger.info "[PhotoGo] MercadoPago#pay! #{vendor_payout.id} (automatic split — no manual payout needed)"

        vendor_payout.update!(provider: 'mercado_pago')
        # Não marca complete aqui — aguarda webhook de pagamento confirmado
      end

      # Refund reversal: reverte split payment.
      # @param vendor_transfer [Spree::VendorTransfer] the reversal transfer
      def reverse!(vendor_transfer)
        # Em produção: POST /v1/payments/:id/refund com split reversal
        # Mercado Pago permite estorno parcial/total do split

        Rails.logger.info "[PhotoGo] MercadoPago#reverse! #{vendor_transfer.id} (refund reversal)"

        vendor_transfer.complete!
      end

      private

      # Calcula a comissão da plataforma (ex: 15% do valor do vendedor)
      def calculate_platform_fee(vendor_transfer)
        (vendor_transfer.amount.to_f * 0.15).round(2)
      end
    end
  end
end
