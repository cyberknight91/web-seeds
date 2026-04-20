import { supabase } from './supabase.js'
import { esc } from './utils.js'

let currentUser = null

// ============================================
// AUTH FUNCTIONS
// ============================================

export async function register(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  })

  if (error) return { error }

  // Create profile
  if (data.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: fullName,
      email: email
    })
  }

  return { data }
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export async function logout() {
  await supabase.auth.signOut()
  currentUser = null
}

export function getCurrentUser() {
  return currentUser
}

export async function getProfile() {
  if (!currentUser) return null
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single()
  return data
}

export async function updateProfile(profileData) {
  if (!currentUser) return { error: 'No user' }
  const { data, error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', currentUser.id)
    .select()
    .single()
  return { data, error }
}

// ============================================
// UI UPDATES
// ============================================

function updateAuthUI() {
  const authBtn = document.getElementById('auth-btn')
  const mobileLink = document.getElementById('mobile-auth-link')
  if (!authBtn) return

  if (currentUser) {
    const name = currentUser.user_metadata?.full_name || currentUser.email
    authBtn.innerHTML = `<span class="auth-user-name">${esc(name)}</span>`
    authBtn.classList.add('logged-in')
    if (mobileLink) {
      mobileLink.textContent = name
      mobileLink.dataset.loggedIn = 'true'
    }
  } else {
    authBtn.textContent = 'Iniciar Sesión'
    authBtn.classList.remove('logged-in')
    if (mobileLink) {
      mobileLink.textContent = 'Iniciar Sesión'
      mobileLink.dataset.loggedIn = 'false'
    }
  }
}

// ============================================
// AUTH MODAL
// ============================================

function openAuthModal() {
  document.getElementById('auth-modal').classList.add('open')
  document.getElementById('auth-overlay').classList.add('open')
  showAuthTab('login')
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.remove('open')
  document.getElementById('auth-overlay').classList.remove('open')
  clearAuthErrors()
}

function showAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab)
  })
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login')
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register')
  clearAuthErrors()
}

function clearAuthErrors() {
  document.querySelectorAll('.auth-error, .auth-success').forEach(el => {
    el.classList.add('hidden')
    el.textContent = ''
  })
}

function showUserMenu() {
  const existing = document.getElementById('user-menu-dropdown')
  if (existing) {
    existing.remove()
    return
  }

  const btn = document.getElementById('auth-btn')
  const rect = btn.getBoundingClientRect()

  const menu = document.createElement('div')
  menu.id = 'user-menu-dropdown'
  menu.className = 'user-menu-dropdown'
  menu.innerHTML = `
    <a href="#" id="menu-my-orders">Mis Pedidos</a>
    <a href="#" id="menu-my-profile">Mi Perfil</a>
    <a href="#" id="menu-logout">Cerrar Sesion</a>
  `
  menu.style.top = `${rect.bottom + 8}px`
  menu.style.right = `${window.innerWidth - rect.right}px`
  document.body.appendChild(menu)

  document.getElementById('menu-my-orders').addEventListener('click', (e) => {
    e.preventDefault()
    menu.remove()
    if (window.__navigateTo) window.__navigateTo('orders')
  })

  document.getElementById('menu-my-profile').addEventListener('click', (e) => {
    e.preventDefault()
    menu.remove()
    if (window.__navigateTo) window.__navigateTo('profile')
  })

  document.getElementById('menu-logout').addEventListener('click', async (e) => {
    e.preventDefault()
    menu.remove()
    await logout()
  })

  // Close on click outside
  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!menu.contains(e.target) && e.target !== btn) {
        menu.remove()
        document.removeEventListener('click', handler)
      }
    })
  }, 10)
}

// ============================================
// INIT
// ============================================

export async function initAuth() {
  // Get current session
  const { data: { session } } = await supabase.auth.getSession()
  currentUser = session?.user || null
  updateAuthUI()

  // Listen for auth changes
  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null
    updateAuthUI()
  })

  // Auth button click
  const authBtn = document.getElementById('auth-btn')
  authBtn.addEventListener('click', () => {
    if (currentUser) {
      showUserMenu()
    } else {
      openAuthModal()
    }
  })

  // Mobile auth link
  const mobileLink = document.getElementById('mobile-auth-link')
  if (mobileLink) {
    mobileLink.addEventListener('click', (e) => {
      e.preventDefault()
      document.getElementById('mobile-nav').classList.remove('open')
      if (currentUser) {
        if (window.__navigateTo) window.__navigateTo('orders')
      } else {
        openAuthModal()
      }
    })
  }

  // Close modal
  document.getElementById('auth-close').addEventListener('click', closeAuthModal)
  document.getElementById('auth-overlay').addEventListener('click', closeAuthModal)

  // Tab switching
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => showAuthTab(tab.dataset.tab))
  })

  // Login form
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('login-email').value.trim()
    const password = document.getElementById('login-password').value
    const errorEl = document.getElementById('login-error')

    errorEl.classList.add('hidden')

    const { error } = await login(email, password)
    if (error) {
      errorEl.textContent = error.message === 'Invalid login credentials'
        ? 'Email o contrasena incorrectos'
        : error.message
      errorEl.classList.remove('hidden')
    } else {
      closeAuthModal()
      document.getElementById('login-form').reset()
    }
  })

  // Register form
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const name = document.getElementById('register-name').value.trim()
    const email = document.getElementById('register-email').value.trim()
    const password = document.getElementById('register-password').value
    const errorEl = document.getElementById('register-error')
    const successEl = document.getElementById('register-success')

    errorEl.classList.add('hidden')
    successEl.classList.add('hidden')

    const { error } = await register(email, password, name)
    if (error) {
      errorEl.textContent = error.message
      errorEl.classList.remove('hidden')
    } else {
      successEl.textContent = 'Cuenta creada. Revisa tu email para confirmar o inicia sesión.'
      successEl.classList.remove('hidden')
      document.getElementById('register-form').reset()
    }
  })
}
