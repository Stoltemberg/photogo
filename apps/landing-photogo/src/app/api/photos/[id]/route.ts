import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const spreeUrl = process.env.SPREE_API_URL
  const spreeKey = process.env.SPREE_API_KEY

  if (!spreeUrl || !spreeKey) {
    return NextResponse.json(
      { error: 'Backend not configured' },
      { status: 503 }
    )
  }

  try {
    const res = await fetch(`${spreeUrl}/api/v3/store/products/${id}`, {
      headers: {
        'Authorization': `Bearer ${spreeKey}`,
        'Accept': 'application/json',
      },
      next: { revalidate: 60 },
    })

    if (res.status === 404) {
      return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch photo' },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Photo API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to backend' },
      { status: 503 }
    )
  }
}