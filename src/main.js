import './style.css';
import {
  growProducts,
  growCategories,
  loadProducts,
  loadCategories,
  degradedMode,
  totalProductCount,
} from './data/products.js';
import { fetchProducts, fetchProductByCode, fetchFeaturedProducts } from './supabase.js';
import { cart, renderCart, showToast } from './cart.js';
// createSmokeParticles — desactivado: el contenedor está oculto en CSS ({display:none})
// para el look pro y el interval spawneaba nodos DOM inútiles cada 2 s.
import { initAuth, getCurrentUser, getProfile, updateProfile } from './auth.js';
import { saveOrder, getMyOrders } from './orders.js';
import { initCookieBanner } from './cookies.js';
import { esc, computeShipping, meetsMinOrder, MIN_ORDER_VALUE, FREE_SHIPPING_FROM } from './utils.js';

// ============================================
// APP STATE
// ============================================
let currentPage = 'home';
let currentFilter = 'all';

// Productos destacados del home. Se rellenan en init() con la lógica
// en cascada de fetchFeaturedProducts (manual → margen → ofertas → fallback).
let homeFeatured = [];

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
  document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      const filter = link.dataset.filter || 'all';
      navigateTo(page, filter);
    });
  });

  // Mobile menu toggle
  const menuToggle = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  menuToggle.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
  });

  // Search
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query) {
        renderSearchResults(query);
        searchInput.value = '';
      }
    }
  });

  document.querySelector('.search-btn').addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      renderSearchResults(query);
      searchInput.value = '';
    }
  });
}

