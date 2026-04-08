import './style.css';
import { seeds, growProducts, allProducts, seedCategories, growCategories } from './data/products.js';
import { cart, renderCart, showToast } from './cart.js';
import { createSmokeParticles } from './effects.js';

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
    case 'seeds': renderSeedsPage(filter); break;
    case 'grow': renderGrowPage(filter); break;
    case 'offers': renderOffersPage(); break;
    case 'about': renderAboutPage(); break;
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// RENDER PAGES
// ============================================
function renderHomePage() {
  const app = document.getElementById('app');
  const featuredSeeds = seeds.slice(0, 4);
  const featuredGrow = growProducts.slice(0, 4);

  app.innerHTML = `
    <!-- HERO -->
    <section class="hero-section">
      <div class="hero-content fade-in">
        <img src="/images/logo.jpg" alt="Grow El Druida" class="hero-logo" />
        <h2 class="hero-title">GROW EL DRUIDA</h2>
        <p class="hero-subtitle">Tu Coffee Shop Online - Las mejores geneticas y el mejor equipo de cultivo</p>
        <div class="hero-badges">
          <span class="hero-badge">+70 Variedades</span>
          <span class="hero-badge">Envio Discreto</span>
          <span class="hero-badge">Geneticas USA & EU</span>
          <span class="hero-badge">Grow Shop Completo</span>
        </div>
        <div class="hero-cta">
          <a href="#" class="btn btn-primary" data-page="seeds">Ver Semillas</a>
          <a href="#" class="btn btn-secondary" data-page="grow">Grow Shop</a>
        </div>
      </div>
    </section>

    <!-- MARQUEE -->
    <div class="marquee-banner">
      <span class="marquee-text">
        ENVIO GRATIS a partir de 50EUR --- NUEVAS GENETICAS USA --- OFERTAS SEMANALES --- PACKS MIX DISPONIBLES --- GROW SHOP COMPLETO --- LED, FERTILIZANTES, SUSTRATOS y MAS ---
      </span>
    </div>

    <!-- CATEGORIES -->
    <section class="categories-section">
      <h2 class="section-title">EXPLORA NUESTRO CATALOGO</h2>
      <p class="section-subtitle">Semillas de coleccion y equipamiento profesional de cultivo</p>
      <div class="category-grid">
        <div class="category-card slide-up" data-page="seeds" data-filter="feminized">
          <img src="https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=600&h=300&fit=crop" alt="Feminizadas" class="category-card-img" />
          <div class="category-card-body">
            <h3>Semillas Feminizadas</h3>
            <p>Las mejores geneticas feminizadas. 100% hembra garantizada.</p>
            <span class="category-card-count">${seeds.filter(s => s.category === 'feminized').length} productos</span>
          </div>
        </div>
        <div class="category-card slide-up" data-page="seeds" data-filter="auto">
          <img src="https://images.unsplash.com/photo-1563291589-4e12fd737131?w=600&h=300&fit=crop" alt="Autos" class="category-card-img" />
          <div class="category-card-body">
            <h3>Autoflorecientes</h3>
            <p>Rapidas y faciles. De semilla a cosecha en 60-75 dias.</p>
            <span class="category-card-count">${seeds.filter(s => s.category === 'auto').length} productos</span>
          </div>
        </div>
        <div class="category-card slide-up" data-page="grow" data-filter="lighting">
          <img src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=300&fit=crop" alt="Iluminacion" class="category-card-img" />
          <div class="category-card-body">
            <h3>Iluminacion LED</h3>
            <p>Paneles LED de ultima generacion. Eficiencia maxima.</p>
            <span class="category-card-count">${growProducts.filter(p => p.category === 'lighting').length} productos</span>
          </div>
        </div>
        <div class="category-card slide-up" data-page="grow" data-filter="fertilizers">
          <img src="https://images.unsplash.com/photo-1585314062604-1a357de8b000?w=600&h=300&fit=crop" alt="Fertilizantes" class="category-card-img" />
          <div class="category-card-body">
            <h3>Fertilizantes</h3>
            <p>Nutricion completa para todo el ciclo de cultivo.</p>
            <span class="category-card-count">${growProducts.filter(p => p.category === 'fertilizers').length} productos</span>
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURED SEEDS -->
    <section class="products-section">
      <h2 class="section-title">SEMILLAS DESTACADAS</h2>
      <p class="section-subtitle">Las favoritas de nuestros clientes</p>
      <div class="product-grid">
        ${featuredSeeds.map(p => renderSeedCard(p)).join('')}
      </div>
      <div style="text-align: center; margin-top: 32px;">
        <a href="#" class="btn btn-primary" data-page="seeds">Ver todas las semillas</a>
      </div>
    </section>

    <!-- BANNER -->
    <section class="featured-banner">
      <h2>PACKS MIX - VARIEDAD AL MEJOR PRECIO</h2>
      <p>Descubre nuestros packs tematicos: Sativa, Indica, Purple, Quick y mas</p>
      <a href="#" class="btn btn-primary" data-page="seeds" data-filter="feminized" style="position:relative;z-index:1;">Ver Packs</a>
    </section>

    <!-- FEATURED GROW -->
    <section class="products-section">
      <h2 class="section-title">GROW SHOP - LO MAS VENDIDO</h2>
      <p class="section-subtitle">Equipamiento profesional para tu cultivo</p>
      <div class="product-grid">
        ${featuredGrow.map(p => renderGrowCard(p)).join('')}
      </div>
      <div style="text-align: center; margin-top: 32px;">
        <a href="#" class="btn btn-secondary" data-page="grow">Ver todo el Grow Shop</a>
      </div>
    </section>
  `;

  bindProductEvents();
  bindNavigationEvents();
}

