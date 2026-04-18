/**
 * Natural Systems API client.
 * Docs: https://doc.api.naturalsystems.es/
 *
 * Flujo de auth: POST /login con {apiKey} -> JWT valido 24h.
 * Resto de endpoints: header `Authorization: Bearer <JWT>`.
 */

const NS_BASE = 'https://api.naturalsystems.es/api';

export interface NSProduct {
  itemCode: string;
  productName?: string;
  category?: string;
  shortDescription?: string;
  description?: string;
  technicalDetails?: string;
  manufacturer?: string;
  images?: string[];
  price?: number;
  pvp?: number;
  stock?: number;
  uomCode?: string;
  weight?: number;
  width?: number;
  height?: number;
  length?: number;
  volume?: number;
  [key: string]: unknown; // por si NS devuelve campos extra
}

export interface NSCategory {
  id: string;
  name: string;
  parentId?: string | null;
  [key: string]: unknown;
}

export interface NSStockItem {
  itemCode: string;
  stock?: number;
  available?: number;
  [key: string]: unknown;
}

export interface NSPriceItem {
  itemCode: string;
  price?: number;
  pvp?: number;
  [key: string]: unknown;
}

export interface NSUomItem {
  itemCode: string;
  uomCode?: string;
  quantity?: string | number;
  weight?: string | number;
  width?: string | number;
  height?: string | number;
  length?: string | number;
  volume?: string | number;
  [key: string]: unknown;
}

async function nsFetch<T>(path: string, jwt: string): Promise<T> {
  const url = `${NS_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '<no body>');
    throw new Error(`NS API ${res.status} on ${path}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

/**
 * Variante tolerante a fallos: devuelve [] si la respuesta no es OK.
 * Usar para endpoints NS que actualmente fallan 500 por bug del proveedor
 * (getCatalogo, getCategoria). Log del warning para observabilidad.
 */
async function nsFetchTolerant<T>(path: string, jwt: string): Promise<T[]> {
  try {
    const url = `${NS_BASE}${path}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '<no body>');
      console.warn(`[ns-client] ${path} returned ${res.status}: ${body.slice(0, 120)}. Continuando con array vacio.`);
      return [];
    }
    const raw = await res.json();
    return unwrap<T>(raw);
  } catch (err) {
    console.warn(`[ns-client] ${path} fetch error: ${err instanceof Error ? err.message : String(err)}. Continuando con array vacio.`);
    return [];
  }
}

export async function login(apiKey: string): Promise<string> {
  const res = await fetch(`${NS_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ apiKey }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '<no body>');
    throw new Error(`NS /login failed ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { token?: string; jwt?: string; access_token?: string };
  // La doc no especifica el nombre exacto del campo; probamos los comunes
  const jwt = data.token ?? data.jwt ?? data.access_token;
  if (!jwt) {
    throw new Error(`NS /login no devolvio JWT. Response: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return jwt;
}

// Algunos endpoints NS pueden devolver `{ data: [...] }` o directamente `[...]`.
// Normalizamos.
function unwrap<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: T[] }).data;
  }
  if (raw && typeof raw === 'object' && Array.isArray((raw as { items?: unknown }).items)) {
    return (raw as { items: T[] }).items;
  }
  return [];
}

// Endpoints tolerantes (actualmente NS devuelve 500 en estos - bug proveedor).
// Cuando NS lo arregle, empezaran a devolver datos reales automaticamente.
export async function getCatalogo(jwt: string): Promise<NSProduct[]> {
  return nsFetchTolerant<NSProduct>('/producto/getCatalogo', jwt);
}

export async function getCategoria(jwt: string): Promise<NSCategory[]> {
  return nsFetchTolerant<NSCategory>('/producto/getCategoria', jwt);
}

// Endpoints estrictos (fallan => fallamos la sync completa).
export async function getStock(jwt: string): Promise<NSStockItem[]> {
  const raw = await nsFetch<unknown>('/producto/getStock', jwt);
  return unwrap<NSStockItem>(raw);
}

export async function getPrecio(jwt: string): Promise<NSPriceItem[]> {
  const raw = await nsFetch<unknown>('/producto/getPrecio', jwt);
  return unwrap<NSPriceItem>(raw);
}

export async function getUnidadMedida(jwt: string): Promise<NSUomItem[]> {
  const raw = await nsFetch<unknown>('/producto/getUnidadMedida', jwt);
  return unwrap<NSUomItem>(raw);
}
