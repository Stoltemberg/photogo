'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Lock, Eye, EyeOff, Camera, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !confirmPassword) {
      setStatus('error')
      setMessage('Preencha todos os campos')
      return
    }
    if (password.length < 8) {
      setStatus('error')
      setMessage('A senha deve ter pelo menos 8 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setStatus('error')
      setMessage('As senhas não coincidem')
      return
    }

    setStatus('loading')
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setStatus('error')
      setMessage(error.message)
      return
    }

    setStatus('success')
    setMessage('Senha redefinida com sucesso!')

    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 dark:bg-ink-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-mono text-2xl font-semibold tracking-tight text-ink-900 dark:text-paper-50">
            <Camera className="h-8 w-8 text-sunset-500" strokeWidth={1.75} />
            PhotoGo
          </Link>
          <p className="mt-2 text-sm text-ink-600 dark:text-paper-200">
            Defina sua nova senha
          </p>
        </div>

        <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-8 shadow-lg dark:border-paper-100/5 dark:bg-ink-900">
          {status === 'success' ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-sm text-ink-600 dark:text-paper-200">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
                  Nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-ink-900/10 bg-paper-50 pl-10 pr-10 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-900 dark:text-paper-100"
                    placeholder="Mínimo 8 caracteres"
                    disabled={status === 'loading'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
                  Confirmar senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-ink-900/10 bg-paper-50 pl-10 pr-10 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-900 dark:text-paper-100"
                    placeholder="Repita a senha"
                    disabled={status === 'loading'}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-primary mt-2 w-full flex items-center justify-center gap-2 py-2.5"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Redefinindo...</span>
                  </>
                ) : (
                  <>
                    <span>Redefinir senha</span>
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </>
                )}
              </button>
            </form>
          )}

          {message && status !== 'success' && (
            <p className={`mt-4 text-center text-sm ${status === 'error' ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}