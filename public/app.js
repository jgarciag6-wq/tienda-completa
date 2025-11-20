// ===== ESTADO GLOBAL =====
let allProducts = [];
let filteredProducts = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

// ===== SELECTORES =====
const productsGrid = document.getElementById('products-grid');
const featuredRow = document.getElementById('featured-row');

const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const sortFilter = document.getElementById('sort-filter');

const cartToggle = document.getElementById('cart-toggle');
const cartPanel = document.getElementById('cart-panel');
const cartClose = document.getElementById('cart-close');
const cartBackdrop = document.getElementById('cart-backdrop');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const cartCountEl = document.getElementById('cart-count');
const cartCheckoutBtn = document.getElementById('cart-checkout');
const cartClearBtn = document.getElementById('cart-clear');
const cartMessageEl = document.getElementById('cart-message');

// ===== INICIO =====
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  attachUIEvents();
  renderCart();
});

// ===== CARGAR PRODUCTOS =====
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    allProducts = await res.json();
    filteredProducts = [...allProducts];

    populateCategoryFilter(allProducts);
    renderProducts(filteredProducts);
    renderFeatured(allProducts.filter((p) => p.featured).slice(0, 4));
  } catch (err) {
    console.error('Error cargando productos:', err);
    if (productsGrid) {
      productsGrid.innerHTML =
        '<p class="muted">No se pudieron cargar los productos.</p>';
    }
  }
}

// ===== FILTROS =====
function applyFilters() {
  const term = (searchInput?.value || '').toLowerCase();
  const category = categoryFilter?.value || '';
  const sort = sortFilter?.value || 'recent';

  let list = [...allProducts];

  if (term) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.brand || '').toLowerCase().includes(term)
    );
  }

  if (category) {
    list = list.filter(
      (p) => (p.category || '').toLowerCase() === category.toLowerCase()
    );
  }

  if (sort === 'price-asc') {
    list.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sort === 'price-desc') {
    list.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else {
    list.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }

  filteredProducts = list;
  renderProducts(filteredProducts);
}

function populateCategoryFilter(products) {
  if (!categoryFilter) return;
  const cats = new Set();
  products.forEach((p) => {
    if (p.category) cats.add(p.category);
  });

  categoryFilter.innerHTML = `<option value="">Todas las categorías</option>`;
  Array.from(cats).forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
}

// ===== RENDER CATÁLOGO =====
function renderProducts(list) {
  if (!productsGrid) return;

  if (!list.length) {
    productsGrid.innerHTML =
      '<p class="muted">No hay productos que coincidan.</p>';
    return;
  }

  productsGrid.innerHTML = list
    .map((p) => {
      const imgUrl =
        p.imageUrl && p.imageUrl.trim()
          ? p.imageUrl
          : 'https://via.placeholder.com/400x300?text=ElectroNova';
      const imgHtml = `
        <div class="product-image-wrapper">
          <img src="${imgUrl}" alt="${p.name}">
        </div>
      `;

      const badgeHtml = p.category
        ? `<span class="product-badge">${p.category}</span>`
        : '';

      return `
      <article class="product-card">
        ${badgeHtml}
        ${imgHtml}
        <h3>${p.name}</h3>
        <p class="muted">${p.brand || 'Sin marca'}</p>
        <p class="muted">${p.description || ''}</p>
        <div class="product-meta-row">
          <span class="product-price">$ ${Number(
            p.price || 0
          ).toLocaleString('es-CO')}</span>
          <span class="product-stock">Stock: ${p.stock ?? 0}</span>
        </div>
        <button class="btn-primary full-width" data-id="${p._id}">
          Agregar al carrito
        </button>
      </article>
    `;
    })
    .join('');

  productsGrid.querySelectorAll('button[data-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      addToCart(id);
    });
  });
}

