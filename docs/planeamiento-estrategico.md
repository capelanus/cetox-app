# Módulo de Planeamiento Estratégico y Control Gerencial

Documentación funcional del módulo **Gerencia → Planeamiento Estratégico** del ERP CETOX
(cetoxlab.tech). Describe cada sección, cómo funciona, qué datos maneja y cómo se
conectan entre sí.

---

## 1. Visión general

El módulo digitaliza el ciclo de **planeamiento y control gerencial** siguiendo el marco
CEPLAN (PEI/POA), más gestión de indicadores, riesgos, proyectos y mejora continua.
La lógica de arriba hacia abajo es:

```
PEI  (Plan Estratégico Institucional, plurianual)
 └─ OEI  Objetivo Estratégico Institucional      → mide con KPIs
     └─ AEI  Acción Estratégica Institucional
         └─ Actividad Operativa (POA, anual, por departamento)  → seguimiento mensual

En paralelo, colgando de los objetivos:
   Indicadores (KPIs) · Riesgos · Proyectos · Acciones de Mejora
Todo se consolida en el → Dashboard Gerencial
```

### Acceso y permisos
Pueden ver y editar todo el módulo los roles:
- **Gerente General**
- **Gerente Técnico**
- **Dirección Lab. y Calidad** (DIRECTOR_CALIDAD)
- **Dirección Adm. y Finanzas** (DIRECTOR_ADMINISTRACION)
- **Super Admin**

Aparece en el sidebar como la sección **"Planeamiento Estratégico"** con 7 entradas.

### Rutas
| Sección | Ruta |
|---|---|
| Dashboard Gerencial | `/gerencia/dashboard` |
| Plan Estratégico (PEI) | `/gerencia/pei` |
| Plan Operativo (POA) | `/gerencia/poa` |
| Indicadores (KPIs) | `/gerencia/indicadores` |
| Riesgos | `/gerencia/riesgos` |
| Proyectos | `/gerencia/proyectos` |
| Acciones de Mejora | `/gerencia/mejoras` |

---

## 2. Plan Estratégico (PEI) — `/gerencia/pei`

Es el punto de partida: define el plan plurianual y su árbol de objetivos.

### Cómo funciona
1. **Si no hay plan activo**, la pantalla muestra un onboarding con el botón *Crear PEI*.
   Se define: nombre (ej. "PEI 2026–2030"), año inicio, año fin, **visión** y **misión**.
2. Con el plan creado, se muestra la **visión/misión** en tarjetas y debajo el árbol de
   **Objetivos Estratégicos (OEI)**.
3. Cada **OEI** se agrega con: código (ej. `OEI.01`), nombre, descripción, departamento
   (o "Institucional" si aplica a toda la organización) y responsable.
4. Dentro de cada OEI se despliegan sus **Acciones Estratégicas (AEI)**: código
   (ej. `AEI.01.01`), nombre, departamento y responsable.
5. Todo es plegable/desplegable; se puede editar o eliminar cualquier nivel.

### Puntos clave
- El **responsable** se elige de la lista de usuarios activos del sistema.
- Los OEI/AEI son la columna vertebral: el POA, los KPIs, los riesgos y los proyectos se
  enlazan a ellos.
- Eliminar un OEI elimina en cascada sus AEI (y desvincula lo que dependa de él).

---

## 3. Plan Operativo (POA) — `/gerencia/poa`

Baja la estrategia a **actividades operativas anuales por departamento**, con seguimiento
mensual de ejecución.

### Cómo funciona
1. Selector de **año** (año anterior / actual / siguiente) en la parte superior.
2. Botón **"Actividad"** para crear una actividad operativa. Requiere:
   - **Acción estratégica (AEI)** a la que pertenece (por eso el PEI debe existir primero).
   - Nombre, departamento, responsable.
   - **Unidad de medida** (ej. "informes", "capacitaciones"), **meta anual**, presupuesto (opcional).
