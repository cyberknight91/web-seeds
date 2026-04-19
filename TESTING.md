# Checklist de tests manuales — Web Mele

Manual E2E checklist para verificar antes de cada deploy. No hay tests automatizados
todavia; esto reemplaza ese hueco. Marca los checks que pasan, anota los que no.

## Preparacion

- [ ] `npm run dev` arranca sin errores en http://localhost:5173
- [ ] Consola del navegador sin errores rojos al cargar `/`
- [ ] Network tab: ninguna request devuelve 4xx/5xx en la carga inicial
- [ ] Lighthouse mobile score > 85 (run en DevTools → Lighthouse)

## 1. Navegacion & routing

- [ ] Home carga con hero + marquee + partners teaser + destacados (8 productos)
- [ ] Click "Entrar al catalogo →" → va a /grow
- [ ] Click "Ver partners" → va a /partners
- [ ] Nav desktop: Inicio, Grow Shop, Ofertas, Partners, Nosotros funcionan
- [ ] Nav mobile (hamburger): abre, cierra, click en link cierra menu
- [ ] Click en logo (header/footer) → vuelve a home
- [ ] Breadcrumbs en producto tienen estructura microformato (inspector DOM)

## 2. Catalogo (/grow)

- [ ] Cargan 50 productos iniciales (skeleton → contenido)
- [ ] Filtros de categoria cambian el listado
- [ ] Sort "Precio ascendente" ordena correctamente
- [ ] Sort "Precio descendente" ordena correctamente
- [ ] Toggle "Mostrar agotados" hace aparecer productos con stock 0
- [ ] Click "Cargar mas" pagina correctamente (offset += 50)
- [ ] Busqueda (header) filtra y muestra resultados
- [ ] Busqueda vacia → mensaje "no hay resultados"
- [ ] Banner degradado aparece SI NS API sigue rota
  - Actualmente: `/getCatalogo` 500 → esperado, banner visible

## 3. Producto detalle

- [ ] Click en una card → abre detalle
- [ ] URL cambia (canonical en `<head>` refleja producto)
- [ ] `<title>` cambia: "[Producto] — Grow El Druida"
- [ ] Meta description cambia (inspector: `document.querySelector('meta[name=description]').content`)
- [ ] OG tags cambian (inspector: `document.querySelector('meta[property="og:title"]').content`)
- [ ] JSON-LD Product presente en head (2 scripts `application/ld+json`)
  - Verificar en: https://search.google.com/test/rich-results (pegar URL cuando este en prod)
- [ ] Breadcrumbs: Inicio > Grow Shop > [codigo]
- [ ] Precio, stock, descripcion, codigo visibles
- [ ] Qty +/- funciona, max = stock
- [ ] "Anadir al carrito" suma al carrito + toast de confirmacion
- [ ] Si agotado: boton deshabilitado con texto "Agotado"
- [ ] "Volver al catalogo" → vuelve a /grow
- [ ] Al salir de producto, SEO se restaura al default (check en inspector)

## 4. Carrito

- [ ] Icono header muestra count correcto
- [ ] Click abre sidebar
- [ ] Items muestran: imagen, nombre, precio, qty
- [ ] +/- en cart actualiza subtotal
- [ ] X elimina item
- [ ] Total = suma de subtotales (IVA incluido)
- [ ] localStorage persiste entre refresh
- [ ] Cart vacio muestra "Tu carrito esta vacio"

## 5. Checkout

- [ ] Click "Finalizar compra" (sidebar) abre modal
- [ ] Step 1: form con validacion HTML5 (requires)
- [ ] Email invalido → bloqueado por navegador
- [ ] Step 2: resumen muestra items + totales correctos
- [ ] "Volver" regresa a step 1 sin perder datos
- [ ] "Enviar pedido por WhatsApp":
  - [ ] Guarda en Supabase (tabla `orders` + `order_items`)
  - [ ] Si `VITE_WORKER_URL` esta: manda POST a `/send-order-email`
    - [ ] Cliente recibe email de confirmacion (revisar bandeja)
    - [ ] Mario recibe email interno de notificacion
  - [ ] Abre wa.me con texto prellenado
  - [ ] Carrito se vacia
  - [ ] Step 3 "Pedido enviado"
- [ ] "Enviar pedido por Email": igual pero con mailto

## 6. Auth (Supabase)

- [ ] Boton "Iniciar Sesion" abre modal
- [ ] Tab Register: crear cuenta con email/password nuevo
- [ ] Email de confirmacion llega (Supabase Auth)
- [ ] Login con credenciales recien creadas
- [ ] Nav muestra nombre del usuario logueado
- [ ] Click en nombre → dropdown con "Mis pedidos" / "Perfil" / "Cerrar sesion"
- [ ] "Mis pedidos" lista pedidos del usuario
- [ ] "Perfil" permite editar telefono/direccion
- [ ] Checkout pre-rellena form con datos del perfil
- [ ] Cerrar sesion → nav vuelve a "Iniciar Sesion"

