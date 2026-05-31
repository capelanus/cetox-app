import { formatearSoles } from './num-to-words'
import type { CamposIndeterminado, CamposPlazoFijo, CamposLocacion } from './types'

// ── Shared print styles ───────────────────────────────────────────────────────

const ESTILOS = `
  @page { size: A4; margin: 2.5cm 2.5cm 2.5cm 2.5cm; }
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11pt;
    line-height: 1.55;
    color: #000;
    margin: 0;
    padding: 32px 0;
  }
  h1 {
    font-size: 12pt;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    margin: 0 0 20px 0;
    letter-spacing: 0.5px;
  }
  h2 {
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    margin: 18px 0 6px 0;
  }
  h3 {
    font-size: 11pt;
    font-weight: bold;
    margin: 14px 0 4px 0;
  }
  p {
    margin: 0 0 10px 0;
    text-align: justify;
  }
  ul {
    margin: 6px 0 10px 24px;
    padding: 0;
  }
  li { margin-bottom: 4px; }
  .firma-block {
    display: flex;
    justify-content: space-between;
    margin-top: 60px;
    gap: 40px;
  }
  .firma-col {
    flex: 1;
    text-align: center;
  }
  .firma-linea {
    border-top: 1px solid #000;
    margin-bottom: 6px;
    margin-top: 60px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 10.5pt;
  }
  th, td {
    border: 1px solid #555;
    padding: 5px 8px;
    text-align: left;
  }
  th { background: #f0f0f0; font-weight: bold; text-align: center; }
  td.center { text-align: center; }
  .no-print {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding: 16px 24px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .btn-print {
    background: #13602C;
    color: white;
    border: none;
    padding: 10px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    font-family: Arial, sans-serif;
  }
  .btn-close {
    background: white;
    color: #64748b;
    border: 1px solid #e2e8f0;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    font-family: Arial, sans-serif;
  }
  .content { max-width: 800px; margin: 0 auto; padding: 0 24px; }
  @media print {
    .no-print { display: none !important; }
    body { padding: 0; }
    .content { padding: 0; }
  }
`

