import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Camera, MapPin, BadgeCheck, Users } from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'

type Photographer = {
  id: string
  full_name: string | null
  public_display_name: string | null
  avatar_url: string | null
  location: string | null
  bio: string | null
}

export default async function PhotographersPage() {
  const supabase = await createClient()

  // Get photographers who have at least one public album
  const { data: photographersData } = await supabase
    .from('user_profiles')
    .select('id, full_name, public_display_name, avatar_url, location, bio')
    .not('avatar_url', 'is', null)
    .limit(48)

  const photographers = (photographersData || []) as Photographer[]

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-ink-950">
      <header className="border-b border-ink-900/5 bg-paper-50/80 backdrop-blur-md dark:border-paper-100/5 dark:bg-ink-950/80 sticky top-0 z-50">
        <div className="container-wide flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 font-mono font-semibold text-ink-900 dark:text-paper-50">
            <Camera className="h-5 w-5 text-sunset-500" /> PhotoGo
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/explorar" className="text-ink-500 hover:text-ink-900 dark:hover:text-paper-200">Explorar</Link>
            <Link href="/fotografos" className="text-sunset-500 font-medium">Fotógrafos</Link>
            <Link href="/auth/login" className="rounded-lg bg-ink-100 px-3 py-1.5 text-ink-700 hover:bg-ink-200 dark:bg-ink-800 dark:text-paper-200">Entrar</Link>
          </nav>
        </div>
      </header>

      <main className="container-wide py-10">
        <FadeIn>
          <div className="mb-8">
            <p className="font-mono text-xs uppercase tracking-widest text-sunset-500">Comunidade</p>
            <h1 className="mt-2 font-mono text-4xl font-semibold tracking-tight text-ink-900 dark:text-paper-50 sm:text-5xl">
              Fotógrafos
            </h1>
            <p className="mt-3 text-ink-600 dark:text-paper-200 max-w-xl">
              Talentos brasileiros verificados vendendo suas fotos no PhotoGo.
            </p>
          </div>
        </FadeIn>

        {photographers.length === 0 ? (
          <FadeIn delay={150}>
            <div className="mt-20 text-center">
              <Users className="mx-auto h-12 w-12 text-ink-300" />
              <p className="mt-4 text-sm font-medium text-ink-700 dark:text-paper-200">
                Nenhum fotógrafo cadastrado ainda
              </p>
              <p className="mt-1 text-xs text-ink-500">
                Seja o primeiro! <Link href="/auth/register" className="text-sunset-500 hover:underline">Criar conta</Link>
              </p>
            </div>
          </FadeIn>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {photographers.map((p, idx) => {
              const handle = p.public_display_name || p.full_name?.split(' ')[0] || 'Fotógrafo'
              return (
                <FadeIn key={p.id} delay={Math.min(idx * 50, 400)} y={16}>
                  <article className="group overflow-hidden rounded-2xl border border-ink-900/5 bg-paper-50 p-6 transition hover-lift dark:border-paper-100/5 dark:bg-ink-900">
                    <div className="flex items-center gap-4">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt={handle} className="h-14 w-14 rounded-full object-cover ring-2 ring-paper-50 dark:ring-ink-900" />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-sunset-500/10 flex items-center justify-center">
                          <Camera className="h-6 w-6 text-sunset-500" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-mono font-semibold text-ink-900 dark:text-paper-50 truncate">
                            {handle}
                          </h3>
                          <BadgeCheck className="h-4 w-4 flex-shrink-0 text-sunset-500" />
                        </div>
                        {p.location && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
                            <MapPin className="h-3 w-3" />
                            {p.location}
                          </p>
                        )}
                      </div>
                    </div>
                    {p.bio && (
                      <p className="mt-4 line-clamp-2 text-sm text-ink-600 dark:text-paper-200">
                        {p.bio}
                      </p>
                    )}
                    <Link
                      href={`/fotografo/${p.id}`}
                      className="mt-4 block text-center rounded-xl border border-ink-900/10 px-4 py-2 text-sm text-ink-700 transition hover:bg-sunset-500 hover:text-white hover:border-sunset-500 dark:border-paper-100/10 dark:text-paper-200"
                    >
                      Ver portfólio
                    </Link>
                  </article>
                </FadeIn>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
