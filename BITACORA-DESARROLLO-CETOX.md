# BITÁCORA DE DESARROLLO Y GESTIÓN — ERP CETOX
### Registro detallado de todo el trabajo realizado, commit por commit

**Período documentado:** 13 de mayo – 16 de junio de 2026 (5 semanas)
**Fecha de emisión:** 16 de junio de 2026
**Fuente:** historial de control de versiones (Git) del repositorio en producción

---

## 1. RESUMEN DE GESTIÓN DEL DESARROLLO

Este documento detalla, de forma trazable y verificable, **todo el trabajo de ingeniería realizado** sobre el ERP Cetox durante su construcción y evolución. Cada cambio quedó registrado en el sistema de control de versiones (Git), lo que permite auditar qué se hizo, cuándo y por qué.

### Indicadores globales de gestión

| Indicador | Valor |
|---|---|
| **Entregas registradas (commits)** | 142 |
| **Período de desarrollo** | 13 mayo – 16 junio 2026 (5 semanas) |
| **Líneas de código incorporadas** | ~82,160 inserciones |
| **Líneas refactorizadas/depuradas** | ~13,670 eliminaciones |
| **Base de código actual (sin archivos generados)** | ~38,600 líneas |
| **Ritmo de entrega promedio** | ~28 entregas/semana (~4 diarias) |
| **Migraciones de base de datos versionadas** | 17 |
| **Pantallas construidas** | 88 |
| **Componentes de interfaz** | 54 |
| **Operaciones de negocio (server actions)** | 26 archivos / ~120 funciones |
| **Servicios API** | 28 |

### Distribución del esfuerzo por semana

| Semana | Entregas | Foco principal |
|---|---|---|
| Semana 1 (13 may) | 1 | Inicialización del proyecto |
| Semana 2 (18-24 may) | 16 | Núcleo del ERP + despliegue + seguridad base |
| Semana 3 (25-31 may) | 50 | Workflow de laboratorio, operaciones, RRHH, equipos, roles |
| Semana 4 (1-7 jun) | 54 | Informes PDF, certificados QR, facturación, vacaciones, caja chica |
| Semana 5 (8-14 jun) | 15 | Certificados RRHH, biométrico, alertas |
| Semana 6 (15-16 jun) | 6 | Refinamiento de calidad y logística avanzada |

> **Lectura de gestión:** la curva de entregas muestra un proyecto de alta intensidad sostenida. Las semanas 3 y 4 concentran la mayor carga (104 de 142 entregas), correspondiente a la construcción simultánea de los módulos núcleo. El desarrollo no se detuvo: cada semana incorporó funcionalidad nueva y correctiva, señal de un ciclo de mejora continua en estrecha relación con las necesidades del cliente.

---

## 2. CRONOLOGÍA DETALLADA POR FASES

---

### FASE 0 — Inicialización del proyecto (13 de mayo)

| Commit | Descripción |
|---|---|
| `f698ad7` | **Inicialización del proyecto** con la plantilla base de Next.js. Establece la estructura del repositorio, herramientas de build y configuración inicial. |

**Gestión:** arranque del proyecto. Punto cero sobre el que se construye todo el sistema.

---

### FASE 1 — Núcleo del ERP, despliegue y seguridad base (22 de mayo)

Esta fase entrega de golpe el **esqueleto completo del ERP** y resuelve toda la cadena de despliegue a producción.

