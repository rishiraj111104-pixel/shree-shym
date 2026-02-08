const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'shop.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Initializing database...');

db.serialize(() => {
  // Create tables
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    image TEXT,
    featured INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, () => console.log('✓ Products table ready'));

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    items TEXT NOT NULL,
    total INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, () => console.log('✓ Orders table ready'));

  db.run(`CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`, () => console.log('✓ Admin table ready'));

  // Insert admin with correct password
  db.run('INSERT OR IGNORE INTO admin (username, password) VALUES (?, ?)', 
    ['admin', 'shym4430'], 
    () => console.log('✓ Admin account ready'));

  // Sample products (NO SAREES - only Lehengas, Dupattas, Jewellery)
  const products = [
    // Lehengas
    { name: 'Bridal Lehenga Set', category: 'lehengas', price: 12000, description: 'Stunning bridal lehenga with heavy embroidery, sequins, and matching dupatta.', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1000&fit=crop', featured: 1 },
    { name: 'Festive Lehenga Choli', category: 'lehengas', price: 5500, description: 'Beautiful festive lehenga with mirror work and vibrant colors.', image: 'https://images.unsplash.com/photo-1606800052052-c96412e2fc8f?w=800&h=1000&fit=crop', featured: 0 },
    { name: 'Party Wear Lehenga', category: 'lehengas', price: 7800, description: 'Elegant party wear lehenga with floral embroidery and net dupatta.', image: 'https://images.unsplash.com/photo-1617627143481-7c5c4e0ad1b8?w=800&h=1000&fit=crop', featured: 1 },
    { name: 'Designer Lehenga', category: 'lehengas', price: 9500, description: 'Contemporary designer lehenga with modern cuts and traditional embellishments.', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1000&fit=crop', featured: 0 },
    
    // Dupattas
    { name: 'Silk Dupatta', category: 'dupattas', price: 800, description: 'Premium silk dupatta with golden border and beautiful drape.', image: 'https://images.unsplash.com/photo-1613125700782-8394bec3e89d?w=800&h=1000&fit=crop', featured: 0 },
    { name: 'Bandhani Dupatta', category: 'dupattas', price: 1200, description: 'Traditional bandhani print dupatta in vibrant colors.', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=1000&fit=crop', featured: 1 },
    { name: 'Embroidered Net Dupatta', category: 'dupattas', price: 1500, description: 'Delicate net dupatta with intricate thread embroidery.', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&h=1000&fit=crop', featured: 0 },
    { name: 'Chiffon Dupatta', category: 'dupattas', price: 950, description: 'Lightweight chiffon dupatta with elegant prints.', image: 'https://images.unsplash.com/photo-1613125700782-8394bec3e89d?w=800&h=1000&fit=crop', featured: 0 },
    
    // Jewellery
    { name: 'Kundan Necklace Set', category: 'jewellery', price: 2500, description: 'Elegant kundan necklace with matching earrings. Perfect for weddings.', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=1000&fit=crop', featured: 1 },
    { name: 'Oxidized Silver Jhumkas', category: 'jewellery', price: 450, description: 'Beautiful oxidized silver jhumka earrings with traditional design.', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=1000&fit=crop', featured: 0 },
    { name: 'Temple Jewellery Set', category: 'jewellery', price: 3200, description: 'Traditional temple jewellery set with goddess motifs.', image: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&h=1000&fit=crop', featured: 0 },
    { name: 'Pearl Maang Tikka', category: 'jewellery', price: 650, description: 'Elegant pearl maang tikka with delicate chain work.', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=1000&fit=crop', featured: 0 }
  ];

  db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
    if (!err && row.count === 0) {
      const stmt = db.prepare('INSERT INTO products (name, category, price, description, image, featured) VALUES (?, ?, ?, ?, ?, ?)');
      products.forEach(p => stmt.run(p.name, p.category, p.price, p.description, p.image, p.featured));
      stmt.finalize(() => console.log(`✓ Added ${products.length} products`));
    } else {
      console.log(`✓ Database has ${row.count} products`);
    }
  });
});

setTimeout(() => {
  db.close(() => {
    console.log('\n✅ Database ready!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin: admin / shym4430');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  });
}, 2000);
