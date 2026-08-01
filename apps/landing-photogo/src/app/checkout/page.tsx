'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CreditCard, QrCode, Loader2, Camera, Trash2 } from 'lucide-react'

type PhotoItem = {
  id: string
  prefix_id: string
  src: string
  title: string
  price: number
  category: string
}

type CartItem = PhotoItem & { photographer_slug: string }

const CART_STORAGE_KEY = 'photogo_cart'

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sunset-500" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string } | null>(null)

  useEffect(() => {
    const photographer = searchParams.get('photographer') || ''
    const photographerSlug = searchParams.get('slug') || photographer

    // Load cart from localStorage (set by /fotografo/[slug])
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(CART_STORAGE_KEY) : null
      if (raw) {
        const cart = JSON.parse(raw) as Array<{ id: string; prefix_id: string; src: string; title: string; price: number; category: string; photographer_slug: string }>
        const filtered = photographerSlug
          ? cart.filter((item) => item.photographer_slug === photographerSlug)
          : cart
        setItems(filtered as CartItem[])
      }
    } catch {
      // localStorage unavailable or invalid JSON
    }
    setLoading(false)
  }, [searchParams])

  const total = items.reduce((sum, item) => sum + item.price, 0)

  const removeItem = (id: string) => {
    const newItems = items.filter((i) => i.id !== id)
    setItems(newItems)
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY)
      if (raw) {
        const cart = JSON.parse(raw)
        const newCart = cart.filter((c: { id: string }) => c.id !== id)
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart))
      }
    } catch {
      // ignore
    }
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || items.length === 0) return

    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          items: items.map((i) => ({ product_id: i.prefix_id || i.id, quantity: 1 })),
          payment_method: 'mercado_pago',
          payment_data: { method: paymentMethod },
        }),
      })

      const data = await res.json()

      if (res.ok) {
        if (data.payment?.method === 'pix' && data.payment?.qr_code) {
          setPixData({ qr_code: data.payment.qr_code, qr_code_base64: data.payment.qr_code_base64 })
          setStatus('success')
          setMessage('Pagamento Pix gerado! Escaneie o QR code abaixo.')
        } else {
          setStatus('success')
          setMessage('Pedido realizado com sucesso! Verifique seu email para o link de download.')
          // Clear cart on success
          try { window.localStorage.removeItem(CART_STORAGE_KEY) } catch {}
        }
      } else {
        setStatus('error')
        setMessage(data.error || 'Erro ao processar pagamento')
      }
    } catch {
      setStatus('error')
      setMessage('Erro de conexão. Tente novamente.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sunset-500" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-ink-50 dark:bg-ink-950">
        <Camera className="h-12 w-12 text-ink-300" />
        <p className="text-ink-600">Nenhum item no carrinho</p>
        <Link href="/" className="text-sunset-500 hover:underline">Voltar ao início</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <header className="border-b border-ink-900/5 bg-paper-50/80 backdrop-blur-md dark:border-paper-100/5 dark:bg-ink-950/80">
        <div className="container-wide flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-ink-600 hover:text-ink-900 dark:text-paper-200">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <Link href="/" className="flex items-center gap-2 font-mono text-lg font-semibold">
            <Camera className="h-5 w-5 text-sunset-500" /> PhotoGo
          </Link>
        </div>
      </header>

      <main className="container-wide py-12 max-w-2xl">
        <h1 className="text-3xl font-mono font-semibold text-ink-900 dark:text-paper-50">Checkout</h1>

        {/* Cart Items */}
        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-xl border border-ink-900/5 bg-paper-50 p-4 dark:border-paper-100/5 dark:bg-ink-900">
              <Image src={item.src} alt={item.title} width={80} height={60} className="rounded-lg object-cover" />
              <div className="flex-1">
                <h3 className="font-mono text-sm font-semibold text-ink-900 dark:text-paper-50">{item.title}</h3>
                <p className="text-xs text-ink-400">{item.category}</p>
              </div>
              <span className="font-mono font-semibold text-sunset-500">
                R$ {item.price.toFixed(2).replace('.', ',')}
              </span>
              <button
                onClick={() => removeItem(item.id)}
                className="p-2 text-ink-400 hover:text-red-500 transition"
                aria-label="Remover do carrinho"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-6 flex items-center justify-between rounded-xl bg-ink-100 px-6 py-4 dark:bg-ink-800">
          <span className="text-sm font-medium text-ink-700 dark:text-paper-100">Total</span>
          <span className="text-2xl font-mono font-bold text-sunset-500">
            R$ {total.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Payment Method */}
        <div className="mt-8">
          <h2 className="text-lg font-mono font-semibold text-ink-900 dark:text-paper-50 mb-4">Forma de pagamento</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setPaymentMethod('pix')}
              className={`flex items-center gap-3 rounded-xl border-2 p-4 transition ${
                paymentMethod === 'pix'
                  ? 'border-sunset-500 bg-sunset-500/5'
                  : 'border-ink-900/10 hover:border-ink-300 dark:border-paper-100/10'
              }`}
            >
              <QrCode className="h-6 w-6 text-sunset-500" />
              <div className="text-left">
                <p className="font-mono font-semibold text-sm text-ink-900 dark:text-paper-50">Pix</p>
                <p className="text-xs text-ink-400">Aprovação instantânea</p>
              </div>
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex items-center gap-3 rounded-xl border-2 p-4 transition ${
                paymentMethod === 'card'
                  ? 'border-sunset-500 bg-sunset-500/5'
                  : 'border-ink-900/10 hover:border-ink-300 dark:border-paper-100/10'
              }`}
            >
              <CreditCard className="h-6 w-6 text-sunset-500" />
              <div className="text-left">
                <p className="font-mono font-semibold text-sm text-ink-900 dark:text-paper-50">Cartão</p>
                <p className="text-xs text-ink-400">Até 12x sem juros</p>
              </div>
            </button>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleCheckout} className="mt-8 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">Email para receber a foto</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-ink-900/10 bg-paper-50 px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-800 dark:text-paper-100"
              placeholder="seu@email.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <><Loader2 className="h-4 w-4 animate-spin" /><span>Processando...</span></>
            ) : (
              <><span>Pagar R$ {total.toFixed(2).replace('.', ',')}</span></>
            )}
          </button>
        </form>

        {message && (
          <div className={`mt-6 rounded-xl p-6 text-center ${
            status === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
            'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
          }`}>
            <p className="font-medium">{message}</p>
            {pixData && (
              <div className="mt-4 flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-xl">
                  <Image
                    src={`data:image/png;base64,${pixData.qr_code_base64}`}
                    alt="QR Code Pix"
                    width={200}
                    height={200}
                    className="rounded-lg"
                  />
                </div>
                <p className="text-xs text-ink-500">Ou copie o código Pix:</p>
                <code className="text-xs bg-ink-100 dark:bg-ink-800 px-3 py-2 rounded-lg break-all max-w-full">
                  {pixData.qr_code}
                </code>
              </div>
            )}
            {status === 'success' && !pixData && (
              <Link href="/dashboard" className="mt-4 inline-block text-sunset-500 hover:underline">
                Acessar meu painel →
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  )
}