| Commit | Descripción | Magnitud |
|---|---|---|
| `f062e15` | **ERP CETOX LAB — sistema completo de gestión de laboratorio.** Entrega fundacional masiva: modelo de datos, autenticación, y los primeros módulos operativos. | **95 archivos, 15,473 líneas** |
| `4e1b951` | Corrección de configuración de Prisma 7 para PostgreSQL. | |
| `46e0448` | Regeneración del SQL de migración para alinearlo al esquema. | |
| `8472564` | Limpieza del SQL de migración. | |
| `77262f8` | Aseguramiento de variables de entorno fuera del control de versiones (`.env.production`). | |
| `d7f58a2` | La URL del certificado QR usa la variable de entorno oficial en vez de localhost. | |
| `accfaae` | Uso de conexión directa (no agrupada) de la base de datos para migraciones. | |
| `79882d6` | Estrategia de migraciones manuales en cambios de esquema. | |
| `cbae4d0` / `4495aa9` | Ajuste de paquetes externos del servidor (PostgreSQL y Prisma). | |
| `2393978` | Configuración explícita de build de despliegue. | |
| `cef2845` | **Seguridad:** middleware de protección, validación de archivos subidos, corrección de IDOR (acceso indebido por ID), y clave de certificado más robusta. | |
| `70d8422` | Resolución de conflicto del middleware con Next.js 16. | |

**Gestión:** en una sola jornada se levanta el núcleo del producto y se estabiliza el pipeline de despliegue a la nube. La inclusión temprana de un commit dedicado a **seguridad** (validación, IDOR, claves) refleja una práctica profesional: la seguridad se aborda desde el inicio, no como un parche posterior.

---

### FASE 2 — Workflow de laboratorio, operaciones y mejoras de uso (23-26 de mayo)

Construcción intensiva de los flujos de trabajo reales del laboratorio y del abastecimiento, con numerosos ajustes de experiencia de usuario solicitados sobre la marcha.

#### Mejoras transversales y de plataforma
| Commit | Descripción |
|---|---|
| `2fcba2d` | **8 mejoras al ERP** en distintos módulos. |
| `e7757ec` | Adecuación del middleware al runtime Node.js de Next.js 16. |
| `4b9b5cb` | **Mejoras de experiencia de usuario en 6 módulos.** |
| `1c701be` | Zona horaria de Lima en fechas/horas del tablero. |

#### Workflow de Informes y documentos (Calidad)
| Commit | Descripción |
|---|---|
| `65002e4` | **Workflow completo de informes, cargos de entrega y generación de documentos.** Flujo de aprobación y emisión documental. (40 archivos, 1,890 líneas) |
| `f7a7133` | Corrección de errores de tipado para el build de producción. |
| `b713c48` | Múltiples mejoras al ERP. |
| `02ba5a9` | Tabla de informes: filas clicables, estado a la derecha, fecha+hora. |
| `27f3a25` | Mostrar fecha+hora en cada paso del flujo de aprobación del informe. |

#### Módulo de Operaciones / Abastecimiento (Logística)
| Commit | Descripción |
|---|---|
| `48d4b4d` | **Módulo completo de Operaciones y Abastecimiento.** (45 archivos, 4,841 líneas) |
| `25ee7e1` | Cualquier área puede enviar solicitudes de compra a Operaciones. |
| `57582a5` | Corrección de manejo de sesión en el formulario de nueva solicitud. |
| `048662f` | Eliminar solicitudes propias desde lista y detalle. |
| `d41d752` | **Módulo de inventario con importación desde Excel.** |
| `5ab12e9` | **Módulo de proveedores completo.** |
| `5248c47` | Refactor: botones de eliminación como componentes de cliente. |
| `165a2f9` | Aprobación de cotizaciones accesible para Dirección de Calidad. |

#### Solicitud de Ensayo (SET) y muestras (Calidad)
| Commit | Descripción |
|---|---|
| `cf98e80` | Editar datos de un SET ya emitido. |
| `0041f85` | Edición de ODAs desde la página de edición del SET. |
| `aa520c6` | Eliminar ODA desde la edición del SET. |
| `aa85240` | **Generar un SET por cada muestra** cuando la cotización tiene varias. |
| `df2187c` | **Indicaciones separadas por laboratorio** (Q/B/M) al crear/editar SET. |
| `303c55f` | Opción "Otro" en condiciones ambientales del SET. |
| `95fb32a` / `516ac8f` | Preservar y alinear saltos de línea en el nombre de la muestra. |
| `f29c378` | Campo nombre comercial como área de texto en formularios SET. |
| `50e2983` | Mostrar solo el código numérico en la muestra de la ODA. |
| `96a3418` | Filas clicables en listas de ODA y SET. |

