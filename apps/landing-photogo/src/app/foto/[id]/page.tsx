'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Camera, MapPin, BadgeCheck, ShoppingCart, Star, ArrowLeft, Loader2, Eye, Download, Globe } from 'lucide-react'
import { useCart, type CartItem } from '@/lib/cart-context'

type PhotoData = {
  id: string
  prefix_id: string
  name: string
  description: string
  price: number
  currency: string
  available_on: string
  images: Array<{ src: string; alt: string; position: number }>
  photographer: {
    slug: string
    name: string
    avatar: string
    verified: boolean
  }
  metadata: {
    exif?: { camera: string; lens: string; iso: number; aperture: string; focal_length: string; shutter_speed: string }
    location?: { name: string; latitude: number; longitude: number }
    license_type: 'personal' | 'commercial' | 'editorial' | 'exclusive' | 'extended'
    file_size_mb: number
    dimensions: { width: number; height: number }
    color_space: string
  }
  license_price_multiplier: number
}

export default function PhotoPage() {
  const params = useParams()
  const id = params.id as string
  const [data, setData] = useState<PhotoData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { add, items: cart } = useCart()

  // License selection state
  const [selectedLicense, setSelectedLicense] = useState('personal')
  
  const licenseOptions = [
    { id: 'personal', name: 'Pessoal', desc: 'Redes sociais, uso pessoal, sem revenda', multiplier: 1.0 },
    { id: 'editorial', name: 'Editorial', desc: 'Blogs, revistas, mídias jornalísticas', multiplier: 2.0 },
    { id: 'commercial', name: 'Comercial', desc: 'Sites, anúncios, marketing, produtos', multiplier: 3.0 },
    { id: 'extended', name: 'Estendida', desc: 'Uso irrestrito, território mundial', multiplier: 5.0 },
    { id: 'exclusive', name: 'Exclusiva', desc: 'Direitos exclusivos, sem revenda pelo fotógrafo', multiplier: 10.0 },
  ]

  const finalPrice = data ? data.price * licenseOptions.find(l => l.id === selectedLicense)!.multiplier : 0

  const handleAddToCart = () => {
    if (!data) return
    const item: CartItem = {
      id: data.id,
      prefix_id: data.prefix_id || data.id,
      src: data.images[0]?.src || '',
      title: data.name,
      price: data.price * licenseOptions.find(l => l.id === selectedLicense)!.multiplier,
      category: data.metadata?.license_type || 'personal',
      photographer_slug: data.photographer?.slug || '',
    }
    add(item)
  }

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    fetch(`/api/photos/${id}`)
      .then((r) => {
        if (r.status === 404) throw new Error('Foto não encontrada')
        if (!r.ok) throw new Error('Failed to fetch photo')
        return r.json()
      })
      .then((d) => { setData(d); setLoading(false) })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [id])

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
        <p className="text-ink-600">{error || 'Foto não encontrada'}</p>
        <Link href="/" className="text-sunset-500 hover:underline">Voltar ao início</Link>
      </div>
    )
  }

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
        {/* Photo + Details Grid */}
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left: Main Image + Gallery */}
          <div className="lg:w-2/3">
            <div className="rounded-2xl border border-ink-900/5 bg-paper-50 overflow-hidden dark:border-paper-100/5 dark:bg-ink-900">
              <div className="aspect-[4/3] relative">
                <Image
                  src={data.images[0]?.src || '/placeholder.jpg'}
                  alt={data.name}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
                {data.metadata?.license_type && (
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-900/80 px-3 py-1.5 text-xs font-mono font-semibold text-paper-50 dark:bg-paper-100/80 dark:text-ink-900">
                      {data.metadata.license_type.charAt(0).toUpperCase() + data.metadata.license_type.slice(1)}
                    </span>
                  </div>
                )}
              </div>
              {data.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {data.images.map((img, idx) => (
                    <button
                      key={idx}
                      className="flex-shrink-0 w-20 h-15 rounded-lg border-2 overflow-hidden transition"
                      style={{
                        borderColor: idx === 0 ? 'rgb(255 107 53)' : 'transparent'
                      }}
                    >
                      <Image
                        src={img.src}
                        alt={`${data.name} - view ${idx + 1}`}
                        width={80}
                        height={60}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Metadata badges */}
            <div className="mt-6 flex flex-wrap gap-3">
              {data.metadata?.exif && (
                <div className="flex flex-wrap gap-2 px-3 py-2 rounded-xl bg-ink-100 dark:bg-ink-800">
                  <span className="text-xs text-ink-500">EXIF</span>
                  <span className="text-xs font-mono text-ink-700 dark:text-paper-200">
                    {data.metadata.exif.camera}
                  </span>
                  <span className="text-xs font-mono text-ink-700 dark:text-paper-200">
                    {data.metadata.exif.lens}
                  </span>
                  <span className="text-xs font-mono text-ink-700 dark:text-paper-200">
                    ISO {data.metadata.exif.iso}
                  </span>
                  <span className="text-xs font-mono text-ink-700 dark:text-paper-200">
                    f/{data.metadata.exif.aperture}
                  </span>
                  <span className="text-xs font-mono text-ink-700 dark:text-paper-200">
                    {data.metadata.exif.shutter_speed}s
                  </span>
                  <span className="text-xs font-mono text-ink-700 dark:text-paper-200">
                    {data.metadata.exif.focal_length}mm
                  </span>
                </div>
              )}
              {data.metadata?.location && (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-ink-100 dark:bg-ink-800 text-xs text-ink-600 dark:text-paper-200">
                  <MapPin className="h-3 w-3" />
                  {data.metadata.location.name}
                </span>
              )}
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-ink-100 dark:bg-ink-800 text-xs text-ink-600 dark:text-paper-200">
                <Eye className="h-3 w-3" />
                {data.metadata.dimensions.width}×{data.metadata.dimensions.height}px
              </span>
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-ink-100 dark:bg-ink-800 text-xs text-ink-600 dark:text-paper-200">
                {data.metadata.color_space}
              </span>
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-ink-100 dark:bg-ink-800 text-xs text-ink-600 dark:text-paper-200">
                {data.metadata.file_size_mb} MB
              </span>
            </div>
          </div>

          {/* Right: Info + Purchase */}
          <div className="lg:w-1/3">
            <div className="sticky top-24 space-y-6">
              {/* Photographer */}
              <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-6 dark:border-paper-100/5 dark:bg-ink-900">
                <Link href={`/fotografo/${data.photographer.slug}`} className="flex items-center gap-3">
                  <img
                    src={data.photographer.avatar}
                    alt={data.photographer.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-mono font-semibold text-ink-900 dark:text-paper-50">
                      {data.photographer.name}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {data.photographer.verified && <BadgeCheck className="h-4 w-4 text-green-500" />}
                      <span className="text-xs text-ink-500">Verificado</span>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Description */}
              <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-6 dark:border-paper-100/5 dark:bg-ink-900">
                <h3 className="font-mono text-lg font-semibold text-ink-900 dark:text-paper-50 mb-3">
                  Sobre esta foto
                </h3>
                <p className="text-ink-600 dark:text-paper-200 whitespace-pre-wrap">{data.description}</p>
              </div>

              {/* License Selection */}
              <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-6 dark:border-paper-100/5 dark:bg-ink-900">
                <h3 className="font-mono text-lg font-semibold text-ink-900 dark:text-paper-50 mb-4">
                  Escolha sua licença
                </h3>
                <div className="space-y-3">
                  {licenseOptions.map((license) => (
                    <label
                      key={license.id}
                      className="flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition"
                    >
                      <input
                        type="radio"
                        name="license"
                        checked={selectedLicense === license.id}
                        onChange={() => setSelectedLicense(license.id)}
                        className="sr-only peer"
                      />
                      <div className="flex-1">
                        <p className="font-mono font-semibold text-sm text-ink-900 dark:text-paper-50">
                          {license.name}
                        </p>
                        <p className="text-xs text-ink-500">{license.desc}</p>
                      </div>
                      <span className="font-mono font-bold text-lg text-sunset-500">
                        R$ {(data!.price * license.multiplier).toFixed(2).replace('.', ',')}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-6 pt-4 border-t border-ink-900/5 flex items-center justify-between">
                  <span className="font-mono text-lg font-semibold text-ink-900 dark:text-paper-50">Total</span>
                  <span className="text-2xl font-mono font-bold text-sunset-500" id="total-price">
                    R$ {finalPrice.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="btn-primary w-full mt-6 py-3 flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Adicionar ao carrinho
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}