function renderSeedsPage(filter = 'all') {
  const app = document.getElementById('app');
  const filtered = filter === 'all' ? seeds : seeds.filter(s => s.category === filter);

  app.innerHTML = `
    <section class="hero-section" style="padding: 40px 20px;">
      <div class="hero-content">
        <h2 class="hero-title" style="font-size: 3rem;">SEMILLAS DE COLECCION</h2>
        <p class="hero-subtitle">Geneticas premium de los mejores breeders</p>
      </div>
    </section>
    <section class="products-section">
      <div class="filter-bar">
        ${Object.entries(seedCategories).map(([key, label]) => `
          <button class="filter-btn ${filter === key ? 'active' : ''}" data-category="${key}" data-type="seeds">${label}</button>
        `).join('')}
      </div>
      <div class="product-grid fade-in">
        ${filtered.map(p => renderSeedCard(p)).join('')}
      </div>
      ${filtered.length === 0 ? '<div class="no-results"><div class="no-results-icon">&#127793;</div><p>No hay productos en esta categoria</p></div>' : ''}
    </section>
  `;

  bindProductEvents();
  bindFilterEvents();
}

function renderGrowPage(filter = 'all') {
  const app = document.getElementById('app');
  const filtered = filter === 'all' ? growProducts : growProducts.filter(p => p.category === filter);

  app.innerHTML = `
    <section class="hero-section" style="padding: 40px 20px; background: linear-gradient(135deg, var(--purple-dark) 0%, var(--green-dark) 100%);">
      <div class="hero-content">
        <h2 class="hero-title" style="font-size: 3rem;">GROW SHOP</h2>
        <p class="hero-subtitle">Todo lo que necesitas para tu cultivo interior y exterior</p>
      </div>
    </section>
    <section class="products-section">
      <div class="filter-bar">
        ${Object.entries(growCategories).map(([key, label]) => `
          <button class="filter-btn ${filter === key ? 'active' : ''}" data-category="${key}" data-type="grow">${label}</button>
        `).join('')}
      </div>
      <div class="product-grid fade-in">
        ${filtered.map(p => renderGrowCard(p)).join('')}
      </div>
      ${filtered.length === 0 ? '<div class="no-results"><div class="no-results-icon">&#128161;</div><p>No hay productos en esta categoria</p></div>' : ''}
    </section>
  `;

  bindProductEvents();
  bindFilterEvents();
}

