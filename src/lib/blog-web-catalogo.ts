// Catálogo de artículos publicados en cetoxlab.com/blog. La página de
// Administración lo sincroniza con la tabla BlogArticulo (crea los que falten;
// nunca borra). Para añadir un artículo nuevo basta agregarlo aquí.
export interface ArticuloCatalogo { slug: string; titulo: string; categoria: string; url: string }

export const CATALOGO_BLOG_WEB: ArticuloCatalogo[] = [
  { slug: 'limite-maximo-de-residuos-lmr', titulo: 'Límite Máximo de Residuos (LMR): qué es y cómo decide si tu lote se exporta', categoria: 'Agroexportación y calidad analítica', url: 'https://cetoxlab.com/blog/limite-maximo-de-residuos-lmr' },
  { slug: 'analisis-multirresiduo-plaguicidas', titulo: 'Análisis multirresiduo de plaguicidas: qué es y qué revisar antes de contratarlo', categoria: 'Agroexportación y calidad analítica', url: 'https://cetoxlab.com/blog/analisis-multirresiduo-plaguicidas' },
  { slug: 'requisitos-lmr-exportar-ue-eeuu-japon', titulo: 'Requisitos de LMR para exportar a la UE, EE.UU. y Japón: comparación práctica', categoria: 'Agroexportación y calidad analítica', url: 'https://cetoxlab.com/blog/requisitos-lmr-exportar-ue-eeuu-japon' },
  { slug: 'laboratorio-acreditado-iso-17025', titulo: 'Laboratorio acreditado ISO/IEC 17025: qué garantiza y qué no', categoria: 'Agroexportación y calidad analítica', url: 'https://cetoxlab.com/blog/laboratorio-acreditado-iso-17025' },
  { slug: 'plomo-en-sangre-analisis', titulo: 'Plomo en sangre: cuándo pedirlo, qué muestra usar y cómo interpretarlo', categoria: 'Metales tóxicos clásicos', url: 'https://cetoxlab.com/blog/plomo-en-sangre-analisis' },
  { slug: 'plomo-en-ninos', titulo: 'Plomo en sangre en niños: síntomas, valor de referencia y cómo se confirma', categoria: 'Metales tóxicos clásicos', url: 'https://cetoxlab.com/blog/plomo-en-ninos' },
  { slug: 'analisis-mercurio-total-metilmercurio', titulo: 'Análisis de mercurio: total vs metilmercurio, y qué muestra pedir en cada caso', categoria: 'Metales tóxicos clásicos', url: 'https://cetoxlab.com/blog/analisis-mercurio-total-metilmercurio' },
  { slug: 'arsenico-en-orina-intoxicacion-cronica', titulo: 'Arsénico en orina: por qué pedir el inorgánico y cómo reconocer la intoxicación crónica', categoria: 'Metales tóxicos clásicos', url: 'https://cetoxlab.com/blog/arsenico-en-orina-intoxicacion-cronica' },
  { slug: 'cadmio-en-orina-creatinina', titulo: 'Cadmio en orina: por qué se normaliza por creatinina y qué indica', categoria: 'Metales tóxicos clásicos', url: 'https://cetoxlab.com/blog/cadmio-en-orina-creatinina' },
  { slug: 'manganeso-en-sangre-soldadores', titulo: 'Manganeso en sangre: vigilancia de soldadores y mineros', categoria: 'Metales tóxicos clásicos', url: 'https://cetoxlab.com/blog/manganeso-en-sangre-soldadores' },
  { slug: 'analisis-metales-pesados-medicina-ocupacional', titulo: 'Análisis de metales pesados en medicina ocupacional: qué pedir para cada exposición', categoria: 'Interpretación y método', url: 'https://cetoxlab.com/blog/analisis-metales-pesados-medicina-ocupacional' },
  { slug: 'biomarcadores-exposicion-efecto', titulo: 'Biomarcadores de exposición, efecto y susceptibilidad: cómo combinarlos', categoria: 'Interpretación y método', url: 'https://cetoxlab.com/blog/biomarcadores-exposicion-efecto' },
  { slug: 'valores-de-referencia-metales-pesados', titulo: 'Valores de referencia en metales pesados: por qué un resultado no se lee solo', categoria: 'Interpretación y método', url: 'https://cetoxlab.com/blog/valores-de-referencia-metales-pesados' },
  { slug: 'analisis-metales-en-cabello', titulo: 'Análisis de metales en cabello: cuándo es útil y cuándo no', categoria: 'Interpretación y método', url: 'https://cetoxlab.com/blog/analisis-metales-en-cabello' },
  { slug: 'tubo-metales-traza-fase-preanalitica', titulo: 'Tubo para metales traza: cómo evitar la contaminación de la muestra', categoria: 'Interpretación y método', url: 'https://cetoxlab.com/blog/tubo-metales-traza-fase-preanalitica' },
  { slug: 'intoxicacion-metales-pesados-aguda-cronica', titulo: 'Intoxicación por metales pesados: diferencias entre aguda y crónica', categoria: 'Interpretación y método', url: 'https://cetoxlab.com/blog/intoxicacion-metales-pesados-aguda-cronica' },
  { slug: 'metales-pesados-embarazo', titulo: 'Metales pesados en el embarazo: plomo, mercurio y cadmio', categoria: 'Poblaciones y especialidades', url: 'https://cetoxlab.com/blog/metales-pesados-embarazo' },
  { slug: 'cromo-cobalto-protesis-metal-metal', titulo: 'Cromo y cobalto en sangre en pacientes con prótesis metal-metal', categoria: 'Poblaciones y especialidades', url: 'https://cetoxlab.com/blog/cromo-cobalto-protesis-metal-metal' },
  { slug: 'aluminio-hemodialisis', titulo: 'Aluminio en pacientes en hemodiálisis: por qué se vigila', categoria: 'Poblaciones y especialidades', url: 'https://cetoxlab.com/blog/aluminio-hemodialisis' },
  { slug: 'enfermedad-de-wilson-diagnostico', titulo: 'Enfermedad de Wilson: cómo ayuda el laboratorio en el diagnóstico', categoria: 'Poblaciones y especialidades', url: 'https://cetoxlab.com/blog/enfermedad-de-wilson-diagnostico' },
  { slug: 'biomonitoreo-humano-evento-ambiental', titulo: 'Biomonitoreo humano ante un evento ambiental: qué pedir y a quién', categoria: 'Poblaciones y especialidades', url: 'https://cetoxlab.com/blog/biomonitoreo-humano-evento-ambiental' },
  { slug: 'litemia-litio-en-sangre', titulo: 'Litemia: cómo y cuándo medir el litio en sangre', categoria: 'Oligoelementos y otros metales', url: 'https://cetoxlab.com/blog/litemia-litio-en-sangre' },
  { slug: 'intoxicacion-por-talio', titulo: 'Intoxicación por talio: síntomas y cómo se confirma', categoria: 'Oligoelementos y otros metales', url: 'https://cetoxlab.com/blog/intoxicacion-por-talio' },
  { slug: 'selenio-en-sangre', titulo: 'Selenio en sangre: deficiencia, exceso y cuándo medirlo', categoria: 'Oligoelementos y otros metales', url: 'https://cetoxlab.com/blog/selenio-en-sangre' },
  { slug: 'deficiencia-de-zinc-analisis', titulo: 'Deficiencia de zinc: síntomas y análisis en sangre', categoria: 'Oligoelementos y otros metales', url: 'https://cetoxlab.com/blog/deficiencia-de-zinc-analisis' },
  { slug: 'niquel-alergia-exposicion-ocupacional', titulo: 'Níquel: alergia de contacto y exposición ocupacional', categoria: 'Oligoelementos y otros metales', url: 'https://cetoxlab.com/blog/niquel-alergia-exposicion-ocupacional' },
  { slug: 'sobrecarga-de-hierro', titulo: 'Sobrecarga de hierro: síntomas y cómo se detecta', categoria: 'Oligoelementos y otros metales', url: 'https://cetoxlab.com/blog/sobrecarga-de-hierro' },
]
