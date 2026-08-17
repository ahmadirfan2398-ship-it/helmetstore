const express = require('express');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = require('../models/db');
const requireAdmin = require('../middleware/auth');
const { sendOrderStatusUpdateEmail } = require('../services/email');

// ---------- Multer setup for image uploads ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'helmet-' + Date.now() + ext);
  }
});
const upload = multer({ storage });

// ---------- Login ----------
router.get('/login', (req, res) => {
  if (req.session.isAdmin) return res.redirect('/admin/dashboard');
  res.render('admin/login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.get('admin').value();

  if (admin && admin.username === username && bcrypt.compareSync(password, admin.password)) {
    req.session.isAdmin = true;
    req.session.adminUsername = username;
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { error: 'Invalid username or password.' });
});

router.get('/logout', (req, res) => {
  req.session.isAdmin = false;
  res.redirect('/admin/login');
});

// ---------- Dashboard ----------
router.get('/dashboard', requireAdmin, (req, res) => {
  const products = db.get('products').value();
  const orders = db.get('orders').value();
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;

  res.render('admin/dashboard', {
    stats: {
      totalProducts: products.length,
      totalOrders: orders.length,
      pendingOrders,
      totalRevenue
    },
    recentOrders: orders.slice(-5).reverse()
  });
});

// ---------- Products: list ----------
router.get('/products', requireAdmin, (req, res) => {
  const products = db.get('products').value();
  res.render('admin/products', { products });
});

// ---------- Products: add form ----------
router.get('/products/add', requireAdmin, (req, res) => {
  res.render('admin/product-form', { product: null });
});

router.post('/products/add', requireAdmin, upload.single('image'), (req, res) => {
  const { name_en, name_ur, category, price, stock, description_en, description_ur, featured, tags } = req.body;
  const newProduct = {
    id: uuidv4().slice(0, 8),
    name_en, name_ur, category,
    price: parseFloat(price) || 0,
    stock: parseInt(stock) || 0,
    description_en, description_ur,
    image: req.file ? '/uploads/' + req.file.filename : '',
    tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    featured: featured === 'on'
  };
  db.get('products').push(newProduct).write();
  res.redirect('/admin/products');
});

// ---------- Products: edit form ----------
router.get('/products/edit/:id', requireAdmin, (req, res) => {
  const product = db.get('products').find({ id: req.params.id }).value();
  if (!product) return res.redirect('/admin/products');
  res.render('admin/product-form', { product });
});

router.post('/products/edit/:id', requireAdmin, upload.single('image'), (req, res) => {
  const { name_en, name_ur, category, price, stock, description_en, description_ur, featured, tags } = req.body;
  const updates = {
    name_en, name_ur, category,
    price: parseFloat(price) || 0,
    stock: parseInt(stock) || 0,
    description_en, description_ur,
    tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    featured: featured === 'on'
  };
  if (req.file) updates.image = '/uploads/' + req.file.filename;

  db.get('products').find({ id: req.params.id }).assign(updates).write();
  res.redirect('/admin/products');
});

// ---------- Products: delete ----------
router.post('/products/delete/:id', requireAdmin, (req, res) => {
  db.get('products').remove({ id: req.params.id }).write();
  res.redirect('/admin/products');
});

// ---------- Orders: list ----------
router.get('/orders', requireAdmin, (req, res) => {
  const orders = db.get('orders').value().slice().reverse();
  res.render('admin/orders', { orders });
});

// ---------- Orders: update status ----------
router.post('/orders/status/:id', requireAdmin, (req, res) => {
  const { status } = req.body;
  const order = db.get('orders').find({ id: req.params.id }).value();
  if (order) {
    const oldStatus = order.status;
    db.get('orders').find({ id: req.params.id }).assign({ status }).write();
    if (oldStatus !== status) {
      const updatedOrder = db.get('orders').find({ id: req.params.id }).value();
      sendOrderStatusUpdateEmail(updatedOrder, oldStatus).catch(err => console.error('Order status email error:', err));
    }
  }
  res.redirect('/admin/orders');
});

// ---------- Branding ----------
const presets = {
  'Light Blue': '#1E88E5',
  'Royal Purple': '#6A1B9A',
  'Forest Green': '#2E7D32',
  'Sunset Orange': '#EF6C00',
  'Classic Black': '#212121',
  'Ruby Red': '#C62828'
};

router.get('/branding', requireAdmin, (req, res) => {
  const settings = db.get('settings').value();
  res.render('admin/branding', { settings, presets });
});

router.post('/branding', requireAdmin, upload.single('logo'), (req, res) => {
  const { siteName_en, siteName_ur, themeColor, phone } = req.body;
  const updates = { siteName_en, siteName_ur, themeColor, phone };
  if (req.file) updates.logo = '/uploads/' + req.file.filename;

  db.get('settings').assign(updates).write();
  res.redirect('/admin/branding');
});

module.exports = router;