3. Las actividades se **agrupan por departamento** (Química, Biología, Microbiología,
   Calidad, Administración, Operaciones, Gerencia).
4. Cada actividad muestra una **barra de avance** semaforizada. Al desplegarla aparece la
   **grilla mensual** (Ene–Dic) con dos filas:
   - **Meta** (programado por mes)
   - **Real** (ejecutado por mes)
   Los valores **se guardan automáticamente al salir de cada celda** (onBlur).

### Cálculo del avance
```
avance (%) = (suma de ejecutado en los 12 meses / meta anual) × 100
```
El color de la barra depende del avance:
- **Verde** ≥ 90 %
- **Ámbar** 70 – 89 %
- **Rojo** < 70 %
- **Gris** si no hay meta definida

### Estados de la actividad
`Planificado · En curso · Completado · Cancelado` (editable).

---

## 4. Indicadores (KPIs) — `/gerencia/indicadores`

Gestión de indicadores de gestión con mediciones periódicas y semáforos de cumplimiento.

### Cómo funciona
1. Panel superior con **conteo de semáforos**: cuántos KPIs están En meta / En riesgo /
   Críticos / Sin datos.
2. Botón **"Indicador"** para crear un KPI con:
   - Nombre y **fórmula de cálculo** (ej. "(informes a tiempo / informes totales) × 100").
   - **Objetivo (OEI)** asociado y departamento.
   - **Sentido**: *Ascendente* (mayor es mejor) o *Descendente* (menor es mejor).
   - **Frecuencia**: Mensual / Trimestral / Anual.
   - **Unidad** (ej. "%"), **línea base**, **meta**, responsable.
3. Cada KPI muestra su **último valor medido**, el **% de cumplimiento** vs. meta y un
   semáforo. Al desplegarlo aparece la **grilla mensual** para registrar el valor de cada
   mes (se guarda al salir de la celda). Cada celda se colorea según su cumplimiento.

### Cálculo del cumplimiento
Depende del **sentido** del indicador:
```
ASCENDENTE (mayor mejor):   cumplimiento = (valor / meta) × 100
DESCENDENTE (menor mejor):  cumplimiento = (meta / valor) × 100
```
Semáforo: **Verde** ≥ 90 % · **Ámbar** 70–89 % · **Rojo** < 70 % · **Gris** sin datos.

> Ejemplo: un KPI de "días de demora" con meta 5 y sentido *Descendente*: si el valor real
> es 4 días, cumplimiento = 5/4 = 125 % (verde, porque tardó menos de la meta).

---

## 5. Riesgos — `/gerencia/riesgos`

Gestión de riesgos con **matriz de calor** probabilidad × impacto.

### Cómo funciona
1. A la izquierda, la **matriz de calor 5×5**: filas = probabilidad (5 arriba), columnas =
   impacto. Cada celda muestra cuántos riesgos activos caen en ella y su color según nivel.
   **Al hacer clic en una celda** se filtra la lista de riesgos de esa combinación.
2. A la derecha, la **lista de riesgos**. Botón **"Riesgo"** para crear uno con:
   - Código, descripción, causa, **categoría** (Estratégico, Operativo, Financiero,
     Cumplimiento, Tecnológico).
   - **Probabilidad (1–5)** e **Impacto (1–5)** → el modal calcula el nivel en vivo.
   - Departamento, responsable, **plan de mitigación**, estado.
3. Cada ficha muestra el nivel (badge de color), P·I, categoría, estado y responsable.

### Cálculo del nivel de riesgo
```
puntaje = probabilidad × impacto   (rango 1–25)

puntaje ≥ 15 → Crítico   (rojo)
puntaje ≥ 9  → Alto      (naranja)
puntaje ≥ 4  → Medio     (ámbar)
puntaje < 4  → Bajo      (verde)
```

### Estados
`Identificado · En tratamiento · Mitigado · Materializado`.
Los riesgos **Mitigados** no cuentan como activos (no aparecen en la matriz ni en los
conteos de "activos/críticos").