#### Cotizaciones (Comercial)
| Commit | Descripción |
|---|---|
| `69f1b27` | Botón "Nueva desde esta" para duplicar cotización con número consecutivo. |
| `11c07d7` | Campos de indicación por laboratorio en las muestras de la cotización. |
| `247f880` | Campo "unidad" opcional en formularios de requerimiento. |
| `ab5a59b` | Guía de uso para Director de Calidad. |

**Gestión:** esta fase evidencia una **dinámica ágil e iterativa**. Junto a entregas grandes (Operaciones, 4,841 líneas), aparecen decenas de ajustes finos (saltos de línea, campos opcionales, filas clicables) que solo surgen del **uso real y la retroalimentación directa del cliente**. Es la fase donde el sistema se ajusta a la operación concreta del laboratorio.

---

### FASE 3 — Equipos, RRHH, Gerencia y arquitectura de roles (28-30 de mayo)

Incorporación de módulos de soporte (Equipos, RRHH, Gerencia) y construcción de la **arquitectura de roles y permisos** que rige todo el sistema.

#### Equipos y RRHH
| Commit | Descripción | Magnitud |
|---|---|---|
| `1448db4` | **Módulo de Equipos & Mantenimiento 2026 + RRHH completo.** Calendario de mantenimiento metrológico y gestión integral de personal. | **63 archivos, 8,426 líneas** |
| `6768ec0` | Restringir el módulo de Equipos solo a roles de Calidad. |

#### Operaciones y comunicación
| Commit | Descripción |
|---|---|
| `9ba555c` | **6 mejoras al módulo de Operaciones.** |
| `ca01175` | **Adjuntar archivos en el chat** (imágenes, PDFs, documentos). |
| `ae74fab` | **13 mejoras premium al ERP.** (28 archivos, 2,858 líneas) |
| `05c96c4` | Reversión del modo oscuro (decisión de diseño). |

#### Gerencia y arquitectura de roles
| Commit | Descripción |
|---|---|
| `b16d549` | **Sección Gerencia — control de accesos al ERP.** |
| `36108e7` | Rediseño del organigrama con tarjetas anidadas por nivel. |
| `bfce849` | **Nuevo rol Dirección de Administración + carga de 20 usuarios CETOX 2026.** |
| `2b30ad2` | Corrección de compatibilidad con React 19. |
| `8226254` | KPIs visibles solo para Gerencia y Dirección de Calidad. |
| `b3cf8e9` | **Rol Gerente General** (Luis Fernández Anaya). |
| `6b12966` | Incorporar nuevos roles al módulo de solicitudes. |
| `3c6b619` | **Rol Coordinación de Calidad** con permisos acotados (sin RRHH, Historial, KPIs ni Caja Chica). |
| `54eed98` / `f514198` / `a2ed6ac` / `b7fa832` | Ajuste fino de permisos de acceso por rol a Finanzas, Historial, Operaciones y Control de Accesos. |

#### Peticiones de efectivo (Finanzas)
| Commit | Descripción |
|---|---|
| `06c2433` | **Peticiones de efectivo** — flujo solicitante → aprobador. |
| `ba4fec4` | Simplificación del flujo (solo monto, concepto auto-generado, saldo visible). |
| `bd93f67` | **Notificaciones** para peticiones de efectivo (alerta al aprobador y resolución al solicitante). |

**Gestión:** fase de maduración organizacional del sistema. Se define la **estructura de roles real de la empresa** (Gerente General, Direcciones, Coordinación, Analistas, Operaciones) con permisos diferenciados, lo que exigió múltiples ajustes finos — característicos de un sistema que modela fielmente la jerarquía y la segregación de funciones de la organización.

