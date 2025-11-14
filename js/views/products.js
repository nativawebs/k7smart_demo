/**
 * Products View - Similar structure to providers.js
 * Handles products page logic and CRUD operations
 */

import state from '../modules/state.js';
import * as api from '../modules/api.js';
import { debounce, formatCurrency, formatPercentage, showToast, showLoading, hideLoading, confirm, exportToCSV, calculateMargin } from '../modules/utils.js';
import { signOut, getCurrentUser, initSupabase } from '../modules/auth.js';

let currentPage = 1;
let currentLimit = 10;
let currentSearch = '';
let currentCategory = '';
let currentSort = 'name';
let currentSortOrder = 'asc';
let editingProductId = null;
let productModal = null;

async function init() {
  try {
    try {
      const configModule = await import('../config.js');
      if (configModule.config) {
        initSupabase(configModule.config.supabaseUrl, configModule.config.supabaseAnonKey);
      }
    } catch (e) {
      console.log('Config file not found');
    }
    
    const user = await getCurrentUser();
    if (user) document.getElementById('user-email').textContent = user.email;
    
    const modalEl = document.getElementById('productModal');
    productModal = new bootstrap.Modal(modalEl);
    
    setupEventListeners();
    updateDummyUI();
    await loadCategories();
    await loadProviders();
    await loadProducts();
    setupKeyboardShortcuts();
  } catch (error) {
    console.error('Error initializing products page:', error);
  }
}

function setupEventListeners() {
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
    state.toggleSidebar();
  });
  
  document.getElementById('dark-mode-toggle')?.addEventListener('click', () => {
    const isDark = state.toggleDarkMode();
    document.querySelector('#dark-mode-toggle i').className = isDark ? 'bi bi-sun' : 'bi bi-moon-stars';
  });
  
  document.getElementById('logout-btn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await signOut();
  });
  
  document.getElementById('search-input')?.addEventListener('input', debounce((e) => {
    currentSearch = e.target.value;
    currentPage = 1;
    loadProducts();
  }, 300));
  
  document.getElementById('category-filter')?.addEventListener('change', (e) => {
    currentCategory = e.target.value;
    currentPage = 1;
    loadProducts();
  });
  
  document.getElementById('sort-select')?.addEventListener('change', (e) => {
    const [field, order] = e.target.value.split('-');
    currentSort = field === 'price' ? 'price_net' : field;
    currentSortOrder = order;
    loadProducts();
  });
  
  document.getElementById('clear-filters-btn')?.addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('sort-select').value = 'name-asc';
    currentSearch = '';
    currentCategory = '';
    currentSort = 'name';
    currentSortOrder = 'asc';
    currentPage = 1;
    loadProducts();
  });
  
  document.getElementById('new-product-btn')?.addEventListener('click', () => openProductModal());
  document.getElementById('export-btn')?.addEventListener('click', exportProducts);
  document.getElementById('product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveProduct();
  });
  
  state.subscribe('dummyMode', () => {
    updateDummyUI();
    loadProducts();
  });
}

function updateDummyUI() {
  const isDummy = state.getState().dummyMode;
  const badge = document.getElementById('dummy-badge');
  if (badge) badge.style.display = isDummy ? 'flex' : 'none';
}

async function loadCategories() {
  const result = await api.getAllCategories();
  if (result.success) {
    const select = document.getElementById('category-filter');
    const modalSelect = document.getElementById('product-category');
    const options = result.data.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if (select) select.innerHTML += options;
    if (modalSelect) modalSelect.innerHTML = '<option value="">Seleccionar...</option>' + options;
  }
}

async function loadProviders() {
  const result = await api.getProviders({ page: 1, limit: 100 });
  if (result.success) {
    const select = document.getElementById('product-provider');
    if (select) {
      select.innerHTML = '<option value="">Seleccionar...</option>' + 
        result.data.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }
  }
}

async function loadProducts() {
  const tbody = document.getElementById('products-table-body');
  tbody.innerHTML = '<tr><td colspan="9" class="text-center py-5"><div class="spinner-border text-primary"></div></td></tr>';
  
  const result = await api.getProducts({
    page: currentPage,
    limit: currentLimit,
    search: currentSearch,
    sortBy: currentSort,
    sortOrder: currentSortOrder
  });
  
  if (result.success) {
    renderProducts(result.data);
    updatePagination(result.total, result.page, result.limit);
  }
}

