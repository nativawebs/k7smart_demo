/**
 * Providers Compare View
 * Handles provider comparison logic
 */

import state from '../modules/state.js';
import * as api from '../modules/api.js';
import { 
  formatCurrency, 
  formatDate, 
  showToast, 
  showLoading, 
  hideLoading,
  exportToCSV,
  debounce
} from '../modules/utils.js';
import { signOut, getCurrentUser, initSupabase } from '../modules/auth.js';

// State
let providerA = null;
let providerB = null;
let providerAProducts = [];
let providerBProducts = [];
let priceHistoryChart = null;

/**
 * Initialize page
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
    
    // Setup event listeners
    setupEventListeners();
    
    // Load providers list
    await loadProvidersList();
    
  } catch (error) {
    console.error('Error initializing providers compare page:', error);
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Sidebar toggle
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
    state.toggleSidebar();
  });
  
  // Dark mode toggle
  document.getElementById('dark-mode-toggle')?.addEventListener('click', () => {
    const isDark = state.toggleDarkMode();
    updateDarkModeIcon(isDark);
  });
  
  updateDarkModeIcon(state.getState().darkMode);
  
  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await signOut();
  });
  
  // Provider selects
  document.getElementById('provider-a-select')?.addEventListener('change', (e) => {
    checkCompareButton();
  });
  
  document.getElementById('provider-b-select')?.addEventListener('change', (e) => {
    checkCompareButton();
  });
  
  // Compare button
  document.getElementById('compare-btn')?.addEventListener('click', async () => {
    await compareProviders();
  });
  
  // Clear button
  document.getElementById('clear-btn')?.addEventListener('click', () => {
    clearComparison();
  });
  
  // Export button
  document.getElementById('export-comparison-btn')?.addEventListener('click', () => {
    exportComparison();
  });
  
  // Product search
  document.getElementById('product-search')?.addEventListener('input', debounce((e) => {
    filterProducts(e.target.value);
  }, 300));
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
 * Load providers list
 */
async function loadProvidersList() {
  try {
    showLoading('Cargando proveedores...');
    
    const result = await api.getProviders({
      page: 1,
      limit: 1000,
      sortBy: 'name',
      sortOrder: 'asc'
    });
    
    hideLoading();
    
    if (result.success && result.data) {
      const selectA = document.getElementById('provider-a-select');
      const selectB = document.getElementById('provider-b-select');
      
      result.data.forEach(provider => {
        const optionA = document.createElement('option');
        optionA.value = provider.id;
        optionA.textContent = provider.name;
        selectA.appendChild(optionA);
        
        const optionB = document.createElement('option');
        optionB.value = provider.id;
        optionB.textContent = provider.name;
        selectB.appendChild(optionB);
      });
    }
  } catch (error) {
    hideLoading();
    console.error('Error loading providers:', error);
  }
}

/**
 * Check if compare button should be enabled
 */
function checkCompareButton() {
  const providerAId = document.getElementById('provider-a-select').value;
  const providerBId = document.getElementById('provider-b-select').value;
  const compareBtn = document.getElementById('compare-btn');
  
  if (providerAId && providerBId && providerAId !== providerBId) {
    compareBtn.disabled = false;
  } else {
    compareBtn.disabled = true;
  }
}

/**
 * Compare providers
 */
async function compareProviders() {
  const providerAId = document.getElementById('provider-a-select').value;
  const providerBId = document.getElementById('provider-b-select').value;
  
  if (!providerAId || !providerBId) {
    showToast('Selecciona dos proveedores', 'warning');
    return;
  }
  
  if (providerAId === providerBId) {
    showToast('Selecciona proveedores diferentes', 'warning');
    return;
  }
  
  try {
    showLoading('Comparando proveedores...');
    
    // Load provider A data
    const resultA = await api.getProvider(providerAId);
    if (!resultA.success) throw new Error('Error loading provider A');
    providerA = resultA.data;
    
    // Load provider B data
    const resultB = await api.getProvider(providerBId);
    if (!resultB.success) throw new Error('Error loading provider B');
    providerB = resultB.data;
    
    // Load products for both providers
    await loadProviderProducts(providerAId, providerBId);
    
    hideLoading();
    
    // Show comparison results
    displayComparison();
    
    // Enable export button
    document.getElementById('export-comparison-btn').disabled = false;
    
  } catch (error) {
    hideLoading();
    console.error('Error comparing providers:', error);
    showToast('Error al comparar proveedores', 'error');
  }
}