function navigateTo(page, filter = 'all', extra = null) {
  currentPage = page;
  currentFilter = filter;

  // Update active nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  // Close mobile nav
  document.getElementById('mobile-nav').classList.remove('open');

  // Restaura SEO por defecto al salir de producto. renderProductDetail se encarga de
  // sobrescribirlo de nuevo con los datos especificos cuando se entra.
  if (page !== 'product' && typeof resetSEOToDefault === 'function') {
    resetSEOToDefault();
  }

  // Render page
  switch (page) {
    case 'home': renderHomePage(); break;
    case 'grow': renderGrowPage(filter); break;
    case 'offers': renderOffersPage(); break;
    case 'about': renderAboutPage(); break;
    case 'partners': renderPartnersPage(); break;
    case 'orders': renderOrdersPage(); break;
    case 'profile': renderProfilePage(); break;
    case 'product': renderProductDetail(extra ?? filter); break;
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// RENDER PAGES
// ============================================
function renderHomePage() {
  const app = document.getElementById('app');
  const featuredGrow = homeFeatured.length > 0 ? homeFeatured : growProducts.slice(0, 8);

  app.innerHTML = `
    <!-- HERO -->
    <section class="hero-section">
      <div class="hero-content fade-in">
        <img src="/images/logo.jpg" alt="Grow El Druida" class="hero-logo" fetchpriority="high" />
        <h2 class="hero-title">GROW EL DRUIDA</h2>
        <p class="hero-subtitle">Todo lo que tu cultivo necesita. <strong>Stock real</strong> y envío discreto en 24-48h a toda España.</p>
        <div class="hero-badges">
          <span class="hero-badge">+${totalProductCount} productos</span>
          <span class="hero-badge">Envío 24-48h</span>
          <span class="hero-badge">Stock en directo</span>
          <span class="hero-badge">Marcas premium</span>
        </div>
        <div class="hero-cta">
          <a href="#" class="btn btn-primary" data-page="grow">Entrar al catálogo →</a>
          <a href="#" class="btn btn-secondary" data-page="about">Sobre nosotros</a>
        </div>
      </div>
    </section>

    <!-- MARQUEE -->
    <div class="marquee-banner">
      <span class="marquee-text">
        ENVÍO GRATIS A PARTIR DE 50€ --- OFERTAS SEMANALES --- GROW SHOP COMPLETO --- LED, FERTILIZANTES, SUSTRATOS, CONTROL DE CLIMA Y MÁS ---
      </span>
    </div>

    ${degradedMode ? renderDegradedBanner() : ''}

    <!-- POR QUÉ NOSOTROS -->
    <section class="partners-section" style="padding: 64px 20px;">
      <div class="partners-wrap">
        <div class="partners-head">
          <span class="eyebrow">Por qué Grow El Druida</span>
          <h2>Cultivo profesional, stock real y envío rápido</h2>
          <p>Más de <strong>3.000 referencias</strong> de cultivo técnico: iluminación LED, fertilizantes, sustratos, control de clima y medición. <strong>Stock en directo</strong> y envío discreto 24-48h a toda España. Trabajamos con las marcas que de verdad rinden en cultivo intensivo.</p>
        </div>
        <div style="text-align:center;">
          <a href="#" class="btn btn-primary" data-page="grow">Ver catálogo completo →</a>
        </div>
      </div>
    </section>

    <!-- FEATURED GROW -->
    <section class="products-section">
      <h2 class="section-title">DESTACADOS</h2>
      <p class="section-subtitle">${totalProductCount} productos en nuestro catálogo</p>
      <div class="product-grid">
        ${featuredGrow.map(p => renderGrowCard(p)).join('')}
      </div>
      <div style="text-align: center; margin-top: 32px;">
        <a href="#" class="btn btn-primary" data-page="grow">Ver todo el Grow Shop (${totalProductCount})</a>
      </div>
    </section>
  `;

  bindProductEvents();
  bindNavigationEvents();
}

function renderDegradedBanner() {
  return `
    <div class="degraded-banner" role="status" aria-live="polite">
      <div class="degraded-banner-inner">
        <span class="degraded-banner-icon" aria-hidden="true">&#9881;</span>
        <p>
          <strong>Actualizando catalogo.</strong>
          Nombres definitivos, descripciones e imagenes de producto estaran
          disponibles en breve. Precios y stock son reales y fiables.
        </p>
      </div>
    </div>
  `;
}

// Estado persistente entre renders. Se resetea al cambiar filtro u opciones.
let growPageState = {
  filter: 'all',
  offset: 0,
  products: [],
  total: 0,
  degraded: false,
  sort: 'default',     // 'default' | 'price-asc' | 'price-desc'
  showOutOfStock: false, // por defecto oculta agotados
  search: '',          // texto del buscador en /grow
}
const PAGE_SIZE = 50

async function renderGrowPage(filter = 'all', opts = {}) {
  const app = document.getElementById('app');

  // Si cambia filtro/sort/stock/search -> reset
  const optsChanged =
    (opts.sort !== undefined && opts.sort !== growPageState.sort) ||
    (opts.showOutOfStock !== undefined && opts.showOutOfStock !== growPageState.showOutOfStock) ||
    (opts.search !== undefined && opts.search !== growPageState.search)
  if (growPageState.filter !== filter || optsChanged) {
    growPageState = {
      filter,
      offset: 0,
      products: [],
      total: 0,
      degraded: false,
      sort: opts.sort ?? growPageState.sort,
      showOutOfStock: opts.showOutOfStock ?? growPageState.showOutOfStock,
      search: opts.search ?? growPageState.search,
    }
  }

  // Skeletons en primer render
  if (growPageState.products.length === 0) {
    app.innerHTML = `
      <section class="hero-section" style="padding: 40px 20px; background: linear-gradient(135deg, var(--purple-dark) 0%, var(--green-dark) 100%);">
        <div class="hero-content">
          <h2 class="hero-title" style="font-size: 3rem;">GROW SHOP</h2>
          <p class="hero-subtitle">Cargando catalogo...</p>
        </div>
      </section>
      <section class="products-section">
        <div class="product-grid">${renderSkeletonCards(8)}</div>
      </section>
    `;
  }

  const { products, total, degraded } = await fetchProducts({
    category: filter === 'all' ? null : filter,
    limit: PAGE_SIZE,
    offset: growPageState.offset,
    onlyInStock: !growPageState.showOutOfStock,
    sort: growPageState.sort,
    search: growPageState.search || null,
  });
  growPageState.products = growPageState.products.concat(products);
  growPageState.total = total;
  growPageState.degraded = degraded;

  app.innerHTML = `
    <section class="hero-section" style="padding: 40px 20px; background: linear-gradient(135deg, var(--purple-dark) 0%, var(--green-dark) 100%);">
      <div class="hero-content">
        <h2 class="hero-title" style="font-size: 3rem;">GROW SHOP</h2>
        <p class="hero-subtitle">${total} productos · Todo lo que necesitas para tu cultivo</p>
      </div>
    </section>

    ${degraded ? renderDegradedBanner() : ''}

    <section class="products-section">
      <div class="catalog-search">
        <input
          type="search"
          id="grow-search-input"
          placeholder="Buscar en el catálogo (nombre, descripción, marca, código...)"
          value="${esc(growPageState.search || '')}"
          autocomplete="off"
          aria-label="Buscar productos en el catálogo"
        />
        ${growPageState.search ? `<button type="button" id="grow-search-clear" class="catalog-search-clear" aria-label="Limpiar búsqueda">&times;</button>` : ''}
      </div>
      <div class="catalog-controls">
        <label class="catalog-control">
          Categoría:
          <select id="category-select">
            ${growCategories.map(([key, label]) => `
              <option value="${esc(key)}" ${filter === key ? 'selected' : ''}>${esc(label)}</option>
            `).join('')}
          </select>
        </label>
        <label class="catalog-control">
          <input type="checkbox" id="toggle-out-of-stock" ${growPageState.showOutOfStock ? 'checked' : ''} />
          <span>Mostrar agotados</span>
        </label>
        <label class="catalog-control">
          Ordenar:
          <select id="sort-select">
            <option value="default" ${growPageState.sort === 'default' ? 'selected' : ''}>Relevancia</option>
            <option value="price-asc" ${growPageState.sort === 'price-asc' ? 'selected' : ''}>Precio: menor a mayor</option>
            <option value="price-desc" ${growPageState.sort === 'price-desc' ? 'selected' : ''}>Precio: mayor a menor</option>
          </select>
        </label>
      </div>

      <div class="product-grid fade-in">
        ${growPageState.products.map(p => renderGrowCard(p)).join('')}
      </div>
      ${growPageState.products.length === 0 ? `<div class="no-results"><div class="no-results-icon" aria-hidden="true">&#128269;</div><p>${growPageState.search ? `No encontramos productos para "${esc(growPageState.search)}"` : 'No hay productos en esta categoría'}</p></div>` : ''}
      ${growPageState.products.length < total ? `
        <div style="text-align:center; margin-top:40px;">
          <button type="button" class="btn btn-secondary" id="load-more-btn">
            Cargar mas (${growPageState.products.length} de ${total})
          </button>
        </div>
      ` : ''}
    </section>
  `;

  bindProductEvents();

  const catSelect = document.getElementById('category-select');
  if (catSelect) {
    catSelect.addEventListener('change', () => {
      renderGrowPage(catSelect.value);
    });
  }

  const growSearch = document.getElementById('grow-search-input');
  if (growSearch) {
    // Mantener foco y posición al re-renderizar tras debounce
    if (document.activeElement === growSearch) {
      const pos = growSearch.value.length;
      growSearch.setSelectionRange(pos, pos);
    }
    let searchTimer;
    growSearch.addEventListener('input', () => {
      clearTimeout(searchTimer);
      const value = growSearch.value.trim();
      searchTimer = setTimeout(() => {
        if (value !== (growPageState.search || '')) {
          renderGrowPage(filter, { search: value });
        }
      }, 300);
    });
    growSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        growSearch.value = '';
        renderGrowPage(filter, { search: '' });
      }
    });
  }

  const growSearchClear = document.getElementById('grow-search-clear');
  if (growSearchClear) {
    growSearchClear.addEventListener('click', () => {
      renderGrowPage(filter, { search: '' });
    });
  }

  const loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', async () => {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'Cargando...';
      growPageState.offset += PAGE_SIZE;
      await renderGrowPage(filter);
    });
  }

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      renderGrowPage(filter, { sort: sortSelect.value });
    });
  }
  const stockToggle = document.getElementById('toggle-out-of-stock');
  if (stockToggle) {
    stockToggle.addEventListener('change', () => {
      renderGrowPage(filter, { showOutOfStock: stockToggle.checked });
    });
  }
}

function renderSkeletonCards(count) {
  return Array.from({ length: count }).map(() => `
    <div class="product-card product-card-skeleton" aria-hidden="true">
      <div class="skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton-line skeleton-line-wide"></div>
        <div class="skeleton-line skeleton-line-mid"></div>
        <div class="skeleton-line skeleton-line-short"></div>
      </div>
    </div>
  `).join('');
}

async function renderOffersPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="offers-hero">
      <h2>OFERTAS Y PROMOCIONES</h2>
      <p>Cargando...</p>
    </section>
  `;

  const { products: offers, total } = await fetchProducts({ offersOnly: true, limit: 100 });

  app.innerHTML = `
    <section class="offers-hero">
      <h2>OFERTAS Y PROMOCIONES</h2>
      <p>${total} ofertas disponibles</p>
    </section>
    <section class="products-section">
      <div class="product-grid fade-in">
        ${offers.map(p => renderGrowCard(p)).join('')}
      </div>
      ${offers.length === 0 ? '<div class="no-results"><div class="no-results-icon">&#128293;</div><p>No hay ofertas disponibles ahora mismo</p></div>' : ''}
    </section>
  `;

  bindProductEvents();
}

// La ruta /partners se mantiene por retrocompatibilidad pero redirige al home.
// Decisión de marca: la web vende productos a nombre de Grow El Druida, sin
// mencionar distribuidores. Si en el futuro se quieren exponer partners reales
// de Druida (no proveedores), recuperar esta vista.
function renderPartnersPage() {
  navigateTo('home');
}

function renderAboutPage() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <section class="hero-section" style="padding: 40px 20px; background: linear-gradient(135deg, var(--brown-dark), var(--green-dark));">
      <div class="hero-content">
        <h2 class="hero-title" style="font-size: 3rem;">SOBRE NOSOTROS</h2>
        <p class="hero-subtitle">Grow shop profesional con equipamiento de referencia</p>
      </div>
    </section>
    <section class="about-section">
      <div class="about-content">
        <div class="about-text">
          <p><strong>Grow El Druida</strong> nace de la pasión por el cultivo profesional y el equipamiento de alta gama para horticultura técnica.</p>
          <p>Somos un grow shop completo donde encontrarás todo el equipamiento profesional que necesitas: iluminación LED, fertilizantes, sustratos, control de clima, sistemas de cultivo y herramientas de medición.</p>
          <p>Trabajamos con las <strong>marcas más reconocidas</strong> del sector para garantizar la máxima calidad y stock en tiempo real en cada producto del catálogo.</p>
          <p>Nuestro equipo cuenta con más de <strong>20 años de experiencia</strong> en el sector, asesorándote en cada paso de tu proyecto de cultivo.</p>
        </div>
        <img src="/images/logo.jpg" alt="Grow El Druida" class="about-img" loading="lazy" />
      </div>
      <div class="about-features">
        <div class="about-feature">
          <div class="about-feature-icon">&#128161;</div>
          <h3>Grow Shop Pro</h3>
          <p>Iluminacion, fertilizantes, sustratos y control clima</p>
        </div>
        <div class="about-feature">
          <div class="about-feature-icon">&#128230;</div>
          <h3>Envio Discreto</h3>
          <p>Packaging anonimo y envio rapido a toda Espana</p>
        </div>
        <div class="about-feature">
          <div class="about-feature-icon" aria-hidden="true">&#127807;</div>
          <h3>Marcas Premium</h3>
          <p>Solo trabajamos con las marcas más reconocidas del sector</p>
        </div>
        <div class="about-feature">
          <div class="about-feature-icon">&#9989;</div>
          <h3>Calidad Garantizada</h3>
          <p>Solo trabajamos con marcas de primera linea</p>
        </div>
        <div class="about-feature">
          <div class="about-feature-icon">&#128172;</div>
          <h3>Asesoramiento</h3>
          <p>Equipo experto para resolver todas tus dudas</p>
        </div>
        <div class="about-feature">
          <div class="about-feature-icon" aria-hidden="true">&#128154;</div>
          <h3>+20 Años</h3>
          <p>Experiencia en cultivo técnico y horticultura profesional</p>
        </div>
      </div>
    </section>
  `;
}

// ============================================
// ORDERS PAGE
// ============================================
async function renderOrdersPage() {
  const app = document.getElementById('app');
  const user = getCurrentUser();

  if (!user) {
    app.innerHTML = `
      <section class="products-section" style="text-align:center; padding: 80px 20px;">
        <div class="no-results">
          <div class="no-results-icon">&#128274;</div>
          <p>Inicia sesión para ver tus pedidos</p>
        </div>
      </section>
    `;
    return;
  }

  app.innerHTML = `
    <section class="hero-section" style="padding: 40px 20px;">
      <div class="hero-content">
        <h2 class="hero-title" style="font-size: 3rem;">MIS PEDIDOS</h2>
        <p class="hero-subtitle">Historial de tus compras</p>
      </div>
    </section>
    <section class="products-section">
      <div class="orders-loading">Cargando pedidos...</div>
    </section>
  `;

  try {
    const orders = await getMyOrders();
    const container = app.querySelector('.products-section');

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">&#128230;</div>
          <p>Aun no tienes pedidos</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="orders-list fade-in">
        ${orders.map(order => {
          const date = new Date(order.created_at).toLocaleDateString('es-ES', {
            day: 'numeric', month: 'long', year: 'numeric'
          });
          const statusMap = {
            pending: 'Pendiente',
            confirmed: 'Confirmado',
            shipped: 'Enviado',
            delivered: 'Entregado',
            cancelled: 'Cancelado'
          };
          const statusClass = order.status === 'delivered' ? 'status-delivered' :
                             order.status === 'cancelled' ? 'status-cancelled' : 'status-pending';

          return `
            <div class="order-card">
              <div class="order-card-header">
                <div>
                  <span class="order-number">Pedido #${esc(order.order_number)}</span>
                  <span class="order-date">${esc(date)}</span>
                </div>
                <span class="order-status ${statusClass}">${esc(statusMap[order.status] || order.status)}</span>
              </div>
              <div class="order-card-items">
                ${order.order_items.map(item => `
                  <div class="order-item-row">
                    <span>${esc(item.product_name)} ${item.product_label ? `(${esc(item.product_label)})` : ''} x${item.quantity}</span>
                    <span>${item.subtotal.toFixed(2)} &euro;</span>
                  </div>
                `).join('')}
              </div>
              <div class="order-card-footer">
                <span>Envío: ${order.shipping_cost > 0 ? order.shipping_cost.toFixed(2) + ' &euro;' : 'GRATIS'}</span>
                <span class="order-total">Total: ${order.total.toFixed(2)} &euro;</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (err) {
    app.querySelector('.products-section').innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">&#9888;</div>
        <p>Error al cargar pedidos</p>
      </div>
    `;
  }
}

// ============================================
// PROFILE PAGE
// ============================================
async function renderProfilePage() {
  const app = document.getElementById('app');
  const user = getCurrentUser();

  if (!user) {
    app.innerHTML = `
      <section class="products-section" style="text-align:center; padding: 80px 20px;">
        <div class="no-results">
          <div class="no-results-icon">&#128274;</div>
          <p>Inicia sesión para ver tu perfil</p>
        </div>
      </section>
    `;
    return;
  }

  const profile = await getProfile();

  app.innerHTML = `
    <section class="hero-section" style="padding: 40px 20px;">
      <div class="hero-content">
        <h2 class="hero-title" style="font-size: 3rem;">MI PERFIL</h2>
        <p class="hero-subtitle">${esc(user.email)}</p>
      </div>
    </section>
    <section class="products-section">
      <div class="profile-form-wrap fade-in">
        <form id="profile-form">
          <div class="form-row">
            <div class="form-group">
              <label for="profile-name">Nombre completo</label>
              <input type="text" id="profile-name" value="${esc(profile?.full_name || '')}" placeholder="Tu nombre" autocomplete="name" />
            </div>
            <div class="form-group">
              <label for="profile-phone">Teléfono</label>
              <input type="tel" id="profile-phone" value="${esc(profile?.phone || '')}" placeholder="+34 600 000 000" autocomplete="tel" />
            </div>
          </div>
          <div class="form-group">
            <label for="profile-address">Dirección</label>
            <input type="text" id="profile-address" value="${esc(profile?.address || '')}" placeholder="Calle, número, piso..." autocomplete="street-address" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="profile-city">Ciudad</label>
              <input type="text" id="profile-city" value="${esc(profile?.city || '')}" placeholder="Ciudad" autocomplete="address-level2" />
            </div>
            <div class="form-group">
              <label for="profile-zip">Código Postal</label>
              <input type="text" id="profile-zip" value="${esc(profile?.zip || '')}" placeholder="28001" autocomplete="postal-code" />
            </div>
          </div>
          <div id="profile-msg" class="auth-success hidden"></div>
          <button type="submit" class="btn btn-primary" style="margin-top: 16px;">Guardar Cambios</button>
        </form>
      </div>
    </section>
  `;

  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgEl = document.getElementById('profile-msg');

    const { error } = await updateProfile({
      full_name: document.getElementById('profile-name').value.trim(),
      phone: document.getElementById('profile-phone').value.trim(),
      address: document.getElementById('profile-address').value.trim(),
      city: document.getElementById('profile-city').value.trim(),
      zip: document.getElementById('profile-zip').value.trim()
    });

    if (error) {
      msgEl.textContent = 'Error al guardar';
      msgEl.style.color = 'var(--neon-red)';
    } else {
      msgEl.textContent = 'Perfil actualizado';
      msgEl.style.color = 'var(--neon-green)';
    }
    msgEl.classList.remove('hidden');
    setTimeout(() => msgEl.classList.add('hidden'), 3000);
  });
}

async function renderSearchResults(query) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="search-results">
      <h2>Buscando "${query}"...</h2>
    </section>
  `;

  const { products: results, total } = await fetchProducts({ search: query, limit: 100 });

  app.innerHTML = `
    <section class="search-results">
      <h2>Resultados para "${query}" (${total})</h2>
      <div class="product-grid fade-in">
        ${results.map(p => renderGrowCard(p)).join('')}
      </div>
      ${results.length === 0 ? '<div class="no-results"><div class="no-results-icon">&#128269;</div><p>No se encontraron productos para tu busqueda</p></div>' : ''}
    </section>
  `;

  // Update nav
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

  bindProductEvents();
}

// ============================================
// RENDER PRODUCT CARDS
// ============================================
function renderGrowCard(product) {
  const safeName = (product.name || '').replace(/"/g, '&quot;');
  const disabled = !product.inStock ? 'disabled' : '';
  const outOfStockLabel = !product.inStock ? '<span class="product-card-offer" style="background:#555;">AGOTADO</span>' : '';
  return `
    <div class="product-card" data-id="${product.id}" data-product-link="${product.id}">
      ${product.badge ? `<span class="product-card-badge badge-${product.badge.toLowerCase()}">${product.badge}</span>` : ''}
      ${product.offer ? `<span class="product-card-offer">OFERTA</span>` : outOfStockLabel}
      <div class="product-card-img-wrap">
        <img src="${product.image}" alt="${safeName}" class="product-card-img" loading="lazy" />
      </div>
      <div class="product-card-body">
        <h3 class="product-card-name">${product.name}</h3>
        ${product.brand ? `<p class="product-card-genetics">${product.brand}</p>` : ''}
        <p class="product-card-desc">${product.description || ''}</p>
        <div class="product-card-price">
          <div>
            <span class="price-current">${product.price.toFixed(2)}&euro;</span>
            ${product.offer && product.oldPrice ? `<span class="price-old">${product.oldPrice.toFixed(2)}&euro;</span>` : ''}
          </div>
        </div>
        <button class="add-to-cart-btn"
                data-id="${product.id}"
                data-name="${safeName}"
                data-price="${product.price}"
                data-image="${product.image}"
                ${disabled}>
          ${product.inStock ? 'Añadir al carrito' : 'Agotado'}
        </button>
      </div>
    </div>
  `;
}

// ============================================
// EVENT BINDING
// ============================================
function bindProductEvents() {
  // Click en boton "Anadir al carrito": solo anade, no navega
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btn.disabled) return;
      const id = btn.dataset.id;
      const name = btn.dataset.name || id;
      const price = parseFloat(btn.dataset.price) || 0;
      const image = btn.dataset.image || '/images/logo.jpg';

      cart.addItem({
        id,
        name,
        price,
        image,
        label: '1 ud.',
      });

      renderCart();
      showToast(`${name} anadido al carrito`);
    });
  });

  // Click en cualquier otra zona de la card: navega al detalle del producto
  document.querySelectorAll('[data-product-link]').forEach(card => {
    card.addEventListener('click', (e) => {
      // No hacer nada si el click fue en el boton (ya manejado arriba con stopPropagation)
      if (e.target.closest('.add-to-cart-btn')) return;
      const id = card.dataset.productLink;
      navigateTo('product', null, id);
    });
  });
}

