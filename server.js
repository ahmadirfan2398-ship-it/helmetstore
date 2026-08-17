require('dotenv').config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const langMiddleware = require('./middleware/lang');
const flashMiddleware = require('./middleware/flash');
const captchaMiddleware = require('./middleware/captcha');
const siteRoutes = require('./routes/site');
const adminRoutes = require('./routes/admin');
const customerRoutes = require('./routes/customer');
const db = require('./models/db');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('[MongoDB] Connected successfully!'))
  .catch(err => console.error('[MongoDB] Connection failed:', err.message));

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Cookies + Session
app.use(cookieParser());
app.use(session({
  secret: 'helmet-store-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Language middleware (must run before routes)
app.use(langMiddleware);
app.use(flashMiddleware);
app.use(captchaMiddleware);

// Make settings + cart count available to all views
app.use((req, res, next) => {
  res.locals.settings = db.get('settings').value();
  res.locals.cartCount = (req.session.cart || []).reduce((sum, item) => sum + item.qty, 0);
  res.locals.req = req;
  res.locals.currentPath = req.path;
  res.locals.allCategories = [...new Set(db.get('products').value().map(p => p.category))];
  res.locals.customer = req.session.customer || null;
  next();
});

// Routes
app.use('/', siteRoutes);
app.use('/', customerRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404');
});

app.listen(PORT, () => {
  console.log('=================================================');
  console.log('  Helmet Store server running!');
  console.log('  Open this in your browser: http://localhost:' + PORT);
  console.log('  Admin panel: http://localhost:' + PORT + '/admin/login');
  console.log('  Admin username: admin | password: admin123');
  console.log('=================================================');
  console.log('  IMPORTANT: Run with "npm start" — do NOT open');
  console.log('  via VS Code Live Server (port 5500). This is a');
  console.log('  Node.js app, it must run on port 3000 via node.');
  console.log('=================================================');
});