---

### FASE 4 — Informes PDF, certificados QR, facturación y vacaciones (31 may – 4 jun)

Fase de mayor carga (semana 4, 54 entregas). Se entregan capacidades de alto valor: generación documental oficial, certificados verificables, facturación al cliente y gestión de vacaciones.

#### Generación de informe PDF oficial y rediseño visual
| Commit | Descripción |
|---|---|
| `22a3ec5` | **Generador de informe PDF con membrete oficial** + corrección de posición del QR. |
| `8b259dc` | Membrete oficial CETOX en la generación de informes. |
| `8945e40` | **Rediseño visual "UI/UX Pro Max"** — migración a colores de marca y componentes premium. (48 archivos) |

#### Facturación al cliente (Administración)
| Commit | Descripción |
|---|---|
| `ae5e6f6` | **Módulo de facturación al cliente desde cotizaciones.** |
| `1bd703f` | Facturación con selección de ítems por ensayo. |
| `51a9c0d` | Mostrar botón "Generar factura" a todos los roles autorizados. |
| `216dc2a` | Corrección de componentes de servidor en facturación. |
| `e92dcb6` | Estilo de cabeceras de tabla tipo planilla. |
| `f55120e` | **Columnas de cobranza** en la lista de facturas. |

#### Módulo de Vacaciones (RRHH)
| Commit | Descripción |
|---|---|
| `3033368` | **Módulo "Mis Vacaciones" — solicitud con calendario + PDF + integración con RRHH.** |

#### Ajuste fino del sello QR sobre el PDF (proceso iterativo)
| Commits | Descripción |
|---|---|
| `78c8f3f`, `ef2b4f6`, `4545e11`, `7d6279f`, `e9270b5`, `635c608`, `9cc4729`, `c396373`, `0ca8bfd`, `572c96c`, `8650154`, `d717646`, `2f18ab4`, `3255140`, `a0ba266`, `cbd750a`, `5459ba7`, `c24479a`, `9361737`, `9f0edf5` | **20 iteraciones de calibración del sello QR**: posición, tamaño, márgenes y texto, hasta eliminar el doble QR y dejarlo anclado con precisión milimétrica en el pie de página. Incluye lógica de re-firma (`upsert`) del mismo informe. |

#### Caja chica contable y otros
| Commit | Descripción |
|---|---|
| `06a3e2d` | **Rediseño del formulario de gasto de caja chica con campos contables completos.** |
| `97c4fa1` | Poblado de listas: tipo de documento, centro de costo, cuenta de gasto. |
| `508c0b6` | Panel resumen reactivo con SubTotal/IGV/Total. |
| `f6aeb97` | **Reemplazo del chat por canales por mensajería directa usuario-a-usuario.** |
| `ddda769` / `3733062` | Acciones de anular/reestablecer SET (incluso con ODAs generadas). |
| `1fcab28` | Documentos y funciones en el detalle del empleado. |
| `8fbfd94` / `64f6aa0` / `4ed6f51` | Campos de funciones específicas y texto legal correcto en contratos (Plazo Fijo, Indeterminado, Alta Dirección). |
| `d01dadf` | Selector de observaciones predefinidas en nueva cotización. |
| `adf01a2` | **Tipo "cotización abierta"** — omite el flujo de aprobación, exclusiva para SET con costo. |
| `3925429` | Sello de QR en todas las páginas del PDF. |
| `c4873cd` | **Portal público de validación** sirve el informe firmado real con sello QR. |
| `30cac91` | Ocultar al analista en el portal público de validación. |

**Gestión:** las **20 iteraciones del sello QR** son el mejor ejemplo de la exigencia de calidad del proyecto: un detalle aparentemente menor (la ubicación del QR en el documento oficial) recibió atención meticulosa hasta quedar perfecto, porque es la cara visible del laboratorio ante el cliente y la autoridad. En paralelo se entregaron tres módulos de alto valor (facturación, vacaciones, validación pública).

