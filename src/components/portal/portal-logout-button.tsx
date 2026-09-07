'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function PortalLogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/portal/logout', { method: 'POST' })
    router.push('/portal/login')
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout}>
      <LogOut className="h-4 w-4 mr-1.5" />
      Salir
    </Button>
  )
}