function bindNavigationEvents() {
  document.querySelectorAll('#app [data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.page, link.dataset.filter || 'all');
    });
  });
}

// ============================================
// CART UI
// ============================================
function initCart() {
  const cartBtn = document.getElementById('cart-btn');
  const cartClose = document.getElementById('cart-close');
  const cartOverlay = document.getElementById('cart-overlay');

  cartBtn.addEventListener('click', () => {
    document.getElementById('cart-sidebar').classList.add('open');
    document.getElementById('cart-overlay').classList.add('open');
  });

  const closeCart = () => {
    document.getElementById('cart-sidebar').classList.remove('open');
    document.getElementById('cart-overlay').classList.remove('open');
  };

  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  // Checkout button
  document.querySelector('.checkout-btn').addEventListener('click', () => {
    if (cart.items.length === 0) {
      showToast('Tu carrito está vacío');
      return;
    }
    if (!meetsMinOrder(cart.getTotal())) {
      const missing = (MIN_ORDER_VALUE - cart.getTotal()).toFixed(2);
      showToast(`Pedido mínimo ${MIN_ORDER_VALUE}€. Te faltan ${missing}€`);
      return;
    }
    closeCart();
    openCheckout();
  });

  renderCart();
}

// ============================================
// CHECKOUT SYSTEM
// ============================================
// >>> TODO PRE-DEPLOY: sustituir por el número real de WhatsApp del Druida
//     (código país + número, SIN + ni espacios). Ej: 34612345678.
//     Mientras siga el placeholder, los checkouts llegan a número inexistente.
const WHATSAPP_NUMBER = '34600000000';
const SHOP_EMAIL = 'info@groweldruida.es';
// URL del Worker de Cloudflare que envia emails transaccionales.
// Dejalo como '' si todavia no tienes el Worker desplegado con Resend.
const WORKER_URL = import.meta.env.VITE_WORKER_URL || '';

