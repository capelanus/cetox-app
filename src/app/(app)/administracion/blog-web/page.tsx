import { requireRol, ROLES_BLOG_WEB } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { CATALOGO_BLOG_WEB } from '@/lib/blog-web-catalogo'
import { BlogWebViewer } from './blog-web-viewer'

export const dynamic = 'force-dynamic'

// Crea en la tabla los artículos del catálogo que aún no existan (y refresca
// título/categoría/URL de los que ya están). Nunca borra ni toca la autoría.
async function sincronizarCatalogo() {
  for (const a of CATALOGO_BLOG_WEB) {
    await prisma.blogArticulo.upsert({
      where: { slug: a.slug },
      update: { titulo: a.titulo, categoria: a.categoria, url: a.url },
      create: { slug: a.slug, titulo: a.titulo, categoria: a.categoria, url: a.url },
    })
  }
}

export default async function BlogWebPage() {
  await requireRol(ROLES_BLOG_WEB)
  await sincronizarCatalogo()

  const articulos = await prisma.blogArticulo.findMany({ orderBy: [{ categoria: 'asc' }, { createdAt: 'asc' }] })

  return (
    <BlogWebViewer
      articulos={articulos.map(a => ({
        ...a,
        fechaRevision: a.fechaRevision ? a.fechaRevision.toISOString().slice(0, 10) : null,
        updatedAt: a.updatedAt.toISOString(),
        createdAt: a.createdAt.toISOString(),
      }))}
    />
  )
}
