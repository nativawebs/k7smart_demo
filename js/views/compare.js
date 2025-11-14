/**
 * Compare View
 */
import state from '../modules/state.js';
import * as api from '../modules/api.js';
import * as charts from '../modules/charts.js';
import { formatCurrency, formatPercentage, showLoading, hideLoading, exportToCSV } from '../modules/utils.js';
import { signOut, getCurrentUser, initSupabase } from '../modules/auth.js';

let marginChart = null;
let priceSeriesChart = null;
let marginSeriesChart = null;

async function init() {
  try {
    try {
      const configModule = await import('../config.js');
      if (configModule.config) initSupabase(configModule.config.supabaseUrl, configModule.config.supabaseAnonKey);
    } catch (e) {}
    
    const user = await getCurrentUser();
    if (user) document.getElementById('user-email').textContent = user.email;
    
    setupEventListeners();
    updateDummyUI();
    await loadFilters();
    setDefaultDates();
  } catch (error) {
    console.error('Error initializing compare:', error);
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
    updateChartsTheme();
  });
  
  document.getElementById('logout-btn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await signOut();
  });
  
  document.getElementById('compare-btn')?.addEventListener('click', loadComparison);
  document.getElementById('export-last-btn')?.addEventListener('click', exportLastPrice);
  document.getElementById('export-series-btn')?.addEventListener('click', exportTimeSeries);
  
  state.subscribe('dummyMode', () => {
    updateDummyUI();
  });
}

function updateDummyUI() {
  const isDummy = state.getState().dummyMode;
  const badge = document.getElementById('dummy-badge');
  if (badge) badge.style.display = isDummy ? 'flex' : 'none';
}

async function loadFilters() {
  const categoriesResult = await api.getAllCategories();
  if (categoriesResult.success) {
    const select = document.getElementById('category-select');
    select.innerHTML += categoriesResult.data.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
  
  const providersResult = await api.getProviders({ page: 1, limit: 100 });
  if (providersResult.success) {
    const select = document.getElementById('providers-select');
    select.innerHTML = providersResult.data.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }
}

function setDefaultDates() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  document.getElementById('date-to').value = today.toISOString().split('T')[0];
  document.getElementById('date-from').value = thirtyDaysAgo.toISOString().split('T')[0];
}

async function loadComparison() {
  const categoryId = document.getElementById('category-select').value;
  const providersSelect = document.getElementById('providers-select');
  const providerIds = Array.from(providersSelect.selectedOptions).map(o => o.value);
  const dateFrom = document.getElementById('date-from').value;
  const dateTo = document.getElementById('date-to').value;
  
  if (providerIds.length === 0) {
    showToast('Selecciona al menos un proveedor', 'warning');
    return;
  }
  
  showLoading('Cargando comparativa...');
  
  const result = await api.getComparative({ categoryId, providerIds, dateFrom, dateTo });
  
  hideLoading();
  
  if (result.success && result.data) {
    renderLastPrice(result.data.lastPrices);
    renderTimeSeries(result.data.timeSeries);
  }
}

function renderLastPrice(data) {
  const tbody = document.getElementById('last-price-table');
  tbody.innerHTML = data.map(p => `
    <tr>
      <td>${p.provider}</td>
      <td>${formatCurrency(p.price_net)}</td>
      <td>${formatCurrency(p.price_gross)}</td>
      <td><span class="badge ${p.margin > 20 ? 'bg-success' : p.margin > 10 ? 'bg-warning' : 'bg-danger'}">${formatPercentage(p.margin, 1)}</span></td>
    </tr>
  `).join('');
  
  const chartData = charts.prepareMarginComparisonData(data);
  if (marginChart) {
    charts.updateChart(marginChart, chartData);
  } else {
    marginChart = charts.createBarChart('margin-comparison-chart', chartData, {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => 'Margen: ' + formatPercentage(context.parsed.y, 1)
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => value + '%'
          }
        }
      }
    });
  }
}

function renderTimeSeries(data) {
  const priceData = charts.prepareTimeSeriesData(data, 'price_net');
  const marginData = charts.prepareTimeSeriesData(data, 'margin');
  
  if (priceSeriesChart) {
    charts.updateChart(priceSeriesChart, priceData);
  } else {
    priceSeriesChart = charts.createLineChart('price-series-chart', priceData);
  }
  
  if (marginSeriesChart) {
    charts.updateChart(marginSeriesChart, marginData);
  } else {
    marginSeriesChart = charts.createLineChart('margin-series-chart', marginData, {
      scales: {
        y: {
          ticks: {
            callback: (value) => value + '%'
          }
        }
      }
    });
  }
}

function updateChartsTheme() {
  if (marginChart) charts.updateChartTheme(marginChart);
  if (priceSeriesChart) charts.updateChartTheme(priceSeriesChart);
  if (marginSeriesChart) charts.updateChartTheme(marginSeriesChart);
}

function exportLastPrice() {
  const tbody = document.getElementById('last-price-table');
  if (!tbody || tbody.children.length === 0) {
    showToast('No hay datos para exportar', 'warning');
    return;
  }
  
  const data = Array.from(tbody.children).map(row => {
    const cells = row.children;
    return {
      Proveedor: cells[0].textContent,
      'Precio Neto': cells[1].textContent,
      'Precio Bruto': cells[2].textContent,
      'Margen %': cells[3].textContent
    };
  });
  
  exportToCSV(data, `comparativa_ultimo_precio_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportTimeSeries() {
  showToast('Exportación de serie temporal disponible próximamente', 'info');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