/**
 * Load products for providers
 */
async function loadProviderProducts(providerAId, providerBId) {
  try {
    // Get products from provider A
    const productsA = await api.getProducts({
      page: 1,
      limit: 1000,
      sortBy: 'name',
      sortOrder: 'asc'
    });
    
    if (productsA.success) {
      providerAProducts = productsA.data.filter(p => p.default_provider_id === providerAId);
    }
    
    // Get products from provider B
    const productsB = await api.getProducts({
      page: 1,
      limit: 1000,
      sortBy: 'name',
      sortOrder: 'asc'
    });
    
    if (productsB.success) {
      providerBProducts = productsB.data.filter(p => p.default_provider_id === providerBId);
    }
    
  } catch (error) {
    console.error('Error loading provider products:', error);
  }
}

/**
 * Display comparison
 */
function displayComparison() {
  // Hide empty state
  document.getElementById('empty-state').style.display = 'none';
  
  // Show comparison results
  document.getElementById('comparison-results').style.display = 'block';
  
  // Display general info
  displayGeneralInfo();
  
  // Display metrics
  displayMetrics();
  
  // Display price history chart
  displayPriceHistory();
  
  // Display products comparison
  displayProductsComparison();
  
  // Display detailed comparison table
  displayDetailedComparison();
}

/**
 * Display general info
 */
function displayGeneralInfo() {
  const infoA = document.getElementById('provider-a-info');
  const infoB = document.getElementById('provider-b-info');
  
  infoA.innerHTML = `
    <h4 class="mb-3">${providerA.name}</h4>
    <div class="mb-2"><strong>RUC:</strong> ${providerA.ruc || 'N/A'}</div>
    <div class="mb-2"><strong>Email:</strong> ${providerA.email || 'N/A'}</div>
    <div class="mb-2"><strong>Teléfono:</strong> ${providerA.phone || 'N/A'}</div>
    <div class="mb-2"><strong>Ciudad:</strong> ${providerA.city || 'N/A'}</div>
    <div class="mb-2"><strong>Ubicación:</strong> ${providerA.location || 'N/A'}</div>
    <div class="mb-2"><strong>Comisión:</strong> ${providerA.commission_rate ? providerA.commission_rate + '%' : 'N/A'}</div>
    <div class="mb-2"><strong>Tiempo de Entrega:</strong> ${providerA.delivery_time_days ? providerA.delivery_time_days + ' días' : 'N/A'}</div>
    <div class="mb-2"><strong>Zonas:</strong> ${providerA.zones || 'N/A'}</div>
    <div class="mb-2"><strong>Estado:</strong> <span class="badge ${providerA.status === 'active' ? 'bg-success' : 'bg-secondary'}">${providerA.status === 'active' ? 'Activo' : 'Inactivo'}</span></div>
  `;
  
  infoB.innerHTML = `
    <h4 class="mb-3">${providerB.name}</h4>
    <div class="mb-2"><strong>RUC:</strong> ${providerB.ruc || 'N/A'}</div>
    <div class="mb-2"><strong>Email:</strong> ${providerB.email || 'N/A'}</div>
    <div class="mb-2"><strong>Teléfono:</strong> ${providerB.phone || 'N/A'}</div>
    <div class="mb-2"><strong>Ciudad:</strong> ${providerB.city || 'N/A'}</div>
    <div class="mb-2"><strong>Ubicación:</strong> ${providerB.location || 'N/A'}</div>
    <div class="mb-2"><strong>Comisión:</strong> ${providerB.commission_rate ? providerB.commission_rate + '%' : 'N/A'}</div>
    <div class="mb-2"><strong>Tiempo de Entrega:</strong> ${providerB.delivery_time_days ? providerB.delivery_time_days + ' días' : 'N/A'}</div>
    <div class="mb-2"><strong>Zonas:</strong> ${providerB.zones || 'N/A'}</div>
    <div class="mb-2"><strong>Estado:</strong> <span class="badge ${providerB.status === 'active' ? 'bg-success' : 'bg-secondary'}">${providerB.status === 'active' ? 'Activo' : 'Inactivo'}</span></div>
  `;
}

