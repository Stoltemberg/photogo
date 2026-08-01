'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Mail, Lock, Eye, EyeOff, Camera } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setStatus('error')
      setMessage('Preencha todos os campos')
      return
    }

    setStatus('loading')
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setStatus('error')
      setMessage(error.message === 'Invalid login credentials'
        ? 'Email ou senha incorretos'
        : error.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 dark:bg-ink-950 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-mono text-2xl font-semibold tracking-tight text-ink-900 dark:text-paper-50">
            <Camera className="h-8 w-8 text-sunset-500" strokeWidth={1.75} />
            PhotoGo
          </Link>
          <p className="mt-2 text-sm text-ink-600 dark:text-paper-200">
            Entre na sua conta para gerenciar suas vendas
          </p>
        </div>

        <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-8 shadow-lg dark:border-paper-100/5 dark:bg-ink-900">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
                  className="w-full rounded-xl border border-ink-900/10 bg-paper-50 pl-10 pr-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-800 dark:text-paper-100"
                  placeholder="seu@email.com"
                  disabled={status === 'loading'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-ink-900/10 bg-paper-50 pl-10 pr-10 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-900 dark:text-paper-100"
                  placeholder="Sua senha"
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

            <div className="flex justify-end">
              <Link href="/auth/recuperar-senha" className="text-xs text-sunset-500 hover:text-sunset-600 font-medium">
                Esqueceu sua senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn-primary mt-2 w-full flex items-center justify-center gap-2 py-2.5"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar</span>
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
            Não tem conta?{' '}
            <Link href="/auth/register" className="text-sunset-500 hover:text-sunset-600 font-medium">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}