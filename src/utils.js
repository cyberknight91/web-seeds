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
