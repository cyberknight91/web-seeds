/**
 * Cliente de email transaccional.
 * Default: Resend (https://resend.com) - 100 emails/dia gratis, API sencilla.
 *
 * Para cambiar a otro proveedor (Mailgun, Postmark, SES), solo modifica sendEmail().
 * El resto del codigo no necesita cambios.
 *
 * Setup:
 *  1. Crear cuenta en resend.com
 *  2. Verificar dominio groweldruida.es en resend (DNS records: SPF + DKIM)
 *  3. `wrangler secret put RESEND_API_KEY` con la API key
 *  4. `wrangler secret put SHOP_EMAIL` con el email de origen (ej. pedidos@groweldruida.es)
 *  5. `wrangler secret put SHOP_NOTIFY_EMAIL` con el email donde recibir notificaciones (Mario)
 */

export interface EmailEnv {
  RESEND_API_KEY: string;
  SHOP_EMAIL: string;           // From: pedidos@groweldruida.es
  SHOP_NOTIFY_EMAIL: string;    // To (interno): mario@groweldruida.es
}

export interface OrderItem {
  item_code: string;
  name: string;
  qty: number;
  price: number;
}

export interface OrderPayload {
  orderId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
    notes?: string;
  };
  items: OrderItem[];
  total: number;
  createdAt: string;
}

async function sendEmail(env: EmailEnv, params: {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: params.from,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        reply_to: params.replyTo,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '<no body>');
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }
    const data = await res.json() as { id: string };
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ============================================
// TEMPLATES
// ============================================

function formatPrice(n: number): string {
  return `${n.toFixed(2)} €`;
}

