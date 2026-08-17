const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'db.json');
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}', 'utf-8');

const adapter = new FileSync(dbPath);
const db = low(adapter);

// Seed default structure if file is empty
db.defaults({
  products: [],
  orders: [],
  customers: [],
  reviews: [],
  admin: null,
  settings: {
    siteName_en: 'Helmet Store',
    siteName_ur: 'ہیلمٹ اسٹور',
    themeColor: '#1E88E5',
    logo: '',
    phone: '0306-056902',
    whatsapp: '92306056902'
  }
}).write();

// Seed admin user (username: admin, password: admin123) if not present
if (!db.get('admin').value()) {
  db.set('admin', {
    username: 'admin',
    password: bcrypt.hashSync('admin123', 10)
  }).write();
}

// Seed sample products if empty
if (db.get('products').value().length === 0) {
  db.set('products', [
    {
      id: '1',
      name_en: 'Full Face Helmet - Racer X',
      name_ur: 'فل فیس ہیلمٹ - ریسر ایکس',
      category: 'Full Face',
      price: 4500,
      stock: 15,
      image: 'https://images.unsplash.com/photo-1494030575520-dd03dd6aeb04?fm=jpg&q=80&w=800&fit=crop',
      description_en: 'Premium full face helmet with double visor, DOT certified, great ventilation.',
      description_ur: 'ڈبل وائزر کے ساتھ پریمیم فل فیس ہیلمٹ، DOT سرٹیفائیڈ، بہترین ہوا کی گزرگاہ۔',
      tags: ['DOT Certified', 'Double Visor', 'Best Seller'],
      featured: true
    },
    {
      id: '2',
      name_en: 'Half Face Helmet - City Rider',
      name_ur: 'ہاف فیس ہیلمٹ - سٹی رائیڈر',
      category: 'Half Face',
      price: 2200,
      stock: 25,
      image: 'https://images.unsplash.com/photo-1623038868323-7d39ec58eefe?fm=jpg&q=80&w=800&fit=crop',
      description_en: 'Lightweight half face helmet, perfect for daily city rides.',
      description_ur: 'ہلکا ہاف فیس ہیلمٹ، روزانہ شہر میں رائیڈنگ کے لیے بہترین۔',
      tags: ['Lightweight', 'Daily Use'],
      featured: true
    },
    {
      id: '3',
      name_en: 'Modular Helmet - Tour Pro',
      name_ur: 'موڈیولر ہیلمٹ - ٹور پرو',
      category: 'Modular',
      price: 6800,
      stock: 8,
      image: 'https://images.unsplash.com/photo-1611004061856-ccc3cbe944b2?fm=jpg&q=80&w=800&fit=crop',
      description_en: 'Flip-up modular helmet, best for touring, with sun shield.',
      description_ur: 'فلپ اپ موڈیولر ہیلمٹ، ٹورنگ کے لیے بہترین، سن شیلڈ کے ساتھ۔',
      tags: ['Flip-up', 'Sun Shield', 'Touring'],
      featured: true
    },
    {
      id: '4',
      name_en: 'Kids Helmet - Junior Safe',
      name_ur: 'بچوں کا ہیلمٹ - جونیئر سیف',
      category: 'Kids',
      price: 1800,
      stock: 20,
      image: 'https://images.unsplash.com/photo-1765728772425-e7dbd97c4e80?fm=jpg&q=80&w=800&fit=crop',
      description_en: 'Safe and colorful helmet designed for kids, adjustable strap.',
      description_ur: 'بچوں کے لیے محفوظ اور رنگین ہیلمٹ، ایڈجسٹ ایبل سٹریپ کے ساتھ۔',
      tags: ['Kids Safe', 'Adjustable'],
      featured: false
    },
    {
      id: '5',
      name_en: 'Full Face Helmet - Storm Rider',
      name_ur: 'فل فیس ہیلمٹ - سٹورم رائیڈر',
      category: 'Full Face',
      price: 5200,
      stock: 12,
      image: 'https://images.unsplash.com/photo-1571819507488-0e1dfe7cc22d?fm=jpg&q=80&w=800&fit=crop',
      description_en: 'Bold red and black full face helmet with aggressive styling and superior airflow.',
      description_ur: 'جرات مندانہ سرخ اور سیاہ فل فیس ہیلمٹ، بہترین ہوا کی گزرگاہ کے ساتھ۔',
      tags: ['DOT Certified', 'Sporty'],
      featured: true
    },
    {
      id: '6',
      name_en: 'Full Face Helmet - Classic White',
      name_ur: 'فل فیس ہیلمٹ - کلاسک وائٹ',
      category: 'Full Face',
      price: 4200,
      stock: 18,
      image: 'https://images.unsplash.com/photo-1627530980937-b8721b91506a?fm=jpg&q=80&w=800&fit=crop',
      description_en: 'Clean classic white and black full face helmet, timeless look with modern protection.',
      description_ur: 'صاف کلاسک سفید اور سیاہ فل فیس ہیلمٹ، جدید تحفظ کے ساتھ۔',
      tags: ['DOT Certified', 'Classic'],
      featured: false
    },
    {
      id: '7',
      name_en: 'Racing Helmet - Track Master',
      name_ur: 'ریسنگ ہیلمٹ - ٹریک ماسٹر',
      category: 'Racing',
      price: 7500,
      stock: 6,
      image: 'https://images.unsplash.com/photo-1590506995460-d0d9892b54da?fm=jpg&q=80&w=800&fit=crop',
      description_en: 'High-performance racing helmet built for speed, aerodynamic shell, track-tested.',
      description_ur: 'تیز رفتاری کے لیے بنایا گیا ہائی پرفارمنس ریسنگ ہیلمٹ، ایروڈائنامک شیل کے ساتھ۔',
      tags: ['Racing', 'Aerodynamic', 'Track-Tested'],
      featured: true
    },
    {
      id: '8',
      name_en: 'Off-Road Helmet - Desert Runner',
      name_ur: 'آف روڈ ہیلمٹ - ڈیزرٹ رنر',
      category: 'Off-Road',
      price: 5800,
      stock: 10,
      image: 'https://images.unsplash.com/photo-1610900656436-1baa9fbe8d05?fm=jpg&q=80&w=800&fit=crop',
      description_en: 'Rugged off-road helmet built for dirt tracks and rough terrain, extra chin protection.',
      description_ur: 'خاردار راستوں کے لیے بنایا گیا مضبوط آف روڈ ہیلمٹ، اضافی تحفظ کے ساتھ۔',
      tags: ['Off-Road', 'Rugged'],
      featured: false
    },
    {
      id: '9',
      name_en: 'Touring Helmet - Road King',
      name_ur: 'ٹورنگ ہیلمٹ - روڈ کنگ',
      category: 'Modular',
      price: 6200,
      stock: 9,
      image: 'https://images.unsplash.com/photo-1649027421785-6827863f0891?fm=jpg&q=80&w=800&fit=crop',
      description_en: 'Comfortable touring helmet designed for long rides, extra padding and noise reduction.',
      description_ur: 'لمبے سفر کے لیے بنایا گیا آرام دہ ٹورنگ ہیلمٹ، اضافی گدی اور کم آواز کے ساتھ۔',
      tags: ['Touring', 'Comfort'],
      featured: false
    },
    {
      id: '10',
      name_en: 'Street Helmet - Urban Rider',
      name_ur: 'سٹریٹ ہیلمٹ - اربن رائیڈر',
      category: 'Half Face',
      price: 2800,
      stock: 22,
      image: 'https://images.unsplash.com/photo-1611004060674-7e8864bcb4e4?fm=jpg&q=80&w=800&fit=crop',
      description_en: 'Sleek matte black street helmet, minimal design for everyday city commuting.',
      description_ur: 'شاندار میٹ بلیک سٹریٹ ہیلمٹ، روزانہ شہر میں سفر کے لیے۔',
      tags: ['Minimal', 'Daily Use'],
      featured: false
    }
  ]).write();
}

module.exports = db;
