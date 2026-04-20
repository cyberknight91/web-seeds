/**
 * Natural Systems API client.
 * Docs: https://doc.api.naturalsystems.es/
 *
 * Flujo de auth: POST /login con {apiKey} -> JWT valido 24h.
 * Resto de endpoints: header `Authorization: Bearer <JWT>`.
 *
 * Nota: getCatalogo, getCategoria y los CSV exigen un body JSON `{"lang":1}`
 * en peticiones GET (documentado por el proveedor). `fetch` (y su shim
 * `node:https` dentro de workerd) prohiben body en GET, asi que esos
 * endpoints hablan HTTPS por TCP raw con cloudflare:sockets.
 */

import { connect } from 'cloudflare:sockets';

const NS_BASE = 'https://api.naturalsystems.es/api';
const NS_HOST = 'api.naturalsystems.es';
const NS_PORT = 443;

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
 * GET con body JSON sobre TCP raw + TLS. Necesario para getCatalogo/getCategoria/CSV
 * porque NS parsea `lang` desde el body aun siendo GET, y el runtime de Workers
 * (spec-compliant) descarta el body en requests GET.
 */
async function nsFetchWithBody<T>(path: string, jwt: string, body: object): Promise<T> {
  const bodyStr = JSON.stringify(body);
  const fullPath = new URL(`${NS_BASE}${path}`).pathname;
  const encoder = new TextEncoder();
  const bodyBytes = encoder.encode(bodyStr);

  const rawRequest =
    `GET ${fullPath} HTTP/1.1\r\n` +
    `Host: ${NS_HOST}\r\n` +
    `User-Agent: groweldruida-worker/1.0\r\n` +
    `Accept: application/json\r\n` +
    `Content-Type: application/json\r\n` +
    `Authorization: Bearer ${jwt}\r\n` +
    `Content-Length: ${bodyBytes.length}\r\n` +
    `Connection: close\r\n` +
    `\r\n` +
    bodyStr;

  const socket = connect(
    { hostname: NS_HOST, port: NS_PORT },
    { secureTransport: 'on', allowHalfOpen: false }
  );

  try {
    const writer = socket.writable.getWriter();
    await writer.write(encoder.encode(rawRequest));
    writer.releaseLock();

    const reader = socket.readable.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        total += value.length;
      }
    }
    reader.releaseLock();

    const full = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      full.set(c, offset);
      offset += c.length;
    }

    // Separar headers / body por \r\n\r\n
    let sepIdx = -1;
    for (let i = 0; i < full.length - 3; i++) {
      if (full[i] === 0x0d && full[i + 1] === 0x0a && full[i + 2] === 0x0d && full[i + 3] === 0x0a) {
        sepIdx = i;
        break;
      }
    }
    if (sepIdx === -1) throw new Error(`NS ${path}: respuesta HTTP malformada (sin separador)`);

    const headerText = new TextDecoder('latin1').decode(full.slice(0, sepIdx));
    const rawBody = full.slice(sepIdx + 4);

    const [statusLine, ...headerLines] = headerText.split('\r\n');
    const statusMatch = statusLine.match(/^HTTP\/\d\.\d (\d+)/);
    if (!statusMatch) throw new Error(`NS ${path}: status line invalida: ${statusLine}`);
    const status = parseInt(statusMatch[1], 10);

    const headers = new Map<string, string>();
    for (const line of headerLines) {
      const c = line.indexOf(':');
      if (c > 0) headers.set(line.slice(0, c).toLowerCase().trim(), line.slice(c + 1).trim());
    }

    const bodyBytesFinal =
      headers.get('transfer-encoding')?.toLowerCase() === 'chunked'
        ? decodeChunked(rawBody)
        : rawBody;
    const decodedBody = new TextDecoder('utf-8').decode(bodyBytesFinal);

    if (status >= 200 && status < 300) {
      try {
        return JSON.parse(decodedBody) as T;
      } catch (e) {
        throw new Error(`NS ${path}: JSON invalido (${status}): ${String(e)}`);
      }
    }
    throw new Error(`NS API ${status} on ${path}: ${decodedBody.slice(0, 200)}`);
  } finally {
    try {
      await socket.close();
    } catch {
      // socket ya cerrado por Connection: close
    }
  }
}

/**
 * Decodifica un body HTTP en `Transfer-Encoding: chunked` a un Uint8Array plano.
 */
function decodeChunked(data: Uint8Array): Uint8Array {
  const out: number[] = [];
  let offset = 0;
  while (offset < data.length) {
    // Leer tamano del chunk (linea hex terminada en \r\n)
    let crlf = -1;
    for (let i = offset; i < data.length - 1; i++) {
      if (data[i] === 0x0d && data[i + 1] === 0x0a) {
        crlf = i;
        break;
      }
    }
    if (crlf === -1) break;
    const sizeHex = new TextDecoder('latin1').decode(data.slice(offset, crlf)).split(';')[0].trim();
    const size = parseInt(sizeHex, 16);
    if (!isFinite(size) || size < 0) break;
    offset = crlf + 2;
    if (size === 0) break; // chunk terminal
    for (let j = 0; j < size; j++) out.push(data[offset + j]);
    offset += size + 2; // saltar \r\n tras chunk
  }
  return new Uint8Array(out);
}

/**
 * Variante tolerante para GET+body. Devuelve [] si falla el endpoint, asi
 * el sync no se cae si NS tiene una caida puntual en catalogo/categoria.
 */
async function nsFetchWithBodyTolerant<T>(
  path: string,
  jwt: string,
  body: object
): Promise<T[]> {
  try {
    const raw = await nsFetchWithBody<unknown>(path, jwt, body);
    return unwrap<T>(raw);
  } catch (err) {
    console.warn(
      `[ns-client] ${path} error: ${err instanceof Error ? err.message : String(err)}. Continuando con array vacio.`
    );
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

// Endpoints que requieren body JSON {"lang":1} incluso siendo GET.
// Tolerantes ante fallo puntual (devuelven [] y el sync continua).
export async function getCatalogo(jwt: string): Promise<NSProduct[]> {
  return nsFetchWithBodyTolerant<NSProduct>('/producto/getCatalogo', jwt, { lang: 1 });
}

export async function getCategoria(jwt: string): Promise<NSCategory[]> {
  return nsFetchWithBodyTolerant<NSCategory>('/producto/getCategoria', jwt, { lang: 1 });
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
