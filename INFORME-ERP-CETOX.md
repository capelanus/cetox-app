# INFORME TÉCNICO-FUNCIONAL DEL ERP CETOX
### Sistema de Gestión Integral para Laboratorio de Ensayos · LE-044

**Documento de sustento de alcance, complejidad y valor**
Fecha de emisión: 16 de junio de 2026
Versión del sistema: producción (rama `main`)

---

## 1. RESUMEN EJECUTIVO

El **ERP Cetox** es un sistema de gestión empresarial **a medida**, desarrollado específicamente para las operaciones de un laboratorio de ensayos acreditado. No es un software genérico configurado: es una plataforma construida desde cero que integra, en una sola aplicación web, los procesos completos de **seis áreas de negocio** que en la mayoría de las empresas requerirían **entre 4 y 6 sistemas comerciales independientes** (un LIMS de laboratorio, un CRM/facturación, un sistema de compras/abastecimiento, un módulo de RRHH, un gestor documental y un tablero gerencial).

El sistema gestiona el **ciclo de vida completo del negocio**: desde que un cliente solicita una cotización, pasando por el ingreso de muestras, la ejecución de ensayos en los laboratorios, la emisión de informes firmados digitalmente con certificado QR verificable, hasta la facturación y cobranza; y en paralelo, todo el abastecimiento (requerimientos, proveedores, órdenes de compra, recepciones, pagos), la gestión del personal (contratos, asistencia biométrica, vacaciones) y el control gerencial (KPIs, finanzas, accesos).

### Cifras de alcance del sistema

| Indicador | Cantidad |
|---|---|
| **Módulos funcionales** | 6 áreas + capacidades transversales |
| **Pantallas / vistas de la aplicación** | 88 páginas |
| **Entidades de datos (tablas modeladas)** | 46 modelos relacionales |
| **Operaciones de negocio (acciones de servidor)** | ~120 funciones |
| **Servicios / endpoints API** | ~28 rutas |
| **Roles de usuario con permisos diferenciados** | 10 roles |
| **Generadores de documentos** | PDF y Word (DOCX) — informes, certificados, cotizaciones, facturas, OC, contratos, actas |
| **Integraciones externas** | Reloj biométrico (ZKTeco), almacenamiento en la nube, verificación pública de certificados |

---

## 2. ARQUITECTURA Y STACK TECNOLÓGICO

El sistema está construido sobre un stack moderno, profesional y de nivel empresarial, lo que garantiza **rendimiento, seguridad y mantenibilidad a largo plazo**.

| Capa | Tecnología | Función |
|---|---|---|
| **Framework** | Next.js 16 (App Router) + React 19 | Renderizado en servidor, máxima velocidad y SEO |
| **Lenguaje** | TypeScript | Tipado estático: menos errores en producción |
| **Base de datos** | PostgreSQL | Motor relacional robusto de grado empresarial |
| **ORM** | Prisma 7.8 | Acceso a datos seguro y migraciones controladas |
| **Autenticación** | NextAuth 5 | Sesiones seguras, hash de contraseñas con bcrypt |
| **Almacenamiento** | Vercel Blob | Archivos (PDF, fotos, documentos) en la nube |
| **Generación documental** | pdf-lib, docx, docxtemplater | Documentos oficiales en PDF y Word |
| **Códigos QR** | qrcode + sellado en PDF | Certificados verificables |
| **Reportería / gráficos** | Recharts, TanStack Table | Tableros y visualizaciones |
| **Interfaz** | Tailwind CSS 4, Radix UI | Diseño consistente, accesible y responsivo |
| **Validación** | Zod + React Hook Form | Datos correctos antes de guardar |
| **Infraestructura** | Docker Swarm + Nixpacks (VPS) | Despliegue reproducible y aislado |

**Características arquitectónicas de valor:**

