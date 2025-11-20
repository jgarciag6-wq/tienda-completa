// ================================
// LOGIN + TOKEN
// ================================
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const productsSection = document.getElementById("productsSection");

const btnLogin = document.getElementById("btnLogin");
const logoutBtn = document.getElementById("logoutBtn");

const btnDash = document.getElementById("btnDash");
const btnProducts = document.getElementById("btnProducts");

let TOKEN = localStorage.getItem("token");

if (TOKEN) showDashboard();

// ================================
// LOGIN
// ================================
btnLogin.addEventListener("click", async () => {
    const username = document.getElementById("user").value;
    const password = document.getElementById("pass").value;

    const res = await fetch("/api/login-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!data.success) {
        alert("Usuario o contraseña incorrectos");
        return;
    }

    localStorage.setItem("token", data.token);
    TOKEN = data.token;

    showDashboard();
});

// ================================
// CAMBIO DE SECCIONES
// ================================
btnDash.addEventListener("click", showDashboard);
btnProducts.addEventListener("click", showProducts);

// ================================
// FUNCIONES VISUALES
// ================================
function hideAll() {
    dashboardSection.style.display = "none";
    productsSection.style.display = "none";

    btnDash.classList.remove("active");
    btnProducts.classList.remove("active");
}

function showDashboard() {
    loginSection.style.display = "none";
    hideAll();

    dashboardSection.style.display = "block";
    btnDash.classList.add("active");

    loadDashboardStats();
}

function showProducts() {
    loginSection.style.display = "none";
    hideAll();

    productsSection.style.display = "block";
    btnProducts.classList.add("active");

    loadProducts();
}

// ================================
// LOGOUT
// ================================
logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    TOKEN = null;

    dashboardSection.style.display = "none";
    productsSection.style.display = "none";

    loginSection.style.display = "block";
});

// ================================
// DASHBOARD STATS
// ================================
async function loadDashboardStats() {
    const res = await fetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${TOKEN}` },
    });

    const data = await res.json();

    document.getElementById("countProducts").innerText = data.stats.totalProducts;
    document.getElementById("countStock").innerText = data.stats.totalStock;
    document.getElementById("countValue").innerText = "$ " + data.stats.totalValue.toLocaleString("es-CO");
    document.getElementById("featuredCount").innerText = data.stats.featuredCount;
}

// ================================
// LISTAR PRODUCTOS
// ================================
async function loadProducts() {
    const res = await fetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${TOKEN}` },
    });

    const data = await res.json();
    const list = document.getElementById("productsList");
    list.innerHTML = "";

    data.products.forEach((p) => {
        const div = document.createElement("div");
        div.className = "product-item";
        div.innerHTML = `
            <h4>${p.name}</h4>
            <p>${p.brand} · ${p.category}</p>
            <p>$ ${p.price} · Stock: ${p.stock}</p>
            <button onclick="editProduct('${p._id}')">Editar</button>
            <button onclick="deleteProduct('${p._id}')">Eliminar</button>
        `;
        list.appendChild(div);
    });
}

// ================================
// CREAR PRODUCTO
// ================================
function normalCreateEvent() {
    document.getElementById("btnCreate").onclick = async () => {
        const product = {
            name: document.getElementById("name").value,
            brand: document.getElementById("brand").value,
            category: document.getElementById("category").value,
            price: Number(document.getElementById("price").value),
            stock: Number(document.getElementById("stock").value),
            imageUrl: document.getElementById("imageUrl").value,
            description: document.getElementById("description").value,
            featured: document.getElementById("featured").checked,
        };

        const res = await fetch("/api/admin/products", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${TOKEN}`,
            },
            body: JSON.stringify(product),
        });

        if (res.ok) {
            alert("Producto creado");
            loadProducts();
            clearForm();
        }
    };
}

// Activar botón en modo guardar
normalCreateEvent();

// ================================
// LIMPIAR FORMULARIO
// ================================
function clearForm() {
    document.getElementById("name").value = "";
    document.getElementById("brand").value = "";
    document.getElementById("category").value = "";
    document.getElementById("price").value = "";
    document.getElementById("stock").value = "";
    document.getElementById("imageUrl").value = "";
    document.getElementById("description").value = "";
    document.getElementById("featured").checked = false;
}

document.getElementById("btnClear").addEventListener("click", () => {
    clearForm();

    // Restaurar botón cuando se limpia
    const btn = document.getElementById("btnCreate");
    btn.textContent = "Guardar";
    normalCreateEvent();
});

// ================================
// ELIMINAR PRODUCTO
// ================================
async function deleteProduct(id) {
    if (!confirm("¿Eliminar producto?")) return;

    await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${TOKEN}` },
    });

    loadProducts();
}
window.deleteProduct = deleteProduct;

