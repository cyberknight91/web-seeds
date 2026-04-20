// ============================================
// CART SYSTEM
// ============================================

import { esc } from './utils.js';

class Cart {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('cart-items') || '[]');
  }

  addItem(item) {
    const existing = this.items.find(i => i.id === item.id && i.label === item.label);
    const maxStock = typeof item.stock === 'number' ? item.stock : Infinity;
    if (existing) {
      if (existing.quantity < maxStock) existing.quantity++;
    } else {
      this.items.push({ ...item, quantity: 1 });
    }
    this.save();
  }

  removeItem(index) {
    this.items.splice(index, 1);
    this.save();
  }

  updateQuantity(index, delta) {
    const it = this.items[index];
    const maxStock = typeof it.stock === 'number' ? it.stock : Infinity;
    const next = it.quantity + delta;
    if (next <= 0) {
      this.removeItem(index);
    } else {
      it.quantity = Math.min(next, maxStock);
      this.save();
    }
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  getCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  save() {
    localStorage.setItem('cart-items', JSON.stringify(this.items));
  }

  clear() {
    this.items = [];
    this.save();
  }
}

export const cart = new Cart();

export function renderCart() {
  const cartItems = document.getElementById('cart-items');
  const cartCount = document.getElementById('cart-count');
  const cartTotal = document.getElementById('cart-total-price');

  cartCount.textContent = cart.getCount();
  cartTotal.innerHTML = `${cart.getTotal().toFixed(2)} &euro;`;

  if (cart.items.length === 0) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon" aria-hidden="true">&#128722;</div>
        <p>Tu carrito está vacío</p>
        <p style="font-size: 0.85rem; margin-top: 8px; opacity: 0.6;">Añade productos para comenzar</p>
      </div>
    `;
    return;
  }

  cartItems.innerHTML = cart.items.map((item, index) => `
    <div class="cart-item">
      <img src="${esc(item.image)}" alt="${esc(item.name)}" class="cart-item-img" loading="lazy" />
      <div class="cart-item-info">
        <div class="cart-item-name">${esc(item.name)}</div>
        <div class="cart-item-price">${item.price.toFixed(2)} &euro;${item.label ? ` (${esc(item.label)})` : ''}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" data-action="decrease" data-index="${index}" aria-label="Reducir cantidad">-</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" data-action="increase" data-index="${index}" aria-label="Aumentar cantidad">+</button>
        </div>
      </div>
      <button class="cart-item-remove" data-action="remove" data-index="${index}" aria-label="Quitar del carrito">&times;</button>
    </div>
  `).join('');

  // Bind cart item events
  cartItems.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      const action = btn.dataset.action;
      if (action === 'increase') cart.updateQuantity(index, 1);
      else if (action === 'decrease') cart.updateQuantity(index, -1);
      else if (action === 'remove') cart.removeItem(index);
      renderCart();
    });
  });
}

// Toast notification
let toastTimeout;
export function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}
