'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ink-600 transition hover:bg-ink-100 dark:text-paper-200 dark:hover:bg-ink-800"
    >
      Sair
      <LogOut className="h-4 w-4" />
    </button>
  )
}