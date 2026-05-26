/**
 * Script: importar proveedores desde el listado maestro de CETOX.
 * Uso: npx tsx scripts/import-proveedores.ts
 */
import { Client } from 'pg'
import { randomUUID } from 'crypto'

const DATABASE_URL = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

interface Prov {
  razonSocial: string
  ruc: string | null
  especialidad: string | null
  direccion: string | null
  telefono: string | null
  telefono2: string | null
  telefono3: string | null
  email: string | null
  email2: string | null
  email3: string | null
  cuentaBancaria: string | null
}

function n(s: string): string | null {
  const t = s.trim().replace(/\s+/g, ' ')
  return t.length > 0 ? t : null
}

const PROVEEDORES: Prov[] = [
  { razonSocial: 'PERTEL® Expertos En Protección Eléctrica SAC', ruc: null, especialidad: null, direccion: 'Calle Mariscal Andrés de Santa Cruz 234, San Luis. Lima – Perú', telefono: '(01) 960 295 607', telefono2: '955 403 764', telefono3: null, email: 'clientes@pertel.pe', email2: null, email3: null, cuentaBancaria: null },
  { razonSocial: 'PAPELERA HANNA', ruc: '20611811315', especialidad: 'PROVEEDOR DE PAPEL', direccion: 'Urb SANTA CATALINA MZA. A LOTE. 4 CALLAO', telefono: '963083355', telefono2: null, telefono3: null, email: 'papelerahanna@gmail.com', email2: null, email3: null, cuentaBancaria: 'BCP (soles): 191-1783395-0-89' },
  { razonSocial: 'DIMMED S.A.C', ruc: '20609064863', especialidad: 'PRODUCTOS, REACTIVOS, EQUIPOS Y MATERIALES E INSUMOS', direccion: 'JR. CHANCAY NRO. 633 INT. A LIMA', telefono: '972170107', telefono2: '934978592', telefono3: null, email: 'ventas@dimmed.pe', email2: null, email3: null, cuentaBancaria: 'CTA: S/ 194-7224788054 - CCI: S/ 00219400722478805494' },
  { razonSocial: 'BIOMARS CORPORATION SAC', ruc: '20603438281', especialidad: 'IMPORTACIÓN, COMERCIALIZACIÓN Y DISTRIBUCIÓN DE INSTRUMENTOS DE MEDICIÓN, EQUIPOS INDUSTRIALES Y EQUIPAMIENTO DE LABORATORIO', direccion: 'Av. Bolivia 1016, Breña, Lima, Perú', telefono: '4801628', telefono2: '969517661', telefono3: null, email: 'ventas@biomars.pe', email2: 'import@biomars.pe', email3: null, cuentaBancaria: 'Cta BCP (S/): 191-2524563-0-35' },
  { razonSocial: 'CORPORACION VALCA S.R.L.', ruc: '20563736918', especialidad: 'PRODUCTOS DE LIMPIEZA, DECORACIÓN Y DESINFECCIÓN', direccion: 'Av. Lima Mza. a Lote. 1 A.V. Parcela 2 San Lorenzo (Fdo Cuadros) – Carabayllo - Lima', telefono: '949044640', telefono2: '960488267', telefono3: null, email: 'ventas@valca.com.pe', email2: 'gerencia@valca.com.pe', email3: null, cuentaBancaria: 'Cta BCP (S/): 191-23638-210-78 / Yape/Plin 960 488 267' },
  { razonSocial: 'INSPECTION & TESTING SERVICES DEL PERU', ruc: '20602034675', especialidad: 'SERVICIOS DE ENSAYO, INSPECCIÓN, MUESTREOS Y CERTIFICACIONES DE ALIMENTOS', direccion: 'Av. Fernando Wiesse 3840, San Juan de Lurigancho 15438', telefono: '(01) 4680802', telefono2: '934169393', telefono3: '999378162', email: 'itsperu@itsperu.com.pe', email2: null, email3: null, cuentaBancaria: 'CTA BCP S/.: 191-9036694-0-35 / CCI: 002-191-009036694035-52' },
  { razonSocial: 'A & O TECH E.I.R.L.', ruc: '20549758054', especialidad: 'PRODUCTOS Y REACTIVOS DE LABORATORIO', direccion: 'Jr. La Prudencia Nro. 8037 Urb. Pro - Los Olivos', telefono: '960 653 628', telefono2: '990 144 982', telefono3: '(01) 504 7767', email: 'ventas3@aotechperu.com.pe', email2: 'atencionalcliente@aotechperu.com.pe', email3: null, cuentaBancaria: 'Cta BCP ($): 191 252 547 6167' },
  { razonSocial: 'AIR PRODUCTS PERU S.A', ruc: '20382072023', especialidad: 'SUMINISTRO DE GASES INDUSTRIALES', direccion: 'Av. Jorge Basadre 233 Int. 201. San Isidro', telefono: '945315747', telefono2: null, telefono3: null, email: 'GOMEZY@airproducts.com', email2: 'BRAVOMCM@AIRPRODUCTS.COM', email3: null, cuentaBancaria: 'Cta BCP (S/): 191-1195441-0-60' },
  { razonSocial: 'ALCIMAR\'S FARM EIRL', ruc: '20562841921', especialidad: 'MATERIAL MEDICO, INSTRUMENTAL QUIRURGICO, PRODUCTOS FARMACEUTICOS Y DISPOSITIVOS', direccion: 'Av. Emancipación Nº 595A Lima', telefono: '974613337', telefono2: '992923194', telefono3: null, email: 'ventas@alcimarsfarm.com', email2: 'consultas@alcimarsfarm.com', email3: null, cuentaBancaria: 'BCP (Soles): 191-2166538-0-20' },
  { razonSocial: 'Bridag EIRL', ruc: '20123344279', especialidad: 'SUMINISTRO DE EQUIPOS Y SERVICIOS PARA SISTEMAS DE GASES', direccion: 'Jr. Monteagudo N° 143 - Callao', telefono: '922463391', telefono2: null, telefono3: null, email: 'j.escalante@bridag.com', email2: 'ventas1@bridag.com', email3: null, cuentaBancaria: 'Cta BCP ($): 1921626168148' },
  { razonSocial: 'Catastrophe SAC', ruc: '20608696378', especialidad: 'TIENDA DE MASCOTAS', direccion: 'Av Alfredo Benavides 620 Dpto 1002 Miraflores', telefono: '925196972', telefono2: null, telefono3: null, email: 'cat.astrophe.pe@gmail.com', email2: null, email3: null, cuentaBancaria: 'Yape 925 196 972' },
  { razonSocial: 'CIENTIFICA ANDINA S.A.C.', ruc: '20212980774', especialidad: 'INSTRUMENTOS ANALITICOS MEDICOS', direccion: 'Av. Dos de Mayo 270 Dpto. 101 - Miraflores', telefono: '934526432', telefono2: null, telefono3: null, email: 'katiusca.vita@cientifica-andina.com.pe', email2: 'sandra.gallegos@cientifica-andina.com.pe', email3: null, cuentaBancaria: 'Cta BCP ($): 193-0843-691-1-40' },
  { razonSocial: 'CONAGROVET', ruc: '20601824508', especialidad: 'TIENDA DE MASCOTAS', direccion: 'Av circunvalación 2869 Lima', telefono: '977 153 702', telefono2: null, telefono3: null, email: 'ventas@conagrovet.com', email2: null, email3: null, cuentaBancaria: 'Cta BCP (S/): 1949931775057' },
  { razonSocial: 'Corporación Lider Perú', ruc: '20517482472', especialidad: 'ARTICULOS DE LIMPIEZA, ABARROTES Y AGUA', direccion: 'Jr Leoncio prado 458 Surquillo', telefono: '946039348', telefono2: null, telefono3: null, email: 'corporacionliderperu@hotmail.com', email2: null, email3: null, cuentaBancaria: null },
  { razonSocial: 'CRISTOFER IMPORT EIRL', ruc: '20520843770', especialidad: 'MATERIAL DE LABORATORIO', direccion: 'Jr. Chancay N° 616 Int. 13 - Lima', telefono: '994182116', telefono2: '994032699', telefono3: null, email: 'ventas@cristoferimport.com', email2: null, email3: null, cuentaBancaria: 'BCP (Soles): 191-1885857-0-58' },
  { razonSocial: 'DIMERC S.A.C.', ruc: '20537321190', especialidad: 'MATERIAL DE OFICINA', direccion: 'Av. Andres Avelino Caceres 320 Miraflores, Lima-Perú', telefono: '711 2300 (504)', telefono2: null, telefono3: null, email: 'wilma.aching@dimerc.pe', email2: null, email3: null, cuentaBancaria: 'CTA BCP (Soles): 194-1920079-0-36' },
  { razonSocial: 'EL MUNDO DE LAS SEÑALES DEL PERÚ S.A.C.', ruc: '20602842844', especialidad: 'SEÑALIZACIÓN', direccion: 'Av. Rep. Panamá 4474 - Of. 201 - Surquillo', telefono: null, telefono2: null, telefono3: null, email: 'info@elmundodelassenales.com', email2: 'disenadores@elmundodelassenales.com', email3: null, cuentaBancaria: 'Cta BCP (S/): 193-2260024-0-24' },
  { razonSocial: 'ENVIROTECHLAB', ruc: '20550688442', especialidad: 'CALIBRACIÓN DE EQUIPOS Y MATERIALES DE LABORATORIO', direccion: 'Jr. Tacna 195 Bellavista Callao', telefono: '954160518', telefono2: '920241098', telefono3: null, email: null, email2: null, email3: null, cuentaBancaria: 'BCP (soles): 193-2096748-1-80' },
  { razonSocial: 'EQUIPOS ANALITICOS Y TECNOLOGIA DE INFORMACION S.A.C. - EQUANTI S.A.C.', ruc: '20603237120', especialidad: 'INSTRUMENTOS ANALITICOS MEDICOS', direccion: 'Cal. Horacio Cachay Nº 375 - La Victoria', telefono: '984 281 609', telefono2: '642-4020 (276)', telefono3: '642-4020', email: 'aespinoza@equanti.com', email2: 'rchumpitaz@equanti.com', email3: null, cuentaBancaria: 'Cta BCP ($): 191-2524-228-1-61' },
  { razonSocial: 'EXORIAM E.I.R.L', ruc: '20601913578', especialidad: 'ARTICULOS Y ACCESORIOS DE LIMPIEZA', direccion: 'Calle Las Amapolas 378 - 372 - Lince', telefono: '981785942', telefono2: null, telefono3: null, email: 'administracion@exoriam.com', email2: 'ventas@exoriam.com', email3: null, cuentaBancaria: 'BCP (soles): 193–2685576–0-28' },
  { razonSocial: 'FIKA S.A.C.', ruc: '20566123518', especialidad: 'PRODUCTOS DE PROTECCIÓN PERSONAL', direccion: 'Mza H-1 Lt. 2 Urb. Alamos Cto. Grande - SJL', telefono: '946167426', telefono2: '973516491', telefono3: null, email: 'ventas4@fikaperu.com', email2: null, email3: null, cuentaBancaria: 'Cta BCP (S/): 191-2205815058' },
  { razonSocial: 'GEN LAB DEL PERU S.A.C.', ruc: '20501262260', especialidad: 'BIOLOGÍA MOLECULAR, CELULAR Y MICROBIOLOGÍA', direccion: 'Jr. Capac Yupanqui N° 2434 - Lince', telefono: '2037500 / 2037504', telefono2: null, telefono3: null, email: 'ventas@genlabperu.com', email2: null, email3: null, cuentaBancaria: 'Cta BCP ($): 193-1718902-1-55' },
  { razonSocial: 'GESMIN S.R.L.', ruc: '20520739280', especialidad: 'METROLOGÍA, SOPORTE TECNICO Y INSTRUMENTALIZACÍON', direccion: 'Jr. Antonio Cabo Nro. 596, Urb. El Trebol - Los Olivos', telefono: '976 318 091', telefono2: null, telefono3: null, email: 'ventas@isocal.pe', email2: 'ventas3@gesmin.pe', email3: 'aflores@gesmin.pe', cuentaBancaria: 'Cta BCP (S/): 191-2328179-0-58' },
  { razonSocial: 'I.E. MEDIC S.A.C.', ruc: '20602472427', especialidad: 'MATERIAL DE LABORATORIO', direccion: 'Jr. Manao Nro. 244 Breña -Lima', telefono: '969781632', telefono2: null, telefono3: null, email: 'postventa@iemedic.com.pe', email2: null, email3: null, cuentaBancaria: 'Cta BCP (S/): 191-2433389-0-85' },
  { razonSocial: 'IMPLEMENTOS Y REACTIVOS E.I.R.L.', ruc: '20502538722', especialidad: 'QUIMICOS PARA ANALISIS Y MEDICAMENTOS', direccion: 'Ca. Los Talladores 170 Urb Industrial del Artesano -Ate', telefono: '914 545 656', telefono2: '719-9833', telefono3: '996 655941 (Facturación)', email: 'maravedis.munoz@ir-peru.com', email2: null, email3: null, cuentaBancaria: 'Cta BCP (S/): 194-1505536-033' },
  { razonSocial: 'IMPORTACIONES UNO MAS UNO S.A.', ruc: '20253961466', especialidad: 'ARTICULOS PARA EL HOGAR', direccion: 'Av. Aviacion Nro. 4755 Urb. Higuereta - Santiago de Surco', telefono: '9233222914', telefono2: '998 977 770', telefono3: null, email: 'ventas@unomasuno.pe', email2: null, email3: null, cuentaBancaria: 'Cta BCP (S/): 194 156 37 52 0 73 / Yape: 977367822' },
  { razonSocial: 'Importadora Acuatica', ruc: '20100488427', especialidad: 'ACCESORIOS DE ACUARIO', direccion: 'Av Gral Garzon 673 Jesus maria', telefono: '924375243', telefono2: '936197116', telefono3: null, email: 'acuatica@gmail.com', email2: null, email3: null, cuentaBancaria: 'Cta BCP (S/): 191-95293883-0-45' },
  { razonSocial: 'IMPORTADORA ANDINA', ruc: '20270485015', especialidad: 'REACTIVOS QUIMICOS Y EQUIPOS DE LABORATORIO', direccion: 'Jr. Moquegua 606 - Cercado', telefono: '942 193 073', telefono2: null, telefono3: null, email: 'andinaeirl3@gmail.com', email2: 'info@andinaeirl.com', email3: null, cuentaBancaria: 'Cta BCP (S/): 191-1758760-0-51' },
  { razonSocial: 'INSTITUTO NACIONAL DE SALUD', ruc: '20131263130', especialidad: 'RATAS', direccion: 'Av. Defensores del Morro 2268 - Chorrillos', telefono: '748-0000 (1558)', telefono2: '997944728', telefono3: '987579241', email: null, email2: null, email3: null, cuentaBancaria: null },
  { razonSocial: 'Inversiones Hualix', ruc: '20515386336', especialidad: 'CALIBRACIÓN DE EQUIPOS Y VENTA DE EQUIPOS', direccion: 'Calle Chacarilla Nº 424 San Isidro', telefono: '938582645', telefono2: '2650920', telefono3: null, email: 'ventas@hualix.com.pe', email2: null, email3: null, cuentaBancaria: 'BCP 193-1831607-1-89' },
  { razonSocial: 'JAMPAR MULTIPLEST INTERNACIONAL S.R.L.', ruc: '20566551072', especialidad: 'REACTIVOS QUIMICOS Y EQUIPOS DE LABORATORIO', direccion: 'Jr. Gaspar Hernandez 912-Urb. Z.I. Lima', telefono: '914175149', telefono2: null, telefono3: null, email: 'cotizaciones@jampar.com.pe', email2: null, email3: null, cuentaBancaria: 'Cta BCP (S/): 191 2633800-0-39' },
  { razonSocial: 'JAS IMPORTACIONES S.A.C.', ruc: '20505978731', especialidad: 'REACTIVOS QUIMICOS Y EQUIPOS DE LABORATORIO', direccion: 'Calle San Hernán Mz 2H Lt 13 B-1 - Urb. Sta. Luisa 2da etapa - Los Olivos', telefono: null, telefono2: null, telefono3: null, email: 'ventas2@jasimportaciones.com', email2: null, email3: null, cuentaBancaria: 'Cta BCP (S/): 191-2066881-0-84' },
  { razonSocial: 'KOSSODO METROLOGIA S.A.C. - KOSSOMET', ruc: '20601958121', especialidad: 'INSTRUMENTOS DE MEDICIÓN, EQUIPOS DE LABORATORIO Y METROLOGÍA', direccion: 'Jr. Chota Nº 1161 - Lima', telefono: '948 795 474', telefono2: '6198400 (1411)', telefono3: null, email: 'jsoto@kossomet.com', email2: null, email3: null, cuentaBancaria: 'Cta BCP (S/): 191-2394565-0-23' },
  { razonSocial: 'Linde Perú S.R.L.', ruc: '20338570041', especialidad: 'SUMINISTRO DE GASES INDUSTRIALES', direccion: 'Av. Benavides 801 Piso 11 Miraflores-lima-lima', telefono: '985842807', telefono2: '994607927', telefono3: '517-2370', email: 'sandra.justiniano@linde.com', email2: 'Melissa.Castaneda@linde.com', email3: 'pedidos@lindeperu.com', cuentaBancaria: 'Cta BCP ($): 191-1016975-1-83' },
  { razonSocial: 'Maryori Peru S.A.C', ruc: '20601211361', especialidad: 'ARTICULOS DE LIMPIEZA, ABARROTES Y AGUA', direccion: 'Av. Alameda los Horizontes Mza. a-01 Lote. 16', telefono: '996 768 663', telefono2: null, telefono3: null, email: 'ventas@maryoriperu.com', email2: null, email3: null, cuentaBancaria: 'Cta BCP (S): 193-2293399-0-44' },
  { razonSocial: 'MERCANTIL S.A.', ruc: '20100312736', especialidad: 'REACTIVOS QUIMICOS Y EQUIPOS DE LABORATORIO', direccion: 'Cal. Santorin Nº 243 Urb. El Vivero -Santiago de Surco', telefono: '998 324 028', telefono2: '998 327 301', telefono3: '618-1618 / 618-1616 (270)', email: 'bvelasco@mercantil.com.pe', email2: 'jbenites@mercantil.com.pe', email3: null, cuentaBancaria: 'Cta BCP (US $): 194 0730 77 0124' },
  { razonSocial: 'MERCK PERUANA S.A.', ruc: '20100099447', especialidad: 'REACTIVOS QUIMICOS Y EQUIPOS DE LABORATORIO', direccion: 'Av. Manuel Olguín Nro. 325 Of. 1702 Lima - Santiago de Surco', telefono: '6187500 (opc 2 luego opc 1)', telefono2: null, telefono3: null, email: 'franklin.vasquez@merckgroup.com', email2: 'fabrizio.monopoli@merckgroup.com', email3: 'CotizacionesFieldServ@merckgroup.com', cuentaBancaria: 'CCI BBVA (S/): 011-586-000100050150-50' },
  { razonSocial: 'METROLOGIA E INGENIERIA LINO S.A.C.', ruc: '20471742792', especialidad: 'CALIBRACIÓN DE EQUIPOS Y VENTA DE EQUIPOS', direccion: 'Av. Venezuela Nro. 2040 Lima 15081 - Lima', telefono: '987 579 813', telefono2: '975 432 370', telefono3: '943 613 051', email: 'VENTAS4@metroil.pe', email2: null, email3: null, cuentaBancaria: 'Cta BCP (S/): 191-1134964-0-81' },
  { razonSocial: 'NEGOCIAR S.A.C.', ruc: '20100810418', especialidad: 'REACTIVOS QUIMICOS Y EQUIPOS DE LABORATORIO', direccion: 'Cal. Los Canarios Nº 130 Int. 201 Urb. San Cesar II Etapa - La Molina', telefono: '992827270', telefono2: '611 0303', telefono3: '966 205 231', email: 'andrea.almandoz@negociar.com.pe', email2: 'asistente.comercial2@negociar.com.pe', email3: null, cuentaBancaria: 'Cta BCP ($): 194-0787-306-1-94' },
  { razonSocial: 'P Y S EQUIPOS E.I.R.L.', ruc: '20550733685', especialidad: 'CALIBRACIÓN DE EQUIPOS Y VENTA DE EQUIPOS', direccion: 'Calle 4, Mz F1 Lt 05 Urb. Virgen del Rosario - San Martín de Porres', telefono: '945 183 033', telefono2: '970055989', telefono3: null, email: 'ventas@pys.pe', email2: 'ysalazar@pys.pe', email3: 'apozo@pys.pe', cuentaBancaria: 'Cta BCP ($): 191-2035266-1-51' },
  { razonSocial: 'PALACIO DE AGUA SAC', ruc: '20520820133', especialidad: 'AGUA DESTILADA', direccion: 'Jr. Bélgica Nº 1442 - La Victoria', telefono: '998 377 424', telefono2: '324-0618', telefono3: '473-2900', email: 'ventas@palaciodeaguas.com', email2: null, email3: null, cuentaBancaria: 'CTA BBVA (S/) 0011-0124-0100021786 / CCI BBVA (S/): 011 124 000100021786 57' },
  { razonSocial: 'PERUMETRIK', ruc: '20612440264', especialidad: 'CALIBRACIÓN DE EQUIPOS Y VENTA DE EQUIPOS', direccion: 'Calle Las Codornices 223A - Surquillo', telefono: '944-558-354', telefono2: '987-007-160', telefono3: '702-1486', email: 'ventas@perumetrik.com.pe', email2: null, email3: null, cuentaBancaria: 'Cta corriente (BCP): 192-2078124-0-50' },
  { razonSocial: 'PROLIDER EMPRESARIAL S.A.C', ruc: '20601043557', especialidad: 'ARTICULOS DE LIMPIEZA, ABARROTES Y AGUA', direccion: 'MZA. E1 LOTE. 8 HABILITACIÓN INDUSTRIAL EL LUCUMO', telefono: '922139093', telefono2: null, telefono3: null, email: 'ventas@prolider.pe', email2: null, email3: null, cuentaBancaria: 'Cta BCP (S/.): 191-9938391-0-86 / CCI: 00219100993839108658' },
  { razonSocial: 'PROSINFER', ruc: '20603671261', especialidad: 'PRODUCTOS DE PROTECCIÓN PERSONAL', direccion: 'Calle Jose Celendon 1072 - Lima', telefono: '973516491', telefono2: null, telefono3: null, email: 'ventas@prosinfer.com', email2: null, email3: null, cuentaBancaria: 'Cta BCP (S/): 191-2548712-0-64' },
  { razonSocial: 'QUIMICA MULTIPLE INDUSTRIAL E.I.R.L', ruc: '20603046570', especialidad: 'REACTIVOS QUIMICOS Y EQUIPOS DE LABORATORIO', direccion: 'Av. Emancipacion 569 Int. 1118 - Lima', telefono: '9206667498', telefono2: '995911930', telefono3: null, email: 'quimicamultiple.2010@hotmail.com', email2: null, email3: null, cuentaBancaria: 'BCP (soles): 191-2511711-0-17' },
  { razonSocial: 'Quimica Service S.R.L.', ruc: '20100421195', especialidad: 'REACTIVOS QUIMICOS Y EQUIPOS DE LABORATORIO', direccion: 'Pq. San Fernando N° 141 - La Perla - Prov. Const. del Callao', telefono: '(511) 420 - 2339', telefono2: '4203832', telefono3: null, email: 'ventas@quimicaservice.com', email2: 'informes@quimicaservice.com', email3: null, cuentaBancaria: 'Cta CCI BBVA (S/): 011 353 000100036576 05' },
  { razonSocial: 'REACTIVOS PARA ANALISIS S.A.C.', ruc: '20178285336', especialidad: 'REACTIVOS QUIMICOS Y EQUIPOS DE LABORATORIO', direccion: 'Av. Guardia Civil N° 661-657 Int. 6 Urb. Corpac - San Borja', telefono: '914-992-098', telefono2: '451 2457', telefono3: '561 0781 Anexo 121', email: 'mallcca@rpaperu.com', email2: null, email3: null, cuentaBancaria: 'Cta BCP ($): 191-1422 774 163' },
  { razonSocial: 'TAI LOY S.A.', ruc: '20100049181', especialidad: 'MATERIAL DE OFICINA', direccion: 'Av. Caminos del Inca 450. Surco', telefono: '977342835', telefono2: '619-3040', telefono3: null, email: null, email2: null, email3: null, cuentaBancaria: 'Cta BCP (S/): 191-0852628-0-02 / Credipago Soles: 193-1159267-0-66 / Credipago Dólares: 193-1159404-1-60' },
  { razonSocial: 'TECFRESH', ruc: '20518364481', especialidad: 'INSTRUMENTOS DE MEDICIÓN, EQUIPOS DE LABORATORIO Y METROLOGÍA', direccion: 'Juana riofrio 197 Of 401 San Miguel', telefono: '974395715', telefono2: null, telefono3: null, email: 'ventas@tecfresh.com', email2: null, email3: null, cuentaBancaria: 'Cta BCP ($): 193-38276629-1-60' },
  { razonSocial: 'UNION YCHICAWA S.A', ruc: '20100047137', especialidad: 'ARTICULOS PARA EL HOGAR', direccion: 'Jr. Junin 774 Lima', telefono: '998177132', telefono2: '994015683', telefono3: null, email: null, email2: null, email3: null, cuentaBancaria: null },
  { razonSocial: 'XELAR S.A.C.', ruc: '20513927526', especialidad: 'TINTAS E IMPRESORAS', direccion: 'Av. Ricardo Palma Nro. 341 int. 302 Urb. Municipal - Miraflores', telefono: '944250521', telefono2: '203-8230 anexo 103', telefono3: null, email: 'cdiaz@xelarperu.com.pe', email2: null, email3: null, cuentaBancaria: 'Cta BCP ($): 193-1698-8491-98' },
]

