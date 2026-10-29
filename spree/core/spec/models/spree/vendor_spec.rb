# frozen_string_literal: true

require 'spec_helper'

describe Spree::Vendor, type: :model do
  let(:store) { create(:store) }

  describe 'validations' do
    subject { build(:vendor, store: store) }

    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:slug) }
    it { is_expected.to validate_uniqueness_of(:slug).scoped_to(:store_id) }
  end

  describe 'associations' do
    subject { create(:vendor, store: store) }

    it { is_expected.to belong_to(:store).class_name('Spree::Store') }
    it { is_expected.to have_many(:products).class_name('Spree::Product') }
    it { is_expected.to have_many(:vendor_transfers).class_name('Spree::VendorTransfer') }
    it { is_expected.to have_many(:vendor_payouts).class_name('Spree::VendorPayout') }
  end

  describe 'state machine' do
    let(:vendor) { create(:vendor, store: store, status: 'pending') }

    it 'starts as pending' do
      expect(vendor.status).to eq('pending')
    end

    it 'transitions to invited' do
      vendor.invite!
      expect(vendor.status).to eq('invited')
    end

    it 'transitions to onboarding from pending' do
      vendor.start_onboarding!
      expect(vendor.status).to eq('onboarding')
    end

    it 'transitions to approved from onboarding' do
      vendor.start_onboarding!
      vendor.approve!
      expect(vendor.status).to eq('approved')
    end

    it 'transitions to rejected from onboarding' do
      vendor.start_onboarding!
      vendor.reject!
      expect(vendor.status).to eq('rejected')
    end

    it 'transitions to suspended from approved' do
      vendor.start_onboarding!
      vendor.approve!
      vendor.suspend!
      expect(vendor.status).to eq('suspended')
    end
  end

  describe '#balance' do
    let(:vendor) { create(:vendor, store: store) }
    let(:order) { create(:order, vendor: vendor) }

    before do
      create(:vendor_transfer, vendor: vendor, order: order, amount: 100.0, status: 'completed')
    end

    it 'returns the sum of completed transfers minus completed payouts' do
      expect(vendor.balance('BRL')).to eq(100.0)
    end
  end

  describe '#onboarding_tasks' do
    let(:vendor) { create(:vendor, store: store, status: 'pending') }

    it 'returns array of tasks' do
      tasks = vendor.onboarding_tasks
      expect(tasks).to be_an(Array)
      expect(tasks.length).to eq(6)
      expect(tasks.first[:key]).to eq(:terms_accepted)
    end

    it 'marks terms_accepted as incomplete by default' do
      tasks = vendor.onboarding_tasks
      terms_task = tasks.find { |t| t[:key] == :terms_accepted }
      expect(terms_task[:completed]).to be false
    end
  end

  describe '#holiday_mode?' do
    let(:vendor) { create(:vendor, store: store) }

    it 'returns false when no holiday mode' do
      expect(vendor.holiday_mode?).to be false
    end

    it 'returns true when holiday_mode_until is in the future' do
      vendor.update!(holiday_mode_until: 1.week.from_now)
      expect(vendor.holiday_mode?).to be true
    end

    it 'returns false when holiday_mode_until is in the past' do
      vendor.update!(holiday_mode_until: 1.week.ago)
      expect(vendor.holiday_mode?).to be false
    end
  end

  describe '#active scope' do
    let!(:approved_vendor) { create(:vendor, store: store, status: 'approved') }
    let!(:pending_vendor) { create(:vendor, store: store, status: 'pending') }
    let!(:holiday_vendor) do
      create(:vendor, store: store, status: 'approved', holiday_mode_until: 1.week.from_now)
    end

    it 'returns only active vendors' do
      expect(Spree::Vendor.active).to include(approved_vendor)
      expect(Spree::Vendor.active).not_to include(pending_vendor)
      expect(Spree::Vendor.active).not_to include(holiday_vendor)
    end
  end
end