## 7. RGPD / Cookies

- [ ] Primera visita (incognito): banner cookies aparece
- [ ] Click "Aceptar todo" → banner desaparece
- [ ] Click "Solo esenciales" → banner desaparece, no se cargan analytics
- [ ] localStorage guarda la preferencia
- [ ] Footer enlaces: Aviso legal, Privacidad, Cookies, Terminos, Envios cargan
- [ ] Cada pagina legal tiene titulo, meta description, canonical

## 8. Performance

- [ ] Lighthouse Performance > 85
- [ ] LCP < 2.5s (hero logo)
- [ ] CLS < 0.1 (no layout shifts)
- [ ] Imagenes de productos: `loading="lazy"` (inspector)
- [ ] Preconnect a fonts.googleapis.com, fonts.gstatic.com, supabase visible en Network
- [ ] CSS < 100KB transferido (gzipped)
- [ ] JS bundle < 200KB transferido (gzipped)

## 9. SEO

- [ ] `/sitemap.xml` responde 200 con URLs validas
- [ ] `/robots.txt` responde 200 y referencia sitemap
- [ ] Google Rich Results test pasa para:
  - [ ] Home (Store)
  - [ ] Producto detalle (Product + BreadcrumbList)
- [ ] https://securityheaders.com/?q=groweldruida.es → nota minima A

## 10. Accesibilidad

- [ ] Lighthouse A11y > 90
- [ ] Tab navigation llega a todos los interactivos
- [ ] Focus ring visible en todos los botones/inputs
- [ ] Alt text en todas las imagenes
- [ ] Aria-labels en botones con solo icono (cart, close, etc.)
- [ ] Contrast ratio suficiente (DevTools → Rendering → Emulate vision deficiencies)

## 11. Edge cases

- [ ] Supabase caido (airplane mode): muestra "Error cargando catalogo" + retry
- [ ] API NS devuelve 500 en sync: Worker log no rompe, producto sigue igual
- [ ] Producto sin imagen: fallback a /images/logo.jpg
- [ ] Producto sin descripcion: campo oculto, layout no roto
- [ ] Stock = 0: boton agotado, no se puede anadir
- [ ] Cart con 1000 items: no peta (test estres manual)
- [ ] URL invalida (ej. /#producto/NOEXISTE): pagina "no encontrado" con volver

## 12. Cross-browser

- [ ] Chrome desktop (ultimo)
- [ ] Firefox desktop (ultimo)
- [ ] Safari desktop (si Mac disponible)
- [ ] Chrome Android
- [ ] Safari iOS
- [ ] Samsung Internet (importante en ES, alta cuota)

## 13. Cron del Worker NS

```bash
# Trigger manual para verificar que el sync funciona
cd worker
curl -X POST http://127.0.0.1:8787/sync \
  -H "X-Trigger-Secret: $(cat .dev.vars | grep TRIGGER_SECRET | cut -d= -f2)"
```

- [ ] Respuesta `{"ok": true, "products": {"upserted": N, ...}}`
- [ ] Supabase tabla `products`: N filas actualizadas con timestamp reciente
- [ ] Cron en prod (Cloudflare dashboard → Workers → schedule logs) ejecuta cada 6h

---

## Setup de servicios externos (una sola vez)

### Plausible (analytics RGPD-friendly)
1. Crear cuenta en https://plausible.io (9$/mes, 10k pageviews)
2. Anadir site: `groweldruida.es`
3. Descomentar el script `<script defer data-domain="groweldruida.es" src="https://plausible.io/js/script.js"></script>` en `index.html`
4. Deploy. Verificar en https://plausible.io/groweldruida.es que llegan pageviews.

**Alternativa gratis**: Cloudflare Web Analytics — descomentar esa linea en `index.html`, pegar el token desde dashboard CF.

### Resend (emails transaccionales)
1. Crear cuenta en https://resend.com (100 emails/dia gratis)
2. Anadir dominio `groweldruida.es`:
   - Anadir SPF record: `v=spf1 include:amazonses.com ~all`
   - Anadir DKIM records (3 CNAMEs que Resend te da)
   - Esperar verificacion (< 1h normalmente)
3. Crear API key desde el dashboard
4. En el worker:
   ```bash
   cd worker
   wrangler secret put RESEND_API_KEY     # pegar la API key
   wrangler secret put SHOP_EMAIL          # pedidos@groweldruida.es
   wrangler secret put SHOP_NOTIFY_EMAIL   # mario@groweldruida.es
   wrangler secret put ALLOWED_ORIGINS     # https://groweldruida.es
   ```
5. Deploy Worker: `wrangler deploy`
6. En el frontend, anadir a `.env.local`:
   ```
   VITE_WORKER_URL=https://tu-worker.workers.dev
   ```
7. Test: hacer un pedido de prueba, verificar que llegan los 2 emails.
