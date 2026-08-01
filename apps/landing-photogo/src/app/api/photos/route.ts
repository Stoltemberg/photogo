import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = (formData.get('description') as string) || ''
    const price = parseFloat(formData.get('price') as string)
    const category = (formData.get('category') as string) || 'Geral'

    if (!file || !title || isNaN(price)) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Arquivo muito grande (máximo 50 MB)' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Tipo de arquivo inválido' }, { status: 400 })
    }

    // Upload to storage
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, file, {
        contentType: file.type,
        cacheControl: '3600',
      })

    if (uploadError) {
      return NextResponse.json({ error: `Erro no upload: ${uploadError.message}` }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName)

    // Insert photo record
    const { data, error: insertError } = await supabase
      .from('photos')
      .insert({
        photographer_id: user.id,
        title,
        description,
        price,
        category,
        image_url: urlData.publicUrl,
        thumbnail_url: urlData.publicUrl,
        file_size_mb: parseFloat((file.size / 1024 / 1024).toFixed(2)),
      })
      .select()
      .single()

    if (insertError) {
      // Rollback storage upload
      await supabase.storage.from('photos').remove([fileName])
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[Photo Upload POST] Error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get('id')

    if (!photoId) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
    }

    // Fetch photo to verify ownership + get storage path
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('image_url, photographer_id')
      .eq('id', photoId)
      .single()

    if (fetchError || !photo) {
      return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })
    }

    if (photo.photographer_id !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Delete from storage
    const urlParts = photo.image_url.split('/photos/')
    if (urlParts.length === 2) {
      const storagePath = urlParts[1]
      await supabase.storage.from('photos').remove([storagePath])
    }

    // Delete from DB
    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Photo DELETE] Error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
