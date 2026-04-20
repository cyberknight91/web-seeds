// Utilidades compartidas.

/**
 * Escapa HTML para evitar XSS al inyectar datos en innerHTML.
 * Uso obligado para cualquier string que venga de Supabase o input de usuario.
 */
export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Formato de precio en euros con 2 decimales. */
export function formatEur(n) {
  const num = typeof n === 'number' ? n : parseFloat(n);
  if (!isFinite(num)) return '0.00 €';
  return `${num.toFixed(2)} €`;
}

// ============================================
// POLÍTICA DE ENVÍOS Y PEDIDO MÍNIMO
// ============================================

/** Pedido mínimo absoluto. Evita que Stripe se coma el margen en carritos ridículos. */
export const MIN_ORDER_VALUE = 20;

/** Umbral a partir del cual el envío pasa a ser gratuito. */
export const FREE_SHIPPING_FROM = 50;

/** Coste de envío por debajo del umbral de gratuidad. */
export const FLAT_SHIPPING_COST = 4.9;

/**
 * Calcula el coste de envío y metadatos (si es gratis, cuánto falta para
 * llegar al umbral de gratuidad). `subtotal` es el importe del carrito.
 */
export function computeShipping(subtotal) {
  const sub = Number(subtotal) || 0;
  if (sub >= FREE_SHIPPING_FROM) {
    return { cost: 0, free: true, remainingForFree: 0 };
  }
  return {
    cost: FLAT_SHIPPING_COST,
    free: false,
    remainingForFree: Math.max(0, FREE_SHIPPING_FROM - sub),
  };
}

/** True si el subtotal alcanza el pedido mínimo. */
export function meetsMinOrder(subtotal) {
  return (Number(subtotal) || 0) >= MIN_ORDER_VALUE;
}
