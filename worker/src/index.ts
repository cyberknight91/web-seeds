/**
 * Worker entrypoint.
 *
 * Triggers:
 *  - Cron (wrangler.toml): ejecuta syncCatalog() cada 6h
 *  - HTTP POST /sync: trigger manual (protegido con X-Trigger-Secret)
 *  - HTTP GET /health: healthcheck sin auth
 */

import { syncCatalog, type SyncEnv } from './sync';

interface Env extends SyncEnv {
  TRIGGER_SECRET: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export default {
  // HTTP handler
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Healthcheck publico (util para verificar que el Worker vive)
    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true, service: 'groweldruida-ns-sync', ts: new Date().toISOString() });
    }

    // Trigger manual del sync
    if (request.method === 'POST' && url.pathname === '/sync') {
      const secret = request.headers.get('X-Trigger-Secret');
      if (!secret || secret !== env.TRIGGER_SECRET) {
        return json({ ok: false, error: 'Unauthorized' }, 401);
      }

      // Si la sync es larga (>30s en CPU), usar waitUntil para no bloquear respuesta
      // De momento es sincrono porque queremos devolver el resultado al caller
      const result = await syncCatalog(env);
      return json(result, result.ok ? 200 : 500);
    }

    return json({ ok: false, error: 'Not found' }, 404);
  },

  // Cron handler (cada 6h segun wrangler.toml)
  async scheduled(controller: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    console.log(`[cron] Starting sync at ${new Date().toISOString()} (${controller.cron})`);
    const result = await syncCatalog(env);
    if (result.ok) {
      console.log(
        `[cron] Sync OK in ${result.durationMs}ms — products: ${result.products.upserted} upserted, ${result.products.deactivated} deactivated, categories: ${result.categories.upserted}`
      );
    } else {
      console.error(`[cron] Sync FAILED after ${result.durationMs}ms: ${result.error}`);
      // Si falla, podemos reintentar o alertar. De momento solo log.
      // Cloudflare reintenta automaticamente las scheduled que lanzan excepcion,
      // pero nosotros capturamos el error en syncCatalog y devolvemos ok:false.
      // Para forzar reintento, throw:
      // throw new Error(result.error);
    }
  },
} satisfies ExportedHandler<Env>;
