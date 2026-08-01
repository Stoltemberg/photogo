# frozen_string_literal: true

# PhotoGo – integrate commission generation into Spree orders.
# After an order transitions to the `complete` state (payment succeeded),
# we create a Photo::Commission for each vendor (photographer) and schedule
# a Photo::Payout (or update an existing scheduled payout).

Spree::Order.include Photo::OrderCommission
