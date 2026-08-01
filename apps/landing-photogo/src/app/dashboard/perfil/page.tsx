'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Camera, MapPin, Phone, Loader2, Check, Building, Briefcase } from 'lucide-react'
import { PageTransition } from '@/components/animations/PageTransition'


export default function PerfilPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [accountType, setAccountType] = useState<'pf' | 'mei' | 'pj'>('pf')
  const [taxId, setTaxId] = useState('')
  const [businessName, setBusinessName] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setFullName(data.full_name || user.user_metadata?.full_name || '')
        setBio(data.bio || '')
        setAvatarUrl(data.avatar_url || '')
        setPhone(data.phone || '')
        setLocation(data.location || '')
        setAccountType(data.account_type || user.user_metadata?.account_type || 'pf')
        setTaxId(data.tax_id || user.user_metadata?.tax_id || '')
        setBusinessName(data.business_name || '')
      } else {
        // Use auth metadata as fallback
        setFullName(user.user_metadata?.full_name || '')
        setAccountType(user.user_metadata?.account_type || 'pf')
        setTaxId(user.user_metadata?.tax_id || '')
      }

      setLoading(false)
    }

    loadProfile()
  }, [supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          bio,
          avatar_url: avatarUrl,
          phone,
          location,
          account_type: accountType,
          tax_id: taxId,
          business_name: businessName,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ext = file.name.split('.').pop()
    const fileName = `${user.id}/avatar.${ext}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (error) {
      setError('Erro ao enviar avatar: ' + error.message)
      return
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    setAvatarUrl(urlData.publicUrl)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sunset-500" />
      </div>
    )
  }

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-semibold text-ink-900 dark:text-paper-50">
          Perfil
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Suas informações públicas e dados fiscais
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar */}
        <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-6 dark:border-paper-100/5 dark:bg-ink-900">
          <h3 className="font-mono text-lg font-semibold text-ink-900 dark:text-paper-50 mb-4">
            Foto do perfil
          </h3>
          <div className="flex items-center gap-6">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-sunset-500/10 flex items-center justify-center">
                <User className="h-10 w-10 text-sunset-500" />
              </div>
            )}
            <label className="cursor-pointer rounded-xl border border-ink-900/10 px-4 py-2 text-sm text-ink-700 hover:bg-ink-100 dark:border-paper-100/10 dark:text-paper-200 dark:hover:bg-ink-800">
              <Camera className="h-4 w-4 inline mr-2" />
              Trocar foto
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Public info */}
        <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-6 dark:border-paper-100/5 dark:bg-ink-900">
          <h3 className="font-mono text-lg font-semibold text-ink-900 dark:text-paper-50 mb-4">
            Informações públicas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
                Nome completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-ink-900/10 bg-paper-50 pl-10 pr-4 py-2.5 text-sm focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-800 dark:text-paper-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
                Localização
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-ink-900/10 bg-paper-50 pl-10 pr-4 py-2.5 text-sm focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-800 dark:text-paper-100"
                  placeholder="São Paulo, SP"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-ink-900/10 bg-paper-50 pl-10 pr-4 py-2.5 text-sm focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-800 dark:text-paper-100"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-ink-900/10 bg-paper-50 px-4 py-2.5 text-sm focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-800 dark:text-paper-100"
                placeholder="Conte um pouco sobre você e seu trabalho fotográfico..."
              />
            </div>
          </div>
        </div>

        {/* Tax info */}
        <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-6 dark:border-paper-100/5 dark:bg-ink-900">
          <h3 className="font-mono text-lg font-semibold text-ink-900 dark:text-paper-50 mb-4">
            Dados fiscais
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
                Tipo de conta
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'pf' as const, label: 'PF', icon: User },
                  { id: 'mei' as const, label: 'MEI', icon: Briefcase },
                  { id: 'pj' as const, label: 'PJ', icon: Building },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAccountType(id)}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm transition ${
                      accountType === id
                        ? 'border-sunset-500 bg-sunset-500/5 text-sunset-600'
                        : 'border-ink-900/10 text-ink-500 dark:border-paper-100/10 dark:text-paper-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
                {accountType === 'pf' ? 'CPF' : 'CNPJ'}
              </label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full rounded-xl border border-ink-900/10 bg-paper-50 px-4 py-2.5 text-sm focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-800 dark:text-paper-100"
                placeholder={accountType === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
              />
            </div>

            {accountType !== 'pf' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
                  Razão social
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full rounded-xl border border-ink-900/10 bg-paper-50 px-4 py-2.5 text-sm focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-800 dark:text-paper-100"
                  placeholder="Nome da empresa"
                />
              </div>
            )}
          </div>
        </div>

        {/* Error / success */}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        {saved && (
          <p className="text-sm text-green-500 flex items-center gap-1">
            <Check className="h-4 w-4" /> Perfil salvo com sucesso!
          </p>
        )}

        {/* Save button */}
        <button
          type="submit"
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
              Salvar alterações
            </>
          )}
        </button>
      </form>
    </PageTransition>
  )
}