function htmlWrapper(titulo: string, cuerpo: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${titulo}</title>
  <style>${ESTILOS}</style>
</head>
<body>
  <div class="no-print">
    <button id="btn-cerrar" class="btn-close">Cerrar</button>
    <button id="btn-imprimir" class="btn-print">🖨️ Imprimir / Guardar PDF</button>
  </div>
  <div class="content">
    ${cuerpo}
  </div>
  <script>
    (function () {
      var btnPrint = document.getElementById('btn-imprimir');
      var btnClose = document.getElementById('btn-cerrar');
      if (btnPrint) {
        btnPrint.addEventListener('click', function () {
          window.focus();
          window.print();
        });
      }
      if (btnClose) {
        btnClose.addEventListener('click', function () {
          window.close();
        });
      }
    })();
  </script>
</body>
</html>`
}

// ── 1. CONTRATO A PLAZO INDETERMINADO (Estándar) ─────────────────────────────

export function generarIndeterminado(c: CamposIndeterminado): string {
  const rem = formatearSoles(c.remuneracionNum)
  const cuerpo = `
<h1>Contrato de Trabajo a Plazo Indeterminado</h1>

<p>Conste por el presente documento, que se extiende por duplicado, el <strong>CONTRATO DE TRABAJO A PLAZO INDETERMINADO</strong>, que celebran de conformidad con el Texto Único Ordenado del Decreto Legislativo 728 – Ley de Productividad y Competitividad Laboral, aprobado por D.S. N.° 003-97-TR, así como sus normas complementarias, las partes siguientes:</p>

<h2>I. Identificación de las Partes</h2>

<h3>El Empleador:</h3>
<p><strong>CENTRO TOXICOLÓGICO S.A.C. – CETOX LAB</strong>, con R.U.C. N.° 20506303746, con domicilio fiscal en Av. Angamos Este N.° 2670, distrito de Surquillo, provincia y departamento de Lima, debidamente representada por su Gerente General, Dr. <strong>FERNÁNDEZ ANAYA LUIS ALBERTO</strong>, identificado con D.N.I. N.° 10810341, a quien en adelante se le denominará <strong>"EL EMPLEADOR"</strong>.</p>

<h3>El Trabajador:</h3>
<p>El Sr./Sra. <strong>${c.trabajadorNombre.toUpperCase()}</strong>, identificado(a) con D.N.I. N.° ${c.trabajadorDni}, domiciliado(a) en ${c.trabajadorDomicilio}, distrito de ${c.trabajadorDistrito}, provincia y departamento de Lima, a quien en adelante se le denominará <strong>"EL TRABAJADOR"</strong>.</p>

<h2>II. Cláusulas Contractuales</h2>

<h3>Primera: Antecedentes y Base Legal</h3>
<p>EL EMPLEADOR es una persona jurídica de derecho privado dedicada a la realización de ensayos y análisis técnicos de laboratorio, operando bajo la normativa aplicable, incluyendo la NTP-ISO/IEC 17025, Buenas Prácticas de Laboratorio (BPL) y normativa sectorial sanitaria. De acuerdo con el artículo 4° del TUO del D. Leg. 728, la prestación personal, subordinada y remunerada configura relación laboral. EL TRABAJADOR presta servicios para el EMPLEADOR de manera continua y subordinada desde el <strong>${c.fechaIngresoServicios}</strong>. En consecuencia, conforme a los artículos 4°, 7° y 9° del TUO del D. Leg. 728, la relación laboral se considera a plazo indeterminado desde dicha fecha, aun sin contrato escrito previo.</p>

<h3>Segunda: Objeto del Contrato</h3>
<p>El objeto del presente contrato es formalizar la relación laboral preexistente, reconociendo que EL TRABAJADOR ha prestado servicios personales desde la fecha indicada en la cláusula anterior, bajo subordinación, horario establecido y percibiendo contraprestación económica. El vínculo laboral es, por tanto, a plazo indeterminado, siendo formalizado mediante el presente documento, sin que ello implique interrupción, modificación o limitación de derechos adquiridos.</p>

<h3>Tercera: Puesto, Funciones y Línea de Mando</h3>
<p>EL TRABAJADOR desempeñará el cargo de <strong>${c.cargo.toUpperCase()}</strong> y cumplirá funciones técnicas, administrativas, conexas y complementarias al puesto, conforme a:</p>
<ul>
  <li>Manual de Organización y Funciones (MOF)</li>
  <li>Reglamento Interno de Trabajo (RIT)</li>
  <li>Sistema de Gestión basado en la NTP-ISO/IEC 17025</li>
  <li>Políticas internas de calidad y bioseguridad</li>
  <li>Instrucciones de la Jefatura inmediata, Dirección Técnica y Alta Dirección</li>
</ul>
<p>Sin perjuicio de ello, EL EMPLEADOR puede efectuar modificaciones razonables conforme al artículo 9° del TUO del D. Leg. 728, sin afectar remuneración ni categoría.</p>

<h3>Cuarta: Jornada y Horario</h3>
<p>EL TRABAJADOR cumplirá la jornada laboral máxima permitida por ley (artículo 25° de la Constitución y artículo 1° del TUO de la Ley de Jornada de Trabajo). El horario establecido: de <strong>08:45 a.m. a 5:30 p.m.</strong>, de lunes a viernes. Refrigerio: 45 minutos, no computable en la jornada. EL EMPLEADOR puede modificar la jornada u horario conforme al artículo 2° del TUO del D. Leg. 854 (D.S. 007-2002-TR), sin disminuir condiciones laborales.</p>

<h3>Quinta: Remuneración</h3>
<p>EL TRABAJADOR percibirá una remuneración mensual de <strong>${rem.completo}</strong>, sujeta a descuentos de ley (AFP/ONP, EsSalud, retenciones aplicables).</p>

<h3>Sexta: Régimen Laboral y Beneficios</h3>
<p>EL TRABAJADOR se encuentra sujeto al régimen laboral de la actividad privada, regulado por el Texto Único Ordenado del Decreto Legislativo N.° 728 – Ley de Productividad y Competitividad Laboral. En tal condición, tiene derecho a los siguientes beneficios laborales:</p>
<ul>
  <li>Vacaciones de treinta (30) días calendario por cada año completo de servicios, conforme al D. Leg. N.° 713.</li>
  <li>Compensación por Tiempo de Servicios (CTS), conforme al D.S. N.° 001-97-TR.</li>
  <li>Gratificaciones legales por Fiestas Patrias y Navidad, conforme a la Ley N.° 27735.</li>
  <li>Seguro Social en Salud (EsSalud).</li>
  <li>Asignación familiar, cuando corresponda, conforme a la Ley N.° 25129.</li>
</ul>

<h3>Séptima: Obligaciones del Trabajador</h3>
<p>EL TRABAJADOR se obliga a:</p>
<ul>
  <li>Cumplir las normas, políticas, procedimientos internos y directrices emitidas por la empresa.</li>
  <li>Guardar absoluta confidencialidad sobre toda información técnica, científica, operativa y administrativa a la que tenga acceso.</li>
  <li>Mantener una conducta ética y profesional conforme a los lineamientos de calidad y buenas prácticas del laboratorio.</li>
  <li>Cuidar y utilizar adecuadamente los equipos, instrumentos, materiales e instalaciones asignados.</li>
  <li>Registrar su asistencia diariamente de acuerdo con los mecanismos establecidos por la empresa.</li>
  <li>Desempeñar las funciones propias de su cargo detalladas en el Manual de Organización y Funciones (MOF).</li>
</ul>

<h3>Octava: Confidencialidad y Responsabilidad Penal</h3>
<p>EL TRABAJADOR se obliga a mantener absoluta confidencialidad y secreto profesional respecto de toda información a la que tenga acceso en el desempeño de sus funciones, incluyendo de manera enunciativa mas no limitativa:</p>
<ul>
  <li>Métodos analíticos, validaciones, protocolos, procedimientos operativos e instructivos internos.</li>
  <li>Resultados de ensayo, trazabilidad, cadenas de custodia, reportes y documentos técnicos.</li>
  <li>Información de clientes, proveedores, estudios, proyectos, precios, contratos o requerimientos.</li>
  <li>Datos, formatos, softwares, códigos, registros del sistema de gestión de la calidad (ISO/IEC 17025) y cualquier información generada o conservada por la empresa.</li>
  <li>Todo el know-how, diseños metodológicos, planes, estrategias o procesos desarrollados por CETOX LAB.</li>
</ul>
<p>Queda terminantemente prohibido al TRABAJADOR: copiar, reproducir o extraer información sin autorización; almacenar información en dispositivos personales; divulgar o compartir información con terceros; retener documentación una vez terminado el vínculo laboral. El incumplimiento constituye falta grave y puede configurar el delito de Revelación de Secretos tipificado en el artículo 165° del Código Penal.</p>

<h3>Novena: Extinción del Contrato</h3>
<p>El presente contrato se extingue por las causales establecidas en el artículo 16° del TUO del Decreto Legislativo N.° 728, incluyendo: renuncia voluntaria, mutuo disenso, fallecimiento del trabajador, invalidez absoluta permanente y causales justificadas de despido conforme a los artículos 22° y 24° del TUO.</p>

<h3>Décima: Domicilio y Notificaciones</h3>
<p>Las partes señalan como domicilios válidos para todo efecto de ley aquellos indicados en la sección de identificación inicial del presente contrato. Cualquier modificación de domicilio deberá ser comunicada a la otra parte por escrito, surtiendo efecto únicamente desde la fecha de recepción.</p>

<h3>Décima Primera: Formalización y Reconocimiento de Antigüedad</h3>
<p>Las partes dejan constancia expresa de que la relación laboral es continua e ininterrumpida desde el <strong>${c.fechaAntiguedadTexto}</strong>, de conformidad con lo establecido en el artículo 4° y concordantes del TUO del Decreto Legislativo N.° 728, reconociéndose que la prestación personal, subordinada y remunerada configura vínculo laboral aun en ausencia de contrato escrito, por lo que el presente documento tiene carácter meramente formal y declarativo, no constituye un nuevo inicio de vínculo ni reinicia cómputos de antigüedad, manteniéndose íntegros y vigentes todos los derechos, beneficios, obligaciones y efectos legales previamente adquiridos por el trabajador, conforme a la normativa laboral peruana y a los criterios de interpretación administrativa aplicados por SUNAFIL.</p>

<h3>Décima Segunda: Firma de Conformidad</h3>
<p>Suscrito en la ciudad de Lima, República del Perú, a los <strong>${c.diaFirma}</strong> días del mes de <strong>${c.mesFirma}</strong> del año <strong>${c.anioFirma}</strong>.</p>

<div class="firma-block">
  <div class="firma-col">
    <div class="firma-linea"></div>
    <p><strong>EL EMPLEADOR</strong><br/>
    Centro Toxicológico S.A.C. – CETOX LAB<br/>
    Dr. Luis Alberto Fernández Anaya<br/>
    D.N.I. N.° 10810341<br/>
    Gerente General</p>
  </div>
  <div class="firma-col">
    <div class="firma-linea"></div>
    <p><strong>EL TRABAJADOR</strong><br/>
    ${c.trabajadorNombre.toUpperCase()}<br/>
    D.N.I. N.° ${c.trabajadorDni}</p>
  </div>
</div>`

  return htmlWrapper('Contrato a Plazo Indeterminado – CETOX LAB', cuerpo)
}

// ── 2. CONTRATO A PLAZO INDETERMINADO – ALTA DIRECCIÓN ───────────────────────

export function generarIndeterminadoAltaDireccion(c: CamposIndeterminado): string {
  const rem = formatearSoles(c.remuneracionNum)
  const cuerpo = `
<h1>Contrato de Trabajo a Plazo Indeterminado<br/><small style="font-size:10pt">(Alta Dirección)</small></h1>

<p>Conste por el presente documento, que se extiende por duplicado, el <strong>CONTRATO DE TRABAJO A PLAZO INDETERMINADO</strong>, que celebran de conformidad con el Texto Único Ordenado del Decreto Legislativo 728 – Ley de Productividad y Competitividad Laboral, aprobado por D.S. N.° 003-97-TR, así como sus normas complementarias, las partes siguientes:</p>

<h2>I. Identificación de las Partes</h2>

<h3>El Empleador:</h3>
<p><strong>CENTRO TOXICOLÓGICO S.A.C. – CETOX LAB</strong>, con R.U.C. N.° 20506303746, con domicilio fiscal en Av. Angamos Este N.° 2670, distrito de Surquillo, provincia y departamento de Lima, debidamente representada por su Gerente General, Dr. <strong>FERNÁNDEZ ANAYA LUIS ALBERTO</strong>, identificado con D.N.I. N.° 10810341, a quien en adelante se le denominará <strong>"EL EMPLEADOR"</strong>.</p>

<h3>El Trabajador(a):</h3>
<p><strong>${c.trabajadorNombre.toUpperCase()}</strong>, identificado(a) con D.N.I. N.° ${c.trabajadorDni}, domiciliado(a) en ${c.trabajadorDomicilio}, distrito de ${c.trabajadorDistrito}, provincia y departamento de Lima, a quien en adelante se le denominará <strong>"EL TRABAJADOR"</strong>.</p>

<h2>II. Cláusulas Contractuales</h2>

<h3>Primera: Antecedentes y Base Legal</h3>
<p>EL EMPLEADOR es una persona jurídica de derecho privado dedicada a la realización de ensayos y análisis técnicos de laboratorio, operando bajo la normativa aplicable, incluyendo la NTP-ISO/IEC 17025, Buenas Prácticas de Laboratorio (BPL) y normativa sectorial sanitaria. EL TRABAJADOR(A) presta servicios para el EMPLEADOR de manera continua y subordinada desde el <strong>${c.fechaIngresoServicios}</strong>. En consecuencia, conforme a los artículos 4°, 7° y 9° del TUO del D. Leg. 728, la relación laboral se considera a plazo indeterminado desde dicha fecha, aun sin contrato escrito previo.</p>

<h3>Segunda: Objeto del Contrato</h3>
<p>El objeto del presente contrato es formalizar la relación laboral preexistente, reconociendo que EL TRABAJADOR(A) ha prestado servicios personales desde la fecha indicada en la cláusula anterior, bajo subordinación, horario establecido y percibiendo contraprestación económica. El vínculo laboral es, por tanto, a plazo indeterminado, sin que ello implique interrupción, modificación o limitación de derechos adquiridos.</p>

<h3>Tercera: Puesto, Funciones y Línea de Mando</h3>
<p>EL TRABAJADOR(A) desempeñará el cargo de <strong>${c.cargo.toUpperCase()}</strong> y cumplirá funciones técnicas, administrativas, conexas y complementarias al puesto, conforme al Manual de Organización y Funciones (MOF), Reglamento Interno de Trabajo (RIT), Sistema de Gestión basado en la NTP-ISO/IEC 17025, políticas internas de calidad y bioseguridad, e instrucciones de la Jefatura inmediata, Dirección Técnica y Alta Dirección.</p>

<h3>Cuarta: Jornada y Horario</h3>
<p>EL TRABAJADOR(A) cumplirá la jornada laboral máxima permitida por ley. El horario establecido: de <strong>09:00 a.m. a 5:00 p.m.</strong>, de lunes a viernes. Refrigerio: 45 minutos, no computable en la jornada.</p>

<h3>Quinta: Remuneración</h3>
<p>EL TRABAJADOR(A) percibirá una remuneración mensual de <strong>${rem.completo}</strong>, sujeta a descuentos de ley (AFP/ONP, EsSalud, retenciones aplicables).</p>

<h3>Sexta: Régimen Laboral y Beneficios</h3>
<p>EL TRABAJADOR(A) se encuentra sujeto al régimen laboral de la actividad privada, regulado por el TUO del Decreto Legislativo N.° 728. En tal condición, tiene derecho a: vacaciones de 30 días calendario por año, CTS conforme al D.S. N.° 001-97-TR, gratificaciones legales por Fiestas Patrias y Navidad (Ley N.° 27735), Seguro Social en Salud (EsSalud) y asignación familiar cuando corresponda (Ley N.° 25129).</p>

<h3>Séptima: Obligaciones del Trabajador</h3>
<p>EL TRABAJADOR(A) se obliga a: cumplir normas, políticas y procedimientos internos; guardar absoluta confidencialidad sobre toda información técnica, científica, operativa y administrativa a la que tenga acceso; y mantener una conducta ética y profesional conforme a los lineamientos de calidad y buenas prácticas del laboratorio.</p>

<h3>Octava: Confidencialidad y Responsabilidad Penal</h3>
<p>EL TRABAJADOR(A) se obliga a mantener absoluta confidencialidad y secreto profesional respecto de toda información a la que tenga acceso, incluyendo métodos analíticos, resultados de ensayo, información de clientes y proveedores, registros del sistema de gestión de la calidad (ISO/IEC 17025) y todo el know-how de CETOX LAB. El incumplimiento constituye falta grave y puede configurar el delito de Revelación de Secretos (artículo 165° del Código Penal). La obligación de confidencialidad permanece vigente de manera indefinida, aun después de concluida la relación laboral.</p>

<h3>Novena: Extinción del Contrato</h3>
<p>El presente contrato se extingue por las causales establecidas en el artículo 16° del TUO del Decreto Legislativo N.° 728: renuncia voluntaria, mutuo disenso, fallecimiento, invalidez absoluta permanente, causales justificadas de despido conforme a los artículos 22° y 24° del TUO, y otras causales previstas en la ley.</p>

<h3>Décima: Domicilio y Notificaciones</h3>
<p>Las partes señalan como domicilios válidos para todo efecto de ley aquellos indicados en la sección de identificación inicial. Cualquier modificación deberá ser comunicada por escrito, surtiendo efecto desde la fecha de recepción.</p>

<h3>Décima Primera: Formalización y Reconocimiento de Antigüedad</h3>
<p>Las partes dejan constancia expresa de que la relación laboral es continua e ininterrumpida desde el <strong>${c.fechaAntiguedadTexto}</strong>, de conformidad con lo establecido en el artículo 4° y concordantes del TUO del Decreto Legislativo N.° 728. El presente documento tiene carácter meramente formal y declarativo, no constituye un nuevo inicio de vínculo ni reinicia cómputos de antigüedad, manteniéndose íntegros todos los derechos y beneficios previamente adquiridos, conforme a la normativa laboral peruana y a los criterios de SUNAFIL.</p>

<h3>Décima Segunda: Firma de Conformidad</h3>
<p>Suscrito en la ciudad de Lima, República del Perú, a los <strong>${c.diaFirma}</strong> días del mes de <strong>${c.mesFirma}</strong> del año <strong>${c.anioFirma}</strong>.</p>

<div class="firma-block">
  <div class="firma-col">
    <div class="firma-linea"></div>
    <p><strong>EL EMPLEADOR</strong><br/>
    Centro Toxicológico S.A.C. – CETOX LAB<br/>
    Dr. Luis Alberto Fernández Anaya<br/>
    D.N.I. N.° 10810341<br/>
    Gerente General</p>
  </div>
  <div class="firma-col">
    <div class="firma-linea"></div>
    <p><strong>EL TRABAJADOR</strong><br/>
    ${c.trabajadorNombre.toUpperCase()}<br/>
    D.N.I. N.° ${c.trabajadorDni}</p>
  </div>
</div>`

  return htmlWrapper('Contrato a Plazo Indeterminado (Alta Dirección) – CETOX LAB', cuerpo)
}

// ── 3. CONTRATO A PLAZO FIJO – SERVICIO ESPECÍFICO ───────────────────────────

export function generarPlazoFijo(c: CamposPlazoFijo): string {
  const rem = formatearSoles(c.remuneracionNum)
  const cuerpo = `
<h1>Contrato de Trabajo a Plazo Determinado<br/>Sujeto a Modalidad por Servicio Específico</h1>

<p>Conste por el presente documento el Contrato de Trabajo sujeto a modalidad <strong>"Servicio Específico"</strong>, que celebran al amparo del Art. 63° de la Ley de Productividad y Competitividad Laboral aprobado por D.S. N.° 003-97-TR, y normas complementarias, de una parte:</p>

<h2>I. Partes del Contrato</h2>

<p><strong>EL EMPLEADOR:</strong> <strong>CENTRO TOXICOLÓGICO S.A.C.</strong>, con R.U.C. N.° 20506303746, con domicilio fiscal en Av. Angamos Este N.° 2670, Urb. La Calera, Lima – Surquillo, debidamente representada por su Gerente General el Dr. <strong>FERNÁNDEZ ANAYA LUIS ALBERTO</strong>, con D.N.I. N.° 10810341, a quien en adelante se le denominará <strong>"EL EMPLEADOR"</strong>.</p>

<p><strong>EL TRABAJADOR:</strong> <strong>${c.trabajadorNombre.toUpperCase()}</strong>, con D.N.I. N.° ${c.trabajadorDni}, domiciliado(a) en ${c.trabajadorDomicilio}, distrito de ${c.trabajadorDistrito}, de profesión <strong>${c.trabajadorProfesion}</strong>, a quien en adelante se le denominará <strong>"EL TRABAJADOR"</strong>.</p>

<h2>II. Cláusulas Contractuales</h2>

<h3>Primero: Antecedentes y Causa Objetiva de Contratación</h3>
<p>EL EMPLEADOR es una persona jurídica de derecho privado cuya actividad principal es la realización de ensayos y análisis técnicos de laboratorio, inscrita en el Régimen Laboral de la Actividad Privada, regulado por el TUO del D. Leg. N.° 728.</p>
<p>EL TRABAJADOR es una persona natural, de profesión <strong>${c.trabajadorProfesion}</strong>, quien declara contar con la formación académica, conocimientos y experiencia necesarios para desempeñar las labores que motivan la presente contratación.</p>
<p>EL EMPLEADOR ha suscrito el presente contrato con la finalidad de que EL TRABAJADOR realice actividades propias de <strong>${c.causaObjetiva}</strong> en CENTRO TOXICOLÓGICO S.A.C. – CETOX LAB, en atención a la necesidad de reforzar el personal para el adecuado cumplimiento de los servicios ofrecidos por la empresa.</p>

<h3>Segundo: Objeto del Contrato y Obligaciones del Trabajador</h3>
<p>EL TRABAJADOR se desempeñará como <strong>${c.cargo.toUpperCase()}</strong>, comprometiéndose a ejecutar las funciones que le sean asignadas, a cumplir estrictamente con las labores encomendadas y a observar las normas, procedimientos y disposiciones internas de EL EMPLEADOR.</p>
<p>EL TRABAJADOR se obliga a mantener absoluta confidencialidad y reserva respecto de toda información técnica, administrativa, comercial u operativa a la que tenga acceso. La obligación de confidencialidad subsistirá incluso después de concluido el vínculo laboral.</p>

<h3>Tercero: De la Jornada de Trabajo</h3>
<p>EL TRABAJADOR cumplirá una jornada ordinaria de lunes a viernes, en el horario de <strong>08:45 a.m. a 05:30 p.m.</strong>, incluyendo un tiempo de refrigerio de cuarenta y cinco (45) minutos, el cual no forma parte de la jornada de trabajo. El horario podrá ser modificado por EL EMPLEADOR por razones operativas, respetando los límites legales y comunicándolo oportunamente.</p>

<h3>Cuarto: De la Remuneración</h3>
<p>EL TRABAJADOR percibirá como contraprestación por los servicios prestados una remuneración mensual bruta ascendente a <strong>${rem.completo}</strong>, la cual será abonada el último día hábil de cada mes, sujeta a los descuentos de ley correspondientes al sistema previsional (ONP o AFP), EsSalud e impuestos aplicables.</p>

<h3>Quinto: De la Duración del Contrato</h3>
<p>El presente contrato tiene una duración determinada de <strong>${c.duracionTexto}</strong>, iniciándose el <strong>${c.fechaInicio}</strong> y concluyendo el <strong>${c.fechaFin}</strong>, fecha en la cual vencerá de pleno derecho e indefectiblemente, sin necesidad de comunicación previa alguna, salvo que las partes acuerden expresamente su prórroga o renovación conforme a la normativa laboral vigente.</p>

<h3>Sexto: Confidencialidad y Reserva de Información</h3>
<p>EL TRABAJADOR se obliga a guardar absoluta confidencialidad y reserva respecto de toda información, documentación, datos, procedimientos, métodos, resultados, informes, sistemas, protocolos, know-how y cualquier otra información a la que tenga acceso con ocasión de la ejecución del presente contrato. Esta obligación se mantiene durante toda la vigencia de la relación laboral y subsistirá aun después de su extinción. El incumplimiento será considerado falta grave conforme al artículo 25° del TUO del D. Leg. N.° 728.</p>

<h3>Séptimo: Devolución de Información y Bienes</h3>
<p>Al término de la relación laboral, EL TRABAJADOR se obliga a devolver de manera inmediata y completa toda documentación, equipos, materiales, dispositivos electrónicos, credenciales de acceso y archivos, quedando prohibida la conservación de copias o reproducciones.</p>

<h3>Octavo: Protección de Datos Personales</h3>
<p>EL TRABAJADOR declara conocer que, en el marco de sus funciones, podría acceder a datos personales, por lo que se obliga a cumplir estrictamente con la Ley N.° 29733 – Ley de Protección de Datos Personales, su reglamento y normas complementarias.</p>

<h3>Noveno: Solución de Controversias</h3>
<p>Las partes acuerdan que toda controversia derivada del presente contrato será sometida a la jurisdicción de los Juzgados y Tribunales Competentes del Cercado de Lima, renunciando expresamente a cualquier otro fuero.</p>

<h3>Décimo: Legislación Aplicable</h3>
<p>El presente contrato se rige por el Texto Único Ordenado del Decreto Legislativo N.° 728, su reglamento, normas complementarias y demás disposiciones laborales vigentes en la República del Perú.</p>

<h3>Décimo Primero: Suscripción</h3>
<p>En señal de conformidad, las partes suscriben el presente contrato en la ciudad de Lima, a los <strong>${c.diaFirma}</strong> días del mes de <strong>${c.mesFirma}</strong> del año <strong>${c.anioFirma}</strong>.</p>

<div class="firma-block">
  <div class="firma-col">
    <div class="firma-linea"></div>
    <p><strong>EL EMPLEADOR</strong><br/>
    Centro Toxicológico S.A.C. – CETOX LAB<br/>
    Dr. Luis Alberto Fernández Anaya<br/>
    D.N.I. N.° 10810341<br/>
    Gerente General</p>
  </div>
  <div class="firma-col">
    <div class="firma-linea"></div>
    <p><strong>EL TRABAJADOR</strong><br/>
    ${c.trabajadorNombre.toUpperCase()}<br/>
    D.N.I. N.° ${c.trabajadorDni}</p>
  </div>
</div>`

  return htmlWrapper('Contrato Servicio Específico – CETOX LAB', cuerpo)
}

// ── 4. CONTRATO DE LOCACIÓN DE SERVICIOS ─────────────────────────────────────

export function generarLocacion(c: CamposLocacion): string {
  const totFmt = formatearSoles(c.honorariosTotal)
  const filasPagos = c.pagos.map(p => {
    const mFmt = formatearSoles(p.monto)
    return `<tr>
      <td class="center">${p.id.padStart(2, '0')}</td>
      <td>${p.entregable}</td>
      <td class="center">${p.fechaPago}</td>
      <td class="center">${mFmt.numero}</td>
    </tr>`
  }).join('\n')

  const cuerpo = `
<h1>Contrato de Locación de Servicios Temporales</h1>

<p>Conste por el presente documento el Contrato de Locación de Servicios Temporales que celebran, de una parte, <strong>CENTRO TOXICOLÓGICO S.A.C. – CETOX</strong>, identificada con R.U.C. N.° 20506303746, inscrita en la Partida Electrónica N.° 11496641 del Registro de Personas Jurídicas de Lima, con domicilio fiscal en Av. Angamos Este N.° 2670, Urb. La Calera, distrito de Surquillo, provincia y departamento de Lima, debidamente representada por su Gerente General, Sr. <strong>Luis Alberto Fernández Anaya</strong>, identificado con DNI N.° 10810341, a quien en adelante se le denominará <strong>"EL COMITENTE"</strong>; y de la otra parte el Sr./Sra. <strong>${c.prestadorNombre.toUpperCase()}</strong>, identificado(a) con DNI N.° ${c.prestadorDni}, con domicilio en ${c.prestadorDomicilio}, distrito de ${c.prestadorDistrito}, provincia y departamento de Lima, a quien en adelante se le denominará <strong>"EL PRESTADOR"</strong>.</p>

<h2>Cláusulas</h2>

<h3>Cláusula Primera – Objeto de la Contratación</h3>
<p>EL COMITENTE contrata los servicios independientes y temporales de EL PRESTADOR para la ejecución de: <strong>${c.descripcionServicios}</strong>.</p>
<p>La presente contratación responde a una necesidad temporal y específica. Las partes dejan expresa constancia de que la presente contratación es de naturaleza exclusivamente civil, regulada por los artículos 1764° y siguientes del Código Civil, por lo que:</p>
<ul>
  <li>No existe relación laboral, subordinación ni dependencia entre las partes.</li>
  <li>EL PRESTADOR ejecutará los servicios con plena autonomía técnica, administrativa y operativa.</li>
  <li>EL PRESTADOR no se encuentra sujeto a fiscalización inmediata, control de asistencia ni jornada laboral por parte de EL COMITENTE.</li>
  <li>La presente contratación no genera beneficios sociales, derechos laborales ni conceptos remunerativos propios de una relación laboral.</li>
</ul>

<h3>Cláusula Segunda – Ejecución del Servicio</h3>
<p>EL PRESTADOR desarrollará las actividades y entregables requeridos por EL COMITENTE de manera autónoma, conforme a las coordinaciones generales efectuadas entre las partes. Cuando la naturaleza del servicio lo requiera, EL PRESTADOR podrá realizar coordinaciones o actividades presenciales en las instalaciones de EL COMITENTE ubicadas en Av. Angamos Este N.° 2670, distrito de Surquillo, sin que ello implique subordinación, exclusividad, control horario ni vínculo laboral alguno.</p>

<h3>Cláusula Tercera – Honorarios y Forma de Pago</h3>
<p>Como contraprestación por los servicios objeto del presente contrato, EL COMITENTE abonará a EL PRESTADOR la suma total de <strong>${totFmt.completo}</strong>, importe que incluye los tributos que resulten aplicables conforme a ley. El pago se efectuará previa conformidad de los servicios prestados y contra entrega del Recibo por Honorarios Electrónico correspondiente, conforme al siguiente cronograma:</p>

<table>
  <thead>
    <tr>
      <th>ID</th>
      <th>Entregable / Descripción</th>
      <th>Fecha de Pago</th>
      <th>Monto</th>
    </tr>
  </thead>
  <tbody>
    ${filasPagos}
    <tr>
      <td colspan="3" style="text-align:right;font-weight:bold;">TOTAL</td>
      <td class="center" style="font-weight:bold;">${totFmt.numero}</td>
    </tr>
  </tbody>
</table>

<p>EL PRESTADOR declara encontrarse inscrito ante SUNAT y contar con capacidad para emitir comprobantes de pago conforme a la normativa tributaria vigente.</p>

<h3>Cláusula Cuarta – Plazo de Vigencia</h3>
<p>El presente contrato tendrá una duración determinada de <strong>${c.duracionMeses} mes${c.duracionMeses !== 1 ? 'es' : ''}</strong>, iniciándose el <strong>${c.fechaInicio}</strong> y culminando indefectiblemente el <strong>${c.fechaFin}</strong>, fecha en la cual quedará resuelto automáticamente, sin necesidad de comunicación previa entre las partes. Cualquiera de las partes podrá resolver anticipadamente el presente contrato mediante comunicación escrita cursada con una anticipación no menor de cinco (05) días calendario.</p>

<h3>Cláusula Quinta – Autonomía e Inexistencia de Relación Laboral</h3>
<p>EL PRESTADOR ejecutará el objeto del presente contrato en forma independiente y con plena autonomía técnica y administrativa. La suscripción del presente contrato no genera vínculo laboral alguno entre las partes, ni otorga a EL PRESTADOR beneficios sociales, CTS, vacaciones, gratificaciones, utilidades ni cualquier otro derecho propio del régimen laboral de la actividad privada.</p>

<h3>Cláusula Sexta – No Exclusividad</h3>
<p>EL PRESTADOR mantiene plena libertad para prestar servicios a terceros durante la vigencia del presente contrato, siempre que ello no genere conflicto de interés ni afecte el adecuado cumplimiento de las obligaciones asumidas frente a EL COMITENTE.</p>

<h3>Cláusula Séptima – Confidencialidad</h3>
<p>EL PRESTADOR se obliga a mantener absoluta reserva y confidencialidad respecto de toda información técnica, administrativa, económica, comercial, científica o de cualquier otra naturaleza a la que tenga acceso con ocasión de la ejecución del presente contrato. La obligación de confidencialidad se mantendrá incluso después de concluida la relación contractual. A la culminación del contrato, EL PRESTADOR deberá devolver toda documentación, registros y archivos proporcionados por EL COMITENTE.</p>

<h3>Cláusula Octava – Cláusula Penal</h3>
<p>En caso de incumplimiento de cualquiera de las obligaciones asumidas por EL PRESTADOR, éste deberá abonar a favor de EL COMITENTE una penalidad equivalente al veinte por ciento (20%) del valor total del presente contrato, sin perjuicio de las acciones legales correspondientes por los daños y perjuicios ocasionados.</p>

<h3>Cláusula Novena – Terminación</h3>
<p>El presente contrato podrá darse por terminado por: vencimiento del plazo contractual; acuerdo mutuo entre las partes; incumplimiento de las obligaciones asumidas por cualquiera de las partes; o resolución anticipada comunicada conforme a la cláusula cuarta.</p>

<h3>Cláusula Décima – Disposiciones Finales</h3>
<p>El presente contrato constituye el acuerdo íntegro entre las partes y reemplaza cualquier comunicación o acuerdo previo, verbal o escrito, relacionado con el mismo objeto. En señal de conformidad, las partes suscriben el presente documento en la ciudad de Lima, a los <strong>${c.diaFirma}</strong> días del mes de <strong>${c.mesFirma}</strong> del año <strong>${c.anioFirma}</strong>.</p>

<div class="firma-block">
  <div class="firma-col">
    <div class="firma-linea"></div>
    <p><strong>EL COMITENTE</strong><br/>
    Centro Toxicológico S.A.C. – CETOX LAB<br/>
    Luis Alberto Fernández Anaya<br/>
    D.N.I. N.° 10810341<br/>
    Gerente General</p>
  </div>
  <div class="firma-col">
    <div class="firma-linea"></div>
    <p><strong>EL PRESTADOR</strong><br/>
    ${c.prestadorNombre.toUpperCase()}<br/>
    D.N.I. N.° ${c.prestadorDni}</p>
  </div>
</div>`

  return htmlWrapper('Contrato de Locación de Servicios – CETOX LAB', cuerpo)
}
