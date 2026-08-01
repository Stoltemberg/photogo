'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, DollarSign, Download, Loader2, Calendar } from 'lucide-react'

type Sale = {
  id: string
  photo_title: string
  buyer_email: string
  amount: number
  license_type: string
  status: 'pending' | 'paid' | 'refunded'
  created_at: string
}

export default function VendasPage() {
  const supabase = createClient()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSales = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch sales from Supabase — real data only
      const { data, error } = await supabase
        .from('sales')
        .select('id, photo_title, buyer_email, amount, license_type, status, created_at')
        .eq('photographer_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setSales(data as Sale[])
      }
      setLoading(false)
    }

    loadSales()
  }, [supabase])

  const totalRevenue = sales
    .filter((s) => s.status === 'paid')
    .reduce((sum, s) => sum + s.amount, 0)

  const pendingRevenue = sales
    .filter((s) => s.status === 'pending')
    .reduce((sum, s) => sum + s.amount, 0)

  const statusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400'
      case 'refunded':
        return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
      default:
        return 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-paper-200'
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago'
      case 'pending': return 'Pendente'
      case 'refunded': return 'Reembolsado'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-semibold text-ink-900 dark:text-paper-50">
          Vendas
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Histórico de vendas e receita
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-5 dark:border-paper-100/5 dark:bg-ink-900">
          <div className="flex items-center justify-between">
            <DollarSign className="h-5 w-5 text-green-500" />
            <span className="text-xs text-ink-500">Total recebido</span>
          </div>
          <p className="mt-3 text-2xl font-mono font-bold text-ink-900 dark:text-paper-50">
            R$ {totalRevenue.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-5 dark:border-paper-100/5 dark:bg-ink-900">
          <div className="flex items-center justify-between">
            <TrendingUp className="h-5 w-5 text-yellow-500" />
            <span className="text-xs text-ink-500">Pendente</span>
          </div>
          <p className="mt-3 text-2xl font-mono font-bold text-ink-900 dark:text-paper-50">
            R$ {pendingRevenue.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-5 dark:border-paper-100/5 dark:bg-ink-900">
          <div className="flex items-center justify-between">
            <Calendar className="h-5 w-5 text-blue-500" />
            <span className="text-xs text-ink-500">Total de vendas</span>
          </div>
          <p className="mt-3 text-2xl font-mono font-bold text-ink-900 dark:text-paper-50">
            {sales.length}
          </p>
        </div>
      </div>

      {/* Sales table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-sunset-500" />
        </div>
      ) : sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <TrendingUp className="h-12 w-12 text-ink-300" />
          <p className="mt-4 text-sm text-ink-500">
            Você ainda não tem vendas registradas.
          </p>
          <p className="text-xs text-ink-400">
            Continue enviando fotos e promovendo seu trabalho!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-900/5 bg-paper-50 dark:border-paper-100/5 dark:bg-ink-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-900/5 dark:border-paper-100/5">
                <th className="px-4 py-3 text-left font-medium text-ink-500">Foto</th>
                <th className="px-4 py-3 text-left font-medium text-ink-500">Licença</th>
                <th className="px-4 py-3 text-left font-medium text-ink-500">Comprador</th>
                <th className="px-4 py-3 text-right font-medium text-ink-500">Valor</th>
                <th className="px-4 py-3 text-left font-medium text-ink-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-ink-500">Data</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-b border-ink-900/5 last:border-0 dark:border-paper-100/5"
                >
                  <td className="px-4 py-3 font-medium text-ink-900 dark:text-paper-50">
                    {sale.photo_title}
                  </td>
                  <td className="px-4 py-3 text-ink-600 dark:text-paper-200 capitalize">
                    {sale.license_type}
                  </td>
                  <td className="px-4 py-3 text-ink-600 dark:text-paper-200">
                    {sale.buyer_email}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-ink-900 dark:text-paper-50">
                    R$ {sale.amount.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(sale.status)}`}>
                      {statusLabel(sale.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-500">
                    {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}