---

## 6. Proyectos — `/gerencia/proyectos`

Portafolio de **proyectos estratégicos** con hitos.

### Cómo funciona
1. Cabecera con conteo: total · en curso · completados.
2. Botón **"Proyecto"** para crear uno con:
   - Nombre, descripción, **objetivo (OEI)** asociado, departamento.
   - **Sponsor** y **gerente de proyecto** (usuarios del sistema).
   - Fechas planificadas de inicio y fin, presupuesto, **% de avance**, estado.
3. Cada proyecto muestra su estado (badge de color), rango de fechas, gerente, conteo de
   hitos y una **barra de avance**.
4. Al desplegar el proyecto se ven sus **hitos**: se marcan como completados con un clic
   (registra la fecha real), se agregan escribiendo en el campo inferior y se eliminan.

### Estados y colores
`Planificado (gris) · En curso (azul) · En pausa (ámbar) · Completado (verde) · Cancelado (gris claro)`.

Un proyecto se considera **atrasado** (y salta como alerta en el dashboard) si su fecha de
fin planificada ya pasó y no está Completado ni Cancelado.

---

## 7. Acciones de Mejora (CAPA) — `/gerencia/mejoras`

Gestión de acciones correctivas/preventivas, cerrando el ciclo de mejora continua.

### Cómo funciona
1. Cabecera con conteo: abiertas · vencidas. Filtros rápidos: Todas / Abierta / En proceso /
   Cerrada.
2. Botón **"Acción"** para crear una con:
   - Código y **origen**: Auditoría, Riesgo, **Sugerencia de cliente**, No conformidad,
     Revisión por dirección, u Otro.
   - Si el origen es *Auditoría*, se puede enlazar a una **auditoría** existente del sistema.
   - Descripción del hallazgo, **análisis de causa raíz**, **acción correctiva/preventiva**.
   - Departamento, responsable, **fecha de compromiso**.
   - En edición: fecha de cierre, estado y casilla **"Eficacia verificada"**.
3. Cada ficha muestra estado (badge), origen, responsable y la fecha de compromiso. Si la
   fecha de compromiso ya pasó y no está cerrada, se marca en **rojo como vencida**.

### Integración
Este módulo conecta con dos áreas ya existentes del ERP:
- **Auditorías**: una acción de mejora puede originarse y enlazarse a una auditoría.
- **Sugerencias de cliente**: el origen "Sugerencia de cliente" permite trazar mejoras a
  partir del formulario público de sugerencias.

---

## 8. Dashboard Gerencial — `/gerencia/dashboard`

Consolida todo el módulo en tiempo real para la toma de decisiones.

### Qué muestra
- **4 indicadores grandes**: Avance POA global, KPIs en meta, Riesgos activos (y críticos),
  Mejoras abiertas (y vencidas). Cada uno es un enlace directo a su sección.
- **Alertas prioritarias**: lista consolidada de lo más urgente, con enlace directo:
  - KPIs en rojo
  - Riesgos críticos
  - Acciones de mejora vencidas
  - Proyectos atrasados
  - Auditorías próximas (siguientes 60 días)
- **Estado de indicadores**: barras por semáforo (en meta / en riesgo / crítico / sin datos).
- **Avance POA por departamento**: barra de avance por cada área con actividades.
- **Mapa de riesgos**: matriz de calor compacta + top riesgos altos/críticos.
- **Portafolio de proyectos**: conteo por estado + proyectos atrasados.
- **Auditorías próximas** (60 días).

### Cálculos del dashboard
- **Avance POA global** = promedio de los avances por departamento.
- **Avance por departamento** = promedio de los avances de sus actividades (con meta > 0).
- **KPIs**: se toma la última medición del año de cada indicador y se calcula su semáforo.
- **Riesgos**: solo los activos (no mitigados) alimentan la matriz y los conteos.

