/**
 * Providers View
 * Handles providers page logic and CRUD operations
 */

import state from '../modules/state.js';
import * as api from '../modules/api.js';
import { 
  debounce, 
  formatCurrency, 
  formatDate, 
  showToast, 
  showLoading, 
  hideLoading, 
  confirm,
  exportToCSV,
  validateEmail,
  validateRUC,
  validatePhone
} from '../modules/utils.js';
import { signOut, getCurrentUser, initSupabase } from '../modules/auth.js';

// State
let currentPage = 1;
let currentLimit = 10;
let currentSearch = '';
let currentStatus = '';
let currentSort = 'name';
let currentSortOrder = 'asc';
let editingProviderId = null;
let providerModal = null;
let selectedProviders = new Set();
let allProviders = [];

/**
 * Initialize providers page
 */
async function init() {
  try {
    // Initialize Supabase
    try {
      const configModule = await import('../config.js');
      if (configModule.config) {
        initSupabase(configModule.config.supabaseUrl, configModule.config.supabaseAnonKey);
      }
    } catch (e) {
      console.log('Config file not found, using defaults');
    }
    
    // Get current user
    const user = await getCurrentUser();
    if (user) {
      document.getElementById('user-email').textContent = user.email;
    }
    
    // Initialize modal
    const modalEl = document.getElementById('providerModal');
    providerModal = new bootstrap.Modal(modalEl);
    
    // Setup event listeners
    setupEventListeners();
    
    // Load providers
    await loadProviders();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
  } catch (error) {
    console.error('Error initializing providers page:', error);
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Sidebar toggle
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  
  sidebarToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    state.toggleSidebar();
  });
  
  // Dark mode toggle
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  darkModeToggle?.addEventListener('click', () => {
    const isDark = state.toggleDarkMode();
    updateDarkModeIcon(isDark);
  });
  
  updateDarkModeIcon(state.getState().darkMode);
  
  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    await signOut();
  });
  
  // Search input with debounce
  const searchInput = document.getElementById('search-input');
  searchInput?.addEventListener('input', debounce((e) => {
    currentSearch = e.target.value;
    currentPage = 1;
    loadProviders();
  }, 300));
  
  // Status filter
  const statusFilter = document.getElementById('status-filter');
  statusFilter?.addEventListener('change', (e) => {
    currentStatus = e.target.value;
    currentPage = 1;
    loadProviders();
  });
  
  // Sort select
  const sortSelect = document.getElementById('sort-select');
  sortSelect?.addEventListener('change', (e) => {
    const [field, order] = e.target.value.split('-');
    currentSort = field === 'created' ? 'created_at' : field;
    currentSortOrder = order;
    loadProviders();
  });
  
  // Clear filters
  const clearFiltersBtn = document.getElementById('clear-filters-btn');
  clearFiltersBtn?.addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('sort-select').value = 'name-asc';
    currentSearch = '';
    currentStatus = '';
    currentSort = 'name';
    currentSortOrder = 'asc';
    currentPage = 1;
    loadProviders();
  });
  
  // New provider button
  const newProviderBtn = document.getElementById('new-provider-btn');
  newProviderBtn?.addEventListener('click', () => {
    openProviderModal();
  });
  
  // Export button
  const exportBtn = document.getElementById('export-btn');
  exportBtn?.addEventListener('click', async () => {
    await exportSelectedProviders();
  });
  
  // Select all checkbox
  const selectAllCheckbox = document.getElementById('select-all-checkbox');
  selectAllCheckbox?.addEventListener('change', (e) => {
    handleSelectAll(e.target.checked);
  });
  
  // Provider form
  const providerForm = document.getElementById('provider-form');
  providerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveProvider();
  });
  
}

/**
 * Update dark mode icon
 */
function updateDarkModeIcon(isDark) {
  const icon = document.querySelector('#dark-mode-toggle i');
  if (icon) {
    icon.className = isDark ? 'bi bi-sun' : 'bi bi-moon-stars';
  }
}

/**
 * Load providers
 */
async function loadProviders() {
  try {
    const tbody = document.getElementById('providers-table-body');
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </td>
      </tr>
    `;
    
    const result = await api.getProviders({
      page: currentPage,
      limit: currentLimit,
      search: currentSearch,
      sortBy: currentSort,
      sortOrder: currentSortOrder
    });
    
    if (result.success) {
      allProviders = result.data;
      renderProviders(result.data);
      updatePagination(result.total, result.page, result.limit);
      updateExportButton();
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-5 text-danger">
            <i class="bi bi-exclamation-triangle fs-1"></i>
            <p class="mt-2">Error al cargar proveedores</p>
          </td>
        </tr>
      `;
    }
  } catch (error) {
    console.error('Error loading providers:', error);
  }
}

