-- =========================================================
-- FIX: pedidos de invitado (checkout sin cuenta)
-- =========================================================
-- Problema: la policy original "auth.uid() = user_id" bloquea
-- cualquier INSERT cuando el usuario no está autenticado (NULL = NULL
-- evalúa a FALSE en SQL). Los pedidos de guest se perdían en silencio.
--
-- Solución: permitir INSERT si
--   (A) usuario autenticado que inserta su propio user_id, o
--   (B) usuario anónimo (auth.uid() IS NULL) con user_id = NULL.
--
-- Aplicar en el SQL Editor de Supabase una sola vez.
-- =========================================================

-- orders
DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- order_items: permitir insertar items si el pedido padre es visible
-- para el mismo contexto (user logueado con su pedido, o anónimo con
-- pedido anónimo).
DROP POLICY IF EXISTS "Users can insert order items for own orders" ON order_items;
CREATE POLICY "Users can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (
          (auth.uid() IS NOT NULL AND orders.user_id = auth.uid())
          OR
          (auth.uid() IS NULL AND orders.user_id IS NULL)
        )
    )
  );
