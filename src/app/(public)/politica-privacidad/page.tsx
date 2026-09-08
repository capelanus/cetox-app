import Link from 'next/link'

const ACTUALIZADO = '7 de setiembre de 2026'

const SECCIONES = [
  {
    titulo: '1. Responsable del tratamiento',
    parrafos: [
      'CENTRO TOXICOLÓGICO S.A.C. (CETOX LAB), RUC 20506303746, con domicilio en Av. Angamos Este N° 2668–2670, Urb. La Calera – Surquillo, Lima, Perú, es responsable del tratamiento de los datos personales recogidos a través de cetoxlab.tech, de acuerdo con la Ley N° 29733, Ley de Protección de Datos Personales, y su Reglamento (D.S. N° 003-2013-JUS).',
    ],
  },
  {
    titulo: '2. Datos que recopilamos',
    parrafos: [
      'Según cómo se use la plataforma, podemos tratar los siguientes datos:',
    ],
    lista: [
      'Datos de la empresa cliente: razón social, RUC, dirección.',
      'Datos de la persona de contacto: nombre, correo electrónico, teléfono.',
      'Credenciales de acceso al Portal del Cliente (usuario y contraseña, esta última almacenada con hash, nunca en texto plano).',
      'Datos operativos de las muestras y ensayos solicitados: código de muestra, área de análisis, estado, fechas y, cuando corresponde, los informes de resultado emitidos.',
      'Datos técnicos de navegación estrictamente necesarios para mantener la sesión (ver sección de cookies).',
    ],
  },
  {
    titulo: '3. Finalidad del tratamiento',
    parrafos: ['Los datos se utilizan exclusivamente para:'],
    lista: [
      'Brindar el servicio de análisis toxicológico y de laboratorio contratado.',
      'Permitir al cliente autenticarse y hacer seguimiento del estado de sus propias muestras.',
      'Generar y entregar los informes de ensayo y sus certificados.',
      'Atender consultas y comunicaciones relacionadas con el servicio.',
      'Cumplir obligaciones legales, contables y de acreditación del laboratorio.',
    ],
  },
  {
    titulo: '4. Base legal',
    parrafos: [
      'El tratamiento se basa en la ejecución de la relación comercial existente entre CETOX LAB y el cliente, y en el consentimiento otorgado al recibir y utilizar las credenciales del Portal del Cliente. Los datos no se emplean para fines distintos a los aquí descritos.',
    ],
  },
  {
    titulo: '5. Conservación',
    parrafos: [
      'Los datos se conservan mientras dure la relación comercial y, posteriormente, durante los plazos exigidos por la normativa tributaria, contable y de acreditación de laboratorios aplicable en el Perú.',
    ],
  },
  {
    titulo: '6. Encargados y transferencias',
    parrafos: [
      'CETOX LAB puede apoyarse en proveedores de infraestructura tecnológica (alojamiento del sistema y almacenamiento de archivos en la nube) para operar la plataforma. Estos proveedores actúan como encargados de tratamiento, solo acceden a los datos necesarios para prestar dicho servicio técnico y no los utilizan con fines propios. CETOX LAB no vende ni cede datos personales a terceros con fines comerciales o publicitarios.',
    ],
  },
  {
    titulo: '7. Medidas de seguridad',
    parrafos: ['El Portal del Cliente aplica, entre otras, las siguientes medidas:'],
    lista: [
      'Las contraseñas se almacenan con hash (bcrypt), nunca en texto plano.',
      'La sesión del cliente es independiente de la del personal interno de CETOX LAB: un cliente no puede autenticarse como personal interno, ni viceversa.',
      'Cada cliente solo puede ver y descargar sus propias muestras e informes; el acceso a datos de otra empresa está bloqueado a nivel de servidor.',
      'Las conexiones a la plataforma se realizan mediante HTTPS.',
    ],
  },
  {
    titulo: '8. Derechos del titular de los datos (ARCO)',
    parrafos: [
      'Conforme a la Ley N° 29733, puede ejercer sus derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO) sobre sus datos personales, así como solicitar información sobre su tratamiento, escribiendo a servicios@cetox.com.pe indicando el derecho que desea ejercer y adjuntando un medio que acredite su identidad o representación de la empresa.',
    ],
  },
  {
    titulo: '9. Cookies',
    parrafos: [
      'El Portal del Cliente utiliza una única cookie técnica, estrictamente necesaria, para mantener la sesión iniciada (identifica de forma cifrada a qué empresa cliente pertenece la sesión). Es de tipo HttpOnly, no es accesible desde scripts del navegador y no se utiliza con fines de publicidad, analítica ni seguimiento entre sitios.',
    ],
  },
  {
    titulo: '10. Cambios a esta política',
    parrafos: [
      'Esta política puede actualizarse para reflejar cambios en el servicio o en la normativa aplicable. La versión vigente siempre estará disponible en esta misma dirección, con la fecha de la última actualización.',
    ],
  },
  {
    titulo: '11. Contacto',
    parrafos: [
      'Para consultas sobre esta política o el tratamiento de sus datos, escríbanos a servicios@cetox.com.pe o llámenos al (511) 920 008 680.',
    ],
  },
]

export default function PoliticaPrivacidadPage() {
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
          <h1 className="text-2xl font-bold text-slate-900">Política de privacidad</h1>
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
              {s.lista && (
                <ul className="mt-2 space-y-1.5 list-disc pl-5">
                  {s.lista.map((li, i) => (
                    <li key={i} className="text-sm leading-relaxed text-slate-600">{li}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          <Link href="/aviso-legal" className="underline hover:text-slate-600">Aviso legal</Link>
          {' · '}
          <a href="mailto:servicios@cetox.com.pe" className="underline hover:text-slate-600">servicios@cetox.com.pe</a>
        </p>
      </div>
    </div>
  )
}
