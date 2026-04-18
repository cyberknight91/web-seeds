/**
 * Sync orchestration: Natural Systems -> Supabase.
 *
 * Pipeline:
 *  1. Login -> JWT
 *  2. Fetch categoria, catalogo, stock, precio (en paralelo)
 *  3. Merge por itemCode: un producto completo combina los 4 endpoints
 *  4. Upsert categorias
 *  5. Upsert productos
 *  6. Soft-delete: marca inactive los productos que estaban en DB pero ya no vienen de NS
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  login,
  getCatalogo,
  getCategoria,
  getStock,
  getPrecio,
  getUnidadMedida,
  type NSProduct,
  type NSCategory,
  type NSStockItem,
  type NSPriceItem,
  type NSUomItem,
} from './ns-client';

export interface SyncEnv {
  NS_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export interface SyncResult {
  ok: boolean;
  startedAt: string;
  durationMs: number;
  degraded: boolean; // true si falto getCatalogo/getCategoria (bug NS)
  categories: { upserted: number };
  products: {
    fetched: number;
    upserted: number;
    deactivated: number;
  };
  error?: string;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

/**
 * Pick la unidad de medida base (Unidad/UD) para un itemCode.
 * UoM devuelve varias filas por item (Unidad, Caja, Palet). Queremos la "base".
 */
function pickBaseUom(uoms: NSUomItem[]): NSUomItem | undefined {
  // Preferencia: "Unidad" > "UD" > la primera
  const unidad = uoms.find((u) => u.uomCode === 'Unidad');
  if (unidad) return unidad;
  const ud = uoms.find((u) => u.uomCode === 'UD');
  if (ud) return ud;
  return uoms[0];
}

/**
 * Merge multi-fuente. Funciona tanto con catalog real como vacio (degradado):
 *  - Si catalog viene: base = catalog, se enriquece con stock/precio/uom
 *  - Si catalog vacio: base = union de todos los itemCodes vistos en stock/precio/uom,
 *    productName = itemCode como placeholder (se actualiza cuando NS arregle catalog)
 */
function mergeProducts(
  catalog: NSProduct[],
  stock: NSStockItem[],
  prices: NSPriceItem[],
  uoms: NSUomItem[]
): NSProduct[] {
  const stockByCode = new Map(stock.map((s) => [s.itemCode, s]));
  const priceByCode = new Map(prices.map((p) => [p.itemCode, p]));

  // Agrupar UoM por itemCode (varias filas por item)
  const uomsByCode = new Map<string, NSUomItem[]>();
  for (const u of uoms) {
    const arr = uomsByCode.get(u.itemCode) ?? [];
    arr.push(u);
    uomsByCode.set(u.itemCode, arr);
  }

  // Set de todos los itemCodes (union de fuentes que funcionan)
  const allCodes = new Set<string>([
    ...catalog.map((p) => p.itemCode),
    ...stock.map((s) => s.itemCode),
    ...prices.map((p) => p.itemCode),
    ...uoms.map((u) => u.itemCode),
  ]);

  // Catalog indexado para lookup rapido
  const catalogByCode = new Map(catalog.map((p) => [p.itemCode, p]));

  const result: NSProduct[] = [];
  for (const code of allCodes) {
    const cat = catalogByCode.get(code);
    const s = stockByCode.get(code);
    const pr = priceByCode.get(code);
    const baseUom = pickBaseUom(uomsByCode.get(code) ?? []);

    result.push({
      itemCode: code,
      productName: cat?.productName ?? code, // placeholder si no hay catalog
      category: cat?.category,
      shortDescription: cat?.shortDescription,
      description: cat?.description,
      technicalDetails: cat?.technicalDetails,
      manufacturer: cat?.manufacturer,
      images: cat?.images ?? [],
      stock: s?.stock ?? s?.available ?? 0,
      price: pr?.price ?? cat?.price,
      pvp: pr?.pvp ?? cat?.pvp,
      uomCode: baseUom?.uomCode ?? cat?.uomCode,
      weight: baseUom ? Number(baseUom.weight) || undefined : cat?.weight,
      width: baseUom ? Number(baseUom.width) || undefined : cat?.width,
      height: baseUom ? Number(baseUom.height) || undefined : cat?.height,
      length: baseUom ? Number(baseUom.length) || undefined : cat?.length,
      volume: baseUom ? Number(baseUom.volume) || undefined : cat?.volume,
    });
  }
  return result;
}

function mapCategoryToRow(c: NSCategory) {
  return {
    ns_id: String(c.id),
    name: c.name,
    parent_ns_id: c.parentId ? String(c.parentId) : null,
    slug: slugify(c.name),
    active: true,
  };
}

