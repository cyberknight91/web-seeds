// ============================================
// COOKIE BANNER RGPD
// ============================================
// Guarda la preferencia del usuario en localStorage.
// Claves: cookie-consent = 'all' | 'essential' | null (no decidido)
// Tambien expone cookieConsent API para que otros scripts carguen
// analytics solo tras aceptar.

const STORAGE_KEY = 'cookie-consent'
const STORAGE_DATE_KEY = 'cookie-consent-date'

export const cookieConsent = {
  get() {
    return localStorage.getItem(STORAGE_KEY) // 'all' | 'essential' | null
  },
  set(value) {
    localStorage.setItem(STORAGE_KEY, value)
    localStorage.setItem(STORAGE_DATE_KEY, new Date().toISOString())
    document.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: value }))
  },
  reset() {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_DATE_KEY)
  },
  hasAcceptedAll() {
    return this.get() === 'all'
  },
}

function renderBanner() {
  if (document.getElementById('cookie-banner')) return
  const wrapper = document.createElement('div')
  wrapper.id = 'cookie-banner'
  wrapper.className = 'cookie-banner'
  wrapper.setAttribute('role', 'dialog')
  wrapper.setAttribute('aria-modal', 'false')
  wrapper.setAttribute('aria-labelledby', 'cookie-banner-title')
  wrapper.innerHTML = `
    <div class="cookie-banner-inner">
      <div class="cookie-banner-text">
        <h3 id="cookie-banner-title">Cookies</h3>
        <p>
          Usamos cookies propias técnicas esenciales (inicio de sesión, carrito) y,
          si las aceptas, cookies de analítica anónima para mejorar la web.
          Consulta la <a href="/cookies.html">política de cookies</a>.
        </p>
      </div>
      <div class="cookie-banner-actions">
        <button type="button" class="btn-cookie btn-cookie-reject" data-consent="essential">
          Solo esenciales
        </button>
        <button type="button" class="btn-cookie btn-cookie-accept" data-consent="all">
          Aceptar todas
        </button>
      </div>
    </div>
  `
  document.body.appendChild(wrapper)

  wrapper.querySelectorAll('[data-consent]').forEach((btn) => {
    btn.addEventListener('click', () => {
      cookieConsent.set(btn.dataset.consent)
      wrapper.classList.add('cookie-banner-hidden')
      setTimeout(() => wrapper.remove(), 400)
    })
  })
}

export function initCookieBanner() {
  // Si ya hay decision (aceptada o rechazada), no mostramos el banner.
  if (cookieConsent.get()) return
  // Esperamos un momento para no molestar en el primer paint.
  setTimeout(renderBanner, 800)
}
