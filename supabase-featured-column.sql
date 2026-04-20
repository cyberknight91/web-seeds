-- =========================================================
-- Soporte de "Destacados" curados + ordenados por margen
-- =========================================================
-- Añade:
--   · is_featured  → Druida marca manualmente desde el dashboard de
--                    Supabase los productos que siempre aparecen en
--                    "Destacados".
--   · margin       → columna calculada (pvp - price). Permite ordenar
--                    productos por el dinero que gana Druida en cada
--                    venta, sin calcular en runtime.
--
-- Aplicar una sola vez en el SQL Editor de Supabase.
-- =========================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- Columna generada persistida. Postgres la recalcula automáticamente en
-- cada INSERT/UPDATE; el Worker de sync no necesita escribirla.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS margin NUMERIC
  GENERATED ALWAYS AS (COALESCE(pvp, 0) - COALESCE(price, 0)) STORED;

-- Índice parcial para destacados manuales (pocas filas, query instantánea).
CREATE INDEX IF NOT EXISTS idx_products_featured
  ON products (is_featured)
  WHERE is_featured = true;

-- Índice para ordenar por margen descendente en queries de "Destacados".
CREATE INDEX IF NOT EXISTS idx_products_margin_desc
  ON products (margin DESC)
  WHERE active = true AND in_stock = true;

-- Nota sobre seguridad: `price` y `margin` siguen siendo visibles con
-- la anon key (SELECT público). La query del frontend de "Destacados"
-- hace select explícito sin esas columnas para no devolverlas al cliente.
-- Si se quiere ocultar totalmente en el futuro, crear una VIEW pública
-- sin esas columnas y mover la anon policy a la vista.
