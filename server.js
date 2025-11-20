require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Product = require('./models/Product');

const app = express();
const PORT = process.env.PORT || 3000;

// ====== MIDDLEWARES ======
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ====== CONEXIÓN A MONGODB ======
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch((err) => console.error('❌ Error conectando a MongoDB', err));

// ====== LOGIN ADMIN ======
app.post('/api/login-admin', (req, res) => {
  const { username, password } = req.body;

  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || '123456';
  const JWT_SECRET = process.env.JWT_SECRET || 'miclave123';

  if (
    username.toLowerCase() === ADMIN_USER.toLowerCase() &&
    password === ADMIN_PASS
  ) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ success: true, token });
  }

  return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
});

// ====== MIDDLEWARE DE AUTENTICACIÓN ======
function authAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: 'Falta encabezado Authorization' });

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token)
    return res.status(401).json({ message: 'Formato de token inválido' });

  const JWT_SECRET = process.env.JWT_SECRET || 'miclave123';

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err)
      return res.status(401).json({ message: 'Token inválido o expirado' });

    if (payload.role !== 'admin')
      return res.status(403).json({ message: 'No autorizado' });

    req.admin = payload;
    next();
  });
}

// ====== RUTAS PÚBLICAS ======
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener productos' });
  }
});

app.get('/api/products/featured', async (req, res) => {
  try {
    const products = await Product.find({ featured: true })
      .sort({ createdAt: -1 })
      .limit(8);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener destacados' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
const bcrypt = require("bcryptjs");
const User = require("./models/user");

// =============================
// REGISTRO DE USUARIO
// =============================
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userFound = await User.findOne({ email });
    if (userFound) {
      return res.json({ success: false, message: "El correo ya está registrado" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashed });
    await newUser.save();

    res.json({ success: true, message: "Usuario registrado correctamente" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error en el registro" });
  }
});

// =============================
// LOGIN DE USUARIO
// =============================
app.post("/api/login-user", async (req, res) => {
  try {
    const { email, password } = req.body;

    const userFound = await User.findOne({ email });
    if (!userFound) {
      return res.json({ success: false, message: "Correo no encontrado" });
    }

    const valid = await bcrypt.compare(password, userFound.password);
    if (!valid) {
      return res.json({ success: false, message: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: userFound._id },
      process.env.JWT_SECRET || "miclave123",
      { expiresIn: "3h" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: userFound._id,
        name: userFound.name,
        email: userFound.email,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error al iniciar sesión" });
  }
});
app.post("/api/recover", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.json({ success: false, message: "El correo no existe" });
  }

  res.json({
    success: true,
    message: "Se envió un enlace de recuperación (simulado).",
  });
});


// ====== RUTAS ADMIN (PROTEGIDAS) ======
app.get('/api/admin/products', authAdmin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    const stats = {
      totalProducts: products.length,
      totalStock: products.reduce((sum, p) => sum + (p.stock || 0), 0),
      totalValue: products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0),
      featuredCount: products.filter((p) => p.featured).length,
    };

    res.json({ products, stats });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener productos admin' });
  }
});

app.post('/api/admin/products', authAdmin, async (req, res) => {
  try {
    const product = new Product(req.body);
    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear producto' });
  }
});

app.put('/api/admin/products/:id', authAdmin, async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Producto no encontrado' });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
});

app.delete('/api/admin/products/:id', authAdmin, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Producto no encontrado' });

    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
});

// ====== INICIAR SERVIDOR ======
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});
