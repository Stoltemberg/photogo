import Link from 'next/link'
import { Camera, Home, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper-50 dark:bg-ink-950 px-4 overflow-hidden relative">
      {/* Animated gradient blobs */}
      <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-sunset-500/20 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl animate-float-delay" />
      <div className="absolute top-1/2 right-1/3 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl animate-float-delay-2" />

      <div className="relative z-10 text-center animate-page-enter">
        <div className="flex items-center justify-center mb-6">
          <Camera className="h-12 w-12 text-sunset-500 animate-pulse-ring rounded-full p-2 glow-sunset" />
        </div>

        <p className="font-mono text-xs uppercase tracking-widest text-sunset-500">
          Erro 404
        </p>

        <h1 className="mt-4 font-mono text-7xl sm:text-8xl font-bold tracking-tighter">
          <span className="text-gradient-sunset">404</span>
        </h1>

        <h2 className="mt-6 font-mono text-2xl font-semibold text-ink-900 dark:text-paper-50">
          Foto não encontrada
        </h2>

        <p className="mt-3 max-w-md mx-auto text-ink-600 dark:text-paper-200">
          A página que você procura saiu do enquadramento. Talvez tenha sido movida ou nunca existiu.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm font-medium"
          >
            <Home className="h-4 w-4" />
            Voltar ao início
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-ink-900/10 px-6 py-3 text-sm text-ink-700 hover:bg-ink-100 dark:border-paper-100/10 dark:text-paper-200 dark:hover:bg-ink-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Início
          </Link>
        </div>
      </div>
    </div>
  )
}
