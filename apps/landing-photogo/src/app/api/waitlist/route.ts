import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400, headers: corsHeaders }
      )
    }

    // In production, this stores in Supabase `waitlist` table
    // and triggers a welcome email via Resend/SendGrid
    console.log('[Waitlist] New signup:', email)

    // TODO: Store in Supabase
    // await supabaseAdmin.from('waitlist').insert({ email, created_at: new Date() })
    // TODO: Send welcome email
    // await resend.emails.send({ from: 'photo@photogo.com.br', to: email, subject: 'Bem-vindo!', ... })

    return NextResponse.json(
      { message: 'Inscrito com sucesso! Em breve entraremos em contato.', email },
      { status: 201, headers: corsHeaders }
    )
  } catch (error) {
    console.error('[Waitlist] Error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}