/**
 * seed-gerencia.ts — Datos de ejemplo para Planeamiento Estratégico y Contabilidad & Finanzas
 * Ejecutar: DATABASE_URL_UNPOOLED="..." npx tsx prisma/seed-gerencia.ts
 */
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const DATABASE_URL =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!

const adapter = new PrismaPg({ connectionString: DATABASE_URL })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  // ── Obtener IDs de usuarios reales ────────────────────────────────────────
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, email: true, nombre: true },
  })
  const byEmail = Object.fromEntries(usuarios.map((u) => [u.email, u]))

  const ID_ANAYA   = byEmail['anaya@cetox.com.pe']?.id   ?? 'anaya'
  const ID_RISCO   = byEmail['risco@cetox.com.pe']?.id   ?? 'risco'
  const ID_ADMIN   = byEmail['admin@cetox.com.pe']?.id   ?? 'admin'
  const ID_CASTILLO = byEmail['a.castillo@cetox.com.pe']?.id ?? ID_ADMIN

  console.log('Usuarios encontrados:', { ID_ANAYA, ID_RISCO, ID_ADMIN })

  // ── Limpiar datos anteriores (en orden por FK) ────────────────────────────
  console.log('Limpiando datos anteriores...')
  await prisma.documentoFinanciero.deleteMany()
  await prisma.registroRentabilidad.deleteMany()
  await prisma.lineaPresupuesto.deleteMany()
  await prisma.partidaPresupuestal.deleteMany()
  await prisma.centroCosto.deleteMany()
  await prisma.accionMejora.deleteMany()
  await prisma.hitoProyecto.deleteMany()
  await prisma.proyectoEstrategico.deleteMany()
  await prisma.medicionIndicador.deleteMany()
  await prisma.indicador.deleteMany()
  await prisma.riesgo.deleteMany()
  await prisma.seguimientoActividad.deleteMany()
  await prisma.actividadOperativa.deleteMany()
  await prisma.accionEstrategica.deleteMany()
  await prisma.objetivoEstrategico.deleteMany()
  await prisma.planEstrategico.deleteMany()

  // ══════════════════════════════════════════════════════════════════════════
  // PLANEAMIENTO ESTRATÉGICO
  // ══════════════════════════════════════════════════════════════════════════

  // ── Plan Estratégico Institucional ────────────────────────────────────────
  const plan = await prisma.planEstrategico.create({
    data: {
      nombre: 'PEI 2026-2030',
      anioInicio: 2026,
      anioFin: 2030,
      activo: true,
      vision:
        'Ser el laboratorio de análisis toxicológico y ecotoxicológico líder en Perú, reconocido por su rigor científico, innovación tecnológica y compromiso con la protección ambiental.',
      mision:
        'Brindar servicios de análisis especializados de alta calidad, con integridad técnica y científica, contribuyendo a la investigación, la regulación ambiental y la salud pública.',
    },
  })
  console.log('Plan estratégico creado:', plan.id)

  // ── OEI 01 — Capacidad tecnológica ────────────────────────────────────────
  const oei01 = await prisma.objetivoEstrategico.create({
    data: {
      planId: plan.id, codigo: 'OEI.01', orden: 1,
      nombre: 'Incrementar la capacidad analítica y tecnológica del laboratorio',
      descripcion: 'Modernizar el equipamiento e incorporar nuevas metodologías para ampliar la oferta de servicios.',
      responsableId: ID_ANAYA,
    },
  })

  // ── OEI 02 — Calidad y acreditación ──────────────────────────────────────
  const oei02 = await prisma.objetivoEstrategico.create({
    data: {
      planId: plan.id, codigo: 'OEI.02', orden: 2,
      nombre: 'Fortalecer el sistema de gestión de calidad y mantener la acreditación',
      descripcion: 'Asegurar el cumplimiento continuo de los requisitos ISO/IEC 17025 y ampliar el alcance de acreditación.',
      responsableId: ID_RISCO,
    },
  })

  // ── OEI 03 — Mercado y clientes ───────────────────────────────────────────
  const oei03 = await prisma.objetivoEstrategico.create({
    data: {
      planId: plan.id, codigo: 'OEI.03', orden: 3,
      nombre: 'Diversificar la cartera de servicios y expandir la base de clientes',
      descripcion: 'Ingresar a nuevos sectores industriales y fidelizar la cartera actual.',
      departamento: 'ADMINISTRACION',
      responsableId: ID_ADMIN,
    },
  })

  // ── OEI 04 — Capital humano ───────────────────────────────────────────────
  const oei04 = await prisma.objetivoEstrategico.create({
    data: {
      planId: plan.id, codigo: 'OEI.04', orden: 4,
      nombre: 'Desarrollar y retener el capital humano especializado',
      descripcion: 'Fortalecer competencias técnicas y reducir la rotación del personal crítico.',
      departamento: 'ADMINISTRACION',
      responsableId: ID_CASTILLO,
    },
  })

  // ── OEI 05 — Sostenibilidad financiera ───────────────────────────────────
  const oei05 = await prisma.objetivoEstrategico.create({
    data: {
      planId: plan.id, codigo: 'OEI.05', orden: 5,
      nombre: 'Garantizar la sostenibilidad financiera y la eficiencia operativa',
      descripcion: 'Optimizar costos, aumentar ingresos y asegurar la viabilidad financiera a largo plazo.',
      departamento: 'ADMINISTRACION',
      responsableId: ID_ADMIN,
    },
  })

  // ── Acciones Estratégicas ─────────────────────────────────────────────────
  const aei0101 = await prisma.accionEstrategica.create({
    data: {
      objetivoId: oei01.id, codigo: 'AEI.01.01', orden: 1,
      nombre: 'Modernización del equipamiento científico e instrumental',
      departamento: 'QUIMICA',
      responsableId: ID_ANAYA,
    },
  })
  const aei0102 = await prisma.accionEstrategica.create({
    data: {
      objetivoId: oei01.id, codigo: 'AEI.01.02', orden: 2,
      nombre: 'Implementación y validación de nuevas metodologías analíticas',
      responsableId: ID_ANAYA,
    },
  })
  const aei0201 = await prisma.accionEstrategica.create({
    data: {
      objetivoId: oei02.id, codigo: 'AEI.02.01', orden: 1,
      nombre: 'Renovación y ampliación del alcance de la acreditación ISO/IEC 17025',
      responsableId: ID_RISCO,
    },
  })
  const aei0202 = await prisma.accionEstrategica.create({
    data: {
      objetivoId: oei02.id, codigo: 'AEI.02.02', orden: 2,
      nombre: 'Gestión de no conformidades y acciones de mejora continua',
      departamento: 'CALIDAD',
      responsableId: ID_RISCO,
    },
  })
  const aei0301 = await prisma.accionEstrategica.create({
    data: {
      objetivoId: oei03.id, codigo: 'AEI.03.01', orden: 1,
      nombre: 'Desarrollo de nuevos mercados en sectores minero, pesquero y farmacéutico',
      departamento: 'ADMINISTRACION',
      responsableId: ID_ADMIN,
    },
  })
  const aei0401 = await prisma.accionEstrategica.create({
    data: {
      objetivoId: oei04.id, codigo: 'AEI.04.01', orden: 1,
      nombre: 'Plan de formación continua y certificación del personal técnico',
      departamento: 'ADMINISTRACION',
      responsableId: ID_CASTILLO,
    },
  })
  const aei0501 = await prisma.accionEstrategica.create({
    data: {
      objetivoId: oei05.id, codigo: 'AEI.05.01', orden: 1,
      nombre: 'Optimización de costos operativos y diversificación de fuentes de ingreso',
      departamento: 'ADMINISTRACION',
      responsableId: ID_ADMIN,
    },
  })

  // ── Actividades Operativas (POA 2026) ─────────────────────────────────────
  const act1 = await prisma.actividadOperativa.create({
    data: {
      accionId: aei0101.id, anio: 2026,
      codigo: 'POA-Q-01',
      nombre: 'Adquisición de cromatógrafo de gases con detector de masas (GC-MS)',
      departamento: 'QUIMICA',
      responsableId: ID_ANAYA,
      unidadMedida: 'equipos',
      metaAnual: 1,
      presupuesto: 85000,
      estado: 'EN_CURSO',
    },
  })
  const act2 = await prisma.actividadOperativa.create({
    data: {
      accionId: aei0101.id, anio: 2026,
      codigo: 'POA-B-01',
      nombre: 'Renovación de microscopía de fluorescencia y equipos de cultivo celular',
      departamento: 'BIOLOGIA',
      responsableId: ID_ANAYA,
      unidadMedida: 'equipos',
      metaAnual: 2,
      presupuesto: 42000,
      estado: 'PLANIFICADO',
    },
  })
  const act3 = await prisma.actividadOperativa.create({
    data: {
      accionId: aei0102.id, anio: 2026,
      codigo: 'POA-Q-02',
      nombre: 'Validación de método OECD 107 para nueva matriz de agua residual industrial',
      departamento: 'QUIMICA',
      responsableId: ID_ANAYA,
      unidadMedida: 'métodos validados',
      metaAnual: 2,
      presupuesto: 8500,
      estado: 'EN_CURSO',
    },
  })
  const act4 = await prisma.actividadOperativa.create({
    data: {
      accionId: aei0201.id, anio: 2026,
      codigo: 'POA-CAL-01',
      nombre: 'Auditoría interna de acreditación — revisión de alcance y documentación técnica',
      departamento: 'CALIDAD',
      responsableId: ID_RISCO,
      unidadMedida: 'auditorías',
      metaAnual: 2,
      presupuesto: 3500,
      estado: 'EN_CURSO',
    },
  })
  const act5 = await prisma.actividadOperativa.create({
    data: {
      accionId: aei0202.id, anio: 2026,
      codigo: 'POA-CAL-02',
      nombre: 'Cierre de no conformidades detectadas en auditoría INACAL 2025',
      departamento: 'CALIDAD',
      responsableId: ID_RISCO,
      unidadMedida: 'NC cerradas',
      metaAnual: 8,
      presupuesto: 2000,
      estado: 'EN_CURSO',
    },
  })
  const act6 = await prisma.actividadOperativa.create({
    data: {
      accionId: aei0301.id, anio: 2026,
      codigo: 'POA-ADM-01',
      nombre: 'Participación en ferias y eventos del sector minero-ambiental',
      departamento: 'ADMINISTRACION',
      responsableId: ID_ADMIN,
      unidadMedida: 'eventos',
      metaAnual: 4,
      presupuesto: 12000,
      estado: 'EN_CURSO',
    },
  })
  const act7 = await prisma.actividadOperativa.create({
    data: {
      accionId: aei0401.id, anio: 2026,
      codigo: 'POA-RH-01',
      nombre: 'Programa de capacitación en ecotoxicología acuática avanzada',
      departamento: 'ADMINISTRACION',
      responsableId: ID_CASTILLO,
      unidadMedida: 'horas-capacitación',
      metaAnual: 120,
      presupuesto: 15000,
      estado: 'EN_CURSO',
    },
  })
  const act8 = await prisma.actividadOperativa.create({
    data: {
      accionId: aei0501.id, anio: 2026,
      codigo: 'POA-ADM-02',
      nombre: 'Implementación de tablero de control financiero mensual',
      departamento: 'ADMINISTRACION',
      responsableId: ID_ADMIN,
      unidadMedida: 'reportes',
      metaAnual: 12,
      presupuesto: 4000,
      estado: 'EN_CURSO',
    },
  })

  // ── Seguimientos (meses 1-6 de 2026) ─────────────────────────────────────
  const seguimientosData = [
    // act3: Validación de métodos — 2 en el año, progresando
    { actividadId: act3.id, periodo: 1, metaProgramada: 0, ejecutado: 0, comentario: 'Etapa de diseño experimental en curso' },
    { actividadId: act3.id, periodo: 2, metaProgramada: 0.5, ejecutado: 0.3, comentario: 'Ensayos preliminares iniciados' },
    { actividadId: act3.id, periodo: 3, metaProgramada: 1, ejecutado: 0.8, comentario: 'Primer método en validación final' },
    { actividadId: act3.id, periodo: 4, metaProgramada: 1, ejecutado: 1, comentario: 'Método OECD 107 validado y aprobado' },
    { actividadId: act3.id, periodo: 5, metaProgramada: 1.5, ejecutado: 1, comentario: 'Segundo método en etapa inicial' },
    { actividadId: act3.id, periodo: 6, metaProgramada: 2, ejecutado: 1.5, comentario: 'En proceso de validación' },
    // act4: Auditorías internas — 2 en el año
    { actividadId: act4.id, periodo: 1, metaProgramada: 0, ejecutado: 0 },
    { actividadId: act4.id, periodo: 2, metaProgramada: 0, ejecutado: 0 },
    { actividadId: act4.id, periodo: 3, metaProgramada: 1, ejecutado: 1, comentario: 'Auditoría de primer semestre ejecutada. 3 observaciones menores.' },
    { actividadId: act4.id, periodo: 4, metaProgramada: 1, ejecutado: 1 },
    { actividadId: act4.id, periodo: 5, metaProgramada: 1, ejecutado: 1 },
    { actividadId: act4.id, periodo: 6, metaProgramada: 1, ejecutado: 1 },
    // act5: NC cerradas
    { actividadId: act5.id, periodo: 1, metaProgramada: 2, ejecutado: 2, comentario: 'NC-001 y NC-002 cerradas' },
    { actividadId: act5.id, periodo: 2, metaProgramada: 4, ejecutado: 3, comentario: 'NC-003 pendiente de evidencia' },
    { actividadId: act5.id, periodo: 3, metaProgramada: 5, ejecutado: 5, comentario: 'NC-003 cerrada. NC-004 y NC-005 concluidas.' },
    { actividadId: act5.id, periodo: 4, metaProgramada: 6, ejecutado: 6 },
    { actividadId: act5.id, periodo: 5, metaProgramada: 7, ejecutado: 7, comentario: 'NC-006 y NC-007 cerradas con eficacia verificada' },
    { actividadId: act5.id, periodo: 6, metaProgramada: 8, ejecutado: 8, comentario: 'Todas las NC del ciclo anterior cerradas satisfactoriamente' },
    // act6: Ferias — 4 en el año
    { actividadId: act6.id, periodo: 1, metaProgramada: 0, ejecutado: 0 },
    { actividadId: act6.id, periodo: 2, metaProgramada: 1, ejecutado: 1, comentario: 'Participación en PERUMIN Conecta Lima' },
    { actividadId: act6.id, periodo: 3, metaProgramada: 1, ejecutado: 1 },
    { actividadId: act6.id, periodo: 4, metaProgramada: 2, ejecutado: 1, comentario: 'Evento previsto en mayo reprogramado para agosto' },
    { actividadId: act6.id, periodo: 5, metaProgramada: 2, ejecutado: 2 },
    { actividadId: act6.id, periodo: 6, metaProgramada: 3, ejecutado: 2 },
    // act7: Capacitación — 120 h
    { actividadId: act7.id, periodo: 1, metaProgramada: 10, ejecutado: 8, comentario: 'Taller introductorio de ecotoxicología' },
    { actividadId: act7.id, periodo: 2, metaProgramada: 20, ejecutado: 18 },
    { actividadId: act7.id, periodo: 3, metaProgramada: 30, ejecutado: 32, comentario: 'Curso externo OECD avanzado' },
    { actividadId: act7.id, periodo: 4, metaProgramada: 40, ejecutado: 42 },
    { actividadId: act7.id, periodo: 5, metaProgramada: 55, ejecutado: 55 },
    { actividadId: act7.id, periodo: 6, metaProgramada: 70, ejecutado: 68 },
    // act8: Reportes financieros — 1/mes
    { actividadId: act8.id, periodo: 1, metaProgramada: 1, ejecutado: 1 },
    { actividadId: act8.id, periodo: 2, metaProgramada: 2, ejecutado: 2 },
    { actividadId: act8.id, periodo: 3, metaProgramada: 3, ejecutado: 3 },
    { actividadId: act8.id, periodo: 4, metaProgramada: 4, ejecutado: 4 },
    { actividadId: act8.id, periodo: 5, metaProgramada: 5, ejecutado: 5 },
    { actividadId: act8.id, periodo: 6, metaProgramada: 6, ejecutado: 6, comentario: 'Tablero automatizado operativo desde junio' },
  ]
  await prisma.seguimientoActividad.createMany({ data: seguimientosData })
  console.log('Seguimientos creados:', seguimientosData.length)

  // ── Indicadores KPI ───────────────────────────────────────────────────────
  const kpi1 = await prisma.indicador.create({
    data: {
      objetivoId: oei02.id,
      nombre: 'Porcentaje de métodos acreditados sobre el total disponible',
      formula: '(Métodos acreditados / Total métodos) × 100',
      unidad: '%', sentido: 'ASCENDENTE', frecuencia: 'TRIMESTRAL',
      lineaBase: 68, meta: 82,
      responsableId: ID_RISCO,
    },
  })
  const kpi2 = await prisma.indicador.create({
    data: {
      objetivoId: oei02.id,
      nombre: 'Tiempo promedio de entrega de resultados (días hábiles)',
      formula: 'Suma(días entrega) / N° informes emitidos',
      unidad: 'días', sentido: 'DESCENDENTE', frecuencia: 'MENSUAL',
      lineaBase: 12, meta: 8,
      responsableId: ID_RISCO,
    },
  })
  const kpi3 = await prisma.indicador.create({
    data: {
      objetivoId: oei03.id,
      nombre: 'Índice de satisfacción del cliente',
      formula: 'Promedio de calificaciones en encuesta post-servicio (escala 1-5)',
      unidad: 'escala 1-5', sentido: 'ASCENDENTE', frecuencia: 'TRIMESTRAL',
      lineaBase: 3.8, meta: 4.5,
      responsableId: ID_ADMIN,
    },
  })
  const kpi4 = await prisma.indicador.create({
    data: {
      objetivoId: oei05.id,
      nombre: 'Ingresos totales por servicios analíticos (S/)',
      formula: 'Suma de facturación por ensayos y consultoría',
      unidad: 'S/', sentido: 'ASCENDENTE', frecuencia: 'MENSUAL',
      lineaBase: 285000, meta: 420000,
      responsableId: ID_ADMIN,
    },
  })
  const kpi5 = await prisma.indicador.create({
    data: {
      objetivoId: oei04.id,
      nombre: 'Índice de rotación de personal técnico (%)',
      formula: '(Bajas / Plantilla promedio) × 100',
      unidad: '%', sentido: 'DESCENDENTE', frecuencia: 'TRIMESTRAL',
      lineaBase: 18, meta: 8,
      responsableId: ID_CASTILLO,
    },
  })
  const kpi6 = await prisma.indicador.create({
    data: {
      objetivoId: oei01.id,
      nombre: 'Número de ensayos realizados en el año',
      formula: 'Conteo de informes de ensayo emitidos',
      unidad: 'n°', sentido: 'ASCENDENTE', frecuencia: 'MENSUAL',
      lineaBase: 1240, meta: 1800,
      responsableId: ID_ANAYA,
    },
  })

  // ── Mediciones de KPIs ────────────────────────────────────────────────────
  await prisma.medicionIndicador.createMany({
    data: [
      // kpi1: % métodos acreditados (trimestral → periodos 3, 6, 9, 12)
      { indicadorId: kpi1.id, anio: 2026, periodo: 3, valor: 71, comentario: 'Se incorporaron 2 nuevos métodos acreditados en Q1' },
      { indicadorId: kpi1.id, anio: 2026, periodo: 6, valor: 74, comentario: 'Ampliación de alcance aprobada por INACAL en junio' },
      // kpi2: Tiempo entrega resultados (mensual)
      { indicadorId: kpi2.id, anio: 2026, periodo: 1, valor: 11.5 },
      { indicadorId: kpi2.id, anio: 2026, periodo: 2, valor: 10.8, comentario: 'Mejora en la distribución de cargas entre analistas' },
      { indicadorId: kpi2.id, anio: 2026, periodo: 3, valor: 10.2 },
      { indicadorId: kpi2.id, anio: 2026, periodo: 4, valor: 9.7 },
      { indicadorId: kpi2.id, anio: 2026, periodo: 5, valor: 9.1, comentario: 'Nueva planilla de seguimiento de ODA redujo tiempos' },
      { indicadorId: kpi2.id, anio: 2026, periodo: 6, valor: 8.9 },
      // kpi3: Satisfacción cliente (trimestral)
      { indicadorId: kpi3.id, anio: 2026, periodo: 3, valor: 4.1, comentario: 'Encuesta Q1: 47 respuestas' },
      { indicadorId: kpi3.id, anio: 2026, periodo: 6, valor: 4.3, comentario: 'Encuesta Q2: 52 respuestas. Mejora en comunicación de resultados' },
      // kpi4: Ingresos mensuales (mensual)
      { indicadorId: kpi4.id, anio: 2026, periodo: 1, valor: 32500 },
      { indicadorId: kpi4.id, anio: 2026, periodo: 2, valor: 28900 },
      { indicadorId: kpi4.id, anio: 2026, periodo: 3, valor: 34200, comentario: 'Ingreso de cliente minero Antamina' },
      { indicadorId: kpi4.id, anio: 2026, periodo: 4, valor: 36800 },
      { indicadorId: kpi4.id, anio: 2026, periodo: 5, valor: 39500 },
      { indicadorId: kpi4.id, anio: 2026, periodo: 6, valor: 41200, comentario: 'Récord mensual. Contrato OEFA renovado.' },
      // kpi5: Rotación personal (trimestral)
      { indicadorId: kpi5.id, anio: 2026, periodo: 3, valor: 14, comentario: 'Salida de 2 analistas Q en Q1' },
      { indicadorId: kpi5.id, anio: 2026, periodo: 6, valor: 10, comentario: 'Mejora por implementación de plan de retención' },
      // kpi6: N° ensayos (mensual)
      { indicadorId: kpi6.id, anio: 2026, periodo: 1, valor: 98 },
      { indicadorId: kpi6.id, anio: 2026, periodo: 2, valor: 112 },
      { indicadorId: kpi6.id, anio: 2026, periodo: 3, valor: 124, comentario: 'Incremento por nuevos clientes del sector pesquero' },
      { indicadorId: kpi6.id, anio: 2026, periodo: 4, valor: 131 },
      { indicadorId: kpi6.id, anio: 2026, periodo: 5, valor: 148 },
      { indicadorId: kpi6.id, anio: 2026, periodo: 6, valor: 155, comentario: 'Mayor demanda en análisis de metales pesados' },
    ],
  })
  console.log('Indicadores y mediciones creados')

  // ── Riesgos ───────────────────────────────────────────────────────────────
  await prisma.riesgo.createMany({
    data: [
      {
        objetivoId: oei02.id, codigo: 'R-001',
        descripcion: 'Pérdida o suspensión de la acreditación ISO/IEC 17025 por incumplimiento de requisitos',
        causa: 'Acumulación de no conformidades no atendidas o falla en auditoría de renovación',
        categoria: 'ESTRATEGICO', probabilidad: 2, impacto: 5,
        responsableId: ID_RISCO,
        planMitigacion: 'Auditorías internas semestrales, plan de cierre de NC con seguimiento mensual, simulacros de auditoría externa.',
        estado: 'EN_TRATAMIENTO',
        fechaRevision: new Date('2026-09-30'),
      },
      {
        objetivoId: oei04.id, codigo: 'R-002',
        descripcion: 'Alta rotación de personal técnico especializado en áreas críticas (Química y Biología)',
        causa: 'Remuneraciones por debajo del mercado y falta de plan de carrera',
        categoria: 'OPERATIVO', probabilidad: 3, impacto: 4,
        responsableId: ID_CASTILLO,
        planMitigacion: 'Revisión salarial anual, plan de línea de carrera, bonos por desempeño y retención.',
        estado: 'EN_TRATAMIENTO',
        fechaRevision: new Date('2026-10-31'),
      },
      {
        objetivoId: oei01.id, codigo: 'R-003',
        descripcion: 'Falla o deterioro de equipos analíticos críticos (GC-MS, espectrofotómetros)',
        causa: 'Antigüedad del parque de equipos y falta de mantenimiento preventivo oportuno',
        categoria: 'OPERATIVO', probabilidad: 3, impacto: 4,
        responsableId: ID_ANAYA,
        planMitigacion: 'Plan de mantenimiento preventivo trimestral, contratos de garantía extendida, identificación de equipos de respaldo.',
        estado: 'IDENTIFICADO',
        fechaRevision: new Date('2026-08-31'),
      },
      {
        objetivoId: oei05.id, codigo: 'R-004',
        descripcion: 'Reducción de ingresos por pérdida de contratos institucionales (OEFA, MINAM)',
        causa: 'Cambios en presupuesto de entidades públicas o procesos de licitación adversos',
        categoria: 'FINANCIERO', probabilidad: 2, impacto: 4,
        responsableId: ID_ADMIN,
        planMitigacion: 'Diversificación de la cartera de clientes, anticipación a procesos licitatorios, relaciones con sector privado.',
        estado: 'IDENTIFICADO',
        fechaRevision: new Date('2026-12-31'),
      },
      {
        objetivoId: oei02.id, codigo: 'R-005',
        descripcion: 'Cambios en normativa técnica de acreditación que requieran ajustes costosos',
        causa: 'Publicación de nuevas versiones de normas OECD o ISO sin periodo de transición suficiente',
        categoria: 'CUMPLIMIENTO', probabilidad: 2, impacto: 3,
        responsableId: ID_RISCO,
        planMitigacion: 'Suscripción a alertas normativas, participación en comités técnicos de INACAL.',
        estado: 'IDENTIFICADO',
        fechaRevision: new Date('2026-11-30'),
      },
      {
        codigo: 'R-006',
        descripcion: 'Incidente de seguridad con sustancias químicas peligrosas en el laboratorio',
        causa: 'Incumplimiento de protocolos de seguridad o fallo de EPI',
        categoria: 'OPERATIVO', probabilidad: 1, impacto: 5,
        responsableId: ID_ANAYA,
        planMitigacion: 'Capacitación trimestral en seguridad, inspecciones mensuales, revisión de inventario de reactivos.',
        estado: 'EN_TRATAMIENTO',
        fechaRevision: new Date('2026-07-31'),
      },
      {
        objetivoId: oei03.id, codigo: 'R-007',
        descripcion: 'Surgimiento de competidores con precios significativamente menores',
        causa: 'Entrada de nuevos laboratorios al mercado con inversión subsidiada',
        categoria: 'ESTRATEGICO', probabilidad: 3, impacto: 3,
        responsableId: ID_ADMIN,
        planMitigacion: 'Diferenciación por calidad y acreditación, fidelización de clientes actuales, propuesta de valor basada en confiabilidad.',
        estado: 'IDENTIFICADO',
        fechaRevision: new Date('2026-12-31'),
      },
    ],
  })
  console.log('Riesgos creados')

  // ── Proyectos Estratégicos ─────────────────────────────────────────────────
  const proy1 = await prisma.proyectoEstrategico.create({
    data: {
      objetivoId: oei01.id,
      nombre: 'Implementación de Sistema LIMS (Laboratory Information Management System)',
      descripcion: 'Digitalización completa del flujo de trabajo del laboratorio: recepción de muestras, seguimiento de ensayos, emisión de informes y trazabilidad.',
      sponsorId: ID_ANAYA,
      gerenteId: ID_ADMIN,
      departamento: 'OPERACIONES',
      fechaInicioPlan: new Date('2026-02-01'),
      fechaFinPlan: new Date('2026-11-30'),
      fechaInicioReal: new Date('2026-02-15'),
      presupuesto: 65000,
      avance: 42,
      estado: 'EN_CURSO',
    },
  })
  const proy2 = await prisma.proyectoEstrategico.create({
    data: {
      objetivoId: oei02.id,
      nombre: 'Renovación y ampliación del alcance de acreditación INACAL 2026',
      descripcion: 'Proceso de renovación de la acreditación ISO/IEC 17025 con incorporación de 6 nuevos métodos en el alcance.',
      sponsorId: ID_ANAYA,
      gerenteId: ID_RISCO,
      departamento: 'CALIDAD',
      fechaInicioPlan: new Date('2026-01-15'),
      fechaFinPlan: new Date('2026-09-30'),
      fechaInicioReal: new Date('2026-01-20'),
      presupuesto: 18500,
      avance: 65,
      estado: 'EN_CURSO',
    },
  })
  const proy3 = await prisma.proyectoEstrategico.create({
    data: {
      objetivoId: oei01.id,
      nombre: 'Modernización de la sala de instrumentación analítica',
      descripcion: 'Adquisición e instalación de GC-MS, ICP-OES y equipo de cromatografía iónica. Readecuación de la infraestructura eléctrica y de ventilación.',
      sponsorId: ID_ANAYA,
      gerenteId: ID_ANAYA,
      departamento: 'QUIMICA',
      fechaInicioPlan: new Date('2026-07-01'),
      fechaFinPlan: new Date('2027-02-28'),
      presupuesto: 145000,
      avance: 8,
      estado: 'EN_CURSO',
    },
  })
  const proy4 = await prisma.proyectoEstrategico.create({
    data: {
      objetivoId: oei04.id,
      nombre: 'Programa de Retención y Desarrollo de Talento Técnico',
      descripcion: 'Diseño e implementación de plan de carrera, revisión salarial y esquema de incentivos para personal técnico especializado.',
      sponsorId: ID_ADMIN,
      gerenteId: ID_CASTILLO,
      departamento: 'ADMINISTRACION',
      fechaInicioPlan: new Date('2026-03-01'),
      fechaFinPlan: new Date('2026-12-31'),
      fechaInicioReal: new Date('2026-03-15'),
      presupuesto: 28000,
      avance: 30,
      estado: 'EN_CURSO',
    },
  })

  // ── Hitos de proyectos ────────────────────────────────────────────────────
  await prisma.hitoProyecto.createMany({
    data: [
      // LIMS
      { proyectoId: proy1.id, orden: 1, nombre: 'Licitación y selección de proveedor LIMS', fechaPlan: new Date('2026-03-31'), fechaReal: new Date('2026-03-28'), completado: true },
      { proyectoId: proy1.id, orden: 2, nombre: 'Instalación y configuración del sistema base', fechaPlan: new Date('2026-05-31'), fechaReal: new Date('2026-06-10'), completado: true },
      { proyectoId: proy1.id, orden: 3, nombre: 'Capacitación del personal en el LIMS', fechaPlan: new Date('2026-07-31'), completado: false },
      { proyectoId: proy1.id, orden: 4, nombre: 'Puesta en marcha en módulo de Química', fechaPlan: new Date('2026-09-30'), completado: false },
      { proyectoId: proy1.id, orden: 5, nombre: 'Integración completa y go-live en todos los departamentos', fechaPlan: new Date('2026-11-30'), completado: false },
      // Acreditación
      { proyectoId: proy2.id, orden: 1, nombre: 'Revisión y actualización de documentación técnica', fechaPlan: new Date('2026-03-31'), fechaReal: new Date('2026-03-25'), completado: true },
      { proyectoId: proy2.id, orden: 2, nombre: 'Validación de los 6 métodos nuevos propuestos', fechaPlan: new Date('2026-05-31'), fechaReal: new Date('2026-06-05'), completado: true },
      { proyectoId: proy2.id, orden: 3, nombre: 'Auditoría interna de preparación', fechaPlan: new Date('2026-07-15'), completado: false },
      { proyectoId: proy2.id, orden: 4, nombre: 'Evaluación de INACAL (auditoría externa)', fechaPlan: new Date('2026-08-31'), completado: false },
      { proyectoId: proy2.id, orden: 5, nombre: 'Recepción de certificado de acreditación renovado', fechaPlan: new Date('2026-09-30'), completado: false },
      // Modernización sala
      { proyectoId: proy3.id, orden: 1, nombre: 'Expediente técnico y aprobación de presupuesto', fechaPlan: new Date('2026-07-31'), completado: false },
      { proyectoId: proy3.id, orden: 2, nombre: 'Readecuación de infraestructura', fechaPlan: new Date('2026-10-31'), completado: false },
      { proyectoId: proy3.id, orden: 3, nombre: 'Recepción e instalación de equipos', fechaPlan: new Date('2026-12-31'), completado: false },
      { proyectoId: proy3.id, orden: 4, nombre: 'Calificación de equipos y puesta en operación', fechaPlan: new Date('2027-02-28'), completado: false },
      // Talento
      { proyectoId: proy4.id, orden: 1, nombre: 'Diagnóstico de brechas salariales y de competencias', fechaPlan: new Date('2026-04-30'), fechaReal: new Date('2026-04-28'), completado: true },
      { proyectoId: proy4.id, orden: 2, nombre: 'Diseño del plan de carrera por puesto crítico', fechaPlan: new Date('2026-06-30'), fechaReal: new Date('2026-07-05'), completado: true },
      { proyectoId: proy4.id, orden: 3, nombre: 'Implementación del esquema de incentivos', fechaPlan: new Date('2026-09-30'), completado: false },
      { proyectoId: proy4.id, orden: 4, nombre: 'Primera evaluación de desempeño bajo el nuevo modelo', fechaPlan: new Date('2026-12-15'), completado: false },
    ],
  })
  console.log('Proyectos e hitos creados')

  // ── Acciones de Mejora (CAPA) ─────────────────────────────────────────────
  await prisma.accionMejora.createMany({
    data: [
      {
        codigo: 'CAPA-001',
        origen: 'AUDITORIA',
        descripcion: 'Ruptura de cadena de custodia en muestras de agua — identificación de muestra faltante en lote ENE-2026-044',
        causaRaiz: 'Proceso de rotulado manual propenso a error humano; falta de doble verificación en recepción',
        accion: 'Implementar código QR para identificación de muestras y validación en LIMS. Actualizar procedimiento de recepción con firma doble.',
        departamento: 'CALIDAD',
        responsableId: ID_RISCO,
        fechaCompromiso: new Date('2026-04-30'),
        fechaCierre: new Date('2026-04-25'),
        estado: 'CERRADA',
        eficaciaVerificada: true,
      },
      {
        codigo: 'CAPA-002',
        origen: 'NO_CONFORMIDAD',
        descripcion: 'Calibración de balanzas analíticas fuera de los intervalos establecidos en procedimiento interno',
        causaRaiz: 'No se realizó la calibración semestral programada por falta de reactivos de referencia certificados',
        accion: 'Reprogramar calibración inmediata. Establecer inventario mínimo de patrones de calibración. Incluir verificación en check-list mensual.',
        departamento: 'QUIMICA',
        responsableId: ID_ANAYA,
        fechaCompromiso: new Date('2026-05-15'),
        fechaCierre: new Date('2026-05-12'),
        estado: 'CERRADA',
        eficaciaVerificada: true,
      },
      {
        codigo: 'CAPA-003',
        origen: 'SUGERENCIA',
        descripcion: 'Optimización del proceso de revisión y emisión de informes de ensayo — tiempos superiores al objetivo',
        causaRaiz: 'Cuello de botella en la revisión por parte de un único analista senior; proceso manual de generación de informes',
        accion: 'Redistribuir la revisión entre 2 analistas senior certificados. Implementar plantilla automática en LIMS para reducir tiempo de edición.',
        departamento: 'CALIDAD',
        responsableId: ID_RISCO,
        fechaCompromiso: new Date('2026-07-31'),
        estado: 'EN_PROCESO',
        eficaciaVerificada: false,
      },
      {
        codigo: 'CAPA-004',
        origen: 'REVISION_DIRECCION',
        descripcion: 'Deficiencia en competencias del personal nuevo en técnicas de cromatografía avanzada',
        causaRaiz: 'Plan de inducción insuficiente para el dominio de equipos GC-MS; falta de mentoría estructurada',
        accion: 'Diseñar programa de inducción técnica de 60 días con evaluación. Asignar analista senior como mentor durante los primeros 3 meses.',
        departamento: 'QUIMICA',
        responsableId: ID_ANAYA,
        fechaCompromiso: new Date('2026-08-31'),
        estado: 'EN_PROCESO',
        eficaciaVerificada: false,
      },
      {
        codigo: 'CAPA-005',
        origen: 'AUDITORIA',
        descripcion: 'Registros de temperatura de cámaras de incubación no firmados en 3 semanas del trimestre',
        causaRaiz: 'Falta de cultura de registro; responsabilidad no claramente asignada en turno tarde',
        accion: 'Asignar responsabilidad nominal por turno. Digitalizar registro de temperatura con alerta automática por omisión.',
        departamento: 'BIOLOGIA',
        responsableId: ID_ANAYA,
        fechaCompromiso: new Date('2026-06-30'),
        fechaCierre: new Date('2026-06-28'),
        estado: 'CERRADA',
        eficaciaVerificada: false,
      },
      {
        codigo: 'CAPA-006',
        origen: 'RIESGO',
        descripcion: 'Procedimiento de gestión de sustancias peligrosas desactualizado — última revisión hace 3 años',
        causaRaiz: 'Falta de proceso formal de revisión periódica de documentos; cambios normativos no incorporados',
        accion: 'Actualizar procedimiento con nueva normativa GHS. Implementar ciclo de revisión anual en calendario de calidad.',
        departamento: 'CALIDAD',
        responsableId: ID_RISCO,
        fechaCompromiso: new Date('2026-09-30'),
        estado: 'ABIERTA',
        eficaciaVerificada: false,
      },
    ],
  })
  console.log('Acciones de mejora (CAPA) creadas')

  // ══════════════════════════════════════════════════════════════════════════
  // CONTABILIDAD Y FINANZAS
  // ══════════════════════════════════════════════════════════════════════════

  // ── Centros de Costo ──────────────────────────────────────────────────────
  const cc_quim = await prisma.centroCosto.create({
    data: { codigo: 'CC-QUIM', nombre: 'Química Analítica', departamento: 'QUIMICA', responsableId: ID_ANAYA },
  })
  const cc_bio = await prisma.centroCosto.create({
    data: { codigo: 'CC-BIO', nombre: 'Biología y Ecotoxicología', departamento: 'BIOLOGIA', responsableId: ID_ANAYA },
  })
  const cc_micro = await prisma.centroCosto.create({
    data: { codigo: 'CC-MICRO', nombre: 'Microbiología', departamento: 'MICROBIOLOGIA', responsableId: ID_ANAYA },
  })
  const cc_adm = await prisma.centroCosto.create({
    data: { codigo: 'CC-ADM', nombre: 'Administración y Finanzas', departamento: 'ADMINISTRACION', responsableId: ID_ADMIN },
  })
  const cc_cal = await prisma.centroCosto.create({
    data: { codigo: 'CC-CAL', nombre: 'Calidad y Acreditación', departamento: 'CALIDAD', responsableId: ID_RISCO },
  })
  const cc_gen = await prisma.centroCosto.create({
    data: { codigo: 'CC-GEN', nombre: 'Gerencia General', responsableId: ID_ANAYA },
  })

  console.log('Centros de costo creados')

  // ── Partidas Presupuestales 2026 ──────────────────────────────────────────
  // INGRESOS
  const ing1 = await prisma.partidaPresupuestal.create({
    data: { anio: 2026, tipo: 'INGRESO', centroCostoId: cc_quim.id, categoria: 'Servicios analíticos', concepto: 'Ensayos fisicoquímicos y de metales' },
  })
  const ing2 = await prisma.partidaPresupuestal.create({
    data: { anio: 2026, tipo: 'INGRESO', centroCostoId: cc_bio.id, categoria: 'Servicios analíticos', concepto: 'Ensayos ecotoxicológicos (OECD/ISO)' },
  })
  const ing3 = await prisma.partidaPresupuestal.create({
    data: { anio: 2026, tipo: 'INGRESO', centroCostoId: cc_micro.id, categoria: 'Servicios analíticos', concepto: 'Ensayos microbiológicos y de control' },
  })
  const ing4 = await prisma.partidaPresupuestal.create({
    data: { anio: 2026, tipo: 'INGRESO', centroCostoId: cc_adm.id, categoria: 'Consultoría', concepto: 'Consultoría técnica y gestión ambiental' },
  })
  const ing5 = await prisma.partidaPresupuestal.create({
    data: { anio: 2026, tipo: 'INGRESO', centroCostoId: cc_adm.id, categoria: 'Otros ingresos', concepto: 'Alquiler de sala de capacitación y otros' },
  })

  // EGRESOS
  const eg1 = await prisma.partidaPresupuestal.create({
    data: { anio: 2026, tipo: 'EGRESO', centroCostoId: cc_quim.id, categoria: 'Personal', concepto: 'Remuneraciones personal Química' },
  })
  const eg2 = await prisma.partidaPresupuestal.create({
    data: { anio: 2026, tipo: 'EGRESO', centroCostoId: cc_bio.id, categoria: 'Personal', concepto: 'Remuneraciones personal Biología' },
  })
  const eg3 = await prisma.partidaPresupuestal.create({
    data: { anio: 2026, tipo: 'EGRESO', centroCostoId: cc_micro.id, categoria: 'Personal', concepto: 'Remuneraciones personal Microbiología' },
  })
  const eg4 = await prisma.partidaPresupuestal.create({
    data: { anio: 2026, tipo: 'EGRESO', centroCostoId: cc_adm.id, categoria: 'Personal', concepto: 'Remuneraciones Administración y Gerencia' },
  })
  const eg5 = await prisma.partidaPresupuestal.create({
    data: { anio: 2026, tipo: 'EGRESO', centroCostoId: cc_quim.id, categoria: 'Reactivos y materiales', concepto: 'Reactivos químicos y estándares de referencia' },
  })
  const eg6 = await prisma.partidaPresupuestal.create({
    data: { anio: 2026, tipo: 'EGRESO', centroCostoId: cc_bio.id, categoria: 'Reactivos y materiales', concepto: 'Organismos de prueba y medios de cultivo' },
  })
  const eg7 = await prisma.partidaPresupuestal.create({
    data: { anio: 2026, tipo: 'EGRESO', centroCostoId: cc_gen.id, categoria: 'Servicios básicos', concepto: 'Electricidad, agua y gas' },
  })
  const eg8 = await prisma.partidaPresupuestal.create({
    data: { anio: 2026, tipo: 'EGRESO', centroCostoId: cc_cal.id, categoria: 'Calibración y acreditación', concepto: 'Calibración de equipos y tasas INACAL' },
  })
  const eg9 = await prisma.partidaPresupuestal.create({
    data: { anio: 2026, tipo: 'EGRESO', centroCostoId: cc_gen.id, categoria: 'Mantenimiento', concepto: 'Mantenimiento preventivo de equipos e infraestructura' },
  })
  const eg10 = await prisma.partidaPresupuestal.create({
    data: { anio: 2026, tipo: 'EGRESO', centroCostoId: cc_adm.id, categoria: 'Administrativos', concepto: 'Honorarios profesionales y servicios externos' },
  })

  console.log('Partidas presupuestales creadas')

  // ── Líneas de Presupuesto (planificado vs ejecutado por mes) ──────────────
  // Helper: presupuesto mensual uniforme con variación realista
  function lineas(
    partidaId: string,
    planMes: number[],  // arreglo de 12 valores planificados
    ejeMes: number[],   // arreglo de 12 valores ejecutados (0 = no disponible aún)
  ) {
    return Array.from({ length: 12 }, (_, i) => ({
      partidaId,
      periodo: i + 1,
      planificado: planMes[i] ?? 0,
      ejecutado: ejeMes[i] ?? 0,
    }))
  }

  const lineasData = [
    // INGRESOS
    ...lineas(ing1.id,
      [28000,26000,30000,32000,34000,36000,38000,36000,34000,32000,30000,28000],
      [29500,25800,31200,33800,36100,38500,0,0,0,0,0,0]),
    ...lineas(ing2.id,
      [8000,7500,9000,9500,10000,10500,11000,10500,10000,9500,9000,8500],
      [7800,7200,9100,9800,10200,11000,0,0,0,0,0,0]),
    ...lineas(ing3.id,
      [4000,3800,4200,4500,4800,5000,5200,5000,4800,4500,4200,4000],
      [3900,3700,4300,4600,4900,5100,0,0,0,0,0,0]),
    ...lineas(ing4.id,
      [2500,2000,2500,3000,3500,3500,4000,3500,3000,2500,2000,2000],
      [2200,1800,2800,3200,3800,4000,0,0,0,0,0,0]),
    ...lineas(ing5.id,
      [800,800,800,800,800,800,800,800,800,800,800,800],
      [1000,600,900,700,800,900,0,0,0,0,0,0]),
    // EGRESOS — personal
    ...lineas(eg1.id,
      [12000,12000,12000,12000,12000,12000,12000,12000,12000,12000,12000,12000],
      [12000,12000,12000,12000,12000,12000,0,0,0,0,0,0]),
    ...lineas(eg2.id,
      [7500,7500,7500,7500,7500,7500,7500,7500,7500,7500,7500,7500],
      [7500,7500,7500,7500,7500,7500,0,0,0,0,0,0]),
    ...lineas(eg3.id,
      [5500,5500,5500,5500,5500,5500,5500,5500,5500,5500,5500,5500],
      [5500,5500,5500,5500,5500,5500,0,0,0,0,0,0]),
    ...lineas(eg4.id,
      [14000,14000,14000,14000,14000,14000,14000,14000,14000,14000,14000,14000],
      [14000,14000,14000,14000,14000,14000,0,0,0,0,0,0]),
    // EGRESOS — reactivos
    ...lineas(eg5.id,
      [3500,3200,4000,3800,4200,4500,4800,4500,4200,3800,3500,3200],
      [3800,3100,4100,3900,4400,4700,0,0,0,0,0,0]),
    ...lineas(eg6.id,
      [1800,1700,2000,2000,2200,2300,2400,2200,2000,1900,1800,1700],
      [1700,1600,2100,2100,2300,2400,0,0,0,0,0,0]),
    // EGRESOS — servicios
    ...lineas(eg7.id,
      [2200,2200,2200,2200,2200,2200,2200,2200,2200,2200,2200,2200],
      [2350,2180,2290,2240,2310,2270,0,0,0,0,0,0]),
    ...lineas(eg8.id,
      [500,500,500,500,500,3500,500,500,500,500,500,500],
      [480,490,510,520,490,3600,0,0,0,0,0,0]),
    ...lineas(eg9.id,
      [1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200],
      [950,1350,1100,1300,1150,1050,0,0,0,0,0,0]),
    ...lineas(eg10.id,
      [3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000,3000],
      [2800,3100,2900,3200,2950,3100,0,0,0,0,0,0]),
  ]
  await prisma.lineaPresupuesto.createMany({ data: lineasData })
  console.log('Líneas de presupuesto creadas:', lineasData.length)

  // ── Rentabilidad por cliente ──────────────────────────────────────────────
  await prisma.registroRentabilidad.createMany({
    data: [
      // Ene–Jun 2026
      { anio: 2026, periodo: 1, clienteNombre: 'Compañía Minera Antamina S.A.', servicio: 'Análisis de metales pesados en efluentes', ingreso: 12500, costoDirecto: 5200, costoIndirecto: 1800 },
      { anio: 2026, periodo: 1, clienteNombre: 'OEFA — Organismo de Evaluación Fiscalización Ambiental', servicio: 'Ensayos ecotoxicológicos OECD 201/202', ingreso: 8400, costoDirecto: 3600, costoIndirecto: 1200 },
      { anio: 2026, periodo: 1, clienteNombre: 'Pesquera Exalmar S.A.A.', servicio: 'Control microbiológico de producto terminado', ingreso: 4200, costoDirecto: 1800, costoIndirecto: 650 },
      { anio: 2026, periodo: 2, clienteNombre: 'Compañía Minera Antamina S.A.', servicio: 'Análisis de metales pesados en efluentes', ingreso: 11800, costoDirecto: 5000, costoIndirecto: 1750 },
      { anio: 2026, periodo: 2, clienteNombre: 'OEFA — Organismo de Evaluación Fiscalización Ambiental', servicio: 'Ensayos ecotoxicológicos OECD 201/202', ingreso: 7200, costoDirecto: 3100, costoIndirecto: 1050 },
      { anio: 2026, periodo: 2, clienteNombre: 'Inkabor S.A.C.', servicio: 'Caracterización fisicoquímica de productos industriales', ingreso: 5600, costoDirecto: 2100, costoIndirecto: 780 },
      { anio: 2026, periodo: 3, clienteNombre: 'Compañía Minera Antamina S.A.', servicio: 'Análisis de metales pesados en efluentes', ingreso: 13200, costoDirecto: 5500, costoIndirecto: 1900 },
      { anio: 2026, periodo: 3, clienteNombre: 'OEFA — Organismo de Evaluación Fiscalización Ambiental', servicio: 'Ensayos ecotoxicológicos OECD 201/202', ingreso: 9100, costoDirecto: 3900, costoIndirecto: 1300 },
      { anio: 2026, periodo: 3, clienteNombre: 'Pesquera Exalmar S.A.A.', servicio: 'Control microbiológico de producto terminado', ingreso: 4500, costoDirecto: 1900, costoIndirecto: 680 },
      { anio: 2026, periodo: 3, clienteNombre: 'Inkabor S.A.C.', servicio: 'Caracterización fisicoquímica de productos industriales', ingreso: 6200, costoDirecto: 2300, costoIndirecto: 850 },
      { anio: 2026, periodo: 4, clienteNombre: 'Compañía Minera Antamina S.A.', servicio: 'Análisis de metales pesados en efluentes', ingreso: 14000, costoDirecto: 5800, costoIndirecto: 2000 },
      { anio: 2026, periodo: 4, clienteNombre: 'OEFA — Organismo de Evaluación Fiscalización Ambiental', servicio: 'Ensayos ecotoxicológicos OECD 201/202', ingreso: 9800, costoDirecto: 4200, costoIndirecto: 1400 },
      { anio: 2026, periodo: 4, clienteNombre: 'Municipalidad de Lima', servicio: 'Análisis de calidad de agua potable', ingreso: 7500, costoDirecto: 3200, costoIndirecto: 1100 },
      { anio: 2026, periodo: 4, clienteNombre: 'Inkabor S.A.C.', servicio: 'Caracterización fisicoquímica de productos industriales', ingreso: 5800, costoDirecto: 2200, costoIndirecto: 800 },
      { anio: 2026, periodo: 5, clienteNombre: 'Compañía Minera Antamina S.A.', servicio: 'Análisis de metales pesados en efluentes', ingreso: 15200, costoDirecto: 6200, costoIndirecto: 2100 },
      { anio: 2026, periodo: 5, clienteNombre: 'OEFA — Organismo de Evaluación Fiscalización Ambiental', servicio: 'Ensayos ecotoxicológicos OECD 201/202', ingreso: 10500, costoDirecto: 4500, costoIndirecto: 1500 },
      { anio: 2026, periodo: 5, clienteNombre: 'Municipalidad de Lima', servicio: 'Análisis de calidad de agua potable', ingreso: 8200, costoDirecto: 3500, costoIndirecto: 1200 },
      { anio: 2026, periodo: 5, clienteNombre: 'Pesquera Exalmar S.A.A.', servicio: 'Control microbiológico de producto terminado', ingreso: 4800, costoDirecto: 2000, costoIndirecto: 700 },
      { anio: 2026, periodo: 6, clienteNombre: 'Compañía Minera Antamina S.A.', servicio: 'Análisis de metales pesados en efluentes', ingreso: 16800, costoDirecto: 6800, costoIndirecto: 2300 },
      { anio: 2026, periodo: 6, clienteNombre: 'OEFA — Organismo de Evaluación Fiscalización Ambiental', servicio: 'Ensayos ecotoxicológicos OECD 201/202', ingreso: 11200, costoDirecto: 4800, costoIndirecto: 1600, comentario: 'Contrato renovado por 12 meses adicionales' },
      { anio: 2026, periodo: 6, clienteNombre: 'Municipalidad de Lima', servicio: 'Análisis de calidad de agua potable', ingreso: 8900, costoDirecto: 3800, costoIndirecto: 1300 },
      { anio: 2026, periodo: 6, clienteNombre: 'Inkabor S.A.C.', servicio: 'Caracterización fisicoquímica de productos industriales', ingreso: 7100, costoDirecto: 2700, costoIndirecto: 950 },
    ],
  })
  console.log('Registros de rentabilidad creados')

  console.log('\n✅ Seed de Gerencia completado exitosamente.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
