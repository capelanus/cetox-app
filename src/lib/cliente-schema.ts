import z from 'zod'

export const ClienteSchema = z.object({
  razonSocial: z.string().min(2),
  ruc:         z.string().min(8).max(11),
  direccion:   z.string().min(2),
  pais:        z.string().default('PE'),
  contacto:    z.string().optional(),
  email:       z.string().optional(),
  telefono:    z.string().optional(),
})
