# Grow El Druida — Natural Systems Sync Worker

Cloudflare Worker que sincroniza el catálogo de Natural Systems (https://api.naturalsystems.es)
a Supabase (`fbjgutmaulopjevoiqsb`). Se ejecuta cada 6h via cron y expone un endpoint HTTP
para trigger manual.

## Arquitectura

```
┌────────────────────┐     cada 6h      ┌──────────────────────┐
│ Cloudflare Cron    │ ───────────────> │   Worker (index.ts)  │
└────────────────────┘                  │                      │
                                        │  1. login NS (JWT)   │
┌────────────────────┐   POST /sync     │  2. fetch catalog    │
│  Trigger manual    │ ───────────────> │     + stock + price  │
│  (curl + secret)   │                  │     + categoria      │
└────────────────────┘                  │  3. merge por code   │
                                        │  4. upsert Supabase  │
                                        │  5. soft-delete      │
                                        └──────────┬───────────┘
                                                   │
                                                   v
                                        ┌──────────────────────┐
                                        │ Supabase (products,  │
                                        │ categories)          │
                                        └──────────────────────┘
```

## Instalar dependencias

```bash
cd "C:/Users/mario/Desktop/Webs/Web Mele/worker"
npm install
```

## Configurar secretos

### Local (para `npm run dev`)
El archivo `.dev.vars` ya está creado (gitignored) con los 4 secretos:
- `NS_API_KEY` — API key Natural Systems
- `SUPABASE_URL` — https://fbjgutmaulopjevoiqsb.supabase.co
- `SUPABASE_SERVICE_KEY` — service_role key de Supabase
- `TRIGGER_SECRET` — secret compartido para `/sync` manual

### Producción (Cloudflare Secrets)
```bash
wrangler secret put NS_API_KEY
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put TRIGGER_SECRET
```
Cada comando te pedirá pegar el valor. Se guardan encriptados en Cloudflare, nunca los ves
después. Para actualizar, vuelve a ejecutar el mismo `put`.

## Correr local

```bash
npm run dev
```
Abre `http://localhost:8787`. Prueba endpoints:

```bash
# Healthcheck
curl http://localhost:8787/health

# Trigger manual del sync
curl -X POST http://localhost:8787/sync \
  -H "X-Trigger-Secret: dev-local-trigger-only-for-testing-change-me"
```

El sync devuelve JSON con el resumen:
```json
{
  "ok": true,
  "startedAt": "2026-04-18T10:00:00.000Z",
  "durationMs": 4821,
  "categories": { "upserted": 12 },
  "products": { "fetched": 847, "upserted": 847, "deactivated": 3 }
}
```

## Deploy a producción

```bash
npm run deploy
```

Primera vez: wrangler te pedirá login (abre browser OAuth).
Las siguientes: directo.

Tras deploy, tendrás una URL tipo `https://groweldruida-ns-sync.<subdomain>.workers.dev`.
El cron arrancará solo según el schedule. Para trigger manual:

```bash
export WORKER_URL="https://groweldruida-ns-sync.<subdomain>.workers.dev"
export TRIGGER_SECRET="<el-que-pusiste-con-wrangler-secret-put>"
npm run trigger
```

## Ver logs en producción

```bash
npm run tail
```
Muestra stdout/stderr del Worker en tiempo real (incluye lo del cron).

## Cómo modificar la frecuencia

Edita `wrangler.toml` sección `[triggers]`:
```toml
crons = ["0 */6 * * *"]   # actual: cada 6h (00, 06, 12, 18 UTC)
# ejemplos:
# crons = ["0 3 * * *"]     # 1 vez al día a las 03:00 UTC
# crons = ["*/30 * * * *"]  # cada 30 min (agresivo, cuidado con rate limits)
```
Después `npm run deploy` para aplicar.

## Troubleshooting

**El sync falla con `NS /login failed 401`**
→ La API key expiró o es inválida. Regenera en portal Natural Systems.

**`Supabase upsert products failed: permission denied`**
→ La service_role key está mal o es la anon. Tiene que empezar por `sb_secret_` o el JWT
service_role legacy. Bypass RLS solo funciona con service_role, nunca con anon.

**`NS API 500 on /producto/getCatalogo`**
→ Problema del lado de NS, reintentar en 5 min. El cron lo volverá a intentar
automáticamente en la siguiente ejecución.

**Productos con `in_stock = false` pero stock >0 en NS**
→ La tabla `in_stock` es un campo GENERATED (computed) desde `stock`. Si stock >0 debe
ser true. Si no lo es, hay bug en el mapping.
