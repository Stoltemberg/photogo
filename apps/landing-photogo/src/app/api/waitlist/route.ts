import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // In a real implementation, this would:
    // 1. Store in database (Vercel KV, PostgreSQL, etc.)
    // 2. Send welcome email
    // 3. Add to newsletter provider (Resend, SendGrid, etc.)
    // For now, we'll just log and return success
    
    console.log('[Waitlist] New signup:', email)
    
    // TODO: Integrate with Spree backend
    // await fetch(`${process.env.SPREE_API_URL}/api/v3/store/waitlist`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email })
    // })

    return NextResponse.json(
      { message: 'Inscrito com sucesso! Em breve entraremos em contato.', email },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Waitlist] Error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}