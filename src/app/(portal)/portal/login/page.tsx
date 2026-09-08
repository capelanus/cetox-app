'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Lock } from 'lucide-react'

export default function PortalLoginPage() {
  const router = useRouter()
  const [ruc, setRuc] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruc, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'No se pudo iniciar sesión')
        setLoading(false)
        return
      }
      router.push('/portal')
      router.refresh()
    } catch {
      setError('No se pudo conectar. Intenta nuevamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0f5226' }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <img src="/cetox-logo.svg" alt="CETOX Lab" className="h-24 w-auto mx-auto mb-3 drop-shadow-xl" />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>Portal del cliente</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-4 w-4" style={{ color: '#13602C' }} />
              Iniciar sesión
            </CardTitle>
            <CardDescription>Ingresa con el RUC y la contraseña que te proporcionó CETOX LAB.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ruc">RUC</Label>
                <Input
                  id="ruc"
                  name="ruc"
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value)}
                  placeholder="20123456789"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading} style={{ backgroundColor: '#13602C' }}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ingresar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          ¿No tienes acceso? Escríbenos a servicios@cetox.com.pe
        </p>
        <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <a href="/aviso-legal" className="underline hover:text-white">Aviso legal</a>
          {' · '}
          <a href="/politica-privacidad" className="underline hover:text-white">Política de privacidad</a>
        </p>
      </div>
    </div>
  )
}
