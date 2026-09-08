import Link from 'next/link'

const ACTUALIZADO = '7 de setiembre de 2026'

const SECCIONES = [
  {
    titulo: '1. Identificación del titular',
    parrafos: [
      'El presente Aviso Legal regula el acceso y uso de la plataforma cetoxlab.tech, incluido el "Portal del Cliente", operada por CENTRO TOXICOLÓGICO S.A.C. (en adelante, "CETOX LAB"), con RUC 20506303746 y domicilio en Av. Angamos Este N° 2668–2670, Urb. La Calera – Surquillo, Lima, Perú.',
      'Puede contactarnos en servicios@cetox.com.pe o al (511) 920 008 680.',
    ],
  },
  {
    titulo: '2. Objeto',
    parrafos: [
      'La plataforma permite a CETOX LAB gestionar sus servicios de ensayo toxicológico y de laboratorio, y a sus clientes hacer seguimiento del estado de sus muestras, consultar el historial de ensayos solicitados y descargar sus informes una vez emitidos y certificados.',
    ],
  },
  {
    titulo: '3. Condiciones de acceso',
    parrafos: [
      'El acceso al Portal del Cliente es personal e intransferible y se otorga únicamente a las empresas con una relación comercial vigente con CETOX LAB. Las credenciales (RUC y contraseña) son entregadas por CETOX LAB y no deben compartirse con terceros ajenos a la empresa titular.',
      'El cliente es responsable de la confidencialidad de su contraseña y de toda actividad realizada con sus credenciales. Ante la sospecha de un uso no autorizado, debe comunicarlo de inmediato a servicios@cetox.com.pe para desactivar o regenerar el acceso.',
    ],
  },
  {
    titulo: '4. Uso del portal',
    parrafos: [
      'El usuario se compromete a utilizar el portal conforme a la ley, la buena fe y el orden público, y a no emplearlo con fines fraudulentos o que puedan dañar, inutilizar o sobrecargar la plataforma, ni intentar acceder a información de otros clientes.',
      'La información mostrada sobre el estado de una muestra (recepción, análisis, control de calidad, informe disponible) es referencial y de seguimiento operativo; no reemplaza al informe de ensayo oficial, que es el único documento con valor técnico y legal.',
    ],
  },
  {
    titulo: '5. Propiedad intelectual',
    parrafos: [
      'Los contenidos de la plataforma —textos, diseño, logotipos, marca "CETOX LAB" y el formato de los informes— son titularidad de CENTRO TOXICOLÓGICO S.A.C. y están protegidos por la legislación peruana sobre propiedad intelectual. Queda prohibida su reproducción o distribución sin autorización previa.',
    ],
  },
  {
    titulo: '6. Exactitud del contenido',
    parrafos: [
      'CETOX LAB procura que la información del portal sea exacta y esté actualizada, pero no garantiza la ausencia de errores materiales u omisiones. En caso de discrepancia entre el estado mostrado en el portal y los registros internos del laboratorio, prevalecen estos últimos.',
    ],
  },
  {
    titulo: '7. Modificaciones',
    parrafos: [
      'CETOX LAB puede modificar el presente Aviso Legal para adaptarlo a novedades legislativas o a cambios en el servicio. Las versiones vigentes se publican en esta misma dirección con la fecha de la última actualización.',
    ],
  },
  {
    titulo: '8. Legislación aplicable',
    parrafos: [
      'Este Aviso Legal se rige por las leyes de la República del Perú. Para cualquier controversia derivada de su interpretación o aplicación, las partes se someten a los jueces y tribunales de Lima, Perú, renunciando a cualquier otro fuero que pudiera corresponderles.',
    ],
  },
]

export default function AvisoLegalPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div
            className="inline-block px-4 py-2 rounded-lg text-white font-bold text-sm mb-4"
            style={{ backgroundColor: '#13602C' }}
          >
            CETOX LAB
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Aviso legal</h1>
          <p className="text-sm text-slate-500 mt-1">Última actualización: {ACTUALIZADO}</p>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6 sm:p-8 space-y-7">
          {SECCIONES.map((s) => (
            <section key={s.titulo}>
              <h2 className="text-sm font-semibold text-slate-900 mb-2">{s.titulo}</h2>
              <div className="space-y-2">
                {s.parrafos.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed text-slate-600">{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          <Link href="/politica-privacidad" className="underline hover:text-slate-600">Política de privacidad</Link>
          {' · '}
          <a href="mailto:servicios@cetox.com.pe" className="underline hover:text-slate-600">servicios@cetox.com.pe</a>
        </p>
      </div>
    </div>
  )
}
