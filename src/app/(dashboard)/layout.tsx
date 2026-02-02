import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { CommandPaletteProvider } from '@/components/layout/command-palette-provider'
import { getCurrentUser } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user: { name: string; email: string; role: string }
  try {
    const dbUser = await getCurrentUser()
    user = {
      name: dbUser.name ?? dbUser.email?.split('@')[0] ?? 'User',
      email: dbUser.email,
      role: dbUser.role,
    }
  } catch {
    redirect('/login')
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
      <CommandPaletteProvider />
    </div>
  )
}