/**
 * Render providers table
 */
function renderProviders(providers) {
  const tbody = document.getElementById('providers-table-body');
  
  if (providers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center py-5 text-muted">
          <i class="bi bi-inbox fs-1"></i>
          <p class="mt-2">No se encontraron proveedores</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = providers.map(provider => `
    <tr>
      <td>
        <input 
          type="checkbox" 
          class="form-check-input provider-checkbox" 
          data-provider-id="${provider.id}"
          ${selectedProviders.has(provider.id) ? 'checked' : ''}
          onchange="window.handleProviderCheckbox('${provider.id}', this.checked)"
        >
      </td>
      <td>
        <div class="fw-semibold">${provider.name}</div>
        <small class="text-muted">${formatDate(provider.created_at)}</small>
      </td>
      <td>${provider.ruc}</td>
      <td>
        ${provider.contact_person ? `<div><i class="bi bi-person me-1"></i><strong>${provider.contact_person}</strong></div>` : ''}
        <div><i class="bi bi-envelope me-1"></i>${provider.email}</div>
        <div><i class="bi bi-telephone me-1"></i>${provider.phone}</div>
        ${provider.whatsapp ? `<div><a href="https://wa.me/${provider.whatsapp}" target="_blank" class="text-success"><i class="bi bi-whatsapp me-1"></i>${provider.whatsapp}</a></div>` : ''}
        ${provider.website ? `<div><a href="${provider.website}" target="_blank" class="text-primary"><i class="bi bi-globe me-1"></i>Web</a></div>` : ''}
      </td>
      <td>${provider.commission_rate ? provider.commission_rate + '%' : '-'}</td>
      <td>
        <small>${provider.zones || '-'}</small>
      </td>
      <td>
        <span class="badge ${provider.dropshipping ? 'bg-info' : 'bg-secondary'}">
          ${provider.dropshipping ? 'Sí' : 'No'}
        </span>
      </td>
      <td>
        <span class="badge ${provider.status === 'active' ? 'bg-success' : 'bg-secondary'}">
          ${provider.status === 'active' ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td class="text-end">
        <div class="table-actions">
          <button class="btn btn-sm btn-icon btn-outline-primary" onclick="window.editProvider('${provider.id}')" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-icon btn-outline-danger" onclick="window.deleteProvider('${provider.id}')" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
  
  // Update select all checkbox state
  updateSelectAllCheckbox();
}

/**
 * Update pagination
 */
function updatePagination(total, page, limit) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const totalPages = Math.ceil(total / limit);
  
  document.getElementById('showing-from').textContent = from;
  document.getElementById('showing-to').textContent = to;
  document.getElementById('total-records').textContent = total;
  
  const pagination = document.getElementById('pagination');
  
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }
  
  let html = '';
  
  // Previous button
  html += `
    <li class="page-item ${page === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="window.goToPage(${page - 1}); return false;">
        <i class="bi bi-chevron-left"></i>
      </a>
    </li>
  `;
  
  // Page numbers
  const maxVisible = 5;
  let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  if (startPage > 1) {
    html += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="window.goToPage(1); return false;">1</a>
      </li>
    `;
    if (startPage > 2) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    html += `
      <li class="page-item ${i === page ? 'active' : ''}">
        <a class="page-link" href="#" onclick="window.goToPage(${i}); return false;">${i}</a>
      </li>
    `;
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    html += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="window.goToPage(${totalPages}); return false;">${totalPages}</a>
      </li>
    `;
  }
  
  // Next button
  html += `
    <li class="page-item ${page === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="window.goToPage(${page + 1}); return false;">
        <i class="bi bi-chevron-right"></i>
      </a>
    </li>
  `;
  
  pagination.innerHTML = html;
}

/**
 * Go to page
 */
window.goToPage = function(page) {
  currentPage = page;
  loadProviders();
};

/**
 * Open provider modal
 */
function openProviderModal(provider = null) {
  editingProviderId = provider?.id || null;
  
  const modalTitle = document.getElementById('providerModalLabel');
  modalTitle.textContent = provider ? 'Editar Proveedor' : 'Nuevo Proveedor';
  
  if (provider) {
    document.getElementById('provider-name').value = provider.name || '';
    document.getElementById('provider-ruc').value = provider.ruc || '';
    document.getElementById('provider-email').value = provider.email || '';
    document.getElementById('provider-phone').value = provider.phone || '';
    document.getElementById('provider-contact-person').value = provider.contact_person || '';
    document.getElementById('provider-city').value = provider.city || '';
    document.getElementById('provider-location').value = provider.location || '';
    document.getElementById('provider-commission').value = provider.commission_rate || '';
    document.getElementById('provider-delivery-time').value = provider.delivery_time_days || '';
    document.getElementById('provider-status').value = provider.status || 'active';
    document.getElementById('provider-whatsapp').value = provider.whatsapp || '';
    document.getElementById('provider-website').value = provider.website || '';
    document.getElementById('provider-zones').value = provider.zones || '';
    document.getElementById('provider-shipping').value = provider.shipping_cost_policy || '';
    document.getElementById('provider-delivery-notes').value = provider.delivery_notes || '';
    document.getElementById('provider-dropshipping').value = provider.dropshipping ? 'true' : 'false';
  } else {
    document.getElementById('provider-form').reset();
    document.getElementById('provider-dropshipping').value = 'false';
  }
  
  providerModal.show();
}

/**
 * Edit provider
 */
window.editProvider = async function(id) {
  try {
    showLoading('Cargando proveedor...');
    const result = await api.getProvider(id);
    hideLoading();
    
    if (result.success && result.data) {
      openProviderModal(result.data);
    }
  } catch (error) {
    hideLoading();
    console.error('Error loading provider:', error);
  }
};

/**
 * Delete provider
 */
window.deleteProvider = async function(id) {
  const confirmed = await confirm(
    '¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer.',
    'Confirmar Eliminación'
  );
  
  if (confirmed) {
    showLoading('Eliminando proveedor...');
    const result = await api.deleteProvider(id);
    hideLoading();
    
    if (result.success) {
      await loadProviders();
    }
  }
};

/**
 * Save provider
 */
async function saveProvider() {
  const name = document.getElementById('provider-name').value.trim();
  const ruc = document.getElementById('provider-ruc').value.trim();
  const email = document.getElementById('provider-email').value.trim();
  const phone = document.getElementById('provider-phone').value.trim();
  const contactPerson = document.getElementById('provider-contact-person').value.trim();
  const city = document.getElementById('provider-city').value.trim();
  const location = document.getElementById('provider-location').value.trim();
  const commission = document.getElementById('provider-commission').value;
  const deliveryTime = document.getElementById('provider-delivery-time').value;
  const status = document.getElementById('provider-status').value;
  const whatsapp = document.getElementById('provider-whatsapp').value.trim();
  const website = document.getElementById('provider-website').value.trim();
  const zones = document.getElementById('provider-zones').value.trim();
  const shipping = document.getElementById('provider-shipping').value.trim();
  const deliveryNotes = document.getElementById('provider-delivery-notes').value.trim();
  const dropshipping = document.getElementById('provider-dropshipping').value === 'true';
  
  // Validate
  if (!name || !email || !phone) {
    showToast('Por favor completa todos los campos requeridos', 'warning');
    return;
  }
  
  // Set default RUC if empty
  const finalRuc = ruc || '1';
  
  if (!validateEmail(email)) {
    showToast('Email inválido', 'warning');
    return;
  }
  
  // RUC validation: allow up to 13 digits or default value "1"
  if (ruc !== '1' && (!/^\d{1,13}$/.test(ruc))) {
    showToast('RUC inválido (debe tener hasta 13 dígitos o usar "1" como valor por defecto)', 'warning');
    return;
  }
  
  if (!validatePhone(phone)) {
    showToast('Teléfono inválido', 'warning');
    return;
  }
  
  const providerData = {
    name,
    ruc: finalRuc,
    email,
    phone,
    contact_person: contactPerson || null,
    whatsapp: whatsapp || null,
    website: website || null,
    city,
    location,
    commission_rate: commission ? parseFloat(commission) : null,
    delivery_time_days: deliveryTime ? parseInt(deliveryTime) : null,
    status,
    zones,
    shipping_cost_policy: shipping,
    delivery_notes: deliveryNotes,
    dropshipping
  };
  
  showLoading(editingProviderId ? 'Actualizando proveedor...' : 'Creando proveedor...');
  
  let result;
  if (editingProviderId) {
    result = await api.updateProvider(editingProviderId, providerData);
  } else {
    result = await api.createProvider(providerData);
  }
  
  hideLoading();
  
  if (result.success) {
    providerModal.hide();
    await loadProviders();
  }
}

/**
 * Handle individual provider checkbox
 */
window.handleProviderCheckbox = function(providerId, checked) {
  if (checked) {
    selectedProviders.add(providerId);
  } else {
    selectedProviders.delete(providerId);
  }
  updateSelectAllCheckbox();
  updateExportButton();
};

/**
 * Handle select all checkbox
 */
function handleSelectAll(checked) {
  if (checked) {
    allProviders.forEach(provider => {
      selectedProviders.add(provider.id);
    });
  } else {
    selectedProviders.clear();
  }
  
  // Update all checkboxes in the table
  document.querySelectorAll('.provider-checkbox').forEach(checkbox => {
    checkbox.checked = checked;
  });
  
  updateExportButton();
}

/**
 * Update select all checkbox state
 */
function updateSelectAllCheckbox() {
  const selectAllCheckbox = document.getElementById('select-all-checkbox');
  if (!selectAllCheckbox) return;
  
  const totalProviders = allProviders.length;
  const selectedCount = selectedProviders.size;
  
  if (selectedCount === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  } else if (selectedCount === totalProviders) {
    selectAllCheckbox.checked = true;
    selectAllCheckbox.indeterminate = false;
  } else {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = true;
  }
}

/**
 * Update export button state
 */
function updateExportButton() {
  const exportBtn = document.getElementById('export-btn');
  if (!exportBtn) return;
  
  const selectedCount = selectedProviders.size;
  
  if (selectedCount > 0) {
    exportBtn.disabled = false;
    exportBtn.innerHTML = `<i class="bi bi-download me-2"></i>Exportar Seleccionados (${selectedCount})`;
  } else {
    exportBtn.disabled = true;
    exportBtn.innerHTML = `<i class="bi bi-download me-2"></i>Exportar Seleccionados (.xlsx)`;
  }
}

/**
 * Export selected providers
 */
async function exportSelectedProviders() {
  if (selectedProviders.size === 0) {
    showToast('Por favor selecciona al menos un proveedor para exportar', 'warning');
    return;
  }
  
  try {
    showLoading('Exportando proveedores seleccionados...');
    
    // Get all providers to filter selected ones
    const result = await api.getProviders({
      page: 1,
      limit: 1000,
      search: currentSearch,
      sortBy: currentSort,
      sortOrder: currentSortOrder
    });
    
    hideLoading();
    
    if (result.success && result.data) {
      // Filter only selected providers
      const selectedProvidersData = result.data.filter(p => selectedProviders.has(p.id));
      
      const exportData = selectedProvidersData.map(p => ({
        Nombre: p.name,
        RUC: p.ruc || '1',
        'Persona de Contacto': p.contact_person || '',
        WhatsApp: p.whatsapp || '',
        'Sitio Web': p.website || '',
        Email: p.email,
        Teléfono: p.phone,
        'Comisión (%)': p.commission_rate || '',
        Zonas: p.zones || '',
        'Política de Envío': p.shipping_cost_policy || '',
        Dropshipping: p.dropshipping ? 'Sí' : 'No',
        Estado: p.status,
        'Fecha de Creación': formatDate(p.created_at)
      }));
      
      exportToCSV(exportData, `proveedores_seleccionados_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast(`${selectedProvidersData.length} proveedores exportados exitosamente`, 'success');
    }
  } catch (error) {
    hideLoading();
    console.error('Error exporting providers:', error);
  }
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  let keys = {};
  
  document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts if user is typing in an input/textarea
    const isTyping = e.target.tagName === 'INPUT' || 
                     e.target.tagName === 'TEXTAREA' || 
                     e.target.isContentEditable;
    
    if (isTyping && e.key !== '/') {
      return; // Allow normal typing in form fields
    }
    
    keys[e.key] = true;
    
    // g + d = Dashboard
    if (keys['g'] && keys['d']) {
      window.location.href = 'index.html';
      keys = {};
    }
    
    // g + p = Providers
    if (keys['g'] && keys['p']) {
      window.location.href = 'providers.html';
      keys = {};
    }
    
    // g + r = Products
    if (keys['g'] && keys['r']) {
      window.location.href = 'products.html';
      keys = {};
    }
    
    // g + c = Compare
    if (keys['g'] && keys['c']) {
      window.location.href = 'compare.html';
      keys = {};
    }
    
    // / = Focus search (only if not typing)
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !isTyping) {
      e.preventDefault();
      document.getElementById('search-input')?.focus();
    }
  });
  
  document.addEventListener('keyup', (e) => {
    delete keys[e.key];
  });
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
