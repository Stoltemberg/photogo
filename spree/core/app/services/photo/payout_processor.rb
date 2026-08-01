# frozen_string_literal: true

module Photo
  # PayoutProcessor (genérico) — processa payouts agendados delegando para
  # o provider configurado no vendor (Stripe Connect ou Mercado Pago).
  #
  # Substitui o antigo StripePayoutProcessor (que era hard-coded para Stripe).
  # Agora, para cada vendor, usa:
  #   - stripe_connect → Spree::Payouts::StripeConnect
  #   - mercado_pago   → Spree::Payouts::MercadoPago
  #   - system         → Spree::Payouts::System (manual, no-op)
  #
  # Para rodar manualmente:
  #   Photo::PayoutProcessor.run!
  #
  # Em produção, seria um job cron (Sidekiq/Cron) rodando diariamente.
  #
  class PayoutProcessor
    PROVIDER_MAP = {
      'stripe_connect' => Spree::Payouts::StripeConnect,
      'mercado_pago'    => Spree::Payouts::MercadoPago,
      'system'          => Spree::Payouts::System
    }.freeze

    def self.run!
      new.run!
    end

    def run!
      summary = []

      Photo::Payout.where(status: :scheduled).find_each do |payout|
        vendor = payout.vendor
        next unless vendor

        # Carregar comissões pendentes do vendor
        pending_commissions = Photo::Commission.where(vendor: vendor, status: :pending)
        next if pending_commissions.empty?

        total_cents = pending_commissions.sum(:amount_cents)
        payout.update!(amount_cents: total_cents) if payout.amount_cents != total_cents

        # Determinar provider com base na configuração do vendor
        provider_name = vendor.payout_provider || 'system'
        provider_class = PROVIDER_MAP[provider_name] || Spree::Payouts::System
        provider = provider_class.new

        # Criar ou atualizar VendorPayout (registro do ledger)
        vendor_payout = Spree::VendorPayout.find_or_initialize_by(vendor: vendor)
        vendor_payout.amount_cents = total_cents
        vendor_payout.currency     = payout.currency
        vendor_payout.save!

        # Delegar para o provider
        provider.pay!(vendor_payout)

        # Atualizar payout
        payout.update!(status: :processing)

        summary << {
          vendor_id: vendor.id,
          payout_id: payout.id,
          amount_cents: total_cents,
          provider: provider_name
        }
      end

      summary
    end
  end
end