function renderProducts(products) {
  const tbody = document.getElementById('products-table-body');
  
  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-5 text-muted"><i class="bi bi-inbox fs-1"></i><p class="mt-2">No se encontraron productos</p></td></tr>';
    return;
  }
  
  tbody.innerHTML = products.map(p => {
    const margin = calculateMargin(p.price_net || 0, p.cogs || 0, 0);
    return `
      <tr>
        <td><code>${p.sku}</code></td>
        <td><div class="fw-semibold">${p.name}</div></td>
        <td>${p.category || '-'}</td>
        <td>${p.provider || '-'}</td>
        <td>${formatCurrency(p.cogs || 0)}</td>
        <td>${formatCurrency(p.price_net || 0)}</td>
        <td>${formatCurrency(p.price_gross || 0)}</td>
        <td><span class="badge ${margin > 20 ? 'bg-success' : margin > 10 ? 'bg-warning' : 'bg-danger'}">${formatPercentage(margin, 1)}</span></td>
        <td class="text-end">
          <div class="table-actions">
            <button class="btn btn-sm btn-icon btn-outline-primary" onclick="window.editProduct('${p.id}')" title="Editar"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-icon btn-outline-danger" onclick="window.deleteProduct('${p.id}')" title="Eliminar"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function updatePagination(total, page, limit) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  document.getElementById('showing-from').textContent = from;
  document.getElementById('showing-to').textContent = to;
  document.getElementById('total-records').textContent = total;
  
  const totalPages = Math.ceil(total / limit);
  const pagination = document.getElementById('pagination');
  if (totalPages <= 1) { pagination.innerHTML = ''; return; }
  
  let html = `<li class="page-item ${page === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="window.goToPage(${page - 1}); return false;"><i class="bi bi-chevron-left"></i></a></li>`;
  for (let i = 1; i <= Math.min(totalPages, 5); i++) {
    html += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="#" onclick="window.goToPage(${i}); return false;">${i}</a></li>`;
  }
  html += `<li class="page-item ${page === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="window.goToPage(${page + 1}); return false;"><i class="bi bi-chevron-right"></i></a></li>`;
  pagination.innerHTML = html;
}

window.goToPage = function(page) {
  currentPage = page;
  loadProducts();
};

function openProductModal(product = null) {
  editingProductId = product?.id || null;
  document.getElementById('productModalLabel').textContent = product ? 'Editar Producto' : 'Nuevo Producto';
  
  if (product) {
    document.getElementById('product-sku').value = product.sku || '';
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-category').value = product.category_id || '';
    document.getElementById('product-provider').value = product.default_provider_id || '';
    document.getElementById('product-cogs').value = product.cogs || '';
    document.getElementById('product-price-net').value = product.price_net || '';
    document.getElementById('product-tax-rate').value = (product.tax_rate || 0.15) * 100;
    document.getElementById('product-notes').value = product.notes || '';
  } else {
    document.getElementById('product-form').reset();
  }
  
  productModal.show();
}

window.editProduct = async function(id) {
  showLoading('Cargando producto...');
  const result = await api.getProduct(id);
  hideLoading();
  if (result.success && result.data) openProductModal(result.data);
};

window.deleteProduct = async function(id) {
  const confirmed = await confirm('¿Eliminar este producto?', 'Confirmar');
  if (confirmed) {
    showLoading('Eliminando...');
    const result = await api.deleteProduct(id);
    hideLoading();
    if (result.success) await loadProducts();
  }
};

async function saveProduct() {
  const productData = {
    sku: document.getElementById('product-sku').value.trim(),
    name: document.getElementById('product-name').value.trim(),
    category_id: document.getElementById('product-category').value,
    default_provider_id: document.getElementById('product-provider').value,
    cogs: parseFloat(document.getElementById('product-cogs').value),
    notes: document.getElementById('product-notes').value.trim()
  };
  
  if (!productData.sku || !productData.name) {
    showToast('Completa los campos requeridos', 'warning');
    return;
  }
  
  showLoading(editingProductId ? 'Actualizando...' : 'Creando...');
  const result = editingProductId ? 
    await api.updateProduct(editingProductId, productData) : 
    await api.createProduct(productData);
  hideLoading();
  
  if (result.success) {
    productModal.hide();
    await loadProducts();
  }
}

async function exportProducts() {
  showLoading('Exportando...');
  const result = await api.getProducts({ page: 1, limit: 1000 });
  hideLoading();
  
  if (result.success) {
    const data = result.data.map(p => ({
      SKU: p.sku,
      Nombre: p.name,
      Categoría: p.category || '',
      Proveedor: p.provider || '',
      COGS: p.cogs || 0,
      'Precio Neto': p.price_net || 0,
      'Precio Bruto': p.price_gross || 0,
      'Margen %': calculateMargin(p.price_net || 0, p.cogs || 0, 0).toFixed(2)
    }));
    exportToCSV(data, `productos_${new Date().toISOString().split('T')[0]}.csv`);
  }
}

function setupKeyboardShortcuts() {
  let keys = {};
  document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (keys['g'] && keys['d']) window.location.href = 'index.html';
    if (keys['g'] && keys['p']) window.location.href = 'providers.html';
    if (keys['g'] && keys['r']) window.location.href = 'products.html';
    if (keys['g'] && keys['c']) window.location.href = 'compare.html';
    if (e.key === '/' && !e.ctrlKey) { e.preventDefault(); document.getElementById('search-input')?.focus(); }
  });
  document.addEventListener('keyup', (e) => delete keys[e.key]);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
