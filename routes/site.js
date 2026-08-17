const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = require('../models/db');
const { sendContactEmail, sendOrderConfirmationEmail } = require('../services/email');

const PAGE_SIZE = 8;

function getAvgRating(productId) {
  const reviews = db.get('reviews').filter({ productId }).value();
  if (reviews.length === 0) return { avg: 0, count: 0 };
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { avg: Math.round(avg * 10) / 10, count: reviews.length };
}

// ---------- Language switch ----------
router.get('/lang/:code', (req, res) => {
  const code = req.params.code === 'ur' ? 'ur' : 'en';
  res.cookie('lang', code, { maxAge: 1000 * 60 * 60 * 24 * 365 });
  res.redirect(req.query.redirect || '/');
});

// ---------- Home ----------
router.get('/', (req, res) => {
  const products = db.get('products').value();
  const featured = products.filter(p => p.featured);
  const categories = [...new Set(products.map(p => p.category))];
  const list = featured.length ? featured : products;
  res.render('index', { products: list.slice(0, 8), categories, activeCategory: null, hasMore: list.length > 8 });
});

// ---------- API: infinite scroll load more (homepage) ----------
router.get('/api/products', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 8;
  const products = db.get('products').value();
  const featured = products.filter(p => p.featured);
  const list = featured.length ? featured : products;

  const start = (page - 1) * limit;
  const pageItems = list.slice(start, start + limit);
  res.json({
    products: pageItems,
    hasMore: start + limit < list.length
  });
});

// ---------- API: search autocomplete ----------
router.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q) return res.json({ results: [] });

  const products = db.get('products').value();
  const matches = products
    .filter(p => p.name_en.toLowerCase().includes(q) || p.name_ur.includes(q) || p.category.toLowerCase().includes(q))
    .slice(0, 6)
    .map(p => ({ id: p.id, name_en: p.name_en, name_ur: p.name_ur, price: p.price, image: p.image, category: p.category }));

  res.json({ results: matches });
});

// ---------- Shop / category filter / pagination / price range ----------
router.get('/shop', (req, res) => {
  const allProducts = db.get('products').value();
  const categories = [...new Set(allProducts.map(p => p.category))];
  const cat = req.query.category;
  const q = (req.query.q || '').toLowerCase().trim();
  const maxPrice = parseInt(req.query.maxPrice) || 10000;
  const page = Math.max(1, parseInt(req.query.page) || 1);

  let products = allProducts;
  if (cat) products = products.filter(p => p.category === cat);
  if (q) {
    products = products.filter(p =>
      p.name_en.toLowerCase().includes(q) || p.name_ur.includes(q)
    );
  }
  products = products.filter(p => p.price <= maxPrice);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  res.render('shop', {
    products: paged,
    categories,
    activeCategory: cat || null,
    query: q,
    maxPrice,
    currentPage,
    totalPages
  });
});

// ---------- Product detail ----------
router.get('/product/:id', (req, res) => {
  const product = db.get('products').find({ id: req.params.id }).value();
  if (!product) return res.status(404).render('404');

  const related = db.get('products')
    .filter(p => p.category === product.category && p.id !== product.id)
    .value()
    .slice(0, 4);

  const reviews = db.get('reviews').filter({ productId: product.id }).value().slice().reverse();
  const rating = getAvgRating(product.id);

  res.render('product', { product, related, reviews, rating, reviewError: null });
});

// ---------- Submit a review ----------
router.post('/product/:id/review', (req, res) => {
  const product = db.get('products').find({ id: req.params.id }).value();
  if (!product) return res.status(404).render('404');

  const { name, rating, comment } = req.body;
  const ratingNum = parseInt(rating);

  if (!name || !ratingNum || ratingNum < 1 || ratingNum > 5) {
    const related = db.get('products').filter(p => p.category === product.category && p.id !== product.id).value().slice(0, 4);
    const reviews = db.get('reviews').filter({ productId: product.id }).value().slice().reverse();
    const ratingInfo = getAvgRating(product.id);
    return res.render('product', { product, related, reviews, rating: ratingInfo, reviewError: 'Please provide your name and a rating.' });
  }

  db.get('reviews').push({
    id: uuidv4().slice(0, 8),
    productId: product.id,
    name,
    rating: ratingNum,
    comment: comment || '',
    date: new Date().toISOString()
  }).write();

  res.redirect('/product/' + product.id + '#reviews');
});