---

## 9. Cómo empezar (flujo recomendado)

1. **Plan Estratégico**: crear el PEI (visión/misión, periodo), luego los OEI y sus AEI.
2. **Indicadores**: definir los KPIs y asociarlos a los OEI; registrar mediciones mes a mes.
3. **Plan Operativo**: crear las actividades del año por departamento (enlazadas a las AEI) y
   cargar meta/ejecución mensual.
4. **Riesgos** y **Proyectos**: registrar y dar seguimiento.
5. **Acciones de Mejora**: abrir CAPA desde auditorías, riesgos o sugerencias.
6. **Dashboard Gerencial**: revisar el consolidado y las alertas.

---

## 10. Notas técnicas (para el equipo de desarrollo)

- **Modelos Prisma** (11): `PlanEstrategico`, `ObjetivoEstrategico`, `AccionEstrategica`,
  `ActividadOperativa`, `SeguimientoActividad`, `Indicador`, `MedicionIndicador`, `Riesgo`,
  `ProyectoEstrategico`, `HitoProyecto`, `AccionMejora`.
- Los campos `responsableId` / `sponsorId` / `gerenteId` / `auditoriaId` se guardan como
  **String plano (sin relación Prisma a Usuario/Auditoria)** y se resuelven a nombre en la
  app, para no acoplar el modelo `Usuario`.
- **Lógica compartida** (semáforos, niveles de riesgo, cálculos): `src/lib/planeamiento.ts`.
- **Server actions** (CRUD): `src/app/actions/planeamiento.ts`.
- **Kit de UI** (modales, campos, subida de archivos): `src/components/planeamiento/kit.tsx`.
  El `Modal` se renderiza vía **portal a `document.body`** para no ser recortado por la
  animación de página (que aplica `transform`).
- Los seguimientos mensuales (POA e Indicadores) usan **upsert por (entidad, periodo)** y se
  guardan al perder el foco de cada celda.

---
---

# Submódulo de Contabilidad y Finanzas

Documentación funcional de **Gerencia → Contabilidad y Finanzas**. Permite controlar
presupuestos, proyectar el flujo de caja, analizar centros de costo, medir la rentabilidad
por cliente y servicio, y cargar documentos de soporte.

## C1. Visión general

La lógica es: se arma el **presupuesto** (partidas de ingresos y egresos con montos mensuales
planificados y ejecutados); de ahí se derivan automáticamente el **flujo de caja** y el
análisis por **centro de costo**. La **rentabilidad** se registra por operación (cliente ×
servicio) y los **documentos** de respaldo se cargan y quedan archivados.

Mismos roles con acceso que el resto de Gerencia. Sidebar: sección **"Contabilidad y
Finanzas"** con 6 entradas.

| Sección | Ruta |
|---|---|
| Panel Financiero | `/gerencia/contabilidad` |
| Presupuesto | `/gerencia/contabilidad/presupuesto` |
| Flujo de Caja | `/gerencia/contabilidad/flujo-caja` |
| Centros de Costo | `/gerencia/contabilidad/centros-costo` |
| Rentabilidad | `/gerencia/contabilidad/rentabilidad` |
| Documentos | `/gerencia/contabilidad/documentos` |

## C2. Presupuesto — `/gerencia/contabilidad/presupuesto`

Es el núcleo del submódulo. Se registran **partidas presupuestales** de dos tipos:
**Ingreso** o **Egreso**.

