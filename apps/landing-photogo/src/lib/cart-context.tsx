'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type CartItem = {
  id: string
  prefix_id: string
  src: string
  title: string
  price: number
  category: string
  photographer_slug: string
}

type CartContextValue = {
  items: CartItem[]
  add: (item: CartItem) => void
  remove: (id: string) => void
  clear: () => void
  total: number
  count: number
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'photogo_cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[]
        if (Array.isArray(parsed)) setItems(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  // Persist on change
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore
    }
  }, [items])

  const add = (item: CartItem) => {
    setItems((prev) => {
      if (prev.find((i) => i.id === item.id)) return prev
      return [...prev, item]
    })
  }

  const remove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const clear = () => setItems([])

  const total = items.reduce((sum, i) => sum + i.price, 0)
  const count = items.length

  return (
    <CartContext.Provider value={{ items, add, remove, clear, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}