import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Fetch album + photos
    const { data: album, error: albumError } = await supabase
      .from('albums')
      .select('*')
      .eq('id', id)
      .eq('photographer_id', user.id)
      .single()

    if (albumError || !album) {
      return NextResponse.json({ error: 'Álbum não encontrado' }, { status: 404 })
    }

    const { data: photos, error: photosError } = await supabase
      .from('album_photos')
      .select(`
        position,
        photo:photos(id, image_url, thumbnail_url, price, category, status)
      `)
      .eq('album_id', id)
      .order('position', { ascending: true })

    if (photosError) {
      return NextResponse.json({ error: photosError.message }, { status: 500 })
    }

    return NextResponse.json({ album, photos: photos || [] })
  } catch (err) {
    console.error('[Album GET] Error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const allowed: Record<string, unknown> = {}
    if (body.name !== undefined) allowed.name = body.name
    if (body.description !== undefined) allowed.description = body.description
    if (body.is_public !== undefined) allowed.is_public = body.is_public
    if (body.cover_photo_id !== undefined) allowed.cover_photo_id = body.cover_photo_id
    if (body.price_per_photo !== undefined) allowed.price_per_photo = body.price_per_photo

    const { data, error } = await supabase
      .from('albums')
      .update(allowed)
      .eq('id', id)
      .eq('photographer_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[Album PATCH] Error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { error } = await supabase
      .from('albums')
      .delete()
      .eq('id', id)
      .eq('photographer_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Album DELETE] Error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