- **Aplicación web centralizada**: accesible desde cualquier navegador, sin instalación en cada equipo.
- **Tiempo real**: notificaciones y mensajería interna mediante SSE (Server-Sent Events).
- **Correlativos automáticos**: numeración secuencial por año para cotizaciones, SET, ODA, informes, OC, recepciones, devoluciones, pagos y facturas.
- **Auditoría**: registro de cambios (audit log) con usuario, acción, entidad y detalle.
- **Seguridad de cabeceras**: políticas CSP, HSTS y control de incrustación (frame-ancestors).

---

## 3. SEGURIDAD, ROLES Y PERMISOS

El sistema implementa un **control de acceso basado en roles (RBAC)** con **10 perfiles diferenciados**, cada uno con visibilidad y permisos específicos. Esto garantiza que cada colaborador solo acceda a lo que le corresponde — un requisito clave de los sistemas de gestión de calidad.

| Rol | Acceso principal |
|---|---|
| **Gerente General** | Visión completa (hereda permisos de Gerencia Técnica) |
| **Gerente Técnico** | Dashboard, calidad, comercial, reportería |
| **Dirección de Lab. y Calidad** | Calidad + Administración + Operaciones + Caja chica + KPIs + Control de accesos |
| **Dirección de Adm. y Finanzas** | Administración + RRHH + Gerencia + Caja chica |
| **Administración** | Comercial, facturación, RRHH, finanzas |
| **Coordinación de Calidad** | Laboratorio + administración básica |
| **Analista** | ODA e informes asignados (acceso restringido) |
| **Jefe de Operaciones** | Módulo completo de Logística |
| **Asistente de Logística** | Módulo de Logística (operativo) |
| **Super Admin** | Acceso técnico total |

Cada acceso a página y cada operación de escritura valida el rol del usuario en el servidor (`requireRol`), de modo que **la seguridad no depende de ocultar botones**, sino de verificación real en el backend. Adicionalmente, la **Gerencia puede activar o desactivar el acceso de cualquier usuario** desde el módulo de Control de Accesos.

---

## 4. MÓDULOS FUNCIONALES

---

### 4.1 MÓDULO DE CALIDAD Y LABORATORIOS

> *El corazón del negocio: gestión del proceso analítico desde el ingreso de la muestra hasta el informe firmado y el certificado verificable.*

Este módulo digitaliza el flujo de trabajo técnico-analítico completo, alineado con los requisitos de un laboratorio acreditado (trazabilidad, control de versiones, firmas y verificación).

#### Catálogo de Ensayos
Maestro de ensayos del laboratorio con:
- Código único, nombre, **prefijo de informe** y **área** (Química / Biología / Microbiología).
- **Método o norma** de referencia.
- **Costos diferenciados en USD y PEN**.
- **Tiempo de entrega comprometido** (días).
- Indicador de **acreditación INACAL** y de **ensayo tercerizado**.
- Tipo de muestra, plantilla Word asociada y alias.

#### SET — Solicitud de Ensayo / Ingreso de Muestra
Registro formal y trazable de la muestra que ingresa al laboratorio, con un nivel de detalle exhaustivo:
- Datos de identificación: nombre comercial, ingrediente activo, formulación, número de lote, fechas de fabricación y vencimiento, peso/volumen, tipo de muestra, **código único de muestra**, fotografía.
- Datos de envase: tipo, material, etiqueta, seguridad.
- Datos clínicos cuando aplica (nombre y edad de paciente).
- **Indicaciones específicas por laboratorio** (Q, B, M) de forma independiente.
- Condiciones ambientales, procedencia, manejo de devolución de muestra.
- **Tres formas de creación**: SET con costo (desde cotización), SET por muestra individual y **SET cero** (sin costo, con motivo justificado).
- Estados controlados (Emitida, En ejecución, Anulado) con posibilidad de anular y reestablecer.

#### ODA — Orden de Ejecución de Ensayo
Orden de trabajo que deriva del SET hacia cada laboratorio:
- Generación **selectiva**: el usuario elige qué ensayos del SET convertir en ODA (no obliga a procesar todos).
- Asignación por **área** y por analista.
- Control de fechas: recepción, inicio de ejecución y **compromiso de entrega** por ítem.
- Carga de resultados por el analista, control de revisión y estados de ejecución.

