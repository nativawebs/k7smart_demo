/**
 * Settings View
 */
import state from '../modules/state.js';
import * as api from '../modules/api.js';
import { showToast, showLoading, hideLoading } from '../modules/utils.js';
import { signOut, getCurrentUser, initSupabase } from '../modules/auth.js';

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
    await loadSettings();
  } catch (error) {
    console.error('Error initializing settings:', error);
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
  
  document.getElementById('save-tax-btn')?.addEventListener('click', saveTaxRate);
  document.getElementById('save-dummy-btn')?.addEventListener('click', saveDummyMode);
  document.getElementById('save-webhook-btn')?.addEventListener('click', saveWebhook);
  document.getElementById('test-webhook-btn')?.addEventListener('click', testWebhook);
  document.getElementById('save-placetopay-btn')?.addEventListener('click', savePlacetoPay);
  
  state.subscribe('dummyMode', () => {
    updateDummyUI();
  });
}

function updateDummyUI() {
  const isDummy = state.getState().dummyMode;
  const badge = document.getElementById('dummy-badge');
  const dummySwitch = document.getElementById('dummy-mode-switch');
  
  if (badge) badge.style.display = isDummy ? 'flex' : 'none';
  if (dummySwitch) dummySwitch.checked = isDummy;
}

async function loadSettings() {
  showLoading('Cargando configuración...');
  
  const result = await api.getSettings();
  
  hideLoading();
  
  if (result.success && result.data) {
    const settings = result.data;
    
    // Tax rate
    if (settings.tax_rate?.value !== undefined) {
      document.getElementById('tax-rate').value = settings.tax_rate.value * 100;
    }
    
    // Dummy mode
    if (settings.dummy_mode?.enabled !== undefined) {
      document.getElementById('dummy-mode-switch').checked = settings.dummy_mode.enabled;
      state.setDummyMode(settings.dummy_mode.enabled);
    }
    
    // n8n webhook
    if (settings.n8n_webhook?.url) {
      document.getElementById('n8n-webhook').value = settings.n8n_webhook.url;
    }
    
    // PlacetoPay
    if (settings.placetopay_login?.value) {
      document.getElementById('placetopay-login').value = settings.placetopay_login.value;
    }
    if (settings.placetopay_trankey?.value) {
      document.getElementById('placetopay-trankey').value = settings.placetopay_trankey.value;
    }
    
    // Store in state
    state.setSettings(settings);
  }
}

async function saveTaxRate() {
  const taxRate = parseFloat(document.getElementById('tax-rate').value) / 100;
  
  if (isNaN(taxRate) || taxRate < 0 || taxRate > 1) {
    showToast('IVA inválido (debe estar entre 0 y 100)', 'warning');
    return;
  }
  
  showLoading('Guardando...');
  
  const result = await api.saveSettings({
    tax_rate: { value: taxRate, label: 'IVA' }
  });
  
  hideLoading();
  
  if (result.success) {
    state.updateSetting('tax_rate', { value: taxRate, label: 'IVA' });
    showToast('IVA guardado correctamente', 'success');
  }
}

async function saveDummyMode() {
  const enabled = document.getElementById('dummy-mode-switch').checked;
  
  showLoading('Guardando...');
  
  const result = await api.saveSettings({
    dummy_mode: { enabled }
  });
  
  hideLoading();
  
  if (result.success) {
    state.setDummyMode(enabled);
    state.updateSetting('dummy_mode', { enabled });
    showToast('Modo dummy guardado correctamente', 'success');
  }
}

async function saveWebhook() {
  const url = document.getElementById('n8n-webhook').value.trim();
  
  if (url && !url.startsWith('http')) {
    showToast('URL inválida (debe comenzar con http:// o https://)', 'warning');
    return;
  }
  
  showLoading('Guardando...');
  
  const result = await api.saveSettings({
    n8n_webhook: { url }
  });
  
  hideLoading();
  
  if (result.success) {
    state.updateSetting('n8n_webhook', { url });
    showToast('Webhook guardado correctamente', 'success');
  }
}

async function testWebhook() {
  const url = document.getElementById('n8n-webhook').value.trim();
  
  if (!url) {
    showToast('Ingresa una URL de webhook primero', 'warning');
    return;
  }
  
  showLoading('Probando conexión...');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Test ping from Kiosko7 Admin'
      })
    });
    
    hideLoading();
    
    if (response.ok) {
      showToast('Conexión exitosa con n8n', 'success');
    } else {
      showToast(`Error: HTTP ${response.status}`, 'error');
    }
  } catch (error) {
    hideLoading();
    console.error('Webhook test error:', error);
    showToast('Error al conectar con n8n', 'error');
  }
}

async function savePlacetoPay() {
  const login = document.getElementById('placetopay-login').value.trim();
  const trankey = document.getElementById('placetopay-trankey').value.trim();
  
  showLoading('Guardando...');
  
  const result = await api.saveSettings({
    placetopay_login: { value: login },
    placetopay_trankey: { value: trankey }
  });
  
  hideLoading();
  
  if (result.success) {
    state.updateSetting('placetopay_login', { value: login });
    state.updateSetting('placetopay_trankey', { value: trankey });
    showToast('Credenciales PlacetoPay guardadas', 'success');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
