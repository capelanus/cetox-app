import { SugerenciasForm } from './sugerencias-form'

export const metadata = { title: 'Sugerencias del Cliente – CETOX' }

export default function SugerenciasPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center py-8 px-4">
      <SugerenciasForm />
    </div>
  )
}
