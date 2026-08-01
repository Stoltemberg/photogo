import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Camera, MapPin, ShoppingBag, TrendingUp } from 'lucide-react'
import { ExploreFilters } from './filters'
import { FadeIn } from '@/components/animations/FadeIn'

type PublicPhoto = {
  id: string
  image_url: string
  thumbnail_url: string | null
  price: number
  category: string
  created_at: string
  photographer_id: string
  user_profiles: {
    public_display_name: string | null
    full_name: string | null
    avatar_url: string | null
    location: string | null
  }
}

const CATEGORIES = ['Todos', 'Paisagem', 'Retrato', 'Urbano', 'Natureza', 'Esporte', 'Eventos', 'Comida', 'Animal', 'Arquitetura', 'Abstrato']

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>
}) {
  const params = await searchParams
  const category = params.category || 'Todos'
  const sort = params.sort || 'recent'

  const supabase = await createClient()

  // Get photo IDs from public albums
  const { data: publicMappings } = await supabase
    .from('album_photos')
    .select('photo_id, albums!inner(is_public)')
    .eq('albums.is_public', true)

  const photoIds = Array.from(new Set(publicMappings?.map((r) => r.photo_id) || []))

  let photos: PublicPhoto[] = []
  if (photoIds.length > 0) {
    let q = supabase
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
      .in('id', photoIds.slice(0, 200))

    if (category !== 'Todos') {
      q = q.eq('category', category)
    }

    if (sort === 'recent') q = q.order('created_at', { ascending: false })
    else if (sort === 'price_asc') q = q.order('price', { ascending: true })
    else if (sort === 'price_desc') q = q.order('price', { ascending: false })

    const { data } = await q.limit(48)
    photos = (data as unknown as PublicPhoto[]) || []
  }

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-ink-950">
      <header className="border-b border-ink-900/5 bg-paper-50/80 backdrop-blur-md dark:border-paper-100/5 dark:bg-ink-950/80 sticky top-0 z-50">
        <div className="container-wide flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 font-mono font-semibold text-ink-900 dark:text-paper-50">
            <Camera className="h-5 w-5 text-sunset-500" /> PhotoGo
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/explorar" className="text-sunset-500 font-medium">Explorar</Link>
            <Link href="/fotografos" className="text-ink-500 hover:text-ink-900 dark:hover:text-paper-200">Fotógrafos</Link>
            <Link href="/auth/login" className="rounded-lg bg-ink-100 px-3 py-1.5 text-ink-700 hover:bg-ink-200 dark:bg-ink-800 dark:text-paper-200">Entrar</Link>
          </nav>
        </div>
      </header>

      <main className="container-wide py-10">
        <FadeIn>
          <div className="mb-8">
            <p className="font-mono text-xs uppercase tracking-widest text-sunset-500">Marketplace</p>
            <h1 className="mt-2 font-mono text-4xl font-semibold tracking-tight text-ink-900 dark:text-paper-50 sm:text-5xl">
              Explorar fotos
            </h1>
            <p className="mt-3 text-ink-600 dark:text-paper-200 max-w-xl">
              Descubra fotos de fotógrafos brasileiros. Compras seguras com Pix e cartão, certificado de autenticidade SHA-256.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <ExploreFilters categories={CATEGORIES} currentCategory={category} currentSort={sort} />
        </FadeIn>

        {/* Results */}
        {photos.length === 0 ? (
          <FadeIn delay={200}>
            <div className="mt-20 text-center">
              <Camera className="mx-auto h-12 w-12 text-ink-300" />
              <p className="mt-4 text-sm font-medium text-ink-700 dark:text-paper-200">
                Nenhuma foto encontrada
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {category !== 'Todos'
                  ? `Tente outra categoria ou aguarde novos envios`
                  : 'Os fotógrafos ainda estão preparando seus portfólios'}
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center gap-2 text-sm text-sunset-500 hover:text-sunset-600"
              >
                <TrendingUp className="h-4 w-4" /> Voltar para a landing
              </Link>
            </div>
          </FadeIn>
        ) : (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, idx) => {
              const handle = photo.user_profiles?.public_display_name ||
                photo.user_profiles?.full_name?.split(' ')[0] || 'Fotógrafo'
              return (
                <FadeIn key={photo.id} delay={Math.min(idx * 30, 400)} y={20}>
                  <Link
                    href={`/foto/${photo.id}`}
                    className="group block overflow-hidden rounded-2xl bg-paper-50 dark:bg-ink-900 hover-lift"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img
                        src={photo.thumbnail_url || photo.image_url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {/* Subtle hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute inset-x-3 bottom-3 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div>
                          <p className="font-mono text-lg font-bold text-white">
                            R$ {photo.price.toFixed(2).replace('.', ',')}
                          </p>
                          <p className="text-xs text-white/80">por {handle}</p>
                        </div>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink-900 shadow-lg">
                          <ShoppingBag className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-mono text-sm font-medium text-ink-900 dark:text-paper-50">
                        R$ {photo.price.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500 truncate">
                        {handle}
                        {photo.user_profiles?.location && ` · ${photo.user_profiles.location}`}
                      </p>
                    </div>
                  </Link>
                </FadeIn>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