// ===== RENDER DESTACADOS =====
function renderFeatured(list) {
  if (!featuredRow) return;

  if (!list.length) {
    featuredRow.innerHTML =
      '<p class="muted">Aún no hay productos destacados.</p>';
    return;
  }

  featuredRow.innerHTML = list
    .map((p) => {
      const imgUrl =
        p.imageUrl && p.imageUrl.trim()
          ? p.imageUrl
          : 'https://via.placeholder.com/400x300?text=ElectroNova';

      return `
      <article class="featured-card">
        <span class="product-badge">${p.category || 'General'}</span>
        <div class="product-image-wrapper small">
          <img src="${imgUrl}" alt="${p.name}">
        </div>
        <h3>${p.name}</h3>
        <p class="muted">${p.brand || ''}</p>
        <span class="product-price">$ ${Number(
          p.price || 0
        ).toLocaleString('es-CO')}</span>
      </article>
    `;
    })
    .join('');
}

// ===== CARRITO =====
function addToCart(id) {
  const product = allProducts.find((p) => p._id === id);
  if (!product) return;

  const item = cart.find((it) => it._id === id);
  if (item) {
    if (item.quantity < product.stock) {
      item.quantity += 1;
    } else {
      showCartMessage('No hay más unidades disponibles.', true);
    }
  } else {
    if (product.stock <= 0) {
      showCartMessage('Este producto no tiene stock.', true);
      return;
    }
    cart.push({
      _id: product._id,
      name: product.name,
      price: product.price || 0,
      stock: product.stock || 0,
      quantity: 1,
    });
  }

  saveCart();
  renderCart();
  openCart();
}

function changeQuantity(id, delta) {
  const item = cart.find((it) => it._id === id);
  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    cart = cart.filter((it) => it._id !== id);
  } else {
    const product = allProducts.find((p) => p._id === id);
    if (product && item.quantity > product.stock) {
      item.quantity = product.stock;
      showCartMessage('No hay más unidades disponibles.', true);
    }
  }

  saveCart();
  renderCart();
}

function clearCart() {
  cart = [];
  saveCart();
  renderCart();
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function renderCart() {
  if (!cartItemsEl || !cartTotalEl || !cartCountEl) return;

  cartItemsEl.innerHTML = '';
  let total = 0;
  let count = 0;

  if (!cart.length) {
    cartItemsEl.innerHTML =
      '<p class="muted">Tu carrito está vacío.</p>';
  } else {
    cart.forEach((item) => {
      total += item.price * item.quantity;
      count += item.quantity;

      const row = document.createElement('div');
      row.className = 'cart-item-row';
      row.innerHTML = `
        <div class="cart-item-main">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-sub">
            <span>$ ${Number(item.price).toLocaleString(
              'es-CO'
            )} c/u</span>
            <span>Stock: ${item.stock}</span>
          </div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" data-id="${item._id}" data-delta="-1">−</button>
          <span class="qty-label">${item.quantity}</span>
          <button class="qty-btn" data-id="${item._id}" data-delta="1">+</button>
        </div>
      `;
      cartItemsEl.appendChild(row);
    });
  }

  cartTotalEl.textContent = `$ ${Number(total).toLocaleString('es-CO')}`;
  cartCountEl.textContent = count;

  if (cartCheckoutBtn) cartCheckoutBtn.disabled = cart.length === 0;

  cartItemsEl.querySelectorAll('.qty-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const delta = Number(btn.getAttribute('data-delta'));
      changeQuantity(id, delta);
    });
  });
}

function simulateCheckout() {
  if (!cart.length) return;

  if (cartCheckoutBtn) cartCheckoutBtn.disabled = true;
  showCartMessage('Procesando pago simulado...', false);

  setTimeout(() => {
    clearCart();
    showCartMessage(
      'Compra realizada correctamente (simulada). ¡Gracias por tu pedido!',
      false
    );
    if (cartCheckoutBtn) cartCheckoutBtn.disabled = false;
  }, 900);
}

