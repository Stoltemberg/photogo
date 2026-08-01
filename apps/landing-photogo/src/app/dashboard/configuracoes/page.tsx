'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Bell, Lock, Globe, CreditCard, Loader2, Check, Trash2, AlertCircle } from 'lucide-react'

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Notification preferences
  const [emailNewSales, setEmailNewSales] = useState(true)
  const [emailNewReviews, setEmailNewReviews] = useState(true)
  const [emailMarketing, setEmailMarketing] = useState(false)
  const [pushNotifications, setPushNotifications] = useState(true)

  // Privacy
  const [profilePublic, setProfilePublic] = useState(true)
  const [showSalesStats, setShowSalesStats] = useState(false)

  // Account
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const loadSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserEmail(user.email || '')

      const { data } = await supabase
        .from('user_profiles')
        .select('email_new_sales, email_new_reviews, email_marketing, push_notifications, profile_public, show_sales_stats')
        .eq('id', user.id)
        .single()

      if (data) {
        setEmailNewSales(data.email_new_sales ?? true)
        setEmailNewReviews(data.email_new_reviews ?? true)
        setEmailMarketing(data.email_marketing ?? false)
        setPushNotifications(data.push_notifications ?? true)
        setProfilePublic(data.profile_public ?? true)
        setShowSalesStats(data.show_sales_stats ?? false)
      }

      setLoading(false)
    }

    loadSettings()
  }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_profiles')
        .update({
          email_new_sales: emailNewSales,
          email_new_reviews: emailNewReviews,
          email_marketing: emailMarketing,
          push_notifications: pushNotifications,
          profile_public: profilePublic,
          show_sales_stats: showSalesStats,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${
        checked ? 'bg-sunset-500' : 'bg-ink-200 dark:bg-ink-700'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sunset-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-semibold text-ink-900 dark:text-paper-50">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Notificações, privacidade e preferências
        </p>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-6 dark:border-paper-100/5 dark:bg-ink-900">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-ink-400" />
          <h3 className="font-mono text-lg font-semibold text-ink-900 dark:text-paper-50">
            Notificações
          </h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink-900 dark:text-paper-50">Nova venda</p>
              <p className="text-xs text-ink-500">Receba email quando uma foto for vendida</p>
            </div>
            <Toggle checked={emailNewSales} onChange={setEmailNewSales} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink-900 dark:text-paper-50">Novas avaliações</p>
              <p className="text-xs text-ink-500">Receba email quando alguém avaliar suas fotos</p>
            </div>
            <Toggle checked={emailNewReviews} onChange={setEmailNewReviews} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink-900 dark:text-paper-50">Marketing</p>
              <p className="text-xs text-ink-500">Dicas, novidades e promoções do PhotoGo</p>
            </div>
            <Toggle checked={emailMarketing} onChange={setEmailMarketing} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink-900 dark:text-paper-50">Notificações push</p>
              <p className="text-xs text-ink-500">Receber notificações no navegador</p>
            </div>
            <Toggle checked={pushNotifications} onChange={setPushNotifications} />
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-6 dark:border-paper-100/5 dark:bg-ink-900">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-ink-400" />
          <h3 className="font-mono text-lg font-semibold text-ink-900 dark:text-paper-50">
            Privacidade
          </h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink-900 dark:text-paper-50">Perfil público</p>
              <p className="text-xs text-ink-500">Permitir que qualquer pessoa veja seu perfil</p>
            </div>
            <Toggle checked={profilePublic} onChange={setProfilePublic} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink-900 dark:text-paper-50">Estatísticas de vendas públicas</p>
              <p className="text-xs text-ink-500">Mostrar número de vendas no seu perfil público</p>
            </div>
            <Toggle checked={showSalesStats} onChange={setShowSalesStats} />
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-6 dark:border-paper-100/5 dark:bg-ink-900">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-ink-400" />
          <h3 className="font-mono text-lg font-semibold text-ink-900 dark:text-paper-50">
            Conta
          </h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-ink-100 px-4 py-3 dark:bg-ink-800">
            <div>
              <p className="text-xs text-ink-500">Email</p>
              <p className="text-sm font-mono text-ink-900 dark:text-paper-50">{userEmail}</p>
            </div>
          </div>

          <Link href="/dashboard/configuracoes/senha" className="block rounded-xl border border-ink-900/10 px-4 py-3 text-sm text-ink-700 hover:bg-ink-100 dark:border-paper-100/10 dark:text-paper-200 dark:hover:bg-ink-800">
            Alterar senha
          </Link>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/5">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <h3 className="font-mono text-lg font-semibold text-red-600">
            Zona de perigo
          </h3>
        </div>
        <button
          className="flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 text-sm text-red-600 hover:bg-red-100 dark:border-red-500/30 dark:hover:bg-red-500/10"
          onClick={() => {
            if (confirm('Tem certeza? Esta ação não pode ser desfeita. Todas as suas fotos e dados serão excluídos permanentemente.')) {
              // TODO: Call API to delete account
              alert('Entre em contato com suporte@photogo.com.br para excluir sua conta.')
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
          Excluir conta
        </button>
      </div>

      {/* Save / error */}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {saved && (
        <p className="text-sm text-green-500 flex items-center gap-1">
          <Check className="h-4 w-4" /> Configurações salvas!
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            Salvar configurações
          </>
        )}
      </button>
    </div>
  )
}