function renderOffersPage() {
  const app = document.getElementById('app');
  const offers = allProducts.filter(p => p.offer);

  app.innerHTML = `
    <section class="offers-hero">
      <h2>OFERTAS Y PROMOCIONES</h2>
      <p>Los mejores precios en semillas y equipamiento</p>
    </section>
    <section class="products-section">
      <div class="product-grid fade-in">
        ${offers.map(p => p.type === 'seed' ? renderSeedCard(p) : renderGrowCard(p)).join('')}
      </div>
      ${offers.length === 0 ? '<div class="no-results"><div class="no-results-icon">&#128293;</div><p>No hay ofertas disponibles ahora mismo</p></div>' : ''}
    </section>
  `;

  bindProductEvents();
}

function renderAboutPage() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <section class="hero-section" style="padding: 40px 20px; background: linear-gradient(135deg, var(--brown-dark), var(--green-dark));">
      <div class="hero-content">
        <h2 class="hero-title" style="font-size: 3rem;">SOBRE NOSOTROS</h2>
        <p class="hero-subtitle">Pasion por la genetica desde el corazon de Amsterdam</p>
      </div>
    </section>
    <section class="about-section">
      <div class="about-content">
        <div class="about-text">
          <p><strong>Grow El Druida</strong> nace de la pasion por las mejores geneticas cannabicas y la cultura del coffee shop de Amsterdam.</p>
          <p>Combinamos semillas de coleccion de los mejores breeders europeos y americanos con un grow shop completo donde encontraras todo el equipamiento profesional que necesitas.</p>
          <p>Trabajamos con marcas reconocidas como <strong>Exotic Seed</strong> para nuestras geneticas y <strong>Natural Systems</strong> para el equipamiento de cultivo, garantizando la maxima calidad en cada producto.</p>
          <p>Nuestro equipo cuenta con mas de <strong>20 anos de experiencia</strong> en el sector, asesorandote en cada paso de tu proyecto de cultivo.</p>
        </div>
        <img src="/images/logo.jpg" alt="Grow El Druida" class="about-img" />
      </div>
      <div class="about-features">
        <div class="about-feature">
          <div class="about-feature-icon">&#127793;</div>
          <h3>+70 Variedades</h3>
          <p>Feminizadas, autos, regulares y CBD de los mejores criadores</p>
        </div>
        <div class="about-feature">
          <div class="about-feature-icon">&#128230;</div>
          <h3>Envio Discreto</h3>
          <p>Packaging anonimo y envio rapido a toda Europa</p>
        </div>
        <div class="about-feature">
          <div class="about-feature-icon">&#128161;</div>
          <h3>Grow Shop Pro</h3>
          <p>Iluminacion, fertilizantes, sustratos y control clima</p>
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

