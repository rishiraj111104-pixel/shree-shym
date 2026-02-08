// Global state
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentCategory = '';
let currentProduct = null;
let isAdminLoggedIn = false;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  updateCartCount();
  loadFeaturedProducts();
  checkAdminSession();
  
  // Event listeners
  document.getElementById('cartBtn').addEventListener('click', toggleCart);
  document.getElementById('closeCart').addEventListener('click', toggleCart);
  document.getElementById('checkoutBtn').addEventListener('click', openCheckoutModal);
  document.getElementById('checkoutForm').addEventListener('submit', handleCheckout);
});

// Navigation
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('href').substring(1);
      navigateTo(target);
    });
  });
  
  // Admin link handler
  const adminLink = document.querySelector('.admin-link');
  if (adminLink) {
    adminLink.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('admin');
    });
  }
  
  // Handle browser back/forward
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.page) {
      showPage(e.state.page);
    }
  });
  
  // Handle initial load
  const hash = window.location.hash.substring(1);
  if (hash) {
    navigateTo(hash);
  }
}

function navigateTo(page) {
  showPage(page);
  window.history.pushState({ page }, '', `#${page}`);
}

function showPage(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  
  // Update nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${page}`) {
      link.classList.add('active');
    }
  });
  
  // Update admin link
  const adminLink = document.querySelector('.admin-link');
  if (adminLink) {
    if (page === 'admin') {
      adminLink.classList.add('active');
    } else {
      adminLink.classList.remove('active');
    }
  }
  
  // Show requested page
  const pageElement = document.getElementById(page);
  if (pageElement) {
    pageElement.classList.add('active');
    
    // Load category products if it's a category page
    if (['lehengas', 'dupattas', 'jewellery'].includes(page)) {
      loadCategoryProducts(page);
    }
  }
}

function navigateToCategory(category) {
  navigateTo(category);
}

function scrollToProducts() {
  const featuredSection = document.querySelector('.featured-section');
  featuredSection.scrollIntoView({ behavior: 'smooth' });
}

// Products
async function loadFeaturedProducts() {
  try {
    const response = await fetch('/api/products/featured');
    const products = await response.json();
    
    const container = document.getElementById('featuredProducts');
    container.innerHTML = products.map(product => createProductCard(product)).join('');
  } catch (error) {
    console.error('Error loading featured products:', error);
  }
}

async function loadCategoryProducts(category) {
  try {
    const response = await fetch(`/api/products?category=${category}`);
    const products = await response.json();
    
    const categoryPage = document.getElementById(category);
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    
    categoryPage.innerHTML = `
      <div class="container">
        <div class="category-header">
          <h1>${categoryName}</h1>
          <p>Discover our beautiful collection of ${categoryName.toLowerCase()}</p>
        </div>
        <div class="products-grid">
          ${products.map(product => createProductCard(product)).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading category products:', error);
  }
}

function createProductCard(product) {
  return `
    <div class="product-card" onclick="viewProduct(${product.id})">
      <img src="${product.image}" alt="${product.name}" class="product-image">
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <div class="product-price">₹${product.price.toLocaleString()}</div>
        <p class="product-description">${product.description.substring(0, 80)}...</p>
        <button class="btn-add-cart" onclick="addToCart(event, ${product.id}, '${product.name}', ${product.price}, '${product.image}')">
          Add to Cart
        </button>
      </div>
    </div>
  `;
}

async function viewProduct(productId) {
  try {
    const response = await fetch(`/api/products/${productId}`);
    const product = await response.json();
    currentProduct = product;
    
    const detailPage = document.getElementById('productDetail');
    detailPage.innerHTML = `
      <div class="container">
        <div class="product-detail">
          <button class="btn-primary" onclick="history.back()" style="margin-bottom: 20px;">← Back</button>
          <div class="product-detail-grid">
            <div>
              <img src="${product.image}" alt="${product.name}" class="product-detail-image">
            </div>
            <div class="product-detail-info">
              <h1>${product.name}</h1>
              <div class="product-detail-price">₹${product.price.toLocaleString()}</div>
              <p class="product-detail-description">${product.description}</p>
              <button class="btn-primary" onclick="addToCart(event, ${product.id}, '${product.name}', ${product.price}, '${product.image}')">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    navigateTo('productDetail');
  } catch (error) {
    console.error('Error loading product:', error);
  }
}

// Cart
function addToCart(event, id, name, price, image) {
  event.stopPropagation();
  
  const existingItem = cart.find(item => item.id === id);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id, name, price, image, quantity: 1 });
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
  
  // Show brief notification
  alert(`${name} added to cart!`);
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

function toggleCart() {
  document.getElementById('cartSidebar').classList.toggle('active');
}

function updateCartUI() {
  updateCartCount();
  renderCartItems();
  updateCartTotal();
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCount').textContent = count;
}

function renderCartItems() {
  const container = document.getElementById('cartItems');
  
  if (cart.length === 0) {
    container.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
    return;
  }
  
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item-image">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${item.price.toLocaleString()} × ${item.quantity}</div>
        <button class="cart-item-remove" onclick="removeFromCart(${item.id})">Remove</button>
      </div>
    </div>
  `).join('');
}

function updateCartTotal() {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  document.getElementById('cartTotal').textContent = `₹${total.toLocaleString()}`;
}

// Checkout
function openCheckoutModal() {
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  
  const modal = document.getElementById('checkoutModal');
  const itemsContainer = document.getElementById('checkoutItems');
  const totalContainer = document.getElementById('checkoutTotal');
  
  itemsContainer.innerHTML = cart.map(item => `
    <div class="checkout-item">
      <span>${item.name} × ${item.quantity}</span>
      <span>₹${(item.price * item.quantity).toLocaleString()}</span>
    </div>
  `).join('');
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  totalContainer.textContent = `₹${total.toLocaleString()}`;
  
  modal.classList.add('active');
  toggleCart(); // Close cart sidebar
}

function closeCheckoutModal() {
  document.getElementById('checkoutModal').classList.remove('active');
  document.getElementById('checkoutForm').reset();
}

async function handleCheckout(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const orderData = {
    customer_name: formData.get('customer_name'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    items: cart,
    total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  };
  
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Clear cart
      cart = [];
      localStorage.removeItem('cart');
      updateCartUI();
      
      // Close checkout modal
      closeCheckoutModal();
      
      // Show success modal
      document.getElementById('successModal').classList.add('active');
    }
  } catch (error) {
    console.error('Error placing order:', error);
    alert('Failed to place order. Please try again.');
  }
}

function closeSuccessModal() {
  document.getElementById('successModal').classList.remove('active');
  navigateTo('home');
}

// Admin
async function checkAdminSession() {
  try {
    const response = await fetch('/api/admin/check');
    const data = await response.json();
    
    if (data.loggedIn) {
      isAdminLoggedIn = true;
      showAdminDashboard();
    } else {
      showAdminLogin();
    }
  } catch (error) {
    showAdminLogin();
  }
}

function showAdminLogin() {
  const adminPage = document.getElementById('admin');
  adminPage.innerHTML = `
    <div class="container">
      <div class="admin-login">
        <h2>Admin Login</h2>
        <form id="adminLoginForm" class="admin-form">
          <div class="form-group">
            <label>Username</label>
            <input type="text" name="username" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" required>
          </div>
          <button type="submit" class="btn-primary btn-full">Login</button>
        </form>
      </div>
    </div>
  `;
  
  document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
}

async function handleAdminLogin(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const credentials = {
    username: formData.get('username'),
    password: formData.get('password')
  };
  
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    if (response.ok) {
      isAdminLoggedIn = true;
      showAdminDashboard();
    } else {
      alert('Invalid credentials');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Login failed');
  }
}

function showAdminDashboard() {
  const adminPage = document.getElementById('admin');
  adminPage.innerHTML = `
    <div class="container">
      <div class="admin-header">
        <h2 style="font-family: 'Playfair Display', serif; color: var(--primary);">Admin Dashboard</h2>
        <button class="btn-primary" onclick="handleAdminLogout()">Logout</button>
      </div>
      
      <div class="admin-tabs">
        <button class="admin-tab active" onclick="showAdminTab('orders')">Orders</button>
        <button class="admin-tab" onclick="showAdminTab('products')">Products</button>
      </div>
      
      <div class="admin-content" id="adminContent">
        <!-- Content loaded via JS -->
      </div>
    </div>
  `;
  
  showAdminTab('orders');
}

async function showAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  if (tab === 'orders') {
    await loadAdminOrders();
  } else if (tab === 'products') {
    await loadAdminProducts();
  }
}

async function loadAdminOrders() {
  try {
    const response = await fetch('/api/admin/orders');
    const orders = await response.json();
    
    const content = document.getElementById('adminContent');
    content.innerHTML = `
      <h3 style="margin-bottom: 20px; font-family: 'Playfair Display', serif;">All Orders</h3>
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Phone</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(order => `
            <tr>
              <td>#${order.id}</td>
              <td>${order.customer_name}</td>
              <td>${order.phone}</td>
              <td>₹${order.total.toLocaleString()}</td>
              <td><span class="status-badge status-${order.status}">${order.status}</span></td>
              <td>${new Date(order.created_at).toLocaleDateString()}</td>
              <td>
                <button class="btn-primary btn-small" onclick="viewOrderDetails(${order.id})">View</button>
                <button class="btn-primary btn-small" onclick="updateOrderStatus(${order.id}, 'confirmed')">Confirm</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Error loading orders:', error);
  }
}

async function loadAdminProducts() {
  try {
    const response = await fetch('/api/admin/products');
    const products = await response.json();
    
    const content = document.getElementById('adminContent');
    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="font-family: 'Playfair Display', serif;">All Products</h3>
        <button class="btn-primary" onclick="showAddProductForm()">Add New Product</button>
      </div>
      <div id="productsList">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(product => `
              <tr>
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>₹${product.price.toLocaleString()}</td>
                <td>${product.featured ? 'Yes' : 'No'}</td>
                <td>
                  <button class="btn-primary btn-small" onclick="editProduct(${product.id})">Edit</button>
                  <button class="btn-primary btn-small" onclick="deleteProduct(${product.id})">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

function showAddProductForm() {
  const content = document.getElementById('adminContent');
  content.innerHTML = `
    <h3 style="margin-bottom: 20px; font-family: 'Playfair Display', serif;">Add New Product</h3>
    <form id="addProductForm" class="admin-form">
      <div class="form-group">
        <label>Product Name *</label>
        <input type="text" name="name" required>
      </div>
      <div class="form-group">
        <label>Category *</label>
        <select name="category" required>
          <option value="sarees">Sarees</option>
          <option value="lehengas">Lehengas</option>
          <option value="dupattas">Dupattas</option>
          <option value="jewellery">Jewellery</option>
        </select>
      </div>
      <div class="form-group">
        <label>Price (₹) *</label>
        <input type="number" name="price" required>
      </div>
      <div class="form-group">
        <label>Description *</label>
        <textarea name="description" rows="4" required></textarea>
      </div>
      <div class="form-group">
        <label>Image URL *</label>
        <input type="text" name="image" required>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" name="featured" value="1">
          Featured Product
        </label>
      </div>
      <div style="display: flex; gap: 10px;">
        <button type="submit" class="btn-primary">Add Product</button>
        <button type="button" class="btn-primary" onclick="loadAdminProducts()">Cancel</button>
      </div>
    </form>
  `;
  
  document.getElementById('addProductForm').addEventListener('submit', handleAddProduct);
}

async function handleAddProduct(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const productData = {
    name: formData.get('name'),
    category: formData.get('category'),
    price: parseInt(formData.get('price')),
    description: formData.get('description'),
    image: formData.get('image'),
    featured: formData.get('featured') ? 1 : 0
  };
  
  try {
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    
    if (response.ok) {
      alert('Product added successfully!');
      loadAdminProducts();
    }
  } catch (error) {
    console.error('Error adding product:', error);
    alert('Failed to add product');
  }
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  
  try {
    const response = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      alert('Product deleted successfully!');
      loadAdminProducts();
    }
  } catch (error) {
    console.error('Error deleting product:', error);
  }
}

async function editProduct(id) {
  try {
    const response = await fetch(`/api/admin/products/${id}`);
    const product = await response.json();
    
    const content = document.getElementById('adminContent');
    content.innerHTML = `
      <h3 style="margin-bottom: 20px; font-family: 'Playfair Display', serif;">Edit Product</h3>
      <form id="editProductForm" class="admin-form">
        <input type="hidden" name="id" value="${product.id}">
        <div class="form-group">
          <label>Product Name *</label>
          <input type="text" name="name" value="${product.name}" required>
        </div>
        <div class="form-group">
          <label>Category *</label>
          <select name="category" required>
            <option value="lehengas" ${product.category === 'lehengas' ? 'selected' : ''}>Lehengas</option>
            <option value="dupattas" ${product.category === 'dupattas' ? 'selected' : ''}>Dupattas</option>
            <option value="jewellery" ${product.category === 'jewellery' ? 'selected' : ''}>Jewellery</option>
          </select>
        </div>
        <div class="form-group">
          <label>Price (₹) *</label>
          <input type="number" name="price" value="${product.price}" required>
        </div>
        <div class="form-group">
          <label>Description *</label>
          <textarea name="description" rows="4" required>${product.description}</textarea>
        </div>
        <div class="form-group">
          <label>Image URL *</label>
          <input type="text" name="image" value="${product.image}" required>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" name="featured" value="1" ${product.featured ? 'checked' : ''}>
            Featured Product
          </label>
        </div>
        <div style="display: flex; gap: 10px;">
          <button type="submit" class="btn-primary">Update Product</button>
          <button type="button" class="btn-primary" onclick="loadAdminProducts()">Cancel</button>
        </div>
      </form>
    `;
    
    document.getElementById('editProductForm').addEventListener('submit', handleEditProduct);
  } catch (error) {
    console.error('Error loading product:', error);
  }
}

async function handleEditProduct(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const productData = {
    name: formData.get('name'),
    category: formData.get('category'),
    price: parseInt(formData.get('price')),
    description: formData.get('description'),
    image: formData.get('image'),
    featured: formData.get('featured') ? 1 : 0
  };
  
  const id = formData.get('id');
  
  try {
    const response = await fetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    
    if (response.ok) {
      alert('Product updated successfully!');
      loadAdminProducts();
    }
  } catch (error) {
    console.error('Error updating product:', error);
    alert('Failed to update product');
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    
    if (response.ok) {
      alert('Order status updated!');
      loadAdminOrders();
    }
  } catch (error) {
    console.error('Error updating order:', error);
  }
}

async function handleAdminLogout() {
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
    isAdminLoggedIn = false;
    showAdminLogin();
    navigateTo('home');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

function viewOrderDetails(orderId) {
  fetch(`/api/admin/orders`)
    .then(res => res.json())
    .then(orders => {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const items = JSON.parse(order.items);
        alert(`Order #${order.id}
Customer: ${order.customer_name}
Phone: ${order.phone}
Address: ${order.address}
Items: ${items.map(i => `${i.name} x${i.quantity}`).join(', ')}
Total: ₹${order.total.toLocaleString()}`);
      }
    });
}