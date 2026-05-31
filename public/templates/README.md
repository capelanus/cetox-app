# Plantillas PDF

## `letterhead.pdf` — Membrete oficial CETOX

Coloca aquí el PDF del membrete oficial del Laboratorio de Ensayo Acreditado (LE-044).

El archivo debe llamarse exactamente `letterhead.pdf`.

El sistema lo usa como fondo de página cuando genera el PDF del informe de ensayo
(`/api/informes/[id]/generar-informe-pdf`). El contenido del informe se superpone
sobre este fondo, y el QR de la firma digital se coloca en la esquina inferior derecha.

**Si el archivo no está presente**, el sistema genera un encabezado programático
con los colores corporativos CETOX como fallback.
