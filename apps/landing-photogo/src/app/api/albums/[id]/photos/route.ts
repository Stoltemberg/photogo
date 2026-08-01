import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Body = {
  photo_ids: string[]
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { id: albumId } = await params

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verify album ownership
    const { data: album, error: albumError } = await supabase
      .from('albums')
      .select('photographer_id')
      .eq('id', albumId)
      .single()

    if (albumError || !album) {
      return NextResponse.json({ error: 'Álbum não encontrado' }, { status: 404 })
    }

    if (album.photographer_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body: Body = await request.json()
    const { photo_ids } = body

    if (!Array.isArray(photo_ids) || photo_ids.length === 0) {
      return NextResponse.json({ error: 'photo_ids é obrigatório' }, { status: 400 })
    }

    // Verify photos belong to user
    const { data: photosCheck, error: photosError } = await supabase
      .from('photos')
      .select('id')
      .eq('photographer_id', user.id)
      .in('id', photo_ids)

    if (photosError) {
      return NextResponse.json({ error: photosError.message }, { status: 500 })
    }

    if (photosCheck.length === 0) {
      return NextResponse.json({ error: 'Nenhuma foto válida' }, { status: 400 })
    }

    // Build album_photos rows
    const rows = photosCheck.map((p, idx) => ({
      album_id: albumId,
      photo_id: p.id,
      position: idx,
    }))

    const { error: insertError } = await supabase
      .from('album_photos')
      .insert(rows)

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ added: rows.length }, { status: 201 })
  } catch (err) {
    console.error('[Album Photos POST] Error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { id: albumId } = await params

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { photo_ids } = body

    if (!Array.isArray(photo_ids) || photo_ids.length === 0) {
      return NextResponse.json({ error: 'photo_ids é obrigatório' }, { status: 400 })
    }

    const { error } = await supabase
      .from('album_photos')
      .delete()
      .eq('album_id', albumId)
      .in('photo_id', photo_ids)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ removed: photo_ids.length })
  } catch (err) {
    console.error('[Album Photos DELETE] Error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
