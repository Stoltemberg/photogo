'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Camera, MapPin, BadgeCheck, ShoppingCart, Star, ArrowLeft, Loader2 } from 'lucide-react'
import { useCart, type CartItem } from '@/lib/cart-context'

type ApiPhoto = {
  id: string
  prefix_id: string
  src: string
  title: string
  price: number
  category: string
}

type PhotographerData = {
  slug: string
  prefix_id: string
  name: string
  bio: string
  avatar: string
  location: string
  specialties: string[]
  verified: boolean
  stats: { photos: number; sales: number; rating: number }
  plan: string
  portfolio: ApiPhoto[]
}

export default function PhotographerPage() {
  const params = useParams()
  const slug = params.slug as string
  const [data, setData] = useState<PhotographerData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('Todos')
  const { items: cart, add, remove } = useCart()

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    fetch(`/api/photographers/${slug}`)
      .then((r) => {
        if (r.status === 404) throw new Error('Fotógrafo não encontrado')
        if (!r.ok) throw new Error('Failed to fetch photographer')
        return r.json()
      })
      .then((d) => { setData(d); setLoading(false) })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sunset-500" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-ink-50 dark:bg-ink-950">
        <Camera className="h-12 w-12 text-ink-300" />
        <p className="text-ink-600">{error || 'Fotógrafo não encontrado'}</p>
        <Link href="/" className="text-sunset-500 hover:underline">Voltar ao início</Link>
      </div>
    )
  }

  const categories = ['Todos', ...new Set(data.portfolio.map((p) => p.category).filter(Boolean))]
  const filtered = filter === 'Todos' ? data.portfolio : data.portfolio.filter((p) => p.category === filter)

  const toggleCart = (photo: ApiPhoto) => {
    const isInCart = cart.some((i) => i.id === photo.id)
    if (isInCart) {
      remove(photo.id)
    } else {
      const item: CartItem = {
        id: photo.id,
        prefix_id: photo.prefix_id || photo.id,
        src: photo.src,
        title: photo.title,
        price: photo.price,
        category: photo.category,
        photographer_slug: data.slug,
      }
      add(item)
    }
  }

  const photographerItems = cart.filter((i) => i.photographer_slug === data.slug)
  const cartTotal = photographerItems.reduce((sum, p) => sum + p.price, 0)

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      {/* Header */}
      <header className="border-b border-ink-900/5 bg-paper-50/80 backdrop-blur-md dark:border-paper-100/5 dark:bg-ink-950/80 sticky top-0 z-50">
        <div className="container-wide flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-ink-600 hover:text-ink-900 dark:text-paper-200">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <Link href="/auth/login" className="text-sm text-sunset-500 font-medium hover:text-sunset-600">
            Entrar
          </Link>
        </div>
      </header>

      <main className="container-wide py-12">
        {/* Profile */}
        <div className="flex flex-col sm:flex-row items-start gap-8">
          <div className="relative">
            <Image
              src={data.avatar}
              alt={data.name}
              width={120}
              height={120}
              className="rounded-2xl object-cover"
              unoptimized
            />
            {data.verified && (
              <div className="absolute -bottom-2 -right-2 bg-sunset-500 rounded-full p-1">
                <BadgeCheck className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-mono font-semibold text-ink-900 dark:text-paper-50">
                {data.name}
              </h1>
              {data.plan === 'pro' && (
                <span className="badge bg-sunset-500/10 text-sunset-500 border-sunset-500/20">Pro</span>
              )}
              {data.plan === 'studio' && (
                <span className="badge bg-purple-500/10 text-purple-400 border-purple-500/20">Studio</span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-ink-600 dark:text-paper-200">
              {data.location && (
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{data.location}</span>
              )}
              {data.stats?.rating && (
                <span className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-400" fill="currentColor" />{data.stats.rating}</span>
              )}
              {data.stats?.sales != null && <span>{data.stats.sales} vendas</span>}
            </div>
            {data.bio && (
              <p className="mt-4 text-ink-600 dark:text-paper-200 max-w-xl">{data.bio}</p>
            )}
            {data.specialties?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {data.specialties.map((s) => (
                  <span key={s} className="rounded-full bg-ink-100 px-3 py-1 text-xs text-ink-700 dark:bg-ink-800 dark:text-paper-200">{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-12 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                filter === cat
                  ? 'bg-ink-900 text-paper-50 dark:bg-paper-50 dark:text-ink-900'
                  : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-paper-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((photo) => {
            const inCart = cart.some((i) => i.id === photo.id)
            return (
              <div
                key={photo.id}
                className="group rounded-2xl border border-ink-900/5 bg-paper-50 overflow-hidden transition hover:-translate-y-1 hover:shadow-lg dark:border-paper-100/5 dark:bg-ink-900"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={photo.src}
                    alt={photo.title}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition" />
                  <button
                    onClick={() => toggleCart(photo)}
                    className={`absolute top-3 right-3 rounded-full p-2 transition ${
                      inCart
                        ? 'bg-sunset-500 text-white'
                        : 'bg-white/80 text-ink-700 opacity-0 group-hover:opacity-100'
                    }`}
                    aria-label={inCart ? 'Remover do carrinho' : 'Adicionar ao carrinho'}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-4">
                  {photo.category && <p className="text-xs text-ink-400 mb-1">{photo.category}</p>}
                  <h3 className="font-mono font-semibold text-ink-900 dark:text-paper-50">{photo.title}</h3>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-mono font-semibold text-sunset-500">
                      R$ {photo.price.toFixed(2).replace('.', ',')}
                    </span>
                    <button
                      onClick={() => toggleCart(photo)}
                      className={`text-sm rounded-lg px-3 py-1.5 transition ${
                        inCart
                          ? 'bg-sunset-500 text-white'
                          : 'bg-ink-100 text-ink-700 hover:bg-ink-200 dark:bg-ink-800 dark:text-paper-200'
                      }`}
                    >
                      {inCart ? 'No carrinho' : 'Comprar'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Floating Cart */}
      {photographerItems.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-ink-900 px-8 py-4 shadow-2xl flex items-center gap-6 dark:bg-ink-800">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-white" />
            <span className="text-sm text-paper-100">{photographerItems.length} {photographerItems.length === 1 ? 'foto' : 'fotos'}</span>
          </div>
          <span className="text-lg font-mono font-semibold text-sunset-400">
            R$ {cartTotal.toFixed(2).replace('.', ',')}
          </span>
          <Link
            href={`/checkout?slug=${data.slug}`}
            className="btn-primary"
          >
            Finalizar compra
          </Link>
        </div>
      )}
    </div>
  )
}