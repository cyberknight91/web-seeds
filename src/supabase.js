import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fbjgutmaulopjevoiqsb.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_qm8QfrXWNBGrYLXS3MuZvA_C3BM57_4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ============================================
// CATALOGO (productos desde Natural Systems sync)
// ============================================

/**
 * Mapea una fila de la tabla Supabase `products` al shape interno que usa el UI.
 * Si el nombre es igual al item_code significa que el catalogo NS no devolvio
 * nombre real (bug en /getCatalogo) y estamos en modo degradado.
 */
function mapDbProduct(row) {
  const isPlaceholder = row.name === row.item_code
  return {
    id: row.item_code,
    name: row.name,
    slug: row.slug,
    category: row.category_ns_id ?? 'all',
    brand: row.manufacturer ?? '',
    description: row.short_description ?? row.description ?? '',
    technicalDetails: row.technical_details ?? '',
    price: row.pvp ? Number(row.pvp) : (row.price ? Number(row.price) : 0),
    costPrice: row.price ? Number(row.price) : 0, // lo que pagas a NS (no mostrar)
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
} = {}) {
  let q = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('active', true)
    .order('in_stock', { ascending: false })
    .order('item_code', { ascending: true })
    .range(offset, offset + limit - 1)

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

/**
 * Fetch categorias desde Supabase.
 * Si NS no ha devuelto categorias aun (bug), devuelve []
 */
export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('ns_id, name, slug, parent_ns_id, position')
    .eq('active', true)
    .order('position', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('[fetchCategories] error:', error.message)
    return []
  }
  return data ?? []
}
