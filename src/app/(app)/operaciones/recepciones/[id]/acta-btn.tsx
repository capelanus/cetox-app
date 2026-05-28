'use client'

interface RecepcionItem {
  descripcion: string
  cantidadEsperada: number
  cantidadRecibida: number
  unidad: string
  conforme: boolean
  observacion: string | null
}

interface ActaBtnProps {
  numero: number
  anio: number
  fechaRecepcion: string
  ocNumero: string
  proveedor: string
  recibidoPor: string
  items: RecepcionItem[]
}

export default function ActaBtn({ numero, anio, fechaRecepcion, ocNumero, proveedor, recibidoPor, items }: ActaBtnProps) {
  function handleGenerarActa() {
    const actaNumero = `REC-${String(numero).padStart(4, '0')}-${anio}`
    const fechaFormateada = new Date(fechaRecepcion).toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })

    const filas = items.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.descripcion}</td>
        <td style="text-align:right">${item.cantidadEsperada} ${item.unidad}</td>
        <td style="text-align:right">${item.cantidadRecibida} ${item.unidad}</td>
        <td style="text-align:center; font-size:16px">${item.conforme ? '✓' : '✗'}</td>
        <td>${item.observacion ?? '—'}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Acta de Conformidad ${actaNumero}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #13602C; padding-bottom: 16px; margin-bottom: 24px; }
    .logo-area h1 { font-size: 24px; color: #13602C; font-weight: 900; letter-spacing: 2px; }
    .logo-area p { font-size: 11px; color: #666; margin-top: 2px; }
    .acta-id { text-align: right; }
    .acta-id .num { font-size: 20px; font-weight: 700; color: #13602C; }
    .acta-id .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
    h2 { font-size: 16px; color: #13602C; margin: 24px 0 12px; text-transform: uppercase; letter-spacing: 1px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
    .info-item .label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-item .value { font-size: 13px; font-weight: 600; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    thead { background: #13602C; color: white; }
    th { padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
    tr:nth-child(even) td { background: #f9fafb; }
    td.conforme-si { color: #15803d; font-weight: 700; }
    td.conforme-no { color: #dc2626; font-weight: 700; }
    .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 48px; }
    .firma-box { border-top: 2px solid #374151; padding-top: 8px; }
    .firma-box .titulo { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .firma-box .espacio { height: 56px; }
    .print-btn { background: #13602C; color: white; border: none; padding: 10px 24px; border-radius: 6px; font-size: 13px; cursor: pointer; margin-bottom: 24px; }
    @media print { .print-btn { display: none; } body { padding: 20px; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Imprimir Acta</button>

  <div class="header">
    <div class="logo-area">
      <h1>CETOX LAB</h1>
      <p>Centro de Toxicología y Análisis Ambiental</p>
    </div>
    <div class="acta-id">
      <div class="label">Acta de Conformidad</div>
      <div class="num">N° ${actaNumero}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-item">
      <div class="label">Fecha de Recepción</div>
      <div class="value">${fechaFormateada}</div>
    </div>
    <div class="info-item">
      <div class="label">Orden de Compra</div>
      <div class="value">${ocNumero}</div>
    </div>
    <div class="info-item">
      <div class="label">Proveedor</div>
      <div class="value">${proveedor}</div>
    </div>
    <div class="info-item">
      <div class="label">Recibido por</div>
      <div class="value">${recibidoPor}</div>
    </div>
  </div>

  <h2>Detalle de ítems recepcionados</h2>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Descripción</th>
        <th>Cant. Esperada</th>
        <th>Cant. Recibida</th>
        <th style="text-align:center">Conforme</th>
        <th>Observaciones</th>
      </tr>
    </thead>
    <tbody>
      ${filas}
    </tbody>
  </table>

  <div class="firmas">
    <div class="firma-box">
      <div class="espacio"></div>
      <div class="titulo">Recibido por:</div>
      <div style="font-weight:600; margin-top:4px">${recibidoPor}</div>
    </div>
    <div class="firma-box">
      <div class="espacio"></div>
      <div class="titulo">Conforme el área:</div>
      <div style="font-weight:600; margin-top:4px">___________________________</div>
    </div>
  </div>

  <script>
    // Colorize conforme cells
    document.querySelectorAll('td:nth-child(5)').forEach(function(td) {
      if (td.textContent.trim() === '✓') td.className = 'conforme-si';
      else if (td.textContent.trim() === '✗') td.className = 'conforme-no';
    });
  </script>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return (
    <button
      onClick={handleGenerarActa}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#13602C] hover:bg-[#0e4a21] text-white transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Generar Acta
    </button>
  )
}