Cómo funciona:
1. Selector de **año**. Botón **"Partida"** para crear una con: tipo, **categoría**
   (predefinidas: para ingresos "Servicios de laboratorio", etc.; para egresos "Personal /
   Planilla", "Reactivos e insumos", "Servicios básicos", etc.), **concepto** y **centro de
   costo** (opcional).
2. Las partidas se agrupan en **Ingresos** y **Egresos**. Cada una muestra el ejecutado vs.
   planificado y su **% de ejecución** coloreado.
3. Al desplegar una partida aparece la **grilla mensual** (Ene–Dic) con filas **Plan** y
   **Real**; se guardan al salir de cada celda. Montos en soles.

Resumen superior: ingresos planificados/ejecutados, egresos planificados y **resultado
proyectado** (ingresos − egresos), con el resultado real.

**% de ejecución** = (ejecutado / planificado) × 100. El color considera el tipo:
- **Egreso**: > 100 % es **rojo** (sobregasto), 85–100 % ámbar, < 85 % verde.
- **Ingreso**: ≥ 100 % es **verde** (superó meta), 80–99 % ámbar, < 80 % rojo.

## C3. Flujo de Caja proyectado — `/gerencia/contabilidad/flujo-caja`

Vista **derivada automáticamente del presupuesto** (no se captura aparte).

Muestra, por mes: ingresos, egresos, **flujo neto proyectado** (ingresos − egresos plan),
flujo neto real, y **saldo acumulado**. Incluye un gráfico de barras del flujo neto mensual
(verde positivo / rojo negativo) y tarjetas resumen (ingresos, egresos, flujo neto anual,
saldo acumulado real).

## C4. Centros de Costo — `/gerencia/contabilidad/centros-costo`

Permite analizar el presupuesto **por unidad organizativa o proyecto**.

Cada centro tiene código, nombre, departamento y responsable. Se le asignan partidas (desde
el Presupuesto). La tarjeta del centro muestra barras de **presupuesto vs. ejecutado** de
egresos (e ingresos si tiene) del año en curso.

## C5. Rentabilidad — `/gerencia/contabilidad/rentabilidad`

Mide el **margen por cliente y por servicio**.

Cómo funciona:
1. Selector de año. Botón **"Registro"**: mes, **cliente** (autocompleta con los clientes
   reales del sistema), **servicio** (autocompleta con los ensayos), **ingreso**, **costo
   directo** y **costo indirecto**.
2. Tres vistas: **Por cliente**, **Por servicio** (agregados, ordenados por margen) y
   **Detalle** (registros individuales, editables).
3. Resumen superior: ingresos, costos, margen y margen %.

Cálculo:
```
margen   = ingreso − costo directo − costo indirecto
margen % = (margen / ingreso) × 100
```
Color del margen: ≥ 25 % verde · 10–24 % ámbar · 0–9 % naranja · negativo rojo.

## C6. Documentos — `/gerencia/contabilidad/documentos`

Permite que el equipo **cargue documentos** de respaldo (estados de cuenta, comprobantes,
reportes, conciliaciones, declaraciones SUNAT, etc.).

Cada documento se sube con nombre, **categoría**, año y centro de costo opcional. Se guarda
quién lo subió y la fecha. Desde la lista se descarga o elimina. El almacenamiento usa
**Vercel Blob** (vía `/api/upload`).

## C7. Panel Financiero — `/gerencia/contabilidad`

Consolida el submódulo: KPIs (ingresos y egresos ejecutados, resultado real vs. proyectado,
n° de centros de costo), mini gráfico de flujo de caja, **top de rentabilidad por cliente y
por servicio**, documentos recientes y accesos rápidos a cada sección.

## C8. Notas técnicas

- **Modelos Prisma** (5): `CentroCosto`, `PartidaPresupuestal`, `LineaPresupuesto`,
  `RegistroRentabilidad`, `DocumentoFinanciero`.
- Lógica compartida (soles, % ejecución, márgenes, categorías): `src/lib/contabilidad.ts`.
- Server actions: `src/app/actions/contabilidad.ts`.
- La rentabilidad es de **captura manual** (los costos por cliente/servicio no se rastrean
  automáticamente en el ERP); autocompleta nombres de clientes (`razonSocial`) y ensayos
  (`nombre`) como ayuda.
- Ruteado bajo `/gerencia/contabilidad/*` para no colisionar con el `/finanzas` operativo
  existente.