#### Informes
Flujo de emisión de informes con **control de versiones y firmas en cadena**:
- Estados: Borrador → En revisión de Calidad → En firma de Gerencia → Emitido.
- **Firma de conformidad de Calidad** y **firma de Gerencia Técnica**.
- Devolución a Administración con observaciones, y carga de informe corregido.
- Generación del informe en **Word (DOCX) y PDF**.
- Resultados con texto, **imágenes y archivos adjuntos**.
- **Visor de PDF integrado** con permisos diferenciados (el analista no ve el certificado QR ni puede descargar el firmado).

#### Certificados con QR verificable
- Generación de **certificado digital con código QR único + clave de verificación**.
- **Página pública de validación**: cualquier tercero (cliente, autoridad) puede verificar la autenticidad de un informe escaneando el QR e ingresando la clave, sin acceso al sistema.
- Sellado del QR directamente sobre el PDF del informe.

#### Cargos de Entrega
- Acta de entrega del informe/resultado al cliente, con datos de quien recibe, DNI y **firma digital capturada**.

#### Gestión de Equipos (Calidad metrológica)
- Inventario de equipos por área y categoría (general, termohigrómetro, vidrio).
- **Calendario anual de mantenimiento**: tareas preventivas, de calibración y de verificación, por mes, con marcado de cumplimiento y fecha real.

**Valor del módulo:** reemplaza un sistema LIMS comercial (cuyo costo de licencia anual suele ser muy elevado) y aporta trazabilidad completa exigida por la acreditación, con verificación pública de certificados — una capacidad diferenciadora frente a la competencia.

---

### 4.2 MÓDULO DE ADMINISTRACIÓN (COMERCIAL Y FINANCIERO)

> *Gestión comercial del cliente, cotizaciones, facturación, cobranza y caja chica.*

#### Gestión de Clientes
- Maestro de clientes con razón social, RUC, dirección, país, contacto, email, teléfono.
- Activación/desactivación y eliminación controlada.

#### Cotizaciones
Motor comercial completo:
- Dos modalidades: **cotización normal** y **cotización abierta** (para clientes recurrentes con múltiples muestras).
- **Multi-muestra**: cada cotización puede contener varias muestras, y cada muestra sus propios ensayos.
- Cálculo automático de **subtotal, IGV y total**, en USD o PEN.
- **7 modalidades de pago** (anticipo 50/50, anticipo 100%, crédito 100%, crédito 50/50, crédito mensual/quincenal, al culminar).
- Vigencia, datos de contacto comercial, país de origen.
- Operaciones avanzadas: **duplicar**, **crear nueva versión desde otra**, **modificar cotización aceptada** (con control de versión vía sufijo y cotización padre), cambio de estado.
- **Papelera con borrado lógico**: eliminación recuperable y eliminación definitiva, con registro de quién y cuándo.
- Generación de **PDF de la cotización**.

#### Facturación a Clientes
- Generación de **factura al cliente desde la cotización** (con o sin selección de ítems).
- Series y correlativos por año.
- **Registro de cobranza avanzado**: número de operación bancaria, **detracción** (% y sujeción), monto efectivamente ingresado, adelanto y saldo del SET.
- Estados: Pendiente → Pagada → Anulada.
- Generación de **PDF de factura**.

#### Ingresos y Resumen
- Vistas consolidadas de ingresos y resumen ejecutivo de la operación comercial.

#### Caja Chica
- Registro de **gastos e ingresos** de caja chica con campos contables completos (tipo de documento, serie, número, fecha de emisión/vencimiento, condición, tipo de cambio, glosa, **centro de costo, cuenta de gasto**, afecto a IGV).
- Asociación a proveedor, comprobante adjunto.
- **Peticiones de efectivo**: flujo de solicitud → aprobación/rechazo con monto aprobado, que al aprobarse genera el ingreso correspondiente.

**Valor del módulo:** sustituye un sistema de facturación/CRM comercial e incorpora particularidades tributarias peruanas (IGV, detracciones, centros de costo) difíciles de encontrar en software genérico.

