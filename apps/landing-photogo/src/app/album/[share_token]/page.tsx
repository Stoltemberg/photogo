import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Camera, ExternalLink, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { AddToCartButton } from './add-to-cart-button'

type Photo = {
  id: string
  image_url: string
  thumbnail_url: string | null
  price: number
  category: string
  status: string
  // Title/description intentionally NOT exposed
}

type Album = {
  id: string
  name: string
  description: string | null
  share_token: string
  is_public: boolean
  photographer_id: string
}

type Photographer = {
  public_display_name: string | null
  full_name: string | null
  avatar_url: string | null
  location: string | null
}

export default async function PublicAlbumPage({
  params,
}: {
  params: Promise<{ share_token: string }>
}) {
  const { share_token } = await params
  const supabase = await createClient()

  // Fetch album by share_token (only if public)
  const { data: album } = await supabase
    .from('albums')
    .select('id, name, description, share_token, is_public, photographer_id')
    .eq('share_token', share_token)
    .eq('is_public', true)
    .single<Album>()

  if (!album) {
    notFound()
  }

  // Fetch photos in album (only public-facing fields)
  const { data: photosData } = await supabase
    .from('album_photos')
    .select('position, photo:photos(id, image_url, thumbnail_url, price, category, status)')
    .eq('album_id', album.id)
    .order('position', { ascending: true })

  const photos: Photo[] = ((photosData || []) as unknown as { photo: Photo }[])
    .map((row) => row.photo)
    .filter(Boolean)
    .filter((p) => p.status !== 'archived')
  const { data: photographer } = await supabase
    .from('user_profiles')
    .select('public_display_name, full_name, avatar_url, location')
    .eq('id', album.photographer_id)
    .single<Photographer>()

  const handle = photographer?.public_display_name || photographer?.full_name?.split(' ')[0] || 'Fotógrafo'

  const minPrice = photos.length > 0 ? Math.min(...photos.map((p) => p.price)) : 0

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-ink-950">
      <header className="border-b border-ink-900/5 bg-paper-50/80 backdrop-blur-md dark:border-paper-100/5 dark:bg-ink-950/80 sticky top-0 z-50">
        <div className="container-wide flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 dark:hover:text-paper-200">
            <Camera className="h-4 w-4 text-sunset-500" />
            <span className="font-mono font-semibold">PhotoGo</span>
          </Link>
          <span className="text-xs text-ink-400">Álbum compartilhado</span>
        </div>
      </header>

      <main className="container-wide py-12">
        {/* Album header — minimal */}
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-mono text-4xl font-semibold tracking-tight text-ink-900 dark:text-paper-50 sm:text-5xl">
            {album.name}
          </h1>
          {album.description && (
            <p className="mt-4 text-base text-ink-600 dark:text-paper-200">{album.description}</p>
          )}
          <div className="mt-6 flex items-center justify-center gap-3 text-sm text-ink-500">
            {photographer?.avatar_url && (
              <img src={photographer.avatar_url} alt={handle} className="h-7 w-7 rounded-full object-cover" />
            )}
            <span>por <span className="font-medium text-ink-700 dark:text-paper-200">{handle}</span></span>
            {photographer?.location && (
              <>
                <span>·</span>
                <span>{photographer.location}</span>
              </>
            )}
          </div>
          <p className="mt-3 text-xs text-ink-400">
            {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
            {minPrice > 0 && ` · a partir de R$ ${minPrice.toFixed(2).replace('.', ',')}`}
          </p>
        </div>

        {/* Photo grid */}
        {photos.length === 0 ? (
          <div className="mt-20 text-center">
            <p className="text-sm text-ink-500">Este álbum ainda não tem fotos.</p>
          </div>
        ) : (
          <div className="mx-auto mt-12 max-w-5xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  photographerHandle={handle}
                  photographerSlug={album.photographer_id}
                />
              ))}
            </div>

            {/* Trust footer */}
            <div className="mt-16 border-t border-ink-900/5 pt-8 dark:border-paper-100/5">
              <div className="flex flex-col items-center gap-2 text-center text-xs text-ink-400">
                <ShieldCheck className="h-5 w-5" />
                <p>Todas as fotos vêm com certificado de autenticidade (hash SHA-256).</p>
                <Link href="/" className="flex items-center gap-1 hover:text-sunset-500">
                  Vendido por PhotoGo <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function PhotoCard({
  photo,
  photographerHandle,
  photographerSlug,
}: {
  photo: Photo
  photographerHandle: string
  photographerSlug: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-paper-50 dark:bg-ink-900">
      <div className="aspect-[4/3] relative overflow-hidden">
        <img
          src={photo.thumbnail_url || photo.image_url}
          alt=""
          className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          loading="lazy"
        />
      </div>

      {/* Hover overlay — subtle */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xl font-semibold text-white">
              R$ {photo.price.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-white/70 mt-0.5">
              por {photographerHandle}
            </p>
          </div>
          <AddToCartButton
            photoId={photo.id}
            photographerSlug={photographerSlug}
            price={photo.price}
            imageUrl={photo.thumbnail_url || photo.image_url}
          />
        </div>
      </div>

      {/* Default state — minimal */}
      <div className="p-4 group-hover:opacity-0 transition">
        <p className="font-mono text-base font-medium text-ink-900 dark:text-paper-50">
          R$ {photo.price.toFixed(2).replace('.', ',')}
        </p>
        <p className="text-xs text-ink-400 mt-0.5">
          {photographerHandle}
        </p>
      </div>
    </div>
  )
}
