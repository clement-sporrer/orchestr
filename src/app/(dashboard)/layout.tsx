import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  // Get user from database using authUserId (secure)
  let dbUser = null
  try {
    dbUser = await prisma.user.findUnique({
      where: { authUserId: authUser.id },
      select: { name: true, email: true, role: true },
    })
    
    // Fallback to email lookup if authUserId not set (migration path)
    if (!dbUser && authUser.email) {
      dbUser = await prisma.user.findUnique({
        where: { email: authUser.email },
        select: { name: true, email: true, role: true, id: true },
      })
      
      // Update with authUserId for future lookups
      if (dbUser) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { authUserId: authUser.id },
        })
      }
    }
  } catch {
    // Database might not be connected yet during development
  }

  const user = dbUser || {
    name: authUser.email?.split('@')[0] || 'User',
    email: authUser.email || '',
    role: 'RECRUITER',
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  )
}



