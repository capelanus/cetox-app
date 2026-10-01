'use server'

import { del } from '@vercel/blob'
import { auth } from '@/lib/auth'

// Borra del almacén un archivo subido con /api/upload que al final no se va a
// usar (p. ej. se quita de un formulario antes de guardar). Solo acepta
// URLs del propio almacén para que nadie borre otra cosa por esta vía.
export async function eliminarArchivoSubido(url: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')
  if (!/^https:\/\/[^/]+\.vercel-storage\.com\//.test(url)) throw new Error('URL no permitida')
  await del(url)
}
