# Workflow de desarrollo CETOX

## Inicio rápido cada vez que empiezas a trabajar

```bash
# 1. Arranca Postgres local (si no está corriendo)
docker start cetox-pg-local

# 2. Arranca el dev server
PORT=3010 npm run dev
```

Abre http://localhost:3010 — login con cualquier usuario (todos tienen password `cetox2026`).

---

## Topología

```
┌────────────────────────┐        ┌─────────────────────────┐
│  TU MAC (local)        │        │  VPS (cetoxlab.tech)    │
│                        │        │                         │
│  npm run dev → :3010   │        │  cetox_web container    │
│  ↓                     │        │  ↓                      │
│  Postgres local        │        │  Postgres interno       │
│  :5440 (Docker)        │        │  (red Docker Swarm)     │
│  cetox/local           │        │  postgres/wb1xrjv...    │
└────────────────────────┘        └─────────────────────────┘
        ↑                                    ↑
        │       git push origin main         │
        └──────────────┬─────────────────────┘
                       │
                  GitHub main
                       │
                  trigger deploy
                  (manual o auto)
```

---

## Comandos por escenario

### 🟢 Cambio puramente de código (UI, lógica, bug fix)

```bash
# Edita lo que quieras
npm run dev      # ver en localhost:3010
# Pruébalo

git add .
git commit -m "fix: ..."
git push origin main

# Deploy a prod — uno de estos:
# A) Manual: pídele a Claude que lo trigueé
# B) curl directo:
curl -s -X POST \
  -H "Authorization: Bearer 46a0921aec8cdad08ffd07a70a481515c01f7f0218f98c524a55c93a0c598a73" \
  -H "Content-Type: application/json" \
  http://177.7.55.12:3000/api/trpc/services.app.deployService \
  -d '{"json":{"projectName":"cetox","serviceName":"web","forceRebuild":true}}'
```

### 🟡 Cambio de schema (nueva tabla, columna, índice)

```bash
# 1. Edita prisma/schema.prisma

# 2. Crea la migración + aplícala a tu BD local
npx prisma migrate dev --name agregar-campo-x

# 3. Edita el código que usa el campo nuevo
npm run dev      # verifica que todo funciona

# 4. Sube
git add prisma/migrations/ prisma/schema.prisma src/
git commit -m "feat: ..."
git push origin main

# 5. Deploy — el container del VPS aplicará la migración automáticamente
#    al arrancar (gracias al `prisma migrate deploy && next start`)
```

### 🟡 Nueva variable de entorno

```bash
# 1. Añádela en .env.local
echo 'MI_VAR="valor-local"' >> .env.local

# 2. Úsala en el código
# 3. Antes de deployar, añade la var en Easypanel:
#    (vía panel UI: panel.cetoxlab.tech → cetox → web → Environment)
#    O por API — pídele a Claude

git push origin main
# trigger deploy
```

### 🟡 Necesitas data nueva (seed)

```bash
# Locales:
npx prisma db seed   # si tienes script de seed

# Para el VPS, después de deploy abre terminal del container en Easypanel
# (Services → web → Console) y corre:
# npx prisma db seed
```

---

## Sincronizar local ↔ prod cuando lo necesites

### Bajar datos frescos de prod a tu local

```bash
# Conexión a Postgres del VPS — necesita exponer puerto temporalmente
# (lo hace Claude desde Easypanel API). O usa pgBackRest si lo configuras.

# Si tienes puerto 5433 expuesto:
export PATH="/opt/homebrew/opt/libpq/bin:$PATH"
PROD_URL="postgresql://postgres:wb1xrjv33dajtx8afjsb@177.7.55.12:5433/cetox"
LOCAL_URL="postgresql://cetox:local@localhost:5440/cetox"

# 1. Backup local actual (por si rompes algo)
pg_dump "$LOCAL_URL" --format=custom -f /tmp/local-$(date +%s).dump

# 2. Wipe local y restaura desde prod
docker exec cetox-pg-local psql -U cetox -d postgres -c 'DROP DATABASE cetox;'
docker exec cetox-pg-local psql -U cetox -d postgres -c 'CREATE DATABASE cetox;'
pg_dump "$PROD_URL" --format=custom --no-owner --no-acl | pg_restore --dbname="$LOCAL_URL" --no-owner --no-acl
```

### Resetear tu local

```bash
docker rm -f cetox-pg-local
docker run -d --name cetox-pg-local \
  -e POSTGRES_PASSWORD=local \
  -e POSTGRES_USER=cetox \
  -e POSTGRES_DB=cetox \
  -p 5440:5432 \
  --restart unless-stopped \
  postgres:17

# Luego: aplica todas las migraciones existentes
npx prisma migrate deploy
```

---

## Comandos útiles

```bash
# Ver estado del Postgres local
docker ps --filter name=cetox-pg-local

# Logs del dev server
tail -f /tmp/cetox-dev.log

# Parar dev server
kill $(cat /tmp/cetox-dev.pid)

# Conectar al Postgres local desde psql
docker exec -it cetox-pg-local psql -U cetox -d cetox

# Conectar a Postgres del VPS (necesita puerto expuesto)
# Pide a Claude que lo exponga primero
```

---

## Reglas que evitan dolor

1. **Nunca** edites `schema.prisma` sin después correr `npx prisma migrate dev`.
   Si lo haces, las migraciones quedan desincronizadas y prod no sabrá del cambio.

2. **Siempre** verifica en local antes de hacer push.
   El dev server tarda 2s en arrancar, no hay excusa.

3. **Cambios destructivos** (eliminar tablas, columnas con datos): hacelos en una migración separada con un comentario explicando por qué.

4. **Si el deploy de prod falla**, revisa los logs del action en Easypanel — Prisma migrate puede fallar si la migración tiene un conflicto con datos existentes.

5. **El password `cetox2026`** que todos tus usuarios tienen es un riesgo. Cuando puedas, cambia esto.

---

## Por si todo se va al diablo

- **VPS prod down**: revertir al commit anterior + trigger redeploy
- **Postgres local corrupto**: ver "Resetear tu local"
- **Pérdida de tu Mac**: el repo en GitHub tiene todo el código. Los datos de prod están en el VPS.
- **VPS perdido**: si tienes snapshot reciente, restaurar. Si no, levantar otro VPS, instalar Easypanel, clonar repo, configurar env vars, restaurar dump más reciente.
