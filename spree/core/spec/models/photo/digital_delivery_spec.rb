# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Photo::DigitalDelivery, type: :model do
  let(:order)   { create(:order) }
  let(:asset)   { create(:asset) }
  let(:license) { create(:license) }
  let(:delivery) { create(:digital_delivery, order: order, asset: asset, license: license) }

  describe 'validations' do
    it 'requires max_downloads > 0' do
      expect(build(:digital_delivery, max_downloads: 0)).not_to be_valid
    end

    it 'requires download_ttl_hours > 0' do
      expect(build(:digital_delivery, download_ttl_hours: 0)).not_to be_valid
    end
  end

  describe 'default values' do
    it 'defaults to pending status' do
      expect(delivery.status).to eq('pending')
    end

    it 'defaults to 3 max_downloads' do
      expect(delivery.max_downloads).to eq(3)
    end

    it 'defaults to 24 ttl hours' do
      expect(delivery.download_ttl_hours).to eq(24)
    end
  end

  describe '#mark_delivered!' do
    it 'sets status to delivered' do
      delivery.mark_delivered!
      expect(delivery.status).to eq('delivered')
    end

    it 'sets delivered_at' do
      delivery.mark_delivered!
      expect(delivery.delivered_at).to be_present
    end

    it 'computes expires_at from delivered_at + ttl' do
      delivery.mark_delivered!
      expected = delivery.delivered_at + 24.hours
      expect(delivery.expires_at).to be_within(1.second).of(expected)
    end
  end

  describe '#revoke!' do
    it 'sets status to revoked' do
      delivery.revoke!
      expect(delivery.status).to eq('revoked')
    end

    it 'expires all download links immediately' do
      link = delivery.generate_download_link!
      expect(link.valid?).to be true

      delivery.revoke!
      link.reload
      expect(link.valid?).to be false
    end
  end

  describe '#can_download?' do
    it 'returns true when delivered and not expired' do
      delivery.mark_delivered!
      expect(delivery.can_download?).to be true
    end

    it 'returns false when not delivered' do
      expect(delivery.can_download?).to be false
    end

    it 'returns false when expired by time' do
      delivery.mark_delivered!
      delivery.update!(expires_at: 1.minute.ago)
      expect(delivery.can_download?).to be false
    end

    it 'returns false when downloads exhausted' do
      delivery.mark_delivered!
      delivery.update!(max_downloads: 1)
      create(:download_link, digital_delivery: delivery, download_count: 1, max_downloads: 1, expires_at: 24.hours.from_now)
      expect(delivery.can_download?).to be false
    end
  end

  describe '#total_downloads' do
    it 'sums download_count across all links' do
      create(:download_link, digital_delivery: delivery, download_count: 3, max_downloads: 3, expires_at: 24.hours.from_now)
      create(:download_link, digital_delivery: delivery, download_count: 1, max_downloads: 3, expires_at: 24.hours.from_now)
      expect(delivery.total_downloads).to eq(4)
    end
  end

  describe '#remaining_downloads' do
    it 'returns max - total' do
      delivery.update!(max_downloads: 10)
      create(:download_link, digital_delivery: delivery, download_count: 3, max_downloads: 10, expires_at: 24.hours.from_now)
      expect(delivery.remaining_downloads).to eq(7)
    end

    it 'never returns negative' do
      delivery.update!(max_downloads: 1)
      create(:download_link, digital_delivery: delivery, download_count: 5, max_downloads: 3, expires_at: 24.hours.from_now)
      expect(delivery.remaining_downloads).to eq(0)
    end
  end

  describe '#generate_download_link!' do
    it 'creates a DownloadLink with token' do
      delivery.mark_delivered!
      link = delivery.generate_download_link!
      expect(link).to be_persisted
      expect(link.token).to be_present
      expect(link.expires_at).to be > Time.current
    end
  end
end
