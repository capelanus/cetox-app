import { requireRol } from '@/lib/roles'
import Link from 'next/link'
import { ArrowLeft, Award } from 'lucide-react'
import { CertificadoForm } from './certificado-form'

export default async function EmitirCertificadoPage() {
  await requireRol(['ADMINISTRACION', 'DIRECTOR_ADMINISTRACION'])

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <Link
          href="/rrhh/contratos"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition mb-4"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a contratos
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #13602C, #004d1c)' }}
          >
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1
              className="text-xl font-bold text-slate-900 leading-none"
              style={{ fontFamily: 'var(--font-oswald)', letterSpacing: '0.06em' }}
            >
              EMITIR CERTIFICADO
            </h1>
            <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: 'var(--font-montserrat)' }}>
              Diploma oficial CETOX · Se descarga al instante
            </p>
          </div>
        </div>
      </div>

      <div className="cetox-card p-6">
        <CertificadoForm />
      </div>
    </div>
  )
}