// ================================
// EDICIÓN DE PRODUCTO REAL
// ================================
async function editProduct(id) {
    const res = await fetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${TOKEN}` },
    });

    const data = await res.json();
    const product = data.products.find((p) => p._id === id);

    if (!product) return alert("Producto no encontrado");

    // Llenar campos
    document.getElementById("name").value = product.name;
    document.getElementById("brand").value = product.brand;
    document.getElementById("category").value = product.category;
    document.getElementById("price").value = product.price;
    document.getElementById("stock").value = product.stock;
    document.getElementById("imageUrl").value = product.imageUrl;
    document.getElementById("description").value = product.description;
    document.getElementById("featured").checked = product.featured;

    const btn = document.getElementById("btnCreate");
    btn.textContent = "Actualizar producto";

    btn.onclick = async () => {
        const updated = {
            name: document.getElementById("name").value,
            brand: document.getElementById("brand").value,
            category: document.getElementById("category").value,
            price: Number(document.getElementById("price").value),
            stock: Number(document.getElementById("stock").value),
            imageUrl: document.getElementById("imageUrl").value,
            description: document.getElementById("description").value,
            featured: document.getElementById("featured").checked,
        };

        const response = await fetch(`/api/admin/products/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${TOKEN}`,
            },
            body: JSON.stringify(updated),
        });

        if (response.ok) {
            alert("Producto actualizado");
            loadProducts();
            clearForm();

            // 🔥 Restaurar comportamiento original
            btn.textContent = "Guardar";
            normalCreateEvent();
        }
    };
}
window.editProduct = editProduct;
// ======================================================
//      USUARIOS – AGREGAR, LISTAR, EDITAR, ELIMINAR
// ======================================================

// Botones
const addUserBtn = document.getElementById("add-user-btn");
const userForm = document.getElementById("user-form");

const saveUserBtn = document.getElementById("save-user");
const cancelUserBtn = document.getElementById("cancel-user");

// ===================
// Mostrar formulario
// ===================
if (addUserBtn) {
  addUserBtn.addEventListener("click", () => {
    userForm.classList.remove("hidden");
  });
}

if (cancelUserBtn) {
  cancelUserBtn.addEventListener("click", () => {
    userForm.classList.add("hidden");
  });
}

// ===================
// Guardar usuario nuevo
// ===================
if (saveUserBtn) {
  saveUserBtn.addEventListener("click", async () => {
    const name = document.getElementById("new-user-name").value;
    const email = document.getElementById("new-user-email").value;
    const password = document.getElementById("new-user-pass").value;

    if (!name || !email || !password) {
      return alert("Todos los campos son obligatorios.");
    }

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    alert(data.message);

    if (data.success) {
      userForm.classList.add("hidden");
      document.getElementById("new-user-name").value = "";
      document.getElementById("new-user-email").value = "";
      document.getElementById("new-user-pass").value = "";

      loadUsers(); // refrescar
    }
  });
}

// ===================
// Cargar usuarios en tabla
// ===================
async function loadUsers() {
  try {
    const res = await fetch("/api/users");
    const users = await res.json();

    const tbody = document.querySelector("#users-table tbody");
    tbody.innerHTML = "";

    users.forEach((u) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>
          <button class="action-btn edit-btn" onclick="editUser('${u._id}')">Editar</button>
          <button class="action-btn delete-btn" onclick="deleteUser('${u._id}')">Eliminar</button>
        </td>
      `;

      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Error cargando usuarios:", err);
  }
}

// ===================
// Eliminar usuario
// ===================
async function deleteUser(id) {
  if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;

  const res = await fetch(`/api/users/${id}`, {
    method: "DELETE"
  });

  const data = await res.json();
  alert(data.message);

  loadUsers();
}
window.deleteUser = deleteUser;

// ===================
// Editar usuario
// ===================
async function editUser(id) {
  const newName = prompt("Nuevo nombre:");
  if (!newName) return;

  const res = await fetch(`/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName })
  });

  const data = await res.json();
  alert(data.message);

  loadUsers();
}
window.editUser = editUser;

// ===================
// Cargar usuarios al entrar al panel
// ===================
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("users-table")) {
    loadUsers();
  }
});
