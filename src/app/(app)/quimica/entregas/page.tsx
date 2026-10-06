import { redirect } from 'next/navigation'

// Ruta anterior del Registro 1 de Química; el registro ahora es por laboratorio.
export default function EntregasQuimicaRedirect() {
  redirect('/entregas/quimica')
}