/**
 * Display metrics
 */
function displayMetrics() {
  const metricsContainer = document.getElementById('metrics-comparison');
  
  // Calculate metrics
  const avgPriceA = calculateAveragePrice(providerAProducts);
  const avgPriceB = calculateAveragePrice(providerBProducts);
  
  const avgMarginA = calculateAverageMargin(providerAProducts);
  const avgMarginB = calculateAverageMargin(providerBProducts);
  
  const commissionA = providerA.commission_rate || 0;
  const commissionB = providerB.commission_rate || 0;
  
  const deliveryA = providerA.delivery_time_days || 0;
  const deliveryB = providerB.delivery_time_days || 0;
  
  metricsContainer.innerHTML = `
    <div class="col-md-3">
      <div class="metric-card">
        <div class="metric-label">Precio Promedio</div>
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <div class="metric-value ${avgPriceA < avgPriceB ? 'better' : avgPriceA > avgPriceB ? 'worse' : ''}">${formatCurrency(avgPriceA)}</div>
            <small class="text-muted">${providerA.name}</small>
          </div>
          <div class="text-end">
            <div class="metric-value ${avgPriceB < avgPriceA ? 'better' : avgPriceB > avgPriceA ? 'worse' : ''}">${formatCurrency(avgPriceB)}</div>
            <small class="text-muted">${providerB.name}</small>
          </div>
        </div>
      </div>
    </div>
    
    <div class="col-md-3">
      <div class="metric-card">
        <div class="metric-label">Margen Promedio</div>
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <div class="metric-value ${avgMarginA > avgMarginB ? 'better' : avgMarginA < avgMarginB ? 'worse' : ''}">${avgMarginA.toFixed(1)}%</div>
            <small class="text-muted">${providerA.name}</small>
          </div>
          <div class="text-end">
            <div class="metric-value ${avgMarginB > avgMarginA ? 'better' : avgMarginB < avgMarginA ? 'worse' : ''}">${avgMarginB.toFixed(1)}%</div>
            <small class="text-muted">${providerB.name}</small>
          </div>
        </div>
      </div>
    </div>
    
    <div class="col-md-3">
      <div class="metric-card">
        <div class="metric-label">Comisión</div>
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <div class="metric-value ${commissionA < commissionB ? 'better' : commissionA > commissionB ? 'worse' : ''}">${commissionA}%</div>
            <small class="text-muted">${providerA.name}</small>
          </div>
          <div class="text-end">
            <div class="metric-value ${commissionB < commissionA ? 'better' : commissionB > commissionA ? 'worse' : ''}">${commissionB}%</div>
            <small class="text-muted">${providerB.name}</small>
          </div>
        </div>
      </div>
    </div>
    
    <div class="col-md-3">
      <div class="metric-card">
        <div class="metric-label">Tiempo de Entrega</div>
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <div class="metric-value ${deliveryA < deliveryB ? 'better' : deliveryA > deliveryB ? 'worse' : ''}">${deliveryA} días</div>
            <small class="text-muted">${providerA.name}</small>
          </div>
          <div class="text-end">
            <div class="metric-value ${deliveryB < deliveryA ? 'better' : deliveryB > deliveryA ? 'worse' : ''}">${deliveryB} días</div>
            <small class="text-muted">${providerB.name}</small>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Calculate average price
 */
function calculateAveragePrice(products) {
  if (products.length === 0) return 0;
  const total = products.reduce((sum, p) => sum + (p.cogs || 0), 0);
  return total / products.length;
}

/**
 * Calculate average margin
 */
function calculateAverageMargin(products) {
  if (products.length === 0) return 0;
  // This is a simplified calculation - adjust based on your actual data structure
  return 25; // Placeholder
}

/**
 * Display price history chart
 */
function displayPriceHistory() {
  const ctx = document.getElementById('price-history-chart');
  
  if (priceHistoryChart) {
    priceHistoryChart.destroy();
  }
  
  // Generate sample data - replace with actual historical data
  const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  const dataA = [100, 105, 103, 108, 110, 107];
  const dataB = [98, 102, 100, 105, 108, 106];
  
  priceHistoryChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: providerA.name,
          data: dataA,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4
        },
        {
          label: providerB.name,
          data: dataB,
          borderColor: '#764ba2',
          backgroundColor: 'rgba(118, 75, 162, 0.1)',
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      }
    }
  });
}

/**
 * Display products comparison
 */
function displayProductsComparison() {
  const container = document.getElementById('products-comparison');
  
  if (providerAProducts.length === 0 && providerBProducts.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted py-4">
        <i class="bi bi-inbox fs-1"></i>
        <p class="mt-2">No hay productos para comparar</p>
      </div>
    `;
    return;
  }
  
  let html = '<div class="row g-3">';
  
  // Display products from provider A
  html += '<div class="col-md-6"><h6 class="mb-3">' + providerA.name + ' (' + providerAProducts.length + ' productos)</h6>';
  providerAProducts.slice(0, 10).forEach(product => {
    html += `
      <div class="product-comparison-item">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <div class="fw-semibold">${product.name}</div>
            <small class="text-muted">SKU: ${product.sku}</small>
          </div>
          <div class="text-end">
            <div class="fw-bold">${formatCurrency(product.cogs || 0)}</div>
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  
  // Display products from provider B
  html += '<div class="col-md-6"><h6 class="mb-3">' + providerB.name + ' (' + providerBProducts.length + ' productos)</h6>';
  providerBProducts.slice(0, 10).forEach(product => {
    html += `
      <div class="product-comparison-item">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <div class="fw-semibold">${product.name}</div>
            <small class="text-muted">SKU: ${product.sku}</small>
          </div>
          <div class="text-end">
            <div class="fw-bold">${formatCurrency(product.cogs || 0)}</div>
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  
  html += '</div>';
  container.innerHTML = html;
}

/**
 * Display detailed comparison table
 */
function displayDetailedComparison() {
  const tbody = document.getElementById('detailed-comparison-body');
  
  const comparisons = [
    {
      metric: 'Número de Productos',
      valueA: providerAProducts.length,
      valueB: providerBProducts.length,
      better: providerAProducts.length > providerBProducts.length ? 'A' : providerBProducts.length > providerAProducts.length ? 'B' : 'Empate'
    },
    {
      metric: 'Precio Promedio',
      valueA: formatCurrency(calculateAveragePrice(providerAProducts)),
      valueB: formatCurrency(calculateAveragePrice(providerBProducts)),
      better: calculateAveragePrice(providerAProducts) < calculateAveragePrice(providerBProducts) ? 'A' : calculateAveragePrice(providerBProducts) < calculateAveragePrice(providerAProducts) ? 'B' : 'Empate'
    },
    {
      metric: 'Comisión',
      valueA: (providerA.commission_rate || 0) + '%',
      valueB: (providerB.commission_rate || 0) + '%',
      better: (providerA.commission_rate || 0) < (providerB.commission_rate || 0) ? 'A' : (providerB.commission_rate || 0) < (providerA.commission_rate || 0) ? 'B' : 'Empate'
    },
    {
      metric: 'Tiempo de Entrega',
      valueA: (providerA.delivery_time_days || 0) + ' días',
      valueB: (providerB.delivery_time_days || 0) + ' días',
      better: (providerA.delivery_time_days || 0) < (providerB.delivery_time_days || 0) ? 'A' : (providerB.delivery_time_days || 0) < (providerA.delivery_time_days || 0) ? 'B' : 'Empate'
    },
    {
      metric: 'Ciudad',
      valueA: providerA.city || 'N/A',
      valueB: providerB.city || 'N/A',
      better: '-'
    },
    {
      metric: 'Estado',
      valueA: providerA.status === 'active' ? 'Activo' : 'Inactivo',
      valueB: providerB.status === 'active' ? 'Activo' : 'Inactivo',
      better: providerA.status === 'active' && providerB.status !== 'active' ? 'A' : providerB.status === 'active' && providerA.status !== 'active' ? 'B' : 'Empate'
    }
  ];
  
  tbody.innerHTML = comparisons.map(comp => `
    <tr>
      <td><strong>${comp.metric}</strong></td>
      <td>${comp.valueA}</td>
      <td>${comp.valueB}</td>
      <td>
        ${comp.better === 'A' ? `<span class="winner-badge">${providerA.name}</span>` : 
          comp.better === 'B' ? `<span class="winner-badge">${providerB.name}</span>` : 
          comp.better === 'Empate' ? '<span class="badge bg-secondary">Empate</span>' : 
          '<span class="text-muted">-</span>'}
      </td>
    </tr>
  `).join('');
}

/**
 * Filter products
 */
function filterProducts(searchTerm) {
  // Implement product filtering logic
  displayProductsComparison();
}

/**
 * Clear comparison
 */
function clearComparison() {
  document.getElementById('provider-a-select').value = '';
  document.getElementById('provider-b-select').value = '';
  document.getElementById('comparison-results').style.display = 'none';
  document.getElementById('empty-state').style.display = 'block';
  document.getElementById('compare-btn').disabled = true;
  document.getElementById('export-comparison-btn').disabled = true;
  
  providerA = null;
  providerB = null;
  providerAProducts = [];
  providerBProducts = [];
  
  if (priceHistoryChart) {
    priceHistoryChart.destroy();
    priceHistoryChart = null;
  }
}

/**
 * Export comparison
 */
function exportComparison() {
  if (!providerA || !providerB) {
    showToast('No hay comparación para exportar', 'warning');
    return;
  }
  
  const exportData = [
    {
      Métrica: 'Nombre',
      [providerA.name]: providerA.name,
      [providerB.name]: providerB.name
    },
    {
      Métrica: 'RUC',
      [providerA.name]: providerA.ruc || 'N/A',
      [providerB.name]: providerB.ruc || 'N/A'
    },
    {
      Métrica: 'Ciudad',
      [providerA.name]: providerA.city || 'N/A',
      [providerB.name]: providerB.city || 'N/A'
    },
    {
      Métrica: 'Comisión (%)',
      [providerA.name]: providerA.commission_rate || 0,
      [providerB.name]: providerB.commission_rate || 0
    },
    {
      Métrica: 'Tiempo de Entrega (días)',
      [providerA.name]: providerA.delivery_time_days || 0,
      [providerB.name]: providerB.delivery_time_days || 0
    },
    {
      Métrica: 'Número de Productos',
      [providerA.name]: providerAProducts.length,
      [providerB.name]: providerBProducts.length
    },
    {
      Métrica: 'Precio Promedio',
      [providerA.name]: calculateAveragePrice(providerAProducts).toFixed(2),
      [providerB.name]: calculateAveragePrice(providerBProducts).toFixed(2)
    }
  ];
  
  exportToCSV(exportData, `comparacion_${providerA.name}_vs_${providerB.name}_${new Date().toISOString().split('T')[0]}.csv`);
  showToast('Comparación exportada exitosamente', 'success');
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