function itemsTable(items: OrderItem[]): string {
  const rows = items.map(it => `
    <tr>
      <td style="padding:10px 8px; border-bottom:1px solid #eee;">${escapeHtml(it.name)}</td>
      <td style="padding:10px 8px; border-bottom:1px solid #eee; font-family:monospace; color:#666; font-size:12px;">${escapeHtml(it.item_code)}</td>
      <td style="padding:10px 8px; border-bottom:1px solid #eee; text-align:center;">${it.qty}</td>
      <td style="padding:10px 8px; border-bottom:1px solid #eee; text-align:right;">${formatPrice(it.price)}</td>
      <td style="padding:10px 8px; border-bottom:1px solid #eee; text-align:right; font-weight:600;">${formatPrice(it.price * it.qty)}</td>
    </tr>
  `).join('');
  return `
    <table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:12px 8px; text-align:left; border-bottom:2px solid #333;">Producto</th>
          <th style="padding:12px 8px; text-align:left; border-bottom:2px solid #333;">Ref.</th>
          <th style="padding:12px 8px; text-align:center; border-bottom:2px solid #333;">Uds.</th>
          <th style="padding:12px 8px; text-align:right; border-bottom:2px solid #333;">Precio</th>
          <th style="padding:12px 8px; text-align:right; border-bottom:2px solid #333;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function customerConfirmationHtml(order: OrderPayload): string {
  const c = order.customer;
  return `
    <!DOCTYPE html>
    <html lang="es"><body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial, sans-serif;">
      <div style="max-width:600px; margin:0 auto; background:#fff;">
        <div style="background:linear-gradient(135deg, #1a0b2e 0%, #0f1b0f 100%); padding:32px 24px; text-align:center;">
          <h1 style="color:#00ff88; margin:0; font-size:28px; letter-spacing:2px;">GROW EL DRUIDA</h1>
          <p style="color:rgba(255,255,255,0.7); margin:8px 0 0; font-size:14px;">GROW SHOP PROFESIONAL</p>
        </div>
        <div style="padding:32px 24px; color:#222;">
          <h2 style="margin:0 0 16px; font-size:22px;">¡Gracias por tu pedido, ${escapeHtml(c.name)}!</h2>
          <p style="line-height:1.6; color:#444;">
            Hemos recibido tu pedido <strong>#${escapeHtml(order.orderId)}</strong>.
            En breve nos pondremos en contacto contigo por WhatsApp o email para confirmar los detalles y el pago.
          </p>

          <h3 style="margin:28px 0 12px; font-size:16px; color:#333; text-transform:uppercase; letter-spacing:1px;">Tu pedido</h3>
          ${itemsTable(order.items)}

          <div style="text-align:right; padding:16px 8px; font-size:18px; font-weight:600; border-top:2px solid #333;">
            Total: ${formatPrice(order.total)} <span style="font-size:12px; color:#888; font-weight:normal;">(IVA incluido)</span>
          </div>

          <h3 style="margin:28px 0 12px; font-size:16px; color:#333; text-transform:uppercase; letter-spacing:1px;">Datos de envío</h3>
          <p style="line-height:1.7; color:#444; margin:0;">
            <strong>${escapeHtml(c.name)}</strong><br>
            ${escapeHtml(c.address)}<br>
            ${escapeHtml(c.zip)} ${escapeHtml(c.city)}<br>
            ${escapeHtml(c.phone)}<br>
            ${escapeHtml(c.email)}
          </p>
          ${c.notes ? `<p style="background:#fff8e1; border-left:4px solid #ffc107; padding:12px 16px; margin:16px 0; line-height:1.6;"><strong>Notas:</strong> ${escapeHtml(c.notes)}</p>` : ''}

          <div style="background:#f8f8f8; padding:16px; border-radius:8px; margin:24px 0;">
            <p style="margin:0; font-size:14px; color:#555; line-height:1.6;">
              <strong>Siguiente paso:</strong> En las próximas 2-4 horas hábiles recibirás un mensaje nuestro
              con el método de pago y la confirmación del envío.
            </p>
          </div>

          <p style="text-align:center; margin:32px 0 0; color:#888; font-size:13px;">
            ¿Dudas? Responde a este email o escríbenos a
            <a href="mailto:info@groweldruida.es" style="color:#00a050;">info@groweldruida.es</a>
          </p>
        </div>
        <div style="padding:20px; text-align:center; background:#f8f8f8; color:#999; font-size:12px; border-top:1px solid #eee;">
          <p style="margin:0 0 6px;">Grow El Druida · Grow Shop Profesional</p>
          <p style="margin:0;">Este email se envió porque realizaste un pedido en nuestra tienda.</p>
        </div>
      </div>
    </body></html>
  `;
}

function internalNotifyHtml(order: OrderPayload): string {
  const c = order.customer;
  return `
    <!DOCTYPE html>
    <html lang="es"><body style="font-family:monospace; max-width:600px; margin:24px auto; color:#222;">
      <h2 style="color:#a00;">🔔 Nuevo pedido — #${escapeHtml(order.orderId)}</h2>
      <p><strong>Total: ${formatPrice(order.total)}</strong> · ${order.items.length} productos · ${escapeHtml(order.createdAt)}</p>

      <h3>Cliente</h3>
      <pre style="background:#f5f5f5; padding:12px; border-radius:4px;">
Nombre:    ${escapeHtml(c.name)}
Email:     ${escapeHtml(c.email)}
Teléfono:  ${escapeHtml(c.phone)}
Dirección: ${escapeHtml(c.address)}, ${escapeHtml(c.zip)} ${escapeHtml(c.city)}
${c.notes ? `\nNotas:     ${escapeHtml(c.notes)}` : ''}
      </pre>

      <h3>Líneas</h3>
      ${itemsTable(order.items)}

      <p style="margin-top:24px;">
        <a href="mailto:${escapeHtml(c.email)}?subject=Re:%20Pedido%20${escapeHtml(order.orderId)}"
           style="background:#00a050; color:#fff; padding:10px 16px; text-decoration:none; border-radius:4px;">
           Responder al cliente
        </a>
        &nbsp;
        <a href="https://wa.me/${c.phone.replace(/\\D/g, '')}?text=Hola%20${escapeHtml(c.name.split(' ')[0])},%20te%20escribimos%20por%20tu%20pedido%20${escapeHtml(order.orderId)}"
           style="background:#25d366; color:#fff; padding:10px 16px; text-decoration:none; border-radius:4px;">
           WhatsApp
        </a>
      </p>
    </body></html>
  `;
}

// ============================================
// API PUBLICA
// ============================================

export async function sendOrderEmails(env: EmailEnv, order: OrderPayload): Promise<{
  customer: { ok: boolean; id?: string; error?: string };
  internal: { ok: boolean; id?: string; error?: string };
}> {
  // Envia en paralelo el email al cliente + notificacion interna
  const [customer, internal] = await Promise.all([
    sendEmail(env, {
      from: `Grow El Druida <${env.SHOP_EMAIL}>`,
      to: order.customer.email,
      subject: `Pedido confirmado #${order.orderId} — Grow El Druida`,
      html: customerConfirmationHtml(order),
      replyTo: env.SHOP_EMAIL,
    }),
    sendEmail(env, {
      from: `Sistema <${env.SHOP_EMAIL}>`,
      to: env.SHOP_NOTIFY_EMAIL,
      subject: `[Pedido] #${order.orderId} — ${order.customer.name} — ${formatPrice(order.total)}`,
      html: internalNotifyHtml(order),
      replyTo: order.customer.email,
    }),
  ]);
  return { customer, internal };
}
