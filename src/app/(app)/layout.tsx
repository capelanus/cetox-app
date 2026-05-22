import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        userName={session.user.name ?? ''}
        userEmail={session.user.email ?? ''}
        userRol={session.user.rol}
        userArea={session.user.area}
      />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
