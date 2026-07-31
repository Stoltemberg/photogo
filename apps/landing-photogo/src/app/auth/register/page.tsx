'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Mail, Lock, Eye, EyeOff, Camera, User } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !name) {
      setStatus('error')
      setMessage('Preencha todos os campos')
      return
    }
    if (password.length < 8) {
      setStatus('error')
      setMessage('A senha deve ter pelo menos 8 caracteres')
      return
    }

    setStatus('loading')
    setMessage('')

    const supabase = createClient()

    // 1. Create user
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/login`,
      },
    })

    if (error) {
      setStatus('error')
      setMessage(
        error.message === 'User already registered'
          ? 'Este email já está cadastrado. Faça login.'
          : error.message
      )
      return
    }

    // 2. If email confirmation is required (depends on Supabase settings)
    setStatus('success')
    setMessage('Conta criada com sucesso! Verifique seu email para confirmar.')

    // Temporarily sign them in anyway (they'll get JWT if email confirm is off)
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
            Comece a vender suas fotos hoje
          </p>
        </div>

        <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-8 shadow-lg dark:border-paper-100/5 dark:bg-ink-900">
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
                Nome completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-ink-900/10 bg-paper-50 pl-10 pr-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-800 dark:text-paper-100"
                  placeholder="Seu nome"
                  disabled={status === 'loading' || status === 'success'}
                />
              </div>
            </div>

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
                  disabled={status === 'loading' || status === 'success'}
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
                  placeholder="Mínimo 8 caracteres"
                  disabled={status === 'loading' || status === 'success'}
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

            <button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="btn-primary mt-2 w-full flex items-center justify-center gap-2 py-2.5"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Criando conta...</span>
                </>
              ) : status === 'success' ? (
                <>
                  <span>Conta criada!</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Criar conta</span>
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
            Já tem conta?{' '}
            <Link href="/auth/login" className="text-sunset-500 hover:text-sunset-600 font-medium">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}