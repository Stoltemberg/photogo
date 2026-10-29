# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Photo::OrderCommission, type: :model do
  # We test the concern by creating an order with line items and transitioning
  # it to 'complete', then verifying commissions and payouts were created.

  let(:vendor)  { create(:vendor) }
  let(:product) { create(:product, vendor: vendor) }
  let(:order)   { create(:order, state: 'cart', currency: 'BRL') }

  before do
    # Add a line item to the order
    order.contents.add(product.master, 2)
  end

  describe 'after order transitions to complete' do
    it 'creates a commission for the vendor' do
      # Transition order to complete
      order.update!(state: 'complete')

      commissions = Photo::Commission.where(order: order, vendor: vendor)
      expect(commissions.count).to eq(1)
      expect(commissions.first.status).to eq('pending')
      expect(commissions.first.currency).to eq('BRL')
    end

    it 'calculates commission as 15% of gross line item total' do
      order.update!(state: 'complete')

      commission = Photo::Commission.find_by(order: order, vendor: vendor)
      # price * quantity * 0.15 → stored in cents
      gross_cents = order.line_items.sum { |li| (li.price * li.quantity).cents }
      expected    = (gross_cents * 0.15).round

      expect(commission.amount_cents).to eq(expected)
    end

    it 'creates or updates a scheduled payout for the vendor' do
      order.update!(state: 'complete')

      payout = Photo::Payout.find_by(vendor: vendor, status: 'scheduled')
      expect(payout).to be_present
      expect(payout.amount_cents).to be > 0
    end

    it 'does not create commissions for orders not in complete state' do
      order.update!(state: 'payment')

      expect(Photo::Commission.where(order: order)).to be_empty
    end
  end

  describe 'PLATFORM_FEE_RATE' do
    it 'is 0.15 (15%)' do
      expect(Photo::OrderCommission::PLATFORM_FEE_RATE).to eq(0.15)
    end
  end
end
