// ============================================
// CATALOGO GROW SHOP - Leido en vivo desde Supabase
// (rellenado por el Worker de sync NS https://worker/...)
// ============================================
//
// Antes: arrays hardcoded con productos manuales.
// Ahora: state mutable que se rellena async via loadProducts().
//
// main.js llama loadProducts() durante init(), luego otros modulos
// importan `growProducts` / `allProducts` para lectura sincrona.

import { fetchProducts as fetchFromSupabase, fetchCategories as fetchCats } from '../supabase.js'

// State (se muta tras el primer loadProducts)
export let growProducts = []
export let allProducts = []
export let degradedMode = false // true si catalogo NS aun devuelve nombres = itemCode
export let totalProductCount = 0 // cuantos hay en total (con paginacion)

/**
 * Carga una pagina de productos desde Supabase.
 * Por defecto trae los primeros 50 (ordenados por in_stock desc, item_code asc).
 * Para mas, pasar offset.
 *
 * Muta growProducts + allProducts. Devuelve la misma lista ya mapeada.
 */
export async function loadProducts(opts = {}) {
  const { products, total, degraded } = await fetchFromSupabase({
    limit: opts.limit ?? 50,
    offset: opts.offset ?? 0,
    category: opts.category ?? null,
    offersOnly: opts.offersOnly ?? false,
    search: opts.search ?? null,
    onlyInStock: opts.onlyInStock ?? false,
  })

  growProducts = products
  allProducts = products
  degradedMode = degraded
  totalProductCount = total
  return { products, total, degraded }
}

// Category list — array de tuplas [key, label] para preservar orden de "Todo" primero.
// (Object con keys numéricas las reordena en JS y mandaba "Todo" al final.)
export let growCategories = [['all', 'Todo']]

/**
 * Carga categorías desde Supabase. Solo incluye las que tienen productos
 * activos (el filtrado lo hace fetchCategories en supabase.js).
 */
export async function loadCategories() {
  const rows = await fetchCats()
  const list = [['all', 'Todo']]
  for (const row of rows) {
    list.push([row.ns_id, row.name])
  }
  growCategories = list
  return growCategories
}
