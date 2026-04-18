-- ============================================================================
-- Migration: Products + Categories (Natural Systems sync)
-- ============================================================================
-- Fase 2 del plan de integración con API de Natural Systems.
-- Aplica este archivo en Supabase SQL Editor (Database -> SQL Editor -> New query).
--
-- Idempotente: se puede ejecutar múltiples veces sin romper nada.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabla: categories
-- Árbol de categorías sincronizado desde /producto/getCategoria
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id            BIGSERIAL PRIMARY KEY,
  ns_id         TEXT UNIQUE NOT NULL,            -- ID que da NS
  name          TEXT NOT NULL,
  parent_ns_id  TEXT REFERENCES public.categories(ns_id) ON DELETE SET NULL,
  slug          TEXT,                             -- slug normalizado para URLs
  position      INTEGER DEFAULT 0,                -- orden para mostrar
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  synced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent   ON public.categories(parent_ns_id);
CREATE INDEX IF NOT EXISTS idx_categories_active   ON public.categories(active);
CREATE INDEX IF NOT EXISTS idx_categories_position ON public.categories(position);

-- ----------------------------------------------------------------------------
-- Tabla: products
-- Productos sincronizados desde /producto/getCatalogo + getStock + getPrecio
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id                 BIGSERIAL PRIMARY KEY,
  item_code          TEXT UNIQUE NOT NULL,          -- referencia NS (itemCode)
  name               TEXT NOT NULL,                 -- productName
  slug               TEXT UNIQUE,                   -- para URLs amigables
  short_description  TEXT,
  description        TEXT,
  technical_details  TEXT,
  manufacturer       TEXT,
  category_ns_id     TEXT REFERENCES public.categories(ns_id) ON DELETE SET NULL,
  images             TEXT[] DEFAULT ARRAY[]::TEXT[],-- array de URLs
  price              NUMERIC(10,2),                 -- precio cliente (tarifa)
  pvp                NUMERIC(10,2),                 -- PVP sugerido
  stock              INTEGER DEFAULT 0,
  in_stock           BOOLEAN GENERATED ALWAYS AS (stock > 0) STORED,
  uom_code           TEXT,                          -- unidad: CAJA, PALET, UD
  weight             NUMERIC(10,3),
  width              NUMERIC(10,2),
  height             NUMERIC(10,2),
  length             NUMERIC(10,2),
  volume             NUMERIC(10,3),
  offer              BOOLEAN NOT NULL DEFAULT FALSE,-- marcar oferta (manual o auto)
  old_price          NUMERIC(10,2),                 -- precio antes de oferta
  badge              TEXT,                          -- 'NUEVO', 'TOP', etc. (manual)
  active             BOOLEAN NOT NULL DEFAULT TRUE, -- visible en tienda
  synced_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category  ON public.products(category_ns_id);
CREATE INDEX IF NOT EXISTS idx_products_active    ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_products_in_stock  ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_offer     ON public.products(offer);
CREATE INDEX IF NOT EXISTS idx_products_synced    ON public.products(synced_at);

-- Búsqueda full-text en nombre + descripción
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products
  USING GIN (to_tsvector('spanish',
    COALESCE(name, '') || ' ' ||
    COALESCE(short_description, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(manufacturer, '')
  ));

-- ----------------------------------------------------------------------------
-- RLS (Row Level Security)
-- ----------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products   ENABLE ROW LEVEL SECURITY;

-- Lectura pública (cualquier usuario anon puede leer productos activos)
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT
  USING (active = TRUE);

DROP POLICY IF EXISTS "products_public_read" ON public.products;
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT
  USING (active = TRUE);

-- Escritura SOLO para service_role (el Worker de sync usa este rol).
-- Los usuarios autenticados NO pueden modificar el catálogo.
-- Postgres lo aplica automáticamente: service_role bypass RLS; anon/authenticated
-- no tienen policy de INSERT/UPDATE/DELETE, así que no pueden.

-- ----------------------------------------------------------------------------
-- Función helper: touch synced_at al actualizar
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_synced_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.synced_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_touch ON public.products;
CREATE TRIGGER trg_products_touch
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_synced_at();

DROP TRIGGER IF EXISTS trg_categories_touch ON public.categories;
CREATE TRIGGER trg_categories_touch
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_synced_at();

-- ----------------------------------------------------------------------------
-- Verificación rápida (descomentar para ejecutar)
-- ----------------------------------------------------------------------------
-- SELECT count(*) AS categorias FROM public.categories;
-- SELECT count(*) AS productos  FROM public.products;
-- SELECT count(*) AS activos, count(*) FILTER (WHERE in_stock) AS con_stock FROM public.products;