---

### FASE 5 — Estabilización, certificados RRHH y biométrico (5-13 de junio)

Endurecimiento de seguridad, estabilización en la nube y nuevas capacidades de RRHH, culminando con la **integración de hardware biométrico**.

#### Seguridad y estabilización
| Commit | Descripción |
|---|---|
| `b69738f` | Corrección de actualizaciones en tiempo real del chat (caché de rutas en la nube). |
| `dcca710` | Fijar versión de Node (requisito de Prisma 7.8). |
| `8388e46` | Eliminar dependencia no usada. |
| `e5a4413` | **Seguridad: HSTS + CSP + límite de tasa + no-cache en login.** |
| `aba401d` | Reubicación del límite de tasa en el middleware. |
| `27b56e7` | Ejecutar migraciones automáticamente al iniciar el contenedor. |
| `30115a7` | Documento de flujo de trabajo de desarrollo. |

#### Informes y vacaciones (mejoras de flujo)
| Commit | Descripción |
|---|---|
| `295e8c2` | Permitir a Dirección de Calidad firmar informes con QR. |
| `4a075c3` | Calidad usa "Revisado" en lugar de "Aprobado" en la revisión. |
| `bc1fef1` | **Vacaciones: matriz de aprobadores por usuario** + flujo de comunicación. |
| `6a92b3e` | Mostrar "Aprobar Vacaciones" a aprobadores que no son de RRHH. |
| `08fd989` | Reembolso de días al balance al destildar días en la comunicación. |
| `301f290` | Dropdown de jefes basado en la matriz de aprobadores. |
| `3add4a2` | Auto-marcar notificaciones como leídas al cerrar la campana. |

#### Certificados de reconocimiento (RRHH) — proceso iterativo
| Commits | Descripción |
|---|---|
| `eac3302`, `e86466a`, `5f051f9`, `5464472`, `ad906e9`, `ed5eb2a`, `4853b90`, `7621ee7` | **Emisión de certificados de reconocimiento CETOX desde RRHH**, con 8 iteraciones de ajuste del template: redacción ("Por su…"), días múltiples, párrafos, expositor, horas académicas, tipografía Montserrat, centrado con coordenadas exactas y concordancia gramatical ("el día"/"los días"). |
| `580b6e4` | Calendario con navegación rápida por año y soporte de fechas pasadas. |

#### Integración biométrica
| Commit | Descripción |
|---|---|
| `efe1663` | **Integración con huellero ZKTeco K20 Pro** y el módulo de RRHH: recepción y vinculación automática de marcaciones de asistencia. |

**Gestión:** esta fase combina **rigor de producción** (seguridad de cabeceras, límite de tasa, migraciones automáticas) con la incorporación de hardware físico al ecosistema. La integración biométrica conecta el mundo físico (el reloj de asistencia) con el ERP, automatizando un proceso antes manual.

---

### FASE 6 — Refinamiento de Calidad y Logística avanzada (14-16 de junio)

Mejoras solicitadas por las áreas usuarias tras el uso en producción.

| Commit | Descripción |
|---|---|
| `e316286` | **Alertas de vencimiento** para facturas de cliente, facturas de proveedor y ODAs. |
| `61fd9d0` | Permitir a Administración y Gerencia Técnica editar ensayos (no solo Dirección de Calidad). |
| `a796ed1` | **SET parcial: generar SETs por muestra individualmente.** |
| `585bdd6` | Habilitar el visor de PDF para Calidad y bloquear el certificado QR a los analistas. |
| `8cbf5c4` | Ensayos por muestra en el SET y selector de ensayos para generar ODAs. |
| `b1c95c3` | **Logística avanzada:** OC editable, historial unificado del departamento, vinculación de múltiples cotizaciones a una OC, área de destino e inventario con historial de movimientos. (16 archivos, 971 líneas) |