async function main() {
  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()
  console.log('🔌  Conectado a la base de datos')

  let created = 0, updated = 0, skipped = 0
  const now = new Date().toISOString()

  for (const p of PROVEEDORES) {
    const ruc = p.ruc?.trim() || null
    try {
      if (ruc) {
        const res = await client.query('SELECT id FROM "Proveedor" WHERE ruc = $1', [ruc])
        if (res.rows.length > 0) {
          const id = res.rows[0].id
          await client.query(`
            UPDATE "Proveedor" SET
              "razonSocial"=$1, "especialidad"=$2, "direccion"=$3,
              "telefono"=$4, "telefono2"=$5, "telefono3"=$6,
              "email"=$7, "email2"=$8, "email3"=$9, "cuentaBancaria"=$10
            WHERE id=$11`,
            [p.razonSocial, n(p.especialidad??''), n(p.direccion??''),
             n(p.telefono??''), n(p.telefono2??''), n(p.telefono3??''),
             n(p.email??''), n(p.email2??''), n(p.email3??''), n(p.cuentaBancaria??''),
             id])
          updated++
          continue
        }
      } else {
        // Check by name (no RUC)
        const res = await client.query('SELECT id FROM "Proveedor" WHERE "razonSocial" = $1', [p.razonSocial])
        if (res.rows.length > 0) { skipped++; continue }
      }

      await client.query(`
        INSERT INTO "Proveedor"
          (id, "razonSocial", ruc, "especialidad", "direccion",
           "telefono", "telefono2", "telefono3",
           "email", "email2", "email3", "cuentaBancaria", activo, "createdAt")
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,$13)`,
        [randomUUID(), p.razonSocial, ruc, n(p.especialidad??''), n(p.direccion??''),
         n(p.telefono??''), n(p.telefono2??''), n(p.telefono3??''),
         n(p.email??''), n(p.email2??''), n(p.email3??''), n(p.cuentaBancaria??''), now])
      created++
    } catch (e) {
      console.error(`  ⚠️  Error en "${p.razonSocial}":`, e)
      skipped++
    }
  }

  await client.end()
  console.log(`\n✅  Proveedores importados: ${created} creados, ${updated} actualizados, ${skipped} omitidos`)
}

main().catch(e => { console.error(e); process.exit(1) })
