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

    const spreeUrl = process.env.SPREE_API_URL
    const spreeKey = process.env.SPREE_API_KEY

    if (!spreeUrl || !spreeKey) {
      return NextResponse.json(
        { error: 'Backend não configurado' },
        { status: 503, headers: corsHeaders }
      )
    }

    // Forward checkout to Spree backend
    const res = await fetch(`${spreeUrl}/api/v3/store/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${spreeKey}`,
      },
      body: JSON.stringify({
        email,
        items: items.map((i: { product_id: string; quantity: number }) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
        payment_method,
        payment_data,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Erro ao processar pagamento' },
        { status: res.status, headers: corsHeaders }
      )
    }

    return NextResponse.json(data, { status: 201, headers: corsHeaders })
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