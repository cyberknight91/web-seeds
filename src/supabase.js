import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fbjgutmaulopjevoiqsb.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_qm8QfrXWNBGrYLXS3MuZvA_C3BM57_4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ============================================
// CATALOGO (productos sincronizados desde el proveedor vía Worker)
// ============================================

/**
 * Mapea una fila de la tabla Supabase `products` al shape interno que usa el UI.
 * Si el nombre es igual al item_code significa que el catalogo NS no devolvio
 * nombre real (bug en /getCatalogo) y estamos en modo degradado.
 */
function mapDbProduct(row) {
  const isPlaceholder = row.name === row.item_code
  // Nombre humanizado mientras NS no devuelva productName real:
  // "ABRA0004" -> "Referencia ABRA0004"
  const displayName = isPlaceholder ? `Referencia ${row.item_code}` : row.name
  return {
    id: row.item_code,
    name: displayName,
    rawName: row.name,
    slug: row.slug,
    category: row.category_ns_id ?? 'all',
    brand: row.manufacturer ?? '',
    description: row.short_description ?? row.description ?? '',
    technicalDetails: row.technical_details ?? '',
    price: row.pvp ? Number(row.pvp) : (row.price ? Number(row.price) : 0),
    stock: row.stock ?? 0,
    inStock: !!row.in_stock,
    image: Array.isArray(row.images) && row.images.length > 0 ? row.images[0] : '/images/logo.jpg',
    images: row.images ?? [],
    badge: row.badge ?? '',
    offer: !!row.offer,
    oldPrice: row.old_price ? Number(row.old_price) : null,
    uomCode: row.uom_code ?? '',
    weight: row.weight ? Number(row.weight) : null,
    width: row.width ? Number(row.width) : null,
    height: row.height ? Number(row.height) : null,
    length: row.length ? Number(row.length) : null,
    isPlaceholder, // true si aun no hay nombre real de NS
    type: 'grow', // mantenemos compat con codigo viejo que espera p.type
  }
}

/**
 * Fetch productos. Opciones:
 *  - category: filtra por category_ns_id (si NS devuelve categorias)
 *  - offersOnly: solo ofertas
 *  - search: busca en name/description
 *  - limit / offset: paginacion (default 50)
 *  - onlyInStock: solo con stock > 0
 */
export async function fetchProducts({
  category = null,
  offersOnly = false,
  search = null,
  limit = 50,
  offset = 0,
  onlyInStock = false,
  sort = 'default', // 'default' | 'price-asc' | 'price-desc'
} = {}) {
  let q = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('active', true)

  // Sort: usamos la columna generada `display_price` que ya tiene la logica
  // COALESCE(pvp>0 ? pvp : price). Asi el orden coincide con el precio mostrado.
  if (sort === 'price-asc') {
    q = q.order('in_stock', { ascending: false }).order('display_price', { ascending: true, nullsFirst: false })
  } else if (sort === 'price-desc') {
    q = q.order('in_stock', { ascending: false }).order('display_price', { ascending: false, nullsFirst: false })
  } else {
    q = q.order('in_stock', { ascending: false }).order('item_code', { ascending: true })
  }

  q = q.range(offset, offset + limit - 1)

  if (category && category !== 'all') q = q.eq('category_ns_id', category)
  if (offersOnly) q = q.eq('offer', true)
  if (onlyInStock) q = q.eq('in_stock', true)
  if (search) {
    // Busca en name/description via ILIKE (simple). Para full-text real habria
    // que crear RPC con tsquery; por ahora ILIKE va bien para volumenes < 10k.
    const pattern = `%${search}%`
    q = q.or(`name.ilike.${pattern},description.ilike.${pattern},short_description.ilike.${pattern},manufacturer.ilike.${pattern}`)
  }

  const { data, error, count } = await q
  if (error) {
    console.error('[fetchProducts] error:', error.message)
    return { products: [], total: 0, degraded: false }
  }

  const products = (data ?? []).map(mapDbProduct)
  // Si el primer producto es placeholder, asumimos modo degradado global
  const degraded = products.length > 0 && products[0].isPlaceholder
  return { products, total: count ?? products.length, degraded }
}

