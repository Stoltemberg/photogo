import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from './shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, avatar_url, account_type')
    .eq('id', user.id)
    .single()

  const userName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Fotógrafo'
  const avatarUrl = profile?.avatar_url || ''
  const accountType = profile?.account_type || user.user_metadata?.account_type || 'pf'

  return (
    <DashboardShell
      userName={userName}
      avatarUrl={avatarUrl}
      accountType={accountType}
      userEmail={user.email || ''}
    >
      {children}
    </DashboardShell>
  )
}