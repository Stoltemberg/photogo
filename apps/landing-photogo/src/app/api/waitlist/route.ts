import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function hashIp(ip: string): string {
  // Simple hash — production should use crypto.subtle
  let h = 0
  for (let i = 0; i < ip.length; i++) {
    h = ((h << 5) - h) + ip.charCodeAt(i)
    h |= 0
  }
  return h.toString(16).padStart(8, '0')
}

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Backend not configured' },
        { status: 503, headers: corsHeaders }
      )
    }

    const supabase = createServiceClient(supabaseUrl, serviceKey)

    const userAgent = request.headers.get('user-agent') || ''
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                request.headers.get('x-real-ip') || 'unknown'
    const ipHash = hashIp(ip)

    const { error } = await supabase
      .from('waitlist_entries')
      .insert({
        email: email.toLowerCase().trim(),
        source: 'landing',
        user_agent: userAgent,
        ip_hash: ipHash,
      })

    if (error) {
      if (error.code === '23505') {
        // Unique violation — already subscribed
        return NextResponse.json(
          { message: 'Você já está na lista! Avisaremos quando liberarmos.', email },
          { status: 200, headers: corsHeaders }
        )
      }
      console.error('[Waitlist] Supabase error:', error)
      return NextResponse.json(
        { error: 'Erro ao processar inscrição' },
        { status: 500, headers: corsHeaders }
      )
    }

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
