import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('albums')
      .select(`
        id,
        name,
        description,
        share_token,
        is_public,
        price_per_photo,
        created_at,
        cover_photo_id,
        album_photos(count)
      `)
      .eq('photographer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err) {
    console.error('[Albums GET] Error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('albums')
      .insert({
        photographer_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        is_public: false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[Albums POST] Error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
