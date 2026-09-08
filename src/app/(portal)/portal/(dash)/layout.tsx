import { redirect } from 'next/navigation'
import { getPortalSession } from '@/lib/portal-auth'
import { PortalLogoutButton } from '@/components/portal/portal-logout-button'

export default async function PortalDashLayout({ children }: { children: React.ReactNode }) {
  const session = await getPortalSession()
  if (!session) redirect('/portal/login')

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="px-3 py-1.5 rounded-lg text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: '#13602C' }}
            >
              CETOX LAB
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">Portal del cliente</p>
              <p className="text-xs text-slate-500">{session.razonSocial}</p>
            </div>
          </div>
          <PortalLogoutButton />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      <footer className="max-w-4xl mx-auto px-4 pb-8">
        <p className="text-center text-xs text-slate-400">
          <a href="/aviso-legal" className="underline hover:text-slate-600">Aviso legal</a>
          {' · '}
          <a href="/politica-privacidad" className="underline hover:text-slate-600">Política de privacidad</a>
        </p>
      </footer>
    </div>
  )
}