**Gestión:** fase de **mejora continua impulsada por el usuario**. Cada entrega responde a una necesidad concreta detectada en la operación diaria (un analista que veía datos que no debía, un SET que necesitaba dividirse por muestra, un jefe de logística que requería trazar quién modificó cada orden). Es la evidencia de un sistema vivo, en evolución constante junto al negocio.

---

## 3. TRABAJO REALIZADO POR MÓDULO

Resumen de cuánto desarrollo concentró cada módulo a lo largo del proyecto:

| Módulo | Hitos de construcción | Entregas asociadas (aprox.) |
|---|---|---|
| **Calidad y Laboratorios** | Workflow de informes, SET multi-muestra y por muestra, ODA selectiva, indicaciones por laboratorio, certificados QR (20 iteraciones), validación pública, equipos y mantenimiento | ~45 |
| **Administración / Comercial** | Cotizaciones (abierta, duplicar, versiones), facturación al cliente, cobranza/detracciones, caja chica contable, peticiones de efectivo | ~25 |
| **Logística / Operaciones** | Abastecimiento completo, proveedores, inventario con Excel y movimientos, OC editable + historial + múltiples cotizaciones, recepciones con área destino | ~20 |
| **RRHH** | Personal, contratos legales, documentos, vacaciones con matriz de aprobadores, certificados de reconocimiento (8 iteraciones), biométrico ZKTeco | ~20 |
| **Gerencia** | Dashboard, KPIs, finanzas, control de accesos, organigrama, arquitectura de 10 roles | ~15 |
| **Plataforma / Transversal** | Despliegue, seguridad (IDOR, HSTS, CSP, rate-limit), chat con adjuntos, notificaciones, alertas, auditoría, rediseño UI Pro Max | ~17 |

---

## 4. PRÁCTICAS DE GESTIÓN EVIDENCIADAS

El historial demuestra prácticas profesionales de ingeniería de software:

1. **Control de versiones disciplinado**: 142 entregas atómicas, cada una con un mensaje descriptivo que explica el qué y el porqué — trazabilidad total.
2. **Seguridad desde el diseño**: corrección de IDOR, validación de archivos, claves robustas, HSTS/CSP y límite de tasa incorporados tempranamente, no como parche.
3. **Migraciones de base de datos versionadas**: 17 migraciones controladas que permiten evolucionar el esquema sin pérdida de datos.
4. **Ciclo de mejora continua**: respuesta rápida a la retroalimentación del usuario (decenas de ajustes finos surgidos del uso real).
5. **Atención al detalle en documentos oficiales**: 20 iteraciones para el sello QR y 8 para el certificado — calidad de cara al cliente y a la autoridad.
6. **Despliegue reproducible**: infraestructura en contenedores (Docker) con migraciones automáticas al arranque.
7. **Modelado fiel de la organización**: arquitectura de 10 roles con segregación de funciones que refleja la jerarquía real de la empresa.

---

## 5. CONCLUSIÓN DE GESTIÓN

En **5 semanas de desarrollo intensivo**, el ERP Cetox pasó de un repositorio vacío a una **plataforma empresarial integral en producción**, con **142 entregas trazables**, **~82,000 líneas de código** y **6 módulos funcionales** que cubren la operación completa del laboratorio y sus áreas de soporte.

El historial no solo cuantifica el esfuerzo: **lo hace auditable**. Cada funcionalidad, cada corrección y cada mejora solicitada por el cliente está registrada con fecha y descripción. Este nivel de trazabilidad es, en sí mismo, un activo de gestión: respalda el valor entregado, documenta la evolución del producto y facilita su mantenimiento futuro.

El ritmo sostenido de entregas, la respuesta continua a las necesidades del usuario y el rigor en seguridad y calidad documental sustentan que el costo del ERP corresponde a un **trabajo de ingeniería sustancial, profesional y altamente especializado en el dominio del negocio.**

---

*Documento generado a partir del análisis directo del historial de control de versiones (Git) del sistema en producción.*
