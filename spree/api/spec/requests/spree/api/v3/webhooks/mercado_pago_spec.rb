# frozen_string_literal: true

require 'spec_helper'

RSpec.describe 'Mercado Pago Webhook', type: :request do
  let(:gateway) do
    Spree::Gateway::MercadoPago.create!(
      name: 'MP Test',
      active: true,
      preferred_access_token: 'TEST-12345',
      preferred_public_key: 'APP_USR-67890'
    )
  end

  let(:order) { create(:order, state: 'payment', email: 'buyer@test.com', currency: 'BRL') }
  let(:payment) do
    create(:payment,
      order: order,
      payment_method: gateway,
      amount: order.total,
      state: 'pending'
    )
  end

  before do
    payment # create
  end

  describe 'POST /api/v3/webhooks/mercado_pago with payment.updated' do
    context 'when payment is approved' do
      it 'marks Spree payment as complete and order as complete' do
        # Mock the MP API call to return approved
        allow_any_instance_of(Spree::Api::V3::Webhooks::MercadoPagoController)
          .to receive(:fetch_payment_status).and_return('approved')

        # Set the transaction_id that MP would have
        payment.update!(transaction_id: '1234567890')

        post '/api/v3/webhooks/mercado_pago', params: {
          action: 'payment.updated',
          data: { id: '1234567890' }
        }, as: :json

        expect(response).to have_http_status(:ok)
        expect(payment.reload.state).to eq('completed')
      end
    end

    context 'when payment is rejected' do
      it 'marks Spree payment as failure' do
        allow_any_instance_of(Spree::Api::V3::Webhooks::MercadoPagoController)
          .to receive(:fetch_payment_status).and_return('rejected')

        payment.update!(transaction_id: '9876543210')

        post '/api/v3/webhooks/mercado_pago', params: {
          action: 'payment.updated',
          data: { id: '9876543210' }
        }, as: :json

        expect(response).to have_http_status(:ok)
        expect(payment.reload.state).to eq('failed')
      end
    end

    context 'when payment is pending' do
      it 'does not change payment state' do
        allow_any_instance_of(Spree::Api::V3::Webhooks::MercadoPagoController)
          .to receive(:fetch_payment_status).and_return('pending')

        payment.update!(transaction_id: '1111111111')

        post '/api/v3/webhooks/mercado_pago', params: {
          action: 'payment.updated',
          data: { id: '1111111111' }
        }, as: :json

        expect(response).to have_http_status(:ok)
        expect(payment.reload.state).to eq('pending')
      end
    end
  end

  describe 'POST /api/v3/webhooks/mercado_pago with refund' do
    it 'revokes digital deliveries for the order' do
      vendor = create(:vendor, :approved)
      product = create(:product, vendor: vendor, product_type: 'digital_photo')
      order.line_items.create!(variant: product.master, quantity: 1, price: 99.90, currency: 'BRL')
      delivery = Photo::DigitalDelivery.create!(
        order: order,
        asset: create(:asset),
        license: create(:license),
        status: :delivered
      )

      allow_any_instance_of(Spree::Api::V3::Webhooks::MercadoPagoController)
        .to receive(:fetch_payment_status).and_return('approved')

      payment.update!(transaction_id: '5555555555')

      # First approve the payment
      post '/api/v3/webhooks/mercado_pago', params: {
        action: 'payment.updated',
        data: { id: '5555555555' }
      }, as: :json

      # Then refund
      post '/api/v3/webhooks/mercado_pago', params: {
        action: 'refund.created',
        data: { id: '5555555555' }
      }, as: :json

      expect(response).to have_http_status(:ok)
      expect(delivery.reload.status).to eq('revoked')
    end
  end

  describe 'POST /api/v3/webhooks/mercado_pago with invalid payload' do
    it 'returns 200 but ignores the request' do
      post '/api/v3/webhooks/mercado_pago', params: {
        invalid: 'data'
      }, as: :json

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['status']).to eq('ignored')
    end
  end
end