---

### 4.3 MÓDULO DE GERENCIA

> *Inteligencia de negocio y control directivo en tiempo real.*

#### Dashboard Gerencial
- **Embudo del pipeline** por etapas (cotizaciones, SET, ODA, informes) con conteos por estado.
- **Tendencias mensuales** de cotizaciones y ensayos.
- Indicadores de trabajo en curso y totales históricos.

#### Dashboard Financiero
- Métricas clave: **facturado total, pagado total, cuentas por pagar, facturas vencidas**.
- Gráficos de evolución financiera mensual.

#### KPIs de Equipo
- Indicadores de productividad por usuario y por etapa del proceso (cotizaciones, SET, informes).

#### Control de Accesos
- La Gerencia puede **activar o desactivar el acceso de cualquier usuario** al sistema, de forma centralizada.

#### Historial / Auditoría
- Registro de cambios del sistema (audit log) con usuario, acción, entidad afectada y detalle del cambio.

**Valor del módulo:** ofrece a la dirección visibilidad inmediata del negocio (comercial, operativo y financiero) sin esperar reportes manuales, y control de gobernanza sobre los accesos.

---

### 4.4 MÓDULO DE RRHH (RECURSOS HUMANOS)

> *Gestión del personal, contratos, asistencia biométrica y vacaciones.*

#### Gestión de Personal
- Ficha completa del empleado: DNI, nombre, **tipo de contrato**, fechas de ingreso y fin de contrato, cargo, área, funciones y notas.
- **Gestión documental por empleado**: carga y descarga de documentos (contratos, certificados, etc.) con tipo y tamaño.
- Activación/desactivación de empleados.
- Vínculo opcional empleado↔usuario del sistema.

#### Contratos
- Gestión de contratos del personal y **generación de certificados/constancias** a partir de plantillas.

#### Asistencia (Integración Biométrica)
- **Integración con reloj biométrico ZKTeco**: un endpoint seguro recibe las marcaciones (entrada, salida, extra-entrada, extra-salida) y las **vincula automáticamente** a cada empleado por coincidencia de nombre (exacta y parcial).
- Protegido por API key dedicada.
- Registro de timestamp y tipo de marcación, con deduplicación.

#### Vacaciones
- **Balance de vacaciones** por empleado: días atrasados, reglamentarios, adelantadas tomadas y pendientes.
- **Solicitud de vacaciones** con días específicos (calendario), tipo (reglamentaria/atrasada/adelantada), tipo de licencia (con goce / sin goce / motivos personales), persona delegada.
- **Flujo de aprobación multinivel**: Pendiente → Aprobada (jefe inmediato) → Comunicada (RRHH), o Rechazada en cualquier paso.
- **Matriz de aprobadores N:M**: un solicitante puede tener varios aprobadores y un aprobador varios solicitantes a cargo.
- Generación de **PDF de la solicitud/autorización**.

#### Estructura Organizacional
- Visualización de la estructura del personal por áreas.

**Valor del módulo:** integra control de asistencia con hardware físico (biométrico) y un flujo de vacaciones con aprobaciones jerárquicas — funcionalidades que normalmente exigen un software de RRHH dedicado.

---

### 4.5 MÓDULO DE LOGÍSTICA Y OPERACIONES

> *Ciclo completo de abastecimiento: del requerimiento al pago, con trazabilidad total.*

#### Requerimientos
- Solicitudes de compra por área con descripción, justificación, **nivel de urgencia** y fecha requerida.
- Ítems con cantidad, unidad y especificaciones.
- Flujo de estados: Borrador → Enviado → En cotización → Aprobada → OC emitida → En tránsito → Recepcionado → Cerrado.

#### Proveedores
- Maestro de proveedores con razón social, RUC, especialidad, **hasta 3 teléfonos y 3 emails**, cuenta bancaria.
- **Catálogo de productos por proveedor** (búsqueda por producto).