// Columnas públicas que viajan al navegador para productos destacados.
// Explícito para NO exponer `price` (coste de proveedor) ni `margin` (secreto
// comercial de Druida) aunque el ORDER BY use esas columnas internamente.
const FEATURED_SELECT =
  'item_code, name, slug, short_description, description, technical_details, manufacturer, ' +
  'category_ns_id, images, pvp, stock, in_stock, offer, old_price, badge, uom_code, ' +
  'weight, width, height, length, is_featured'

/**
 * Fetch de productos "destacados" para la home. Lógica en cascada:
 *   1) Marcados `is_featured = true` por Druida en el dashboard → van primero.
 *   2) Productos con MÁS MARGEN (pvp − price) que tengan stock → rellenan hasta `limit`.
 *   3) Ofertas activas (si sigue faltando).
 *   4) Fallback: cualquier producto con stock (catálogo pequeño).
 *
 * El margen lo calcula la columna generada `margin` (ver SQL migration).
 * Se excluye `price` y `margin` del select devuelto al cliente para no
 * filtrar el coste de proveedor.
 */
export async function fetchFeaturedProducts(limit = 8) {
  const need = () => limit - collected.length
  const collected = []
  const seen = new Set()
  const push = (rows) => {
    for (const row of rows ?? []) {
      if (collected.length >= limit) break
      if (seen.has(row.item_code)) continue
      seen.add(row.item_code)
      collected.push(row)
    }
  }

  // 1) Destacados manuales (Druida los fija desde Supabase).
  // Si la columna is_featured no existe aún (SQL migration pendiente),
  // capturamos y seguimos con los siguientes pasos.
  try {
    const { data, error } = await supabase
      .from('products')
      .select(FEATURED_SELECT)
      .eq('active', true)
      .eq('is_featured', true)
      .order('item_code', { ascending: true })
      .limit(limit)
    if (!error) push(data)
  } catch {/* columna aún no aplicada; continuar */}

  // 2) Más rentables (ordenados por margen DESC, pvp en rango razonable).
  // Igual: si la columna margin no existe aún, saltar al paso 3.
  if (need() > 0) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(FEATURED_SELECT)
        .eq('active', true)
        .eq('in_stock', true)
        .gte('display_price', 30)
        .lte('display_price', 500)
        .order('margin', { ascending: false })
        .limit(need() * 3)
      if (!error) {
        const top = (data ?? []).slice()
        for (let i = top.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[top[i], top[j]] = [top[j], top[i]]
        }
        push(top)
      }
    } catch {/* columna margin aún no aplicada; continuar */}
  }

  // 3) Ofertas activas
  if (need() > 0) {
    const { data } = await supabase
      .from('products')
      .select(FEATURED_SELECT)
      .eq('active', true)
      .eq('offer', true)
      .eq('in_stock', true)
      .limit(need())
    push(data)
  }

  // 4) Fallback extremo: lo que haya con stock
  if (need() > 0) {
    const { data } = await supabase
      .from('products')
      .select(FEATURED_SELECT)
      .eq('active', true)
      .eq('in_stock', true)
      .limit(need())
    push(data)
  }

  return collected.map(mapDbProduct)
}

/**
 * Fetch un producto por itemCode. Devuelve null si no existe o esta inactivo.
 */
export async function fetchProductByCode(itemCode) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .eq('item_code', itemCode)
    .maybeSingle()
  if (error) {
    console.error('[fetchProductByCode] error:', error.message)
    return null
  }
  return data ? mapDbProduct(data) : null
}

/**
 * Fetch categorias desde Supabase, solo aquellas con productos activos.
 * NS devuelve un árbol enorme (400+ nodos) con muchas ramas sin productos
 * directos. Filtrar aquí evita que la UI muestre filtros que no producen
 * resultados.
 */
export async function fetchCategories() {
  const [catsRes, idsRes] = await Promise.all([
    supabase
      .from('categories')
      .select('ns_id, name, slug, parent_ns_id, position')
      .eq('active', true)
      .order('name', { ascending: true }),
    supabase
      .from('products')
      .select('category_ns_id')
      .eq('active', true)
      .not('category_ns_id', 'is', null),
  ])

  if (catsRes.error) {
    console.error('[fetchCategories] error:', catsRes.error.message)
    return []
  }
  if (idsRes.error) {
    console.error('[fetchCategories] products error:', idsRes.error.message)
    return catsRes.data ?? []
  }

  const withProducts = new Set((idsRes.data ?? []).map((r) => r.category_ns_id))
  return (catsRes.data ?? []).filter((c) => withProducts.has(c.ns_id))
}
