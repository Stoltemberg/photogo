'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'
import { ArrowRight, Loader2, Mail, Camera, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [message, setMessage] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setStatus('error')
      setMessage('Digite seu email')
      return
    }

    setStatus('loading')
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/redefinir-senha`,
    })

    if (error) {
      setStatus('error')
      setMessage(error.message)
      return
    }

    setStatus('success')
    setMessage('Enviamos um link de recuperação para seu email. Verifique sua caixa de entrada.')
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
            Recupere o acesso à sua conta
          </p>
        </div>

        <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-8 shadow-lg dark:border-paper-100/5 dark:bg-ink-900">
          {status === 'success' ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-sm text-ink-600 dark:text-paper-200">{message}</p>
              <Link
                href="/auth/login"
                className="btn-primary mt-4 flex items-center gap-2 px-6 py-2.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para login
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleReset} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-ink-900/10 bg-paper-50 pl-10 pr-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-800 dark:text-paper-100"
                      placeholder="seu@email.com"
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
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar link de recuperação</span>
                      <ArrowRight className="h-4 w-4" strokeWidth={2} />
                    </>
                  )}
                </button>
              </form>

              {message && (
                <p className={`mt-4 text-center text-sm ${status === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                  {message}
                </p>
              )}

              <p className="mt-6 text-center text-sm text-ink-600 dark:text-paper-200">
                Lembrou a senha?{' '}
                <Link href="/auth/login" className="text-sunset-500 hover:text-sunset-600 font-medium">
                  Fazer login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}