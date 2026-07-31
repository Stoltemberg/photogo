import { NextResponse } from 'next/server'

const MOCK_PHOTOGRAPHERS: Record<string, PhotographerData> = {
  'ana-silva': {
    slug: 'ana-silva',
    name: 'Ana Silva',
    bio: 'Fotógrafa de paisagens e natureza com 10 anos de experiência. Trabalho com editorais como National Geographic Brasil e Revista Viagem.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    location: 'São Paulo, SP',
    specialties: ['Paisagem', 'Natureza', 'Aventura'],
    verified: true,
    stats: { photos: 1247, sales: 389, rating: 4.9 },
    plan: 'pro',
    portfolio: [
      { id: 'p1', src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', title: 'Montanha ao amanhecer', price: 49.90, category: 'Paisagem' },
      { id: 'p2', src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80', title: 'Floresta tropical', price: 59.90, category: 'Natureza' },
      { id: 'p3', src: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&q=80', title: 'Cachoeira', price: 39.90, category: 'Natureza' },
      { id: 'p4', src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80', title: 'Pôr do sol na serra', price: 44.90, category: 'Paisagem' },
      { id: 'p5', src: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80', title: 'Trilha na montanha', price: 34.90, category: 'Aventura' },
      { id: 'p6', src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', title: 'Praia tropical', price: 54.90, category: 'Paisagem' },
    ],
  },
  'marcos-oliveira': {
    slug: 'marcos-oliveira',
    name: 'Marcos Oliveira',
    bio: 'Fotógrafo de casamentos e retratos em São Paulo. 8 anos capturando momentos únicos.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    location: 'São Paulo, SP',
    specialties: ['Casamento', 'Retrato', 'Eventos'],
    verified: true,
    stats: { photos: 856, sales: 210, rating: 4.8 },
    plan: 'studio',
    portfolio: [
      { id: 'p7', src: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80', title: 'Casamento ao ar livre', price: 89.90, category: 'Casamento' },
      { id: 'p8', src: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80', title: 'Retrato feminino', price: 69.90, category: 'Retrato' },
      { id: 'p9', src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80', title: 'Primeiro beijo', price: 79.90, category: 'Casamento' },
      { id: 'p10', src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80', title: 'Retrato artístico', price: 59.90, category: 'Retrato' },
      { id: 'p11', src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80', title: 'Decoração floral', price: 49.90, category: 'Casamento' },
      { id: 'p12', src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80', title: 'Retrato urbano', price: 44.90, category: 'Retrato' },
    ],
  },
}

export type PhotoItem = {
  id: string
  src: string
  title: string
  price: number
  category: string
}

export type PhotographerData = {
  slug: string
  name: string
  bio: string
  avatar: string
  location: string
  specialties: string[]
  verified: boolean
  stats: { photos: number; sales: number; rating: number }
  plan: string
  portfolio: PhotoItem[]
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const photographer = MOCK_PHOTOGRAPHERS[slug]

  if (!photographer) {
    return NextResponse.json({ error: 'Fotógrafo não encontrado' }, { status: 404 })
  }

  return NextResponse.json(photographer)
}