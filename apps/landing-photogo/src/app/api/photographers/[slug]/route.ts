import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const spreeUrl = process.env.SPREE_API_URL
  const spreeKey = process.env.SPREE_API_KEY

  if (!spreeUrl || !spreeKey) {
    return NextResponse.json(
      { error: 'Backend not configured' },
      { status: 503 }
    )
  }

  try {
    const res = await fetch(`${spreeUrl}/api/v3/store/photographers/${slug}`, {
      headers: {
        'Authorization': `Bearer ${spreeKey}`,
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // Cache 1 minute
    })

    if (res.status === 404) {
      return NextResponse.json({ error: 'Fotógrafo não encontrado' }, { status: 404 })
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch photographer' },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Photographer API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to backend' },
      { status: 503 }
    )
  }
}