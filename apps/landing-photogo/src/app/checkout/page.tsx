'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CreditCard, QrCode, Loader2, Camera } from 'lucide-react'

type PhotoItem = {
  id: string
  src: string
  title: string
  price: number
  category: string
}

type CartItem = PhotoItem & { photographer: string }

const MOCK_PHOTOS: Record<string, PhotoItem> = {
  p1: { id: 'p1', src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80', title: 'Montanha ao amanhecer', price: 49.90, category: 'Paisagem' },
  p2: { id: 'p2', src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&q=80', title: 'Floresta tropical', price: 59.90, category: 'Natureza' },
  p3: { id: 'p3', src: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&q=80', title: 'Cachoeira', price: 39.90, category: 'Natureza' },
  p4: { id: 'p4', src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80', title: 'Pôr do sol na serra', price: 44.90, category: 'Paisagem' },
  p5: { id: 'p5', src: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&q=80', title: 'Trilha na montanha', price: 34.90, category: 'Aventura' },
  p6: { id: 'p6', src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80', title: 'Praia tropical', price: 54.90, category: 'Paisagem' },
  p7: { id: 'p7', src: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80', title: 'Casamento ao ar livre', price: 89.90, category: 'Casamento' },
  p8: { id: 'p8', src: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&q=80', title: 'Retrato feminino', price: 69.90, category: 'Retrato' },
}

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
  const [email, setEmail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string } | null>(null)

  useEffect(() => {
    const ids = searchParams.get('items')?.split(',') || []
    const photographer = searchParams.get('photographer') || 'fotografo'
    const cartItems = ids
      .filter((id) => MOCK_PHOTOS[id])
      .map((id) => ({ ...MOCK_PHOTOS[id], photographer }))
    setItems(cartItems)
  }, [searchParams])

  const total = items.reduce((sum, item) => sum + item.price, 0)

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
          items: items.map((i) => ({ product_id: i.id, quantity: 1 })),
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
          setMessage('Pedido realizado com sucesso!')
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