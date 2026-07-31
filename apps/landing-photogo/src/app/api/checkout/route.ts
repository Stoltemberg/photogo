import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, items, payment_method, payment_data } = body

    if (!email || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Email e itens são obrigatórios' },
        { status: 400, headers: corsHeaders }
      )
    }

    // In production, this would call the Spree backend API:
    // const res = await fetch(`${process.env.SPREE_API_URL}/api/v3/store/checkout`, { ... })

    // For now, simulate a successful checkout
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const total = items.length * 49.90 // simplified

    if (payment_data?.method === 'pix') {
      return NextResponse.json({
        order_id: orderId,
        status: 'pending_payment',
        total,
        payment: {
          method: 'pix',
          status: 'pending',
          qr_code: '00020126360014BR.GOV.BCB.PIX0114test@photogo.com.br5204000053039865802BR5913PHOTOGO',
          qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          ticket_url: 'https://www.mercadopago.com.br/checkout/v1/redirect',
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
        commissions: items.map((_: unknown, i: number) => ({
          id: `comm_${i}_${Date.now()}`,
          vendor_id: `vnd_${i}`,
          amount_cents: Math.round(49.90 * 100 * 0.85),
          currency: 'BRL',
          status: 'pending',
        })),
      }, { status: 201, headers: corsHeaders })
    }

    // Card payment (simulated approval)
    return NextResponse.json({
      order_id: orderId,
      status: 'complete',
      total,
      payment: {
        method: 'card',
        status: 'approved',
        payment_method_id: payment_data?.payment_method_id || 'visa',
        installments: payment_data?.installments || 1,
      },
      commissions: items.map((_: unknown, i: number) => ({
        id: `comm_${i}_${Date.now()}`,
        vendor_id: `vnd_${i}`,
        amount_cents: Math.round(49.90 * 100 * 0.85),
        currency: 'BRL',
        status: 'pending',
      })),
    }, { status: 201, headers: corsHeaders })

  } catch (error) {
    console.error('[Checkout] Error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}