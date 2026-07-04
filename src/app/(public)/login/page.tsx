'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const email    = (form.elements.namedItem('email')    as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      setError('Credenciales inválidas. Verifique su email y contraseña.')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL — Branding ───────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden"
        style={{
          background: 'linear-gradient(155deg, #0a3d1a 0%, #13602C 45%, #0f5226 100%)',
        }}
      >
        {/* Decorative geometry */}
        <div className="absolute inset-0 pointer-events-none select-none">
          {/* Big circle top-right */}
          <div
            className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #4AC3B2 0%, transparent 70%)' }}
          />
          {/* Medium circle bottom-left */}
          <div
            className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-[0.08]"
            style={{ background: 'radial-gradient(circle, #4AC3B2 0%, transparent 70%)' }}
          />
          {/* Hex grid pattern via box outlines */}
          <svg
            className="absolute top-0 left-0 w-full h-full opacity-[0.035]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="hex-grid" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
                <polygon
                  points="30,2 58,17 58,47 30,62 2,47 2,17"
                  fill="none"
                  stroke="#4AC3B2"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hex-grid)" />
          </svg>
          {/* Accent teal line */}
          <div
            className="absolute left-12 top-0 bottom-0 w-[2px] opacity-20"
            style={{ background: 'linear-gradient(to bottom, transparent, #4AC3B2 30%, #4AC3B2 70%, transparent)' }}
          />
        </div>

        {/* Logo + brand */}
        <div className="relative z-10">
          <div className="mb-10">
            <img
              src="/cetox-logo.svg"
              alt="CETOX Lab"
              className="h-24 w-auto"
            />
          </div>

          <h1
            className="font-heading text-white font-bold leading-[1.05] mb-6"
            style={{ fontSize: 'clamp(2.4rem, 4vw, 3.2rem)' }}
          >
            Laboratorio<br />
            <span style={{ color: '#4AC3B2' }}>de Ensayo</span><br />
            Acreditado
          </h1>

          <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Centro Toxicológico S.A.C. — gestión integral de muestras,
            ensayos y certificados de calidad.
          </p>
        </div>

        {/* Accreditation badges */}
        <div className="relative z-10 space-y-3">
          {[
            'Acreditado por INACAL-DA',
            'Registro Nº LE-044',
            'Norma ISO/IEC 17025',
          ].map((text) => (
            <div key={text} className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#4AC3B2' }} />
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{text}</span>
            </div>
          ))}

          <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              © {new Date().getFullYear()} Centro Toxicológico S.A.C. · Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ──────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-8 py-12 relative"
        style={{ backgroundColor: '#f8faf9' }}
      >
        {/* Mobile logo (shown only on small screens) */}
        <div className="lg:hidden mb-10 px-4 py-3 rounded-xl" style={{ backgroundColor: '#13602C' }}>
          <img
            src="/cetox-logo.svg"
            alt="CETOX Lab"
            className="h-16 w-auto mx-auto"
          />
        </div>

        {/* Form card */}
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2
              className="font-heading font-bold text-3xl mb-1.5 tracking-wide"
              style={{ color: '#13602C' }}
            >
              Iniciar sesión
            </h2>
            <p className="text-sm" style={{ color: '#808080' }}>
              Ingrese sus credenciales para acceder al sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-semibold"
                style={{ color: '#1e293b' }}
              >
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="usuario@cetox.com.pe"
                required
                autoComplete="email"
                className="cetox-input"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-semibold"
                style={{ color: '#1e293b' }}
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="cetox-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#94a3b8' }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm"
                style={{
                  backgroundColor: 'oklch(0.97 0.015 20)',
                  border: '1px solid oklch(0.88 0.04 20)',
                  color: 'oklch(0.5 0.18 25)',
                }}
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="cetox-btn-primary w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ingresando…
                </>
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs" style={{ color: '#cbd5e1' }}>
            Acceso restringido · Solo personal autorizado CETOX
          </p>
        </div>
      </div>
    </div>
  )
}