function showCartMessage(text, isError) {
  if (!cartMessageEl) return;
  cartMessageEl.textContent = text;
  cartMessageEl.classList.remove('cart-message-ok', 'cart-message-error');
  cartMessageEl.classList.add(
    isError ? 'cart-message-error' : 'cart-message-ok'
  );
}

// ===== PANEL CARRITO =====
function openCart() {
  cartPanel?.classList.remove('hidden');
  cartBackdrop?.classList.remove('hidden');
}

function closeCartPanel() {
  cartPanel?.classList.add('hidden');
  cartBackdrop?.classList.add('hidden');
}

// ===== TABS (SECCIONES) =====
function activateSection(sectionName) {
  const sections = document.querySelectorAll('.page-section');
  sections.forEach((sec) => sec.classList.remove('active'));

  const target = document.getElementById(`section-${sectionName}`);
  if (target) target.classList.add('active');
}

// ===== EVENTOS UI =====
function attachUIEvents() {
  // filtros
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
  if (sortFilter) sortFilter.addEventListener('change', applyFilters);

  // carrito
  if (cartToggle) cartToggle.addEventListener('click', openCart);
  if (cartClose) cartClose.addEventListener('click', closeCartPanel);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeCartPanel);
  if (cartClearBtn) cartClearBtn.addEventListener('click', clearCart);
  if (cartCheckoutBtn)
    cartCheckoutBtn.addEventListener('click', simulateCheckout);

  // navegación por secciones
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const section = btn.getAttribute('data-section');
      if (section) activateSection(section);
    });
  });
}  
// =========================================================
// SISTEMA DE USUARIO (REGISTRO + LOGIN + PERFIL + LOGOUT)
// =========================================================

// Elementos del DOM
const userToggle = document.getElementById("user-toggle");
const userDropdown = document.getElementById("user-dropdown");
const userPanel = document.getElementById("user-panel");
const userBackdrop = document.getElementById("user-backdrop");
const userContent = document.getElementById("user-content");
const logoutBtnUser = document.getElementById("logout-btn");

// Estado Global Usuario
let USER_TOKEN = localStorage.getItem("userToken") || null;
let USER_DATA = JSON.parse(localStorage.getItem("userData") || "null");


// =========================================================
// ABRIR / CERRAR PANEL DE USUARIO
// =========================================================

userToggle?.addEventListener("click", () => {
  userDropdown.classList.toggle("hidden");
});

// cerrar menú al hacer clic afuera
document.addEventListener("click", (e) => {
  if (!userToggle.contains(e.target) && !userDropdown.contains(e.target)) {
    userDropdown.classList.add("hidden");
  }
});

function openUserPanel() {
  userPanel.classList.remove("hidden");
  userBackdrop.classList.remove("hidden");
}

function closeUserPanel() {
  userPanel.classList.add("hidden");
  userBackdrop.classList.add("hidden");
}

userBackdrop?.addEventListener("click", closeUserPanel);


// =========================================================
// MOSTRAR LOGIN
// =========================================================

function showLoginForm() {
  userContent.innerHTML = `
    <div class="user-form">

      <h3 class="user-title">Iniciar sesión</h3>

      <label class="user-label">Correo electrónico</label>
      <input id="login-email" type="email" class="user-input" placeholder="correo@ejemplo.com">

      <label class="user-label">Contraseña</label>
      <input id="login-pass" type="password" class="user-input" placeholder="******">

      <button id="btn-login-user" class="user-btn user-btn-primary full-width">
        Entrar
      </button>

      <div class="user-links">
        <span>¿No tienes cuenta?</span>
        <button id="go-register" class="user-btn-link">
          Registrarse
        </button>
      </div>
    </div>
  `;

  document.getElementById("btn-login-user").addEventListener("click", loginUser);
  document.getElementById("go-register").addEventListener("click", showRegisterForm);

  openUserPanel();
}



// =========================================================
// MOSTRAR REGISTRO
// =========================================================

