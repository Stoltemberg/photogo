import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const sort = searchParams.get('sort') || 'recent' // recent | popular | price_asc | price_desc

    // Only fetch photos that are in at least one public album
    let query = supabase
      .from('photos')
      .select(`
        id,
        image_url,
        thumbnail_url,
        price,
        category,
        created_at,
        photographer_id,
        user_profiles!inner(
          public_display_name,
          full_name,
          avatar_url,
          location
        )
      `)
      .in('id',
        // Sub-query for photo IDs that are in public albums
        // (Supabase doesn't support subqueries directly, so we use a 2-step)
        // We'll fetch all public albums then filter — fine for MVP
        (
          await supabase
            .from('album_photos')
            .select('photo_id, albums!inner(is_public)')
            .eq('albums.is_public', true)
        ).data?.map((r) => r.photo_id) || []
      )
      .limit(limit)
      .range(offset, offset + limit - 1)

    if (category && category !== 'Todos') {
      query = query.eq('category', category)
    }

    if (sort === 'recent') {
      query = query.order('created_at', { ascending: false })
    } else if (sort === 'price_asc') {
      query = query.order('price', { ascending: true })
    } else if (sort === 'price_desc') {
      query = query.order('price', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err) {
    console.error('[Explore API] Error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
