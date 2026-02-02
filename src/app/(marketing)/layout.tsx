import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user is authenticated, redirect to dashboard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  )
}