let checkoutData = {};

/**
 * Flujo comun tras aceptar el pedido en checkout:
 *  1. Guarda el pedido en Supabase (orders + order_items)
 *  2. Si hay WORKER_URL, llama a /send-order-email para enviar confirmacion
 *     al cliente + notificacion interna a Mario
 *  3. Limpia el carrito
 *
 * Los fallos de email no rompen el flujo (no bloqueamos al cliente por un SMTP down).
 * Los fallos de Supabase tampoco rompen (el pedido siempre puede completarse por
 * WhatsApp/email manual, que es el canal primario).
 */
async function completeOrder() {
  let savedOrder = null;
  try {
    savedOrder = await saveOrder(checkoutData, cart.items, cart.getTotal());
  } catch (err) {
    console.error('[checkout] Error guardando pedido en Supabase:', err);
  }

  // Envio de emails transaccionales (best-effort, no bloquea)
  if (WORKER_URL && savedOrder?.id) {
    try {
      await fetch(`${WORKER_URL}/send-order-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: savedOrder.id,
          customer: checkoutData,
          items: cart.items.map(it => ({
            item_code: it.id,
            name: it.name,
            qty: it.quantity,
            price: it.price,
          })),
          total: cart.getTotal(),
          createdAt: new Date().toISOString(),
        }),
      }).catch(err => console.warn('[checkout] Error enviando emails:', err));
    } catch (err) {
      console.warn('[checkout] Error enviando emails:', err);
    }
  }

  cart.clear();
  renderCart();
}

async function openCheckout() {
  document.getElementById('checkout-modal').classList.add('open');
  document.getElementById('checkout-overlay').classList.add('open');
  showCheckoutStep(1);

  // Pre-fill form for logged-in users
  const user = getCurrentUser();
  if (user) {
    document.getElementById('checkout-email').value = user.email || '';
    document.getElementById('checkout-name').value = user.user_metadata?.full_name || '';
    const profile = await getProfile();
    if (profile) {
      if (profile.phone) document.getElementById('checkout-phone').value = profile.phone;
      if (profile.address) document.getElementById('checkout-address').value = profile.address;
      if (profile.city) document.getElementById('checkout-city').value = profile.city;
      if (profile.zip) document.getElementById('checkout-zip').value = profile.zip;
    }
  }
}

function closeCheckout() {
  document.getElementById('checkout-modal').classList.remove('open');
  document.getElementById('checkout-overlay').classList.remove('open');
}

function showCheckoutStep(step) {
  document.querySelectorAll('.checkout-step').forEach(s => s.classList.add('hidden'));
  document.getElementById(`checkout-step-${step}`).classList.remove('hidden');
}

function buildOrderText() {
  const items = cart.items.map((item, i) =>
    `${i + 1}. ${item.name} (${item.label}) x${item.quantity} = ${(item.price * item.quantity).toFixed(2)}EUR`
  ).join('\n');

  const subtotal = cart.getTotal();
  const ship = computeShipping(subtotal);
  const envioTxt = ship.free ? 'GRATIS' : `${ship.cost.toFixed(2)} EUR`;
  const totalFinal = (subtotal + ship.cost).toFixed(2);

  return `NUEVO PEDIDO - Grow El Druida
=========================================
PRODUCTOS:
${items}

Subtotal: ${subtotal.toFixed(2)} EUR
Envio: ${envioTxt}
TOTAL: ${totalFinal} EUR
=========================================
DATOS DEL CLIENTE:
Nombre: ${checkoutData.name}
Telefono: ${checkoutData.phone}
Email: ${checkoutData.email}
Direccion: ${checkoutData.address}
Ciudad: ${checkoutData.city}
CP: ${checkoutData.zip}
${checkoutData.notes ? `Notas: ${checkoutData.notes}` : ''}
=========================================`;
}

function renderCheckoutSummary() {
  const summary = document.getElementById('checkout-summary');
  const subtotal = cart.getTotal();
  const ship = computeShipping(subtotal);
  const totalFinal = subtotal + ship.cost;

  summary.innerHTML = `
    <div class="summary-section">
      <h3>Productos</h3>
      ${cart.items.map(item => `
        <div class="summary-item">
          <span>${esc(item.name)} (${esc(item.label)}) x${item.quantity}</span>
          <span class="summary-price">${(item.price * item.quantity).toFixed(2)} &euro;</span>
        </div>
      `).join('')}
    </div>
    <div class="summary-section">
      <div class="summary-item">
        <span>Subtotal</span>
        <span>${subtotal.toFixed(2)} &euro;</span>
      </div>
      <div class="summary-item">
        <span>Envío</span>
        <span>${ship.free ? '<span class="neon-tag">GRATIS</span>' : `${ship.cost.toFixed(2)} &euro;`}</span>
      </div>
      ${!ship.free ? `<div class="summary-item" style="font-size:0.82rem;color:var(--text-muted);"><span>Añade ${ship.remainingForFree.toFixed(2)} € más para envío gratis (desde ${FREE_SHIPPING_FROM} €)</span><span></span></div>` : ''}
      <div class="summary-item summary-total">
        <span>TOTAL</span>
        <span>${totalFinal.toFixed(2)} &euro;</span>
      </div>
    </div>
    <div class="summary-section">
      <h3>Enviar a</h3>
      <p>${checkoutData.name}</p>
      <p>${checkoutData.address}, ${checkoutData.city} ${checkoutData.zip}</p>
      <p>${checkoutData.phone} | ${checkoutData.email}</p>
      ${checkoutData.notes ? `<p class="summary-notes">Notas: ${checkoutData.notes}</p>` : ''}
    </div>
  `;
}

function initCheckout() {
  const form = document.getElementById('checkout-form');
  const overlay = document.getElementById('checkout-overlay');
  const closeBtn = document.getElementById('checkout-close');
  const backBtn = document.getElementById('checkout-back');
  const whatsappBtn = document.getElementById('btn-send-whatsapp');
  const emailBtn = document.getElementById('btn-send-email');
  const doneBtn = document.getElementById('checkout-done');

  closeBtn.addEventListener('click', closeCheckout);
  overlay.addEventListener('click', closeCheckout);

  backBtn.addEventListener('click', () => showCheckoutStep(1));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    checkoutData = {
      name: document.getElementById('checkout-name').value.trim(),
      phone: document.getElementById('checkout-phone').value.trim(),
      email: document.getElementById('checkout-email').value.trim(),
      address: document.getElementById('checkout-address').value.trim(),
      city: document.getElementById('checkout-city').value.trim(),
      zip: document.getElementById('checkout-zip').value.trim(),
      notes: document.getElementById('checkout-notes').value.trim()
    };
    renderCheckoutSummary();
    showCheckoutStep(2);
  });

  whatsappBtn.addEventListener('click', async () => {
    await completeOrder();
    const text = encodeURIComponent(buildOrderText());
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
    showCheckoutStep(3);
  });

  emailBtn.addEventListener('click', async () => {
    await completeOrder();
    const subject = encodeURIComponent(`Pedido - ${checkoutData.name}`);
    const body = encodeURIComponent(buildOrderText());
    window.open(`mailto:${SHOP_EMAIL}?subject=${subject}&body=${body}`, '_blank');
    showCheckoutStep(3);
  });

  doneBtn.addEventListener('click', () => {
    closeCheckout();
    form.reset();
    navigateTo('home');
  });
}

// ============================================
// PRODUCT DETAIL PAGE
// ============================================
async function renderProductDetail(itemCode) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="product-detail-loading">
      <div class="hero-content" style="text-align:center; padding:100px 20px;">
        <p>Cargando producto...</p>
      </div>
    </section>
  `;

  const product = await fetchProductByCode(itemCode);
  if (!product) {
    app.innerHTML = `
      <section class="hero-section" style="padding: 80px 20px; text-align:center;">
        <div class="hero-content">
          <h2 class="hero-title" style="font-size: 2rem;">Producto no encontrado</h2>
          <p class="hero-subtitle">El producto "${itemCode}" no existe o ya no est&aacute; disponible.</p>
          <div class="hero-cta" style="justify-content:center; margin-top:20px;">
            <button type="button" class="btn btn-primary" data-page="grow">Volver al cat&aacute;logo</button>
          </div>
        </div>
      </section>
    `;
    bindNavigationEvents();
    return;
  }

  const dims = product.weight || product.width || product.height || product.length
    ? `
      <div class="product-detail-meta">
        ${product.weight ? `<div><strong>Peso:</strong> ${product.weight} kg</div>` : ''}
        ${product.width ? `<div><strong>Ancho:</strong> ${product.width} cm</div>` : ''}
        ${product.height ? `<div><strong>Alto:</strong> ${product.height} cm</div>` : ''}
        ${product.length ? `<div><strong>Largo:</strong> ${product.length} cm</div>` : ''}
        ${product.uomCode ? `<div><strong>Unidad:</strong> ${product.uomCode}</div>` : ''}
      </div>
    `
    : '';

  const stockBadge = product.inStock
    ? `<span class="detail-stock-ok">&#10003; Disponible${product.stock < 100 ? ` (${product.stock} uds)` : ''}</span>`
    : `<span class="detail-stock-out">&#10007; Agotado</span>`;

  const safeName = (product.name || '').replace(/"/g, '&quot;');
  const disabled = !product.inStock ? 'disabled' : '';

  // SEO dinámico: title, meta description, OG, canonical y JSON-LD Product+Breadcrumb
  updateProductSEO(product);

  app.innerHTML = `
    <section class="product-detail">
      <div class="product-detail-wrap">
        <nav class="breadcrumbs" aria-label="Breadcrumb" itemscope itemtype="https://schema.org/BreadcrumbList">
          <a href="#" data-page="home" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
            <span itemprop="name">Inicio</span>
            <meta itemprop="position" content="1" />
          </a>
          <span aria-hidden="true">›</span>
          <a href="#" data-page="grow" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
            <span itemprop="name">Grow Shop</span>
            <meta itemprop="position" content="2" />
          </a>
          <span aria-hidden="true">›</span>
          <span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
            <span itemprop="name">${product.id}</span>
            <meta itemprop="position" content="3" />
          </span>
        </nav>

        <div class="product-detail-grid">
          <div class="product-detail-media">
            <img src="${esc(product.image)}" alt="${esc(product.name)}" class="product-detail-img" loading="lazy" />
          </div>

          <div class="product-detail-info">
            ${product.isPlaceholder ? '<div class="detail-placeholder-note"><strong>Catálogo en actualización.</strong> Nombre completo, descripción e imagen definitiva disponibles en breve. Precio y stock son reales.</div>' : ''}

            <div class="detail-kicker">${esc(product.brand || 'Referencia')}</div>
            <h1 class="detail-title">${esc(product.name)}</h1>
            <div class="detail-itemcode">Código: <code>${esc(product.id)}</code></div>

            ${product.description ? `<p class="detail-description">${esc(product.description)}</p>` : ''}

            <div class="detail-price-block">
              <div class="detail-price">${product.price.toFixed(2)}&euro;</div>
              ${product.offer && product.oldPrice ? `<div class="detail-old-price">${product.oldPrice.toFixed(2)}&euro;</div>` : ''}
              <div class="detail-tax-note">IVA incluido</div>
            </div>

            <div class="detail-stock">${stockBadge}</div>

            ${dims}

            ${product.technicalDetails ? `
              <details class="detail-technical">
                <summary>Detalles técnicos</summary>
                <div>${esc(product.technicalDetails)}</div>
              </details>
            ` : ''}

            <div class="detail-actions">
              <div class="detail-qty">
                <button type="button" class="qty-btn" id="qty-minus" aria-label="Disminuir">&minus;</button>
                <input type="number" id="qty-input" value="1" min="1" max="${Math.max(1, product.stock)}" aria-label="Cantidad" />
                <button type="button" class="qty-btn" id="qty-plus" aria-label="Aumentar">+</button>
              </div>
              <button type="button"
                      class="add-to-cart-btn detail-add-btn"
                      id="detail-add-to-cart"
                      data-id="${esc(product.id)}"
                      data-name="${esc(product.name)}"
                      data-price="${product.price}"
                      data-image="${esc(product.image)}"
                      ${disabled}>
                ${product.inStock ? 'Añadir al carrito' : 'Agotado'}
              </button>
            </div>

            <div class="detail-back">
              <a href="/#grow" data-page="grow" class="detail-back-link">&larr; Volver al catálogo</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  // Bindings
  bindNavigationEvents();

  const qtyInput = document.getElementById('qty-input');
  document.getElementById('qty-minus').addEventListener('click', () => {
    qtyInput.value = Math.max(1, parseInt(qtyInput.value, 10) - 1);
  });
  document.getElementById('qty-plus').addEventListener('click', () => {
    const max = parseInt(qtyInput.max, 10) || 1;
    qtyInput.value = Math.min(max, parseInt(qtyInput.value, 10) + 1);
  });

  const addBtn = document.getElementById('detail-add-to-cart');
  if (addBtn && !addBtn.disabled) {
    addBtn.addEventListener('click', () => {
      const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
      for (let i = 0; i < qty; i++) {
        cart.addItem({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          label: '1 ud.',
        });
      }
      renderCart();
      showToast(`${qty} x ${product.name} anadido al carrito`);
    });
  }
}

// ============================================
// SEO dinamico (producto detalle)
// ============================================
/**
 * Actualiza <title>, meta description, OG, canonical y JSON-LD Product+Breadcrumb
 * cuando se renderiza un producto. Esencial para rich snippets en Google y
 * previsualizacion en WhatsApp/Facebook/Twitter al compartir URL de producto.
 */
function updateProductSEO(product) {
  const siteName = 'Grow El Druida';
  const siteUrl = 'https://groweldruida.es';
  const productUrl = `${siteUrl}/#producto/${product.id}`;
  const productName = product.name || product.id;
  const description = product.description
    ? product.description.slice(0, 160)
    : `${productName} — ${product.brand || 'Grow Shop'} · ${product.price.toFixed(2)}€ · Stock real en Grow El Druida.`;
  const image = product.image?.startsWith('http') ? product.image : `${siteUrl}${product.image || '/images/logo.jpg'}`;

  // 1. <title>
  document.title = `${productName} — ${siteName}`;

  // 2. meta description
  setMetaTag('name', 'description', description);

  // 3. canonical
  setLinkTag('canonical', productUrl);

  // 4. OG tags
  setMetaTag('property', 'og:title', `${productName} — ${siteName}`);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:url', productUrl);
  setMetaTag('property', 'og:image', image);
  setMetaTag('property', 'og:type', 'product');

  // 5. Twitter card
  setMetaTag('name', 'twitter:title', `${productName} — ${siteName}`);
  setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:image', image);

  // 6. JSON-LD Product + BreadcrumbList
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    description,
    image,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || siteName,
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'EUR',
      price: product.price.toFixed(2),
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      seller: {
        '@type': 'Organization',
        name: siteName,
      },
    },
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Grow Shop', item: `${siteUrl}/#grow` },
      { '@type': 'ListItem', position: 3, name: productName, item: productUrl },
    ],
  };
  setJsonLd('product-schema', productSchema);
  setJsonLd('breadcrumb-schema', breadcrumbSchema);
}

/**
 * Restaura los metas por defecto cuando el usuario navega fuera del detalle.
 * Llamado desde navigateTo() cuando la page no es 'product'.
 */
function resetSEOToDefault() {
  document.title = 'Grow El Druida — Grow Shop Profesional | Iluminación, Fertilizantes, Sustratos';
  setMetaTag('name', 'description', 'Grow shop online con +3000 productos de cultivo profesional: iluminación LED, fertilizantes, sustratos, control de clima y mucho más. Envío discreto 24-48h a toda España.');
  setLinkTag('canonical', 'https://groweldruida.es/');
  setMetaTag('property', 'og:title', 'Grow El Druida — Grow Shop Profesional');
  setMetaTag('property', 'og:description', '+3000 productos de cultivo profesional. Iluminación LED, fertilizantes, sustratos y control de clima. Envío 24-48h.');
  setMetaTag('property', 'og:url', 'https://groweldruida.es/');
  setMetaTag('property', 'og:image', 'https://groweldruida.es/images/logo.jpg');
  setMetaTag('property', 'og:type', 'website');
  // Elimina JSON-LD especifico de producto
  document.getElementById('product-schema')?.remove();
  document.getElementById('breadcrumb-schema')?.remove();
}

function setMetaTag(attrName, attrValue, content) {
  let tag = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setLinkTag(rel, href) {
  let tag = document.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

function setJsonLd(id, data) {
  let tag = document.getElementById(id);
  if (!tag) {
    tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.id = id;
    document.head.appendChild(tag);
  }
  tag.textContent = JSON.stringify(data);
}

// ============================================
// INIT
// ============================================
async function init() {
  initNavigation();
  initCart();
  initCheckout();
  initCookieBanner();
  window.__navigateTo = navigateTo;

  // Carga inicial: destacados curados + categorias + auth + total count en paralelo.
  // Si Supabase tarda, se muestra loading state; si falla, error state.
  renderLoadingPage();
  try {
    const [featured] = await Promise.all([
      fetchFeaturedProducts(8),
      loadProducts({ limit: 1 }),   // solo para obtener totalProductCount
      loadCategories(),
      initAuth(),
    ]);
    homeFeatured = featured;
    renderHomePage();
  } catch (err) {
    console.error('[init] error cargando datos:', err);
    renderErrorPage(err);
  }
}

function renderLoadingPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="hero-section" style="padding: 120px 20px; text-align:center;">
      <div class="hero-content">
        <img src="/images/logo.jpg" alt="Grow El Druida" class="hero-logo" width="120" height="120" />
        <h2 class="hero-title" style="font-size: 2rem;">Cargando catálogo...</h2>
        <p class="hero-subtitle">Un momento, preparando productos</p>
      </div>
    </section>
  `;
}

function renderErrorPage(err) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="hero-section" style="padding: 80px 20px; text-align:center;">
      <div class="hero-content">
        <h2 class="hero-title" style="font-size: 2rem;">Ups, algo ha fallado</h2>
        <p class="hero-subtitle">${esc(err?.message || 'No pudimos cargar el catálogo')}</p>
        <div class="hero-cta" style="justify-content:center;">
          <button type="button" class="btn btn-primary" id="btn-retry">Reintentar</button>
        </div>
      </div>
    </section>
  `;
  document.getElementById('btn-retry')?.addEventListener('click', () => window.location.reload());
}

document.addEventListener('DOMContentLoaded', init);
