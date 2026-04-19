/**
 * Worker entrypoint.
 *
 * Triggers:
 *  - Cron (wrangler.toml): ejecuta syncCatalog() cada 6h
 *  - HTTP POST /sync: trigger manual (protegido con X-Trigger-Secret)
 *  - HTTP GET /health: healthcheck sin auth
 */

import { syncCatalog, type SyncEnv } from './sync';
import { sendOrderEmails, type EmailEnv, type OrderPayload } from './email';

interface Env extends SyncEnv, EmailEnv {
  TRIGGER_SECRET: string;
  ALLOWED_ORIGINS: string; // coma-separado: "https://groweldruida.es,http://localhost:5173"
}

function corsHeaders(env: Env, origin: string | null): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const allowOrigin = origin && allowed.includes(origin) ? origin : allowed[0] || '';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Trigger-Secret',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
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
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(env, origin);

    // Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // Healthcheck publico (util para verificar que el Worker vive)
    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true, service: 'groweldruida-worker', ts: new Date().toISOString() });
    }

    // Trigger manual del sync
    if (request.method === 'POST' && url.pathname === '/sync') {
      const secret = request.headers.get('X-Trigger-Secret');
      if (!secret || secret !== env.TRIGGER_SECRET) {
        return json({ ok: false, error: 'Unauthorized' }, 401);
      }
      const result = await syncCatalog(env);
      return json(result, result.ok ? 200 : 500);
    }

    // Envio de emails transaccionales tras checkout
    if (request.method === 'POST' && url.pathname === '/send-order-email') {
      try {
        const payload = await request.json() as OrderPayload;

        // Validacion minima para rechazar payloads corruptos
        if (!payload || !payload.orderId || !payload.customer?.email || !Array.isArray(payload.items)) {
          return new Response(JSON.stringify({ ok: false, error: 'Invalid payload' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...cors },
          });
        }
        // Anti-spam basico: max 50 items por pedido
        if (payload.items.length > 50) {
          return new Response(JSON.stringify({ ok: false, error: 'Too many items' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...cors },
          });
        }

        const result = await sendOrderEmails(env, payload);
        return new Response(JSON.stringify({
          ok: result.customer.ok && result.internal.ok,
          customer: result.customer,
          internal: result.internal,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ ok: false, error: msg }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }
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
