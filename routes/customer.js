const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = require('../models/db');
const { sendContactEmail } = require('../services/email');

// ---------- Signup ----------
router.get('/signup', (req, res) => {
  if (req.session.customer) return res.redirect('/');
  res.render('signup', { error: null });
});

router.post('/signup', (req, res) => {
  const { name, phone, email, password, terms } = req.body;

  if (!name || !phone || !email || !password || !terms) {
    return res.render('signup', { error: 'Please fill all required fields and accept terms.' });
  }

  const existing = db.get('customers').find({ email }).value();
  if (existing) {
    return res.render('signup', { error: 'An account with this email already exists.' });
  }

  const customer = {
    id: uuidv4().slice(0, 8),
    name,
    phone,
    email,
    password: bcrypt.hashSync(password, 10),
    createdAt: new Date().toISOString()
  };
  db.get('customers').push(customer).write();

  req.session.customer = { id: customer.id, name: customer.name, email: customer.email };
  req.flash('success', 'toast_signup_success');
  res.redirect('/');
});

// ---------- Login ----------
router.get('/login', (req, res) => {
  if (req.session.customer) return res.redirect('/');
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const customer = db.get('customers').find({ email }).value();

  if (!customer || !bcrypt.compareSync(password, customer.password)) {
    return res.render('login', { error: 'Invalid email or password.' });
  }

  req.session.customer = { id: customer.id, name: customer.name, email: customer.email };
  req.flash('success', 'toast_login_success');
  res.redirect('/');
});

router.get('/logout', (req, res) => {
  req.session.customer = null;
  res.redirect('/');
});

// ---------- Contact ----------
router.get('/contact', (req, res) => {
  const captcha = req.generateCaptcha();
  res.render('contact', { error: null, captcha });
});

router.post('/contact', (req, res) => {
  const { name, email, phone, message, captchaAnswer } = req.body;

  if (!req.verifyCaptcha(captchaAnswer)) {
    const captcha = req.generateCaptcha();
    return res.render('contact', { error: 'Incorrect answer to the security question. Please try again.', captcha });
  }

  if (!name || !email || !message) {
    const captcha = req.generateCaptcha();
    return res.render('contact', { error: 'Please fill all required fields.', captcha });
  }
  // Store contact message (optional log)
  const contacts = db.get('contacts');
  if (contacts.value()) {
    contacts.push({ id: uuidv4().slice(0, 8), name, email, phone, message, date: new Date().toISOString() }).write();
  } else {
    db.set('contacts', [{ id: uuidv4().slice(0, 8), name, email, phone, message, date: new Date().toISOString() }]).write();
  }

  // Send email notification via Brevo (does not block the response if it fails)
  sendContactEmail({ name, email, phone, message }).catch(err => console.error('Email send error:', err));

  req.flash('success', 'toast_message_sent');
  res.redirect('/contact');
});

module.exports = router;