function mapProductToRow(p: NSProduct) {
  // Normaliza numericos que a veces vienen como string
  const num = (v: unknown): number | null => {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return isFinite(n) ? n : null;
  };
  const images: string[] = Array.isArray(p.images)
    ? p.images.filter((x): x is string => typeof x === 'string')
    : [];

  return {
    item_code: p.itemCode,
    name: p.productName ?? p.itemCode,
    slug: slugify(`${p.productName ?? p.itemCode}-${p.itemCode}`),
    short_description: p.shortDescription ?? null,
    description: p.description ?? null,
    technical_details: p.technicalDetails ?? null,
    manufacturer: p.manufacturer ?? null,
    category_ns_id: p.category ? String(p.category) : null,
    images,
    price: num(p.price),
    pvp: num(p.pvp),
    stock: Math.max(0, Math.floor(num(p.stock) ?? 0)),
    uom_code: p.uomCode ?? null,
    weight: num(p.weight),
    width: num(p.width),
    height: num(p.height),
    length: num(p.length),
    volume: num(p.volume),
    active: true,
  };
}

async function upsertCategories(
  supabase: SupabaseClient,
  categories: NSCategory[]
): Promise<number> {
  if (categories.length === 0) return 0;
  const rows = categories.map(mapCategoryToRow);
  const { error } = await supabase.from('categories').upsert(rows, {
    onConflict: 'ns_id',
    ignoreDuplicates: false,
  });
  if (error) throw new Error(`Supabase upsert categories failed: ${error.message}`);
  return rows.length;
}

async function upsertProducts(
  supabase: SupabaseClient,
  products: NSProduct[]
): Promise<number> {
  if (products.length === 0) return 0;
  const rows = products.map(mapProductToRow);
  // Upsert en batches de 500 para no exceder limites de payload
  const BATCH = 500;
  let count = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase.from('products').upsert(chunk, {
      onConflict: 'item_code',
      ignoreDuplicates: false,
    });
    if (error) throw new Error(`Supabase upsert products batch ${i}: ${error.message}`);
    count += chunk.length;
  }
  return count;
}

async function deactivateMissingProducts(
  supabase: SupabaseClient,
  activeItemCodes: Set<string>
): Promise<number> {
  // Productos que tenemos en DB pero ya no vienen de NS -> marcar inactive
  const { data: current, error } = await supabase
    .from('products')
    .select('item_code')
    .eq('active', true);
  if (error) throw new Error(`Fetch current products: ${error.message}`);
  const toDeactivate = (current ?? [])
    .map((r) => r.item_code as string)
    .filter((code) => !activeItemCodes.has(code));

  if (toDeactivate.length === 0) return 0;

  const { error: updErr } = await supabase
    .from('products')
    .update({ active: false })
    .in('item_code', toDeactivate);
  if (updErr) throw new Error(`Deactivate missing: ${updErr.message}`);
  return toDeactivate.length;
}

export async function syncCatalog(env: SyncEnv): Promise<SyncResult> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();

  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // 1. Login
    const jwt = await login(env.NS_API_KEY);

    // 2. Fetch paralelo (getCatalogo y getCategoria son tolerantes; los demas fallan duro)
    const [catalog, categories, stock, prices, uoms] = await Promise.all([
      getCatalogo(jwt),
      getCategoria(jwt),
      getStock(jwt),
      getPrecio(jwt),
      getUnidadMedida(jwt),
    ]);

    const degraded = catalog.length === 0 || categories.length === 0;
    if (degraded) {
      console.warn(
        `[sync] Modo degradado: catalog=${catalog.length}, categories=${categories.length}. ` +
          `Stock=${stock.length}, precios=${prices.length}, uoms=${uoms.length}. ` +
          `Construyendo productos desde stock/precio/uom con nombre placeholder.`
      );
    }

    // 3. Merge
    const merged = mergeProducts(catalog, stock, prices, uoms);

    // 4. Upserts
    const catsCount = await upsertCategories(supabase, categories);
    const prodCount = await upsertProducts(supabase, merged);

    // 5. Soft-delete
    const activeCodes = new Set(merged.map((p) => p.itemCode));
    const deactivated = await deactivateMissingProducts(supabase, activeCodes);

    return {
      ok: true,
      startedAt,
      durationMs: Date.now() - t0,
      degraded,
      categories: { upserted: catsCount },
      products: {
        fetched: merged.length,
        upserted: prodCount,
        deactivated,
      },
    };
  } catch (err) {
    return {
      ok: false,
      startedAt,
      durationMs: Date.now() - t0,
      degraded: false,
      categories: { upserted: 0 },
      products: { fetched: 0, upserted: 0, deactivated: 0 },
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
