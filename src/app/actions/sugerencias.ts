'use server'

import { prisma } from '@/lib/prisma'

interface SugerenciaData {
  medioContacto: string[]
  ratingAtencion?: string
  ratingRapidez?: string
  ratingInformacion?: string
  ratingAmbiente?: string
  ratingCumplimiento?: string
  ratingTiempoEspera?: string
  satisfecho?: boolean
  tuvoQuejaAntes?: boolean
  quejaCuando?: string
  quejaSobre?: string
  quejaManejo?: string
  sugerencias?: string
  empresa?: string
  contacto?: string
  fechaCliente?: string
}

export async function enviarSugerencia(data: SugerenciaData) {
  await prisma.sugerenciaCliente.create({ data })
}
