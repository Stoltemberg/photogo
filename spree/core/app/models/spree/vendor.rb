# frozen_string_literal: true

module Spree
  # Spree::Vendor — the marketplace seller model.
  #
  # Per `docs/plans/6.0-multi-vendor-marketplace.md`:
  # - Keeps prefix `ven_` for Enterprise data continuity
  # - Lifecycle state machine ports the Enterprise onboarding flow
  # - Team membership reuses existing Spree::RoleUser (resource: vendor)
  # - External-store subsystem NOT ported — lives in Enterprise only
  # - No denormalized sales_total/commission_total — derived from ledger

  class Vendor < Spree.base_class
    has_prefix_id :ven
    include Spree::Metadata
    include Spree::TranslatableResource

    acts_as_paranoid
    publishes_lifecycle_events

    # ──────────────── Associations ────────────────
    belongs_to :store, class_name: 'Spree::Store', optional: false

    has_many :products,        class_name: 'Spree::Product',       dependent: :nullify
    has_many :stock_locations, class_name: 'Spree::StockLocation', dependent: :nullify
    has_many :orders,          class_name: 'Spree::Order'
    has_many :commission_lines, class_name: 'Spree::CommissionLine'
    has_many :vendor_transfers, class_name: 'Spree::VendorTransfer'
    has_many :vendor_payouts,   class_name: 'Spree::VendorPayout'
    has_many :commission_rates, class_name: 'Spree::CommissionRate'

    has_many :role_users,  class_name: 'Spree::RoleUser',   as: :resource, dependent: :destroy
    has_many :invitations, class_name: 'Spree::Invitation',  as: :resource, dependent: :destroy
    has_many :users, through: :role_users, source: :user, source_type: Spree.user_class.to_s

    # ──────────────── Lifecycle State Machine ────────────────
    # Ports the legacy Enterprise lifecycle (user docs):
    # Invited → Onboarding → Ready for Review → Approved / Rejected / Suspended
    # Legacy allows approve/reject/suspend from most states; keep permissiveness.

    state_machine :status, initial: :pending do
      event(:invite)              { transition [:pending, :canceled] => :invited }
      event(:cancel_invite)       { transition invited: :canceled }
      event(:start_onboarding)    { transition [:pending, :invited] => :onboarding }
      event(:submit_for_review)   { transition onboarding: :ready_for_review }
      event(:approve)             { transition [:onboarding, :ready_for_review, :suspended, :rejected] => :approved }
      event(:reject)              { transition [:onboarding, :ready_for_review] => :rejected }
      event(:suspend)             { transition %i[onboarding ready_for_review approved rejected] => :suspended }
      event(:cancel)              { transition %i[pending invited canceled] => :canceled }
    end

    # ──────────────── Validations ────────────────
    validates :name, :slug, presence: true, uniqueness: { scope: [:store_id], conditions: -> { where(deleted_at: nil) } }
    validates :status, inclusion: { in: %w[pending invited onboarding ready_for_review approved rejected suspended canceled] }
    validates :payouts_schedule_interval, inclusion: { in: %w[daily weekly biweekly monthly manual], allow_nil: true }
    validates :tax_type, inclusion: { in: %w[pf pj mei], allow_nil: true }
    validates :payout_provider, inclusion: { in: %w[system stripe_connect mercado_pago] }

    # ──────────────── Scopes ────────────────
    scope :approved,    -> { where(status: 'approved') }
    scope :active,      -> { where(status: 'approved').where('holiday_mode_until IS NULL OR holiday_mode_until < ?', Time.current) }
    scope :for_store,   ->(store) { where(store: store) }

    # ──────────────── Derived Methods ────────────────

    # What we still owe the vendor in that currency
    def balance(currency = 'BRL')
      vendor_transfers.completed.where(currency: currency).sum(:amount) -
        vendor_payouts.completed.where(currency: currency).sum(:amount)
    end

    # Holiday mode
    def holiday_mode?
      holiday_mode_until.present? && holiday_mode_until > Time.current
    end

    def enter_holiday_mode!(until_date = 30.days.from_now)
      update!(holiday_mode_until: until_date)
    end

    def exit_holiday_mode!
      update!(holiday_mode_until: nil)
    end

    # Onboarding checklist helpers (core tasks for photo marketplace)
    def onboarding_completed?
      terms_accepted_at.present? &&
        about.present? &&
        users.exists? &&
        products.any?
    end

    def onboarding_tasks
      [
        { key: :terms_accepted, completed: terms_accepted_at.present?, required: true },
        { key: :profile_complete, completed: about.present?, required: true },
        { key: :team_member, completed: users.exists?, required: true },
        { key: :first_product, completed: products.any?, required: true },
        { key: :billing_address, completed: billing_address.present?, required: true },
        { key: :returns_address, completed: returns_address.present?, required: false },
      ]
    end
  end
end