function renderSearchResults(query) {
  const app = document.getElementById('app');
  const q = query.toLowerCase();
  const results = allProducts.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.genetics && p.genetics.toLowerCase().includes(q)) ||
    p.description.toLowerCase().includes(q) ||
    (p.brand && p.brand.toLowerCase().includes(q)) ||
    p.category.toLowerCase().includes(q)
  );

  app.innerHTML = `
    <section class="search-results">
      <h2>Resultados para "${query}" (${results.length})</h2>
      <div class="product-grid fade-in">
        ${results.map(p => p.type === 'seed' ? renderSeedCard(p) : renderGrowCard(p)).join('')}
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
function renderSeedCard(product) {
  const priceEntries = Object.entries(product.prices);
  const firstPrice = priceEntries[0];
  const hasMultiplePrices = priceEntries.length > 1;

  return `
    <div class="product-card" data-id="${product.id}">
      ${product.badge ? `<span class="product-card-badge badge-${product.badge.toLowerCase()}">${product.badge}</span>` : ''}
      ${product.offer ? `<span class="product-card-offer">OFERTA</span>` : ''}
      <div class="product-card-img-wrap">
        <img src="${product.image}" alt="${product.name}" class="product-card-img" loading="lazy" />
      </div>
      <div class="product-card-body">
        <h3 class="product-card-name">${product.name}</h3>
        <p class="product-card-genetics">${product.genetics}</p>
        <div class="product-card-stats">
          <span class="stat-tag thc">THC: ${product.thc}</span>
          ${product.cbd ? `<span class="stat-tag cbd-tag">CBD: ${product.cbd}</span>` : ''}
          <span class="stat-tag flowering">${product.flowering}</span>
        </div>
        <p class="product-card-desc">${product.description}</p>
        <div class="product-card-price">
          <div>
            <span class="price-current">${firstPrice[1].toFixed(2)}&euro;</span>
            ${product.offer && product.oldPrice ? `<span class="price-old">${product.oldPrice.toFixed(2)}&euro;</span>` : ''}
          </div>
          ${hasMultiplePrices ? `
            <select class="price-select" data-product-id="${product.id}">
              ${priceEntries.map(([qty, price]) => `<option value="${qty}">${qty} sem. - ${price.toFixed(2)}&euro;</option>`).join('')}
            </select>
          ` : `
            <span class="stat-tag">${firstPrice[0]} semillas</span>
          `}
        </div>
        <button class="add-to-cart-btn" data-id="${product.id}" data-type="seed">Anadir al carrito</button>
      </div>
    </div>
  `;
}

function renderGrowCard(product) {
  return `
    <div class="product-card" data-id="${product.id}">
      ${product.badge ? `<span class="product-card-badge badge-${product.badge.toLowerCase()}">${product.badge}</span>` : ''}
      ${product.offer ? `<span class="product-card-offer">OFERTA</span>` : ''}
      <div class="product-card-img-wrap">
        <img src="${product.image}" alt="${product.name}" class="product-card-img" loading="lazy" />
      </div>
      <div class="product-card-body">
        <h3 class="product-card-name">${product.name}</h3>
        ${product.brand ? `<p class="product-card-genetics">${product.brand}</p>` : ''}
        <p class="product-card-desc">${product.description}</p>
        <div class="product-card-price">
          <div>
            <span class="price-current">${product.price.toFixed(2)}&euro;</span>
            ${product.offer && product.oldPrice ? `<span class="price-old">${product.oldPrice.toFixed(2)}&euro;</span>` : ''}
          </div>
        </div>
        <button class="add-to-cart-btn" data-id="${product.id}" data-type="grow">Anadir al carrito</button>
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
      const id = btn.dataset.id;
      const type = btn.dataset.type;
      const product = type === 'seed'
        ? seeds.find(s => s.id === id)
        : growProducts.find(p => p.id === id);

      if (product) {
        let price, label;
        if (type === 'seed') {
          const select = document.querySelector(`select[data-product-id="${id}"]`);
          const qty = select ? select.value : Object.keys(product.prices)[0];
          price = product.prices[qty];
          label = `${qty} sem.`;
        } else {
          price = product.price;
          label = '1 ud.';
        }

        cart.addItem({
          id: product.id,
          name: product.name,
          price: price,
          image: product.image,
          label: label
        });

        renderCart();
        showToast(`${product.name} anadido al carrito`);
      }
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
      const type = btn.dataset.type;
      if (type === 'seeds') {
        renderSeedsPage(category);
      } else {
        renderGrowPage(category);
      }
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

function openCheckout() {
  document.getElementById('checkout-modal').classList.add('open');
  document.getElementById('checkout-overlay').classList.add('open');
  showCheckoutStep(1);
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

  whatsappBtn.addEventListener('click', () => {
    const text = encodeURIComponent(buildOrderText());
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
    cart.clear();
    renderCart();
    showCheckoutStep(3);
  });

  emailBtn.addEventListener('click', () => {
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
function init() {
  initNavigation();
  initCart();
  initCheckout();
  createSmokeParticles();
  renderHomePage();
}

document.addEventListener('DOMContentLoaded', init);
