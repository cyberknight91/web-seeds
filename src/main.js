import './style.css';
import {
  growProducts,
  allProducts,
  growCategories,
  loadProducts,
  loadCategories,
  degradedMode,
  totalProductCount,
} from './data/products.js';
import { fetchProducts } from './supabase.js';
import { cart, renderCart, showToast } from './cart.js';
import { createSmokeParticles } from './effects.js';
import { initAuth, getCurrentUser, getProfile } from './auth.js';
import { saveOrder, getMyOrders } from './orders.js';

// ============================================
// APP STATE
// ============================================
let currentPage = 'home';
let currentFilter = 'all';

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
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
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

function navigateTo(page, filter = 'all') {
  currentPage = page;
  currentFilter = filter;

  // Update active nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  // Close mobile nav
  document.getElementById('mobile-nav').classList.remove('open');

  // Render page
  switch (page) {
    case 'home': renderHomePage(); break;
    case 'grow': renderGrowPage(filter); break;
    case 'offers': renderOffersPage(); break;
    case 'about': renderAboutPage(); break;
    case 'partners': renderPartnersPage(); break;
    case 'orders': renderOrdersPage(); break;
    case 'profile': renderProfilePage(); break;
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// RENDER PAGES
// ============================================
function renderHomePage() {
  const app = document.getElementById('app');
  const featuredGrow = growProducts.slice(0, 8);

  app.innerHTML = `
    <!-- HERO -->
    <section class="hero-section">
      <div class="hero-content fade-in">
        <img src="/images/logo.jpg" alt="Grow El Druida" class="hero-logo" />
        <h2 class="hero-title">GROW EL DRUIDA</h2>
        <p class="hero-subtitle">Tu Grow Shop Online - Equipamiento profesional de cultivo al mejor precio</p>
        <div class="hero-badges">
          <span class="hero-badge">+${totalProductCount} productos</span>
          <span class="hero-badge">Envio Discreto</span>
          <span class="hero-badge">Stock Real</span>
          <span class="hero-badge">Partner Natural Systems</span>
        </div>
        <div class="hero-cta">
          <a href="#" class="btn btn-primary" data-page="grow">Ver Catalogo</a>
          <a href="#" class="btn btn-secondary" data-page="partners">Nuestros Partners</a>
        </div>
      </div>
    </section>

    <!-- MARQUEE -->
    <div class="marquee-banner">
      <span class="marquee-text">
        ENVIO GRATIS a partir de 50EUR --- OFERTAS SEMANALES --- GROW SHOP COMPLETO --- LED, FERTILIZANTES, SUSTRATOS, CONTROL DE CLIMA Y MAS ---
      </span>
    </div>

    ${degradedMode ? renderDegradedBanner() : ''}

    <!-- PARTNERS TEASER -->
    <section class="partners-section" style="padding: 64px 20px;">
      <div class="partners-wrap">
        <div class="partners-head">
          <span class="eyebrow">Partner oficial</span>
          <h2>Distribuidores de Natural Systems</h2>
          <p>Colaboramos directamente con Natural Systems, uno de los distribuidores de referencia en horticultura tecnica en Espana. Stock en tiempo real, catalogo completo, precios de partner.</p>
        </div>
        <div style="text-align:center;">
          <a href="#" class="btn btn-primary" data-page="partners">Ver nuestros partners →</a>
        </div>
      </div>
    </section>

    <!-- FEATURED GROW -->
    <section class="products-section">
      <h2 class="section-title">DESTACADOS</h2>
      <p class="section-subtitle">${totalProductCount} productos en nuestro catalogo</p>
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

// Estado de paginacion persistente entre renders
let growPageState = { filter: 'all', offset: 0, products: [], total: 0, degraded: false }
const PAGE_SIZE = 50

async function renderGrowPage(filter = 'all') {
  const app = document.getElementById('app');

  // Reset offset al cambiar filtro
  if (growPageState.filter !== filter) {
    growPageState = { filter, offset: 0, products: [], total: 0, degraded: false }
  }

  // Skeleton
  if (growPageState.products.length === 0) {
    app.innerHTML = `
      <section class="hero-section" style="padding: 40px 20px; background: linear-gradient(135deg, var(--purple-dark) 0%, var(--green-dark) 100%);">
        <div class="hero-content">
          <h2 class="hero-title" style="font-size: 3rem;">GROW SHOP</h2>
          <p class="hero-subtitle">Cargando catalogo...</p>
        </div>
      </section>
    `;
  }

  const { products, total, degraded } = await fetchProducts({
    category: filter === 'all' ? null : filter,
    limit: PAGE_SIZE,
    offset: growPageState.offset,
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
      <div class="filter-bar">
        ${Object.entries(growCategories).map(([key, label]) => `
          <button class="filter-btn ${filter === key ? 'active' : ''}" data-category="${key}">${label}</button>
        `).join('')}
      </div>
      <div class="product-grid fade-in">
        ${growPageState.products.map(p => renderGrowCard(p)).join('')}
      </div>
      ${growPageState.products.length === 0 ? '<div class="no-results"><div class="no-results-icon">&#128161;</div><p>No hay productos en esta categoria</p></div>' : ''}
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
  bindFilterEvents();

  const loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', async () => {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'Cargando...';
      growPageState.offset += PAGE_SIZE;
      await renderGrowPage(filter);
    });
  }
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

function renderPartnersPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="hero-section" style="padding: 60px 20px;">
      <div class="hero-content fade-in">
        <h2 class="hero-title">NUESTROS PARTNERS</h2>
        <p class="hero-subtitle">Trabajamos con los mejores distribuidores de equipamiento profesional de cultivo. Colaboraciones reales, stock garantizado, precios de partner.</p>
      </div>
    </section>

    <section class="partners-section">
      <div class="partners-wrap">
        <div class="partners-head">
          <span class="eyebrow">Partner oficial · Equipamiento</span>
          <h2>Natural Systems — nuestro distribuidor de referencia</h2>
          <p>Distribuidor oficial. Llevamos años trabajando con Natural Systems porque su catálogo y servicio hablan por sí solos: stock real, marcas premium y resultados que se notan en el cultivo.</p>
        </div>

        <article class="partner-card">
          <div class="partner-card-media">
            <div class="partner-mark">NATURAL<br/>SYSTEMS</div>
          </div>
          <div class="partner-card-body">
            <span class="partner-kicker">Distribuidor horticultura · España</span>
            <h3>Equipamiento profesional, catálogo completo</h3>
            <p>
              Natural Systems es uno de los distribuidores referentes en España en horticultura técnica,
              con certificaciones ISO 9001, 14001 y 45001. Todo su catálogo de iluminación,
              fertilizantes, sustratos, control de clima, cultivo y medición está disponible a través
              de nosotros — con la misma garantía y stock en tiempo real.
            </p>
            <div class="partner-feats">
              <span>Stock sincronizado</span>
              <span>Marcas premium</span>
              <span>Certificaciones ISO</span>
              <span>Envío discreto</span>
              <span>Precios competitivos</span>
            </div>
            <div class="partner-cta-row">
              <a href="https://naturalsystems.es/" class="btn btn-primary" target="_blank" rel="noopener noreferrer">Visitar Natural Systems →</a>
              <a href="#" class="btn btn-secondary" data-page="grow">Ver catálogo aquí</a>
            </div>
          </div>
        </article>

        <div style="text-align:center; margin-top:64px;">
          <h3 style="font-family: var(--font-heading); font-size: 1.5rem; font-weight:600; color: var(--text-primary); margin-bottom:8px;">¿Eres distribuidor o tienda?</h3>
          <p style="color: var(--text-secondary); max-width:58ch; margin: 0 auto;">Si tienes un grow shop físico o una tienda online y quieres condiciones mayoristas, escríbenos. Trabajamos con pedidos al por mayor bajo acuerdo.</p>
          <a href="mailto:info@groweldruida.es?subject=Contacto%20B2B" class="btn btn-primary" style="margin-top:20px; display:inline-block;">Contactar para B2B</a>
        </div>
      </div>
    </section>
  `;
  bindNavigationEvents();
  bindProductEvents();
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
          <p><strong>Grow El Druida</strong> nace de la pasion por el cultivo profesional y el equipamiento de alta gama para horticultura tecnica.</p>
          <p>Somos un grow shop completo donde encontraras todo el equipamiento profesional que necesitas: iluminacion LED, fertilizantes, sustratos, control de clima, sistemas de cultivo y herramientas de medicion.</p>
          <p>Trabajamos directamente con <strong>Natural Systems</strong> como distribuidor oficial, garantizando la maxima calidad y stock en tiempo real en cada producto del catalogo.</p>
          <p>Nuestro equipo cuenta con mas de <strong>20 anos de experiencia</strong> en el sector, asesorandote en cada paso de tu proyecto de cultivo.</p>
        </div>
        <img src="/images/logo.jpg" alt="Grow El Druida" class="about-img" />
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
          <div class="about-feature-icon">&#127807;</div>
          <h3>Partner Oficial</h3>
          <p>Distribuidor autorizado de Natural Systems</p>
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
          <div class="about-feature-icon">&#128154;</div>
          <h3>+20 Anos</h3>
          <p>Experiencia en el sector cannabico</p>
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
          <p>Inicia sesion para ver tus pedidos</p>
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
                  <span class="order-number">Pedido #${order.order_number}</span>
                  <span class="order-date">${date}</span>
                </div>
                <span class="order-status ${statusClass}">${statusMap[order.status] || order.status}</span>
              </div>
              <div class="order-card-items">
                ${order.order_items.map(item => `
                  <div class="order-item-row">
                    <span>${item.product_name} ${item.product_label ? `(${item.product_label})` : ''} x${item.quantity}</span>
                    <span>${item.subtotal.toFixed(2)} &euro;</span>
                  </div>
                `).join('')}
              </div>
              <div class="order-card-footer">
                <span>Envio: ${order.shipping_cost > 0 ? order.shipping_cost.toFixed(2) + ' &euro;' : 'GRATIS'}</span>
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
          <p>Inicia sesion para ver tu perfil</p>
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
        <p class="hero-subtitle">${user.email}</p>
      </div>
    </section>
    <section class="products-section">
      <div class="profile-form-wrap fade-in">
        <form id="profile-form">
          <div class="form-row">
            <div class="form-group">
              <label for="profile-name">Nombre completo</label>
              <input type="text" id="profile-name" value="${profile?.full_name || ''}" placeholder="Tu nombre" />
            </div>
            <div class="form-group">
              <label for="profile-phone">Telefono</label>
              <input type="tel" id="profile-phone" value="${profile?.phone || ''}" placeholder="+34 600 000 000" />
            </div>
          </div>
          <div class="form-group">
            <label for="profile-address">Direccion</label>
            <input type="text" id="profile-address" value="${profile?.address || ''}" placeholder="Calle, numero, piso..." />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="profile-city">Ciudad</label>
              <input type="text" id="profile-city" value="${profile?.city || ''}" placeholder="Ciudad" />
            </div>
            <div class="form-group">
              <label for="profile-zip">Codigo Postal</label>
              <input type="text" id="profile-zip" value="${profile?.zip || ''}" placeholder="28001" />
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
    const { updateProfile } = await import('./auth.js');
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
    <div class="product-card" data-id="${product.id}">
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
          ${product.inStock ? 'Anadir al carrito' : 'Agotado'}
        </button>
      </div>
    </div>
  `;
}

// ============================================
// EVENT BINDING
// ============================================
function bindProductEvents() {
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
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
}

function bindNavigationEvents() {
  document.querySelectorAll('#app [data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.page, link.dataset.filter || 'all');
    });
  });
}

function bindFilterEvents() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category;
      renderGrowPage(category);
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
      showToast('Tu carrito esta vacio');
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
// >>> PON TU NUMERO DE WHATSAPP AQUI (con codigo de pais, sin + ni espacios) <<<
const WHATSAPP_NUMBER = '34600000000';
const SHOP_EMAIL = 'info@groweldruida.es';

let checkoutData = {};

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

  const total = cart.getTotal().toFixed(2);
  const envio = cart.getTotal() >= 50 ? 'GRATIS' : '5.00 EUR';
  const totalFinal = cart.getTotal() >= 50 ? total : (cart.getTotal() + 5).toFixed(2);

  return `NUEVO PEDIDO - Grow El Druida
=========================================
PRODUCTOS:
${items}

Subtotal: ${total} EUR
Envio: ${envio}
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
  const envio = cart.getTotal() >= 50 ? 0 : 5;
  const totalFinal = cart.getTotal() + envio;

  summary.innerHTML = `
    <div class="summary-section">
      <h3>Productos</h3>
      ${cart.items.map(item => `
        <div class="summary-item">
          <span>${item.name} (${item.label}) x${item.quantity}</span>
          <span class="summary-price">${(item.price * item.quantity).toFixed(2)} &euro;</span>
        </div>
      `).join('')}
    </div>
    <div class="summary-section">
      <div class="summary-item">
        <span>Subtotal</span>
        <span>${cart.getTotal().toFixed(2)} &euro;</span>
      </div>
      <div class="summary-item">
        <span>Envio</span>
        <span>${envio === 0 ? '<span class="neon-tag">GRATIS</span>' : '5.00 &euro;'}</span>
      </div>
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
    try {
      await saveOrder(checkoutData, cart.items, cart.getTotal());
    } catch (err) {
      console.error('Error saving order:', err);
    }
    const text = encodeURIComponent(buildOrderText());
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
    cart.clear();
    renderCart();
    showCheckoutStep(3);
  });

  emailBtn.addEventListener('click', async () => {
    try {
      await saveOrder(checkoutData, cart.items, cart.getTotal());
    } catch (err) {
      console.error('Error saving order:', err);
    }
    const subject = encodeURIComponent(`Pedido - ${checkoutData.name}`);
    const body = encodeURIComponent(buildOrderText());
    window.open(`mailto:${SHOP_EMAIL}?subject=${subject}&body=${body}`, '_blank');
    cart.clear();
    renderCart();
    showCheckoutStep(3);
  });

  doneBtn.addEventListener('click', () => {
    closeCheckout();
    form.reset();
    navigateTo('home');
  });
}

// ============================================
// INIT
// ============================================
async function init() {
  initNavigation();
  initCart();
  initCheckout();
  createSmokeParticles();
  window.__navigateTo = navigateTo;

  // Carga inicial: primeros 8 productos para la home + categorias + auth en paralelo.
  // Si Supabase tarda, se muestra loading state; si falla, error state.
  renderLoadingPage();
  try {
    await Promise.all([
      loadProducts({ limit: 8 }),
      loadCategories(),
      initAuth(),
    ]);
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
        <img src="/images/logo.jpg" alt="Grow El Druida" class="hero-logo" />
        <h2 class="hero-title" style="font-size: 2rem;">Cargando catalogo...</h2>
        <p class="hero-subtitle">Conectando con Natural Systems</p>
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
        <p class="hero-subtitle">${err?.message || 'No pudimos cargar el catalogo'}</p>
        <div class="hero-cta" style="justify-content:center;">
          <button type="button" class="btn btn-primary" onclick="window.location.reload()">Reintentar</button>
        </div>
      </div>
    </section>
  `;
}

document.addEventListener('DOMContentLoaded', init);
