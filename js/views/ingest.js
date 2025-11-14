/**
 * Ingest View
 */
import state from '../modules/state.js';
import * as api from '../modules/api.js';
import { showToast, showLoading, hideLoading, parseCSV, formatDate, formatFileSize, exportToCSV } from '../modules/utils.js';
import { signOut, getCurrentUser, initSupabase } from '../modules/auth.js';

let selectedFile = null;
let previewData = null;

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
    await loadHistory();
  } catch (error) {
    console.error('Error initializing ingest:', error);
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
  
  document.getElementById('file-input')?.addEventListener('change', handleFileSelect);
  document.getElementById('preview-btn')?.addEventListener('click', showPreview);
  document.getElementById('upload-btn')?.addEventListener('click', uploadFile);
  
  document.getElementById('download-providers-template')?.addEventListener('click', () => downloadTemplate('providers'));
  document.getElementById('download-products-template')?.addEventListener('click', () => downloadTemplate('products'));
  document.getElementById('download-prices-template')?.addEventListener('click', () => downloadTemplate('prices'));
  document.getElementById('download-categories-template')?.addEventListener('click', () => downloadTemplate('categories'));
  
  state.subscribe('dummyMode', () => {
    updateDummyUI();
    loadHistory();
  });
}

function updateDummyUI() {
  const isDummy = state.getState().dummyMode;
  const badge = document.getElementById('dummy-badge');
  if (badge) badge.style.display = isDummy ? 'flex' : 'none';
}

function handleFileSelect(e) {
  selectedFile = e.target.files[0];
  
  if (selectedFile) {
    if (selectedFile.size > 10 * 1024 * 1024) {
      showToast('El archivo es demasiado grande (máx 10MB)', 'warning');
      selectedFile = null;
      e.target.value = '';
      return;
    }
    
    document.getElementById('preview-btn').disabled = false;
    document.getElementById('upload-btn').disabled = false;
    showToast(`Archivo seleccionado: ${selectedFile.name} (${formatFileSize(selectedFile.size)})`, 'info');
  } else {
    document.getElementById('preview-btn').disabled = true;
    document.getElementById('upload-btn').disabled = true;
  }
}

async function showPreview() {
  if (!selectedFile) return;
  
  const fileType = selectedFile.name.split('.').pop().toLowerCase();
  
  if (fileType === 'csv') {
    const text = await selectedFile.text();
    const parsed = parseCSV(text);
    previewData = parsed;
    
    const previewHead = document.getElementById('preview-head');
    const previewBody = document.getElementById('preview-body');
    
    previewHead.innerHTML = '<tr>' + parsed.headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    previewBody.innerHTML = parsed.rows.slice(0, 5).map(row => 
      '<tr>' + parsed.headers.map(h => `<td>${row[h] || ''}</td>`).join('') + '</tr>'
    ).join('');
    
    document.getElementById('preview-container').style.display = 'block';
    showToast(`Vista previa: ${parsed.rows.length} filas`, 'success');
  } else if (fileType === 'json') {
    const text = await selectedFile.text();
    try {
      const data = JSON.parse(text);
      previewData = Array.isArray(data) ? data : [data];
      showToast(`JSON válido: ${previewData.length} registros`, 'success');
    } catch (error) {
      showToast('JSON inválido', 'error');
    }
  } else {
    showToast('Vista previa no disponible para PDF', 'info');
  }
}

async function uploadFile() {
  if (!selectedFile) return;
  
  const targetTable = document.getElementById('target-table').value;
  const notes = document.getElementById('notes-input').value;
  
  showLoading('Subiendo archivo...');
  
  const uploadResult = await api.uploadIngestFile(selectedFile, targetTable);
  
  if (!uploadResult.success) {
    hideLoading();
    return;
  }
  
  const user = state.getUser();
  const fileType = selectedFile.name.split('.').pop().toLowerCase();
  
  await api.createIngestRecord({
    filename: selectedFile.name,
    filetype: fileType,
    file_url: uploadResult.data.url,
    target_table: targetTable,
    status: 'pending',
    uploaded_by: user?.id,
    notes
  });
  
  const webhookResult = await api.triggerN8nIngest(
    uploadResult.data.url,
    fileType,
    targetTable,
    user?.id
  );
  
  hideLoading();
  
  if (webhookResult.success) {
    showToast('Archivo enviado a procesamiento', 'success');
    document.getElementById('file-input').value = '';
    document.getElementById('notes-input').value = '';
    selectedFile = null;
    document.getElementById('preview-btn').disabled = true;
    document.getElementById('upload-btn').disabled = true;
    document.getElementById('preview-container').style.display = 'none';
    await loadHistory();
  }
}

async function loadHistory() {
  const tbody = document.getElementById('history-table-body');
  tbody.innerHTML = '<tr><td colspan="6" class="text-center py-5"><div class="spinner-border text-primary"></div></td></tr>';
  
  const result = await api.getIngestHistory({ page: 1, limit: 20 });
  
  if (result.success) {
    renderHistory(result.data);
  }
}

function renderHistory(history) {
  const tbody = document.getElementById('history-table-body');
  
  if (history.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-5 text-muted"><i class="bi bi-inbox fs-1"></i><p class="mt-2">No hay cargas registradas</p></td></tr>';
    return;
  }
  
  tbody.innerHTML = history.map(h => `
    <tr>
      <td><i class="bi bi-file-earmark-${h.filetype} me-2"></i>${h.filename}</td>
      <td><span class="badge bg-secondary">${h.filetype.toUpperCase()}</span></td>
      <td><code>${h.target_table}</code></td>
      <td>
        <span class="badge ${
          h.status === 'processed' ? 'bg-success' : 
          h.status === 'error' ? 'bg-danger' : 
          'bg-warning'
        }">
          ${h.status === 'processed' ? 'Procesado' : h.status === 'error' ? 'Error' : 'Pendiente'}
        </span>
      </td>
      <td><small>${formatDate(h.created_at, 'datetime')}</small></td>
      <td>
        ${h.file_url ? `<a href="${h.file_url}" target="_blank" class="btn btn-sm btn-outline-primary" title="Ver archivo"><i class="bi bi-download"></i></a>` : ''}
        ${h.log_url ? `<a href="${h.log_url}" target="_blank" class="btn btn-sm btn-outline-secondary" title="Ver log"><i class="bi bi-file-text"></i></a>` : ''}
      </td>
    </tr>
  `).join('');
}

function downloadTemplate(type) {
  const templates = {
    providers: [
      { name: 'Ejemplo SA', ruc: '210000000018', email: 'ventas@ejemplo.com', phone: '+598 2900 0000', commission_rate: '10', zones: 'Montevideo', shipping_cost_policy: 'Gratis sobre $2000', status: 'active' }
    ],
    products: [
      { sku: 'PROD-001', name: 'Producto Ejemplo', category_slug: 'categoria-ejemplo', default_provider_ruc: '210000000018', cogs: '100', notes: 'Notas del producto' }
    ],
    prices: [
      { sku: 'PROD-001', provider_ruc: '210000000018', date: '2025-01-01', price_net: '150', tax_rate: '0.15', cogs: '100', shipping_cost: '5' }
    ],
    categories: [
      { name: 'Categoría Ejemplo', slug: 'categoria-ejemplo', parent_slug: '', active: 'true' }
    ]
  };
  
  const data = templates[type];
  if (data) {
    exportToCSV(data, `plantilla_${type}.csv`);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
