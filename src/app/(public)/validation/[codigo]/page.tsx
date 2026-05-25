'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck, XCircle, Download } from 'lucide-react'

interface ValidationResult {
  valid: boolean
  informe?: {
    numero: number
    anio: number
    prefijo: string
    ensayo: string
    cliente: string
    analista: string
    firmaGerencia: string
  }
}

export default function ValidationPage({ params }: { params: Promise<{ codigo: string }> }) {
  const [clave, setClave] = useState('')
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [codigo, setCodigo] = useState<string | null>(null)

  // Get codigo from params
  if (!codigo) {
    params.then((p) => setCodigo(p.codigo))
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!codigo) return
    setLoading(true)
    try {
      const res = await fetch(`/api/validation/${codigo}?clave=${encodeURIComponent(clave)}`)
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ valid: false })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div
            className="inline-block px-6 py-3 rounded-xl text-white font-bold text-2xl mb-2"
            style={{ backgroundColor: '#1F4E79' }}
          >
            CETOX LAB
          </div>
          <p className="text-slate-500 text-sm">Portal de validación de certificados</p>
          {codigo && (
            <p className="text-slate-700 font-mono text-sm mt-1">Código: {codigo}</p>
          )}
        </div>

        {!result ? (
          <Card>
            <CardHeader>
              <CardTitle>Verificar certificado</CardTitle>
              <CardDescription>
                Ingrese la clave de verificación para consultar la autenticidad del informe.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clave">Clave de verificación</Label>
                  <Input
                    id="clave"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    required
                    placeholder="Ingrese la clave..."
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  style={{ backgroundColor: '#1F4E79' }}
                  disabled={loading}
                >
                  {loading ? 'Verificando...' : 'Verificar'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : result.valid && result.informe ? (
          <Card className="border-green-200">
            <CardHeader>
              <div className="flex items-center gap-2 text-green-700">
                <ShieldCheck className="h-6 w-6" />
                <CardTitle className="text-green-700">Certificado válido</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-500">Informe</p>
                  <p className="font-mono font-bold">
                    {result.informe.prefijo}-{result.informe.numero}-{result.informe.anio}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Ensayo</p>
                  <p className="font-medium">{result.informe.ensayo}</p>
                </div>
                <div>
                  <p className="text-slate-500">Cliente</p>
                  <p>{result.informe.cliente}</p>
                </div>
                <div>
                  <p className="text-slate-500">Analista</p>
                  <p>{result.informe.analista}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500">Firmado</p>
                  <p>{result.informe.firmaGerencia}</p>
                </div>
              </div>
              <a
                href={`/api/validation/${codigo}/pdf?clave=${encodeURIComponent(clave)}`}
                download
                className="block mt-2"
              >
                <Button className="w-full" style={{ backgroundColor: '#1F4E79' }}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar certificado PDF
                </Button>
              </a>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setResult(null)}
              >
                Verificar otro
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-red-200">
            <CardHeader>
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-6 w-6" />
                <CardTitle className="text-red-600">Certificado no válido</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                La clave ingresada no es correcta o el certificado no existe.
              </p>
              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => { setResult(null); setClave('') }}
              >
                Intentar de nuevo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