#### Cotizaciones de Proveedor
- Registro de cotizaciones recibidas de proveedores, con ítems, plazo de entrega, condiciones de pago y validez.
- **Flujo de aprobación por Calidad**: Borrador → Enviada a Calidad → Aprobada / Rechazada (con motivo).
- Adjunto del archivo de cotización.

#### Órdenes de Compra
- Emisión de OC desde requerimiento y cotización(es).
- **Vinculación de múltiples cotizaciones de un proveedor a una sola OC**.
- **Edición de OC** con ítems, condiciones, lugar de entrega y fechas.
- **Historial de modificaciones**: cada cambio queda registrado con usuario, fecha y descripción.
- **Búsqueda y filtrado** por producto o proveedor.
- Estados: Emitida → Confirmada por proveedor → En tránsito → Recibida → Cerrada / Cancelada.
- Cálculo automático de subtotal, IGV y total.

#### Recepciones
- Registro de recepción de mercadería contra la OC.
- **Verificación ítem por ítem**: cantidad esperada vs. recibida, conformidad y observaciones.
- **Área de destino** de la mercadería.
- Registro de entrega al área (con conformidad del área).
- Generación de **acta de recepción**.

#### Devoluciones
- Gestión de devoluciones totales o parciales contra una recepción, con motivo e ítems.

#### Inventario
- Maestro de ítems de inventario con código, categoría, unidad, **stock y stock mínimo (alerta)**.
- **Historial de movimientos**: cada entrada, salida o ajuste queda registrado con cantidad, stock anterior/nuevo, **área de destino**, descripción y usuario responsable.

#### Gestión de Pagos a Proveedor
- Registro de **facturas de proveedor** contra la OC.
- **Provisión de pago** (aprobación) con condición de pago.
- **Pago** con medio (transferencia, Yape, cheque, efectivo), referencia, voucher.
- **Confirmación del pago al proveedor**.
- Estados controlados en cada paso.

#### Historial de Logística (consolidado)
- **Bitácora unificada del departamento**: en una sola línea de tiempo se consolidan OC creadas, OC editadas, recepciones y movimientos de inventario — cada evento con **fecha, tipo, referencia y responsable**. Permite saber en todo momento qué movimientos hubo en el área y quién es el responsable.

**Valor del módulo:** equivale a un módulo de compras/abastecimiento de un ERP comercial, con trazabilidad de extremo a extremo (requerimiento → cotización → OC → recepción → factura → pago) y bitácora de responsabilidad.

---

### 4.6 CAPACIDADES TRANSVERSALES (toda la organización)

Funcionalidades que atraviesan todos los módulos y multiplican el valor del sistema:

| Capacidad | Descripción |
|---|---|
| **Notificaciones** | Centro de notificaciones por usuario con marcado de leídas, enlaces directos al origen. |
| **Mensajería interna (Chat/DM)** | Conversaciones directas entre usuarios con **adjuntos** y actualización **en tiempo real (SSE)**. |
| **Alertas de vencimiento** | Detección automática de facturas de cliente, facturas de proveedor y ODA próximas a vencer, vencidas o que vencen hoy, con sincronización a notificaciones. |
| **Solicitudes internas** | Bandeja de solicitudes del personal con flujo propio. |
| **Auditoría** | Registro inmutable de cambios (quién, qué, cuándo, detalle). |
| **Generación documental** | Motor de PDF y Word para informes, certificados, cotizaciones, facturas, órdenes de compra, contratos, actas y autorizaciones de vacaciones. |
| **Correlativos automáticos** | Numeración secuencial controlada por año para todos los documentos oficiales. |
| **Búsqueda global** | Buscador transversal en la aplicación. |

---

## 5. JUSTIFICACIÓN DEL VALOR Y DEL COSTO

### 5.1 El ERP reemplaza múltiples sistemas comerciales

Para cubrir el mismo alcance con software de mercado, la organización necesitaría adquirir y **mantener integrados** al menos los siguientes sistemas, cada uno con su licenciamiento, su curva de aprendizaje y sus costos de integración:

| Necesidad | Software comercial equivalente | Modelo de costo típico |
|---|---|---|
| Gestión de laboratorio | **LIMS** (Sample Manager, LabWare, etc.) | Licencia + mantenimiento anual elevado |
| Comercial y facturación | **CRM + facturación electrónica** | Suscripción mensual por usuario |
| Compras y abastecimiento | **Módulo ERP de compras** (SAP B1, etc.) | Licencia por usuario + implementación |
| Recursos Humanos | **Software de RRHH + control de asistencia** | Suscripción + hardware |
| Gestión documental | **DMS** | Suscripción por almacenamiento/usuario |
| Tablero gerencial | **BI** (Power BI, Tableau) | Suscripción por usuario |

Un sistema a medida **elimina las suscripciones recurrentes por usuario**, evita los costos de integración entre sistemas dispares, y entrega **exactamente** los flujos del negocio (cotización abierta, SET cero, indicaciones por laboratorio, detracciones, SET con adelanto/saldo, aprobación de cotizaciones de proveedor por Calidad, etc.) que ningún software genérico contempla.

### 5.2 Funcionalidades a medida que no existen "de fábrica"

- Verificación **pública** de certificados por QR + clave.
- Flujo de informes con **doble firma** (Calidad y Gerencia Técnica) y control de versiones.
- **Indicaciones por laboratorio** (Q/B/M) independientes dentro de una misma muestra.
- **Cotización abierta** y generación selectiva de SET y ODA.
- **Detracciones, centros de costo y cuentas contables** peruanas en facturación y caja chica.
- **Vinculación de varias cotizaciones de proveedor a una OC** y bitácora de responsabilidad logística.
- **Integración con reloj biométrico** y vinculación automática a empleados.
- Flujo de vacaciones con **matriz de aprobadores multinivel**.

### 5.3 Magnitud de la ingeniería

- **46 entidades de datos** modeladas y relacionadas (integridad referencial, cascadas, índices).
- **88 pantallas** funcionales con lógica de negocio.
- **~120 operaciones de negocio** en servidor, cada una con validación de permisos.
- **~28 servicios/APIs**, incluyendo generación de documentos y la integración biométrica.
- **10 roles** con permisos verificados en el backend.
- Despliegue profesional en infraestructura propia (VPS con Docker), con migraciones de base de datos versionadas.

### 5.4 Beneficios económicos directos

1. **Cero licencias recurrentes por usuario** — el sistema escala sin costo marginal por colaborador.
2. **Ahorro de horas-hombre**: automatización de correlativos, cálculos (IGV, totales), generación de documentos y alertas que antes eran manuales.
3. **Reducción de errores**: validación de datos y trazabilidad eliminan reprocesos.
4. **Cumplimiento y reputación**: trazabilidad y verificación de certificados refuerzan la acreditación y la confianza del cliente.
5. **Propiedad total**: la organización es dueña del código y los datos; no hay dependencia de un proveedor externo ni riesgo de aumentos de tarifa.
6. **Adaptabilidad**: el sistema evoluciona con el negocio (como demuestran las mejoras continuas de Logística, Calidad y RRHH).

---

## 6. CONCLUSIÓN

El ERP Cetox es una **plataforma empresarial integral, a medida y en producción**, que centraliza la operación completa de un laboratorio de ensayos acreditado y de sus áreas de soporte. Su alcance —6 módulos, 88 pantallas, 46 entidades de datos, ~120 operaciones de negocio y 10 perfiles de seguridad— representa un activo tecnológico cuyo valor de reemplazo, vía software comercial, implicaría **múltiples licencias, integraciones costosas y suscripciones recurrentes permanentes**, sin alcanzar el grado de ajuste a los procesos reales del negocio que este sistema ya entrega.

El costo del desarrollo y mantenimiento del ERP se sustenta no solo en la **amplitud funcional**, sino en la **profundidad de la ingeniería**, la **especificidad regulatoria y tributaria** del dominio, y el **ahorro estructural** que genera al eliminar licencias por usuario y trabajo manual.

---

*Documento generado a partir del análisis directo del código fuente del sistema en producción.*
