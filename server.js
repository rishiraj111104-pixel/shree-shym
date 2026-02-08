const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'shop.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('DB Error:', err);
  else {
    console.log('✓ Database connected');
    initDB();
  }
});

function initDB() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT NOT NULL, price INTEGER NOT NULL, description TEXT, image TEXT, featured INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    db.run(`CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT NOT NULL, phone TEXT NOT NULL, address TEXT NOT NULL, items TEXT NOT NULL, total INTEGER NOT NULL, status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    db.run(`CREATE TABLE IF NOT EXISTS admin (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL)`);
    db.run('INSERT OR IGNORE INTO admin (username, password) VALUES (?, ?)', ['admin', 'shym4430']);
  });
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'shree-shyam-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000, secure: process.env.NODE_ENV === 'production' }
}));
app.use(express.static('public'));

// PUBLIC ROUTES
app.get('/api/products', (req, res) => {
  const { category } = req.query;
  let query = 'SELECT * FROM products';
  let params = [];
  if (category) { query += ' WHERE category = ?'; params.push(category); }
  query += ' ORDER BY created_at DESC';
  db.all(query, params, (err, products) => err ? res.status(500).json({ error: 'DB error' }) : res.json(products));
});

app.get('/api/products/featured', (req, res) => {
  db.all('SELECT * FROM products WHERE featured = 1 ORDER BY created_at DESC LIMIT 6', (err, products) => 
    err ? res.status(500).json({ error: 'DB error' }) : res.json(products));
});

app.get('/api/products/:id', (req, res) => {
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, product) => 
    err ? res.status(500).json({ error: 'DB error' }) : product ? res.json(product) : res.status(404).json({ error: 'Not found' }));
});

app.post('/api/orders', (req, res) => {
  const { customer_name, phone, address, items, total } = req.body;
  if (!customer_name || !phone || !address || !items || !total) return res.status(400).json({ error: 'Missing fields' });
  db.run('INSERT INTO orders (customer_name, phone, address, items, total) VALUES (?, ?, ?, ?, ?)',
    [customer_name, phone, address, JSON.stringify(items), total],
    function(err) { err ? res.status(500).json({ error: 'DB error' }) : res.json({ success: true, orderId: this.lastID }); });
});

// ADMIN AUTH
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM admin WHERE username = ? AND password = ?', [username, password], (err, admin) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (admin) { req.session.adminLoggedIn = true; res.json({ success: true }); }
    else res.status(401).json({ error: 'Invalid credentials' });
  });
});

app.post('/api/admin/logout', (req, res) => { req.session.destroy(); res.json({ success: true }); });
app.get('/api/admin/check', (req, res) => res.json({ loggedIn: !!req.session.adminLoggedIn }));

const requireAdmin = (req, res, next) => req.session.adminLoggedIn ? next() : res.status(401).json({ error: 'Unauthorized' });

// ADMIN ROUTES
app.get('/api/admin/orders', requireAdmin, (req, res) => {
  db.all('SELECT * FROM orders ORDER BY created_at DESC', (err, orders) => 
    err ? res.status(500).json({ error: 'DB error' }) : res.json(orders));
});

app.put('/api/admin/orders/:id', requireAdmin, (req, res) => {
  db.run('UPDATE orders SET status = ? WHERE id = ?', [req.body.status, req.params.id], 
    err => err ? res.status(500).json({ error: 'DB error' }) : res.json({ success: true }));
});

app.get('/api/admin/products', requireAdmin, (req, res) => {
  db.all('SELECT * FROM products ORDER BY created_at DESC', (err, products) => 
    err ? res.status(500).json({ error: 'DB error' }) : res.json(products));
});

app.get('/api/admin/products/:id', requireAdmin, (req, res) => {
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, product) => 
    err ? res.status(500).json({ error: 'DB error' }) : product ? res.json(product) : res.status(404).json({ error: 'Not found' }));
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const { name, category, price, description, image, featured } = req.body;
  db.run('INSERT INTO products (name, category, price, description, image, featured) VALUES (?, ?, ?, ?, ?, ?)',
    [name, category, price, description, image, featured || 0],
    function(err) { err ? res.status(500).json({ error: 'DB error' }) : res.json({ success: true, id: this.lastID }); });
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const { name, category, price, description, image, featured } = req.body;
  db.run('UPDATE products SET name = ?, category = ?, price = ?, description = ?, image = ?, featured = ? WHERE id = ?',
    [name, category, price, description, image, featured, req.params.id],
    err => err ? res.status(500).json({ error: 'DB error' }) : res.json({ success: true }));
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], 
    err => err ? res.status(500).json({ error: 'DB error' }) : res.json({ success: true }));
});

app.get('/health', (req, res) => res.json({ status: 'OK' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Server running on port ${PORT}\n`);
});

process.on('SIGTERM', () => { db.close(() => process.exit(0)); });