// ---------- Cart: add ----------
router.post('/cart/add/:id', (req, res) => {
  const product = db.get('products').find({ id: req.params.id }).value();
  if (!product) return res.redirect('/');

  const qty = parseInt(req.body.qty) || 1;
  if (!req.session.cart) req.session.cart = [];

  const existing = req.session.cart.find(item => item.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    req.session.cart.push({
      id: product.id,
      name_en: product.name_en,
      name_ur: product.name_ur,
      price: product.price,
      image: product.image,
      qty
    });
  }

  req.flash('success', 'toast_added_cart');
  res.redirect(req.get('Referer') || '/cart');
});

// ---------- Cart: view ----------
router.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  res.render('cart', { cart, total });
});

// ---------- Cart: update quantities ----------
router.post('/cart/update', (req, res) => {
  const cart = req.session.cart || [];
  const qtys = req.body.qty || {};
  cart.forEach(item => {
    if (qtys[item.id] !== undefined) {
      const newQty = parseInt(qtys[item.id]);
      item.qty = newQty > 0 ? newQty : 1;
    }
  });
  req.session.cart = cart;
  res.redirect('/cart');
});

// ---------- Cart: remove item ----------
router.post('/cart/remove/:id', (req, res) => {
  req.session.cart = (req.session.cart || []).filter(item => item.id !== req.params.id);
  res.redirect('/cart');
});

// ---------- Checkout: show form ----------
router.get('/checkout', (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('/cart');
  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  res.render('checkout', { cart, total, error: null });
});

// ---------- Checkout: place order ----------
router.post('/checkout', (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('/cart');

  const { name, phone, address, city } = req.body;
  if (!name || !phone || !address || !city) {
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    return res.render('checkout', { cart, total, error: 'Please fill all fields. / براہ کرم تمام خانے پُر کریں۔' });
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const order = {
    id: uuidv4().slice(0, 8).toUpperCase(),
    items: cart,
    customer: { name, phone, address, city },
    total,
    status: 'Pending',
    paymentMethod: 'COD',
    date: new Date().toISOString()
  };

  db.get('orders').push(order).write();

  // Reduce stock
  cart.forEach(item => {
    const product = db.get('products').find({ id: item.id });
    const p = product.value();
    if (p) product.assign({ stock: Math.max(0, p.stock - item.qty) }).write();
  });

  req.session.cart = [];
  req.session.lastOrderId = order.id;
  req.flash('success', 'toast_order_placed');

  sendOrderConfirmationEmail(order).catch(err => console.error('Order confirmation email error:', err));

  res.redirect('/order-success');
});

// ---------- FAQ ----------
router.get('/faq', (req, res) => {
  res.render('faq');
});

// ---------- Order success ----------
router.get('/order-success', (req, res) => {
  const orderId = req.session.lastOrderId;
  if (!orderId) return res.redirect('/');
  const order = db.get('orders').find({ id: orderId }).value();
  if (!order) return res.redirect('/');
  res.render('order-success', { order });
});

// ---------- Quick Contact (embedded form at bottom of pages, no captcha) ----------
router.post('/contact-quick', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    req.flash('error', 'toast_message_sent');
    return res.redirect(req.get('Referer') || '/');
  }

  const contacts = db.get('contacts');
  const entry = { id: uuidv4().slice(0, 8), name, email, phone: '', message, date: new Date().toISOString() };
  if (contacts.value()) {
    contacts.push(entry).write();
  } else {
    db.set('contacts', [entry]).write();
  }

  // Send email notification via Brevo (does not block the response if it fails)
  sendContactEmail({ name, email, phone: '', message }).catch(err => console.error('Email send error:', err));

  req.flash('success', 'toast_message_sent');
  res.redirect(req.get('Referer') || '/');
});

module.exports = router;
