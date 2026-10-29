'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { useCart } from '@/lib/cart-context'

type Props = {
  photoId: string
  photographerSlug: string
  price: number
  imageUrl: string
}

export function AddToCartButton({ photoId, photographerSlug, price, imageUrl }: Props) {
  const [added, setAdded] = useState(false)
  const [_, setS] = useState(0)
  const cart = useCart()

  function onAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    cart.add({
      id: photoId,
      prefix_id: photoId,
      src: imageUrl,
      title: '', // público: sem título
      price,
      category: '',
      photographer_slug: photographerSlug,
    })
    setAdded(true)
    setS((n) => n + 1)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <button
      onClick={onAdd}
      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition shadow-lg ${
        added
          ? 'bg-green-500 text-white'
          : 'bg-white text-ink-900 hover:bg-sunset-500 hover:text-white'
      }`}
    >
      {added ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Adicionado
        </>
      ) : (
        <>
          <ShoppingCart className="h-3.5 w-3.5" />
          Comprar
        </>
      )}
    </button>
  )
}
