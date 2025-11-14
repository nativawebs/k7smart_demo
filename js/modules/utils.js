/**
 * Utility Functions Module
 * Common helper functions used across the application
 */

/**
 * Debounce function - delays execution until after wait time
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format currency
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format number
 */
export function formatNumber(number, decimals = 0) {
  return new Intl.NumberFormat('es-UY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
}

/**
 * Format percentage
 */
export function formatPercentage(value, decimals = 2) {
  return `${formatNumber(value, decimals)}%`;
}

/**
 * Format date
 */
export function formatDate(date, format = 'short') {
  const d = new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString('es-UY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } else if (format === 'long') {
    return d.toLocaleDateString('es-UY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } else if (format === 'datetime') {
    return d.toLocaleString('es-UY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return d.toLocaleDateString('es-UY');
}

/**
 * Format relative time (e.g., "hace 2 horas")
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'hace unos segundos';
  if (diffMins < 60) return `hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  
  return formatDate(date);
}

/**
 * Show toast notification
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toastContainer = document.getElementById('toast-container') || createToastContainer();
  
  const toastId = `toast-${Date.now()}`;
  const iconMap = {
    success: 'bi-check-circle-fill',
    error: 'bi-x-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill'
  };
  
  const bgMap = {
    success: 'bg-success',
    error: 'bg-danger',
    warning: 'bg-warning',
    info: 'bg-info'
  };
  
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = 'toast align-items-center text-white border-0';
  toast.classList.add(bgMap[type] || bgMap.info);
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi ${iconMap[type] || iconMap.info} me-2"></i>
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  const bsToast = new bootstrap.Toast(toast, { delay: duration });
  bsToast.show();
  
  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
}

/**
 * Create toast container if it doesn't exist
 */
function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container position-fixed top-0 end-0 p-3';
  container.style.zIndex = '9999';
  document.body.appendChild(container);
  return container;
}

/**
 * Show loading spinner
 */
export function showLoading(message = 'Cargando...') {
  const existing = document.getElementById('loading-overlay');
  if (existing) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.className = 'spinner-overlay';
  overlay.innerHTML = `
    <div class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">${message}</span>
      </div>
      <div class="mt-3 text-white">${message}</div>
    </div>
  `;
  
  document.body.appendChild(overlay);
}

/**
 * Hide loading spinner
 */
export function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.remove();
  }
}

/**
 * Confirm dialog
 */
export function confirm(message, title = 'Confirmar') {
  return new Promise((resolve) => {
    const modalId = `confirm-modal-${Date.now()}`;
    
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal fade';
    modal.setAttribute('tabindex', '-1');
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>${message}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="${modalId}-confirm">Confirmar</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    document.getElementById(`${modalId}-confirm`).addEventListener('click', () => {
      bsModal.hide();
      resolve(true);
    });
    
    modal.addEventListener('hidden.bs.modal', () => {
      if (!modal.dataset.confirmed) {
        resolve(false);
      }
      modal.remove();
    });
    
    document.getElementById(`${modalId}-confirm`).addEventListener('click', () => {
      modal.dataset.confirmed = 'true';
    });
  });
}

/**
 * Validate email
 */
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate RUC (Uruguay)
 */
export function validateRUC(ruc) {
  // Basic validation: 12 digits
  const re = /^\d{12}$/;
  return re.test(ruc);
}

/**
 * Validate phone
 */
export function validatePhone(phone) {
  // Basic validation: at least 8 digits
  const re = /^\+?[\d\s-]{8,}$/;
  return re.test(phone);
}

/**
 * Sanitize HTML
 */
export function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

/**
 * Parse CSV
 */
export function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
  
  return { headers, rows };
}

/**
 * Export to CSV
 */
export function exportToCSV(data, filename = 'export.csv') {
  if (!data || data.length === 0) {
    showToast('No hay datos para exportar', 'warning');
    return;
  }
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header] ?? '';
      // Escape commas and quotes
      return typeof value === 'string' && (value.includes(',') || value.includes('"'))
        ? `"${value.replace(/"/g, '""')}"`
        : value;
    }).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast('Archivo exportado exitosamente', 'success');
}

/**
 * Calculate margin
 */
export function calculateMargin(priceNet, cogs, shippingCost = 0) {
  const totalCost = parseFloat(cogs) + parseFloat(shippingCost);
  const price = parseFloat(priceNet);
  
  if (price === 0) return 0;
  
  return ((price - totalCost) / price) * 100;
}

/**
 * Calculate price with tax
 */
export function calculatePriceWithTax(priceNet, taxRate) {
  return parseFloat(priceNet) * (1 + parseFloat(taxRate));
}

/**
 * Get query params
 */
export function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

/**
 * Set query params
 */
export function setQueryParams(params) {
  const url = new URL(window.location);
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.set(key, params[key]);
    } else {
      url.searchParams.delete(key);
    }
  });
  window.history.pushState({}, '', url);
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copiado al portapapeles', 'success');
    return true;
  } catch (err) {
    console.error('Error copying to clipboard:', err);
    showToast('Error al copiar', 'error');
    return false;
  }
}

/**
 * Download file
 */
export function downloadFile(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate UUID
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Truncate text
 */
export function truncate(text, length = 50) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Sleep/delay
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Group array by key
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
}

/**
 * Sort array by key
 */
export function sortBy(array, key, order = 'asc') {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Get file extension
 */
export function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if object is empty
 */
export function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Merge objects
 */
export function merge(...objects) {
  return Object.assign({}, ...objects);
}

/**
 * Get nested property
 */
export function getNestedProperty(obj, path) {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

/**
 * Set nested property
 */
export function setNestedProperty(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * Retry async function
 */
export async function retry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
}

/**
 * Throttle function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export default {
  debounce,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
  formatRelativeTime,
  showToast,
  showLoading,
  hideLoading,
  confirm,
  validateEmail,
  validateRUC,
  validatePhone,
  sanitizeHTML,
  parseCSV,
  exportToCSV,
  calculateMargin,
  calculatePriceWithTax,
  getQueryParams,
  setQueryParams,
  copyToClipboard,
  downloadFile,
  generateUUID,
  truncate,
  sleep,
  groupBy,
  sortBy,
  getFileExtension,
  formatFileSize,
  isEmpty,
  deepClone,
  merge,
  getNestedProperty,
  setNestedProperty,
  retry,
  throttle
};