function showRegisterForm() {
  userContent.innerHTML = `
    <h3>Crear cuenta</h3>

    <label>Nombre completo</label>
    <input id="reg-name" type="text" placeholder="Tu nombre">

    <label>Correo electrónico</label>
    <input id="reg-email" type="email" placeholder="correo@ejemplo.com">

    <label>Contraseña</label>
    <input id="reg-pass" type="password" placeholder="******">

    <button id="btn-register-user" class="btn-primary full-width">Registrarse</button>

    <p class="muted center">
      ¿Ya tienes cuenta?
      <button id="go-login" class="link-btn">Iniciar sesión</button>
    </p>
  `;

  document
    .getElementById("btn-register-user")
    .addEventListener("click", registerUser);

  document.getElementById("go-login").addEventListener("click", showLoginForm);
  openUserPanel();
}


// =========================================================
// REGISTRAR USUARIO
// =========================================================

async function registerUser() {
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const pass = document.getElementById("reg-pass").value.trim();

  if (!name || !email || !pass) return alert("Todos los campos son obligatorios.");

  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password: pass })
  });

  const data = await res.json();
  if (!data.success) return alert(data.message);

  alert("Cuenta creada correctamente");
  showLoginForm();
}


// =========================================================
// LOGIN USUARIO
// =========================================================

async function loginUser() {
  const email = document.getElementById("login-email").value.trim();
  const pass = document.getElementById("login-pass").value.trim();

  if (!email || !pass) return alert("Completa todos los campos.");

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass })
  });

  const data = await res.json();

  if (!data.success) return alert(data.message);

  USER_TOKEN = data.token;
  USER_DATA = data.user;

  localStorage.setItem("userToken", data.token);
  localStorage.setItem("userData", JSON.stringify(data.user));

  updateUserUI();
  closeUserPanel();
}


// =========================================================
// MOSTRAR PANEL DE PERFIL
// =========================================================

function showProfile() {
  userContent.innerHTML = `
    <h3>Mi cuenta</h3>

    <p><strong>Nombre:</strong> ${USER_DATA.name}</p>
    <p><strong>Correo:</strong> ${USER_DATA.email}</p>

    <button id="logout-user" class="btn-ghost full-width">Cerrar sesión</button>
  `;

  document.getElementById("logout-user").addEventListener("click", logoutUser);
  openUserPanel();
}


// =========================================================
// CERRAR SESIÓN
// =========================================================

function logoutUser() {
  USER_TOKEN = null;
  USER_DATA = null;

  localStorage.removeItem("userToken");
  localStorage.removeItem("userData");

  updateUserUI();
  closeUserPanel();
}


// =========================================================
// UI DEL MENÚ DE USUARIO
// =========================================================

function updateUserUI() {
  if (USER_DATA) {
    // usuario logueado
    logoutBtnUser?.classList.remove("hidden");
    document
      .querySelector('[data-action="login"]')
      ?.classList.add("hidden");
    document
      .querySelector('[data-action="register"]')
      ?.classList.add("hidden");

    userToggle.textContent = "👤";
    userToggle.title = USER_DATA.name;

    userToggle.onclick = showProfile;
  } else {
    // usuario NO logueado
    logoutBtnUser?.classList.add("hidden");
    document
      .querySelector('[data-action="login"]')
      ?.classList.remove("hidden");
    document
      .querySelector('[data-action="register"]')
      ?.classList.remove("hidden");

    userToggle.textContent = "👤";
    userToggle.onclick = () => userDropdown.classList.toggle("hidden");
  }
}

updateUserUI();


// =========================================================
// ACCIONES DEL MENÚ
// =========================================================

document.querySelector('[data-action="login"]')
  ?.addEventListener("click", showLoginForm);

document.querySelector('[data-action="register"]')
  ?.addEventListener("click", showRegisterForm);

logoutBtnUser?.addEventListener("click", logoutUser);
