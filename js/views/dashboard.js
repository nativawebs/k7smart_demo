/**
 * Dashboard View
 * Handles dashboard page logic and charts
 */

import state from '../modules/state.js';
import * as api from '../modules/api.js';
import * as charts from '../modules/charts.js';
import { formatCurrency, formatNumber, formatPercentage, showLoading, hideLoading } from '../modules/utils.js';
import { signOut, getCurrentUser, initSupabase } from '../modules/auth.js';

// Chart instances
let salesMarginChart = null;
let topCategoriesChart = null;
let topProvidersChart = null;

/**
 * Initialize dashboard
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
    
    // Update UI based on state
    updateDummyUI();
    
    // Load dashboard data
    await loadDashboard();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
  } catch (error) {
    console.error('Error initializing dashboard:', error);
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
    updateChartsTheme();
  });
  
  // Update dark mode icon on load
  updateDarkModeIcon(state.getState().darkMode);
  
  // Dummy mode toggle
  const toggleDummyBtn = document.getElementById('toggle-dummy-btn');
  toggleDummyBtn?.addEventListener('click', async () => {
    const isDummy = state.toggleDummyMode();
    updateDummyUI();
    await loadDashboard();
  });
  
  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    await signOut();
  });
  
  // Subscribe to dummy mode changes
  state.subscribe('dummyMode', (newValue) => {
    updateDummyUI();
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
 * Update dummy mode UI
 */
function updateDummyUI() {
  const isDummy = state.getState().dummyMode;
  const badge = document.getElementById('dummy-badge');
  const btnText = document.getElementById('dummy-btn-text');
  
  if (badge) {
    badge.style.display = isDummy ? 'flex' : 'none';
  }
  
  if (btnText) {
    btnText.textContent = isDummy ? 'Activar Datos Reales' : 'Activar Modo Dummy';
  }
}

/**
 * Load dashboard data
 */
async function loadDashboard() {
  showLoading('Cargando dashboard...');
  
  try {
    // Load KPIs
    await loadKPIs();
    
    // Load charts
    await loadCharts();
    
    hideLoading();
  } catch (error) {
    console.error('Error loading dashboard:', error);
    hideLoading();
  }
}

/**
 * Load KPIs
 */
async function loadKPIs() {
  try {
    const result = await api.getKPIs();
    
    if (result.success && result.data) {
      const kpis = result.data;
      
      // Sales
      updateKPI('sales', kpis.sales.value, kpis.sales.change, 'currency');
      
      // AOV
      updateKPI('aov', kpis.aov.value, kpis.aov.change, 'currency');
      
      // Margin
      updateKPI('margin', kpis.margin.value, kpis.margin.change, 'percentage');
      
      // ROAS
      updateKPI('roas', kpis.roas.value, kpis.roas.change, 'multiplier');
      
      // Conversion
      updateKPI('conversion', kpis.conversion.value, kpis.conversion.change, 'percentage');
    }
  } catch (error) {
    console.error('Error loading KPIs:', error);
  }
}

/**
 * Update KPI card
 */
function updateKPI(name, value, change, format) {
  const valueEl = document.getElementById(`kpi-${name}`);
  const changeEl = document.getElementById(`kpi-${name}-change`);
  
  if (valueEl) {
    if (format === 'currency') {
      valueEl.textContent = formatCurrency(value);
    } else if (format === 'percentage') {
      valueEl.textContent = formatPercentage(value, 1);
    } else if (format === 'multiplier') {
      valueEl.textContent = formatNumber(value, 2) + 'x';
    } else {
      valueEl.textContent = formatNumber(value);
    }
  }
  
  if (changeEl) {
    const isPositive = change >= 0;
    changeEl.className = `kpi-change ${isPositive ? 'positive' : 'negative'}`;
    changeEl.innerHTML = `
      <i class="bi bi-arrow-${isPositive ? 'up' : 'down'}"></i>
      <span>${formatPercentage(Math.abs(change), 1)}</span>
    `;
  }
}

/**
 * Load charts
 */
async function loadCharts() {
  try {
    // Sales vs Margin
    const salesResult = await api.getSalesDaily(30);
    if (salesResult.success && salesResult.data) {
      updateSalesMarginChart(salesResult.data);
    }
    
    // Top Categories
    const categoriesResult = await api.getTopCategories(5);
    if (categoriesResult.success && categoriesResult.data) {
      updateTopCategoriesChart(categoriesResult.data);
    }
    
    // Top Providers
    const providersResult = await api.getTopProviders(5);
    if (providersResult.success && providersResult.data) {
      updateTopProvidersChart(providersResult.data);
    }
  } catch (error) {
    console.error('Error loading charts:', error);
  }
}

/**
 * Update sales vs margin chart
 */
function updateSalesMarginChart(data) {
  const chartData = charts.prepareSalesMarginData(data);
  
  if (salesMarginChart) {
    charts.updateChart(salesMarginChart, chartData);
  } else {
    salesMarginChart = charts.createLineChart('sales-margin-chart', chartData, {
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += formatCurrency(context.parsed.y);
              return label;
            }
          }
        }
      }
    });
  }
}

/**
 * Update top categories chart
 */
function updateTopCategoriesChart(data) {
  const chartData = charts.prepareTopCategoriesData(data);
  
  if (topCategoriesChart) {
    charts.updateChart(topCategoriesChart, chartData);
  } else {
    topCategoriesChart = charts.createBarChart('top-categories-chart', chartData, {
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += formatCurrency(context.parsed.y);
              return label;
            }
          }
        }
      }
    });
  }
}

/**
 * Update top providers chart
 */
function updateTopProvidersChart(data) {
  const chartData = charts.prepareTopProvidersData(data);
  
  if (topProvidersChart) {
    charts.updateChart(topProvidersChart, chartData);
  } else {
    topProvidersChart = charts.createBarChart('top-providers-chart', chartData, {
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return 'Margen: ' + formatCurrency(context.parsed.x);
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            callback: function(value) {
              return formatCurrency(value, 0);
            }
          }
        }
      }
    });
  }
}

/**
 * Update charts theme
 */
function updateChartsTheme() {
  if (salesMarginChart) {
    charts.updateChartTheme(salesMarginChart);
  }
  if (topCategoriesChart) {
    charts.updateChartTheme(topCategoriesChart);
  }
  if (topProvidersChart) {
    charts.updateChartTheme(topProvidersChart);
  }
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  let keys = {};
  
  document.addEventListener('keydown', (e) => {
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
