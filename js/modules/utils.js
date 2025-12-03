/**
 * K7Smart Utilities
 * Funciones de ayuda para matching, formateo y cálculos.
 */

export const utils = {
  /**
   * Calcula la distancia de Levenshtein entre dos cadenas.
   * Retorna el número de operaciones (inserción, eliminación, sustitución) necesarias.
   */
  calculateLevenshteinDistance: (str1, str2) => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    const len1 = s1.length;
    const len2 = s2.length;

    // Crear matriz de distancias
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

    // Inicializar primera fila y columna
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    // Calcular distancias
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // Eliminación
          matrix[i][j - 1] + 1,      // Inserción
          matrix[i - 1][j - 1] + cost // Sustitución
        );
      }
    }

    return matrix[len1][len2];
  },

  /**
   * Calcula el score de similitud fuzzy entre dos cadenas usando Levenshtein.
   * Retorna un valor entre 0 (totalmente diferente) y 1 (idéntico).
   */
  fuzzyMatch: (str1, str2) => {
    if (!str1 || !str2) return 0;

    const normalized1 = utils.normalizeProductName(str1);
    const normalized2 = utils.normalizeProductName(str2);

    if (normalized1 === normalized2) return 1;

    const distance = utils.calculateLevenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);

    if (maxLength === 0) return 0;

    return 1 - (distance / maxLength);
  },

  /**
   * Normaliza un nombre de producto para comparación.
   * Elimina caracteres especiales, convierte a minúsculas, elimina palabras comunes.
   */
  normalizeProductName: (name) => {
    if (!name) return '';

    // Palabras comunes a eliminar (stopwords en español)
    const stopwords = ['de', 'la', 'el', 'los', 'las', 'un', 'una', 'y', 'o', 'para', 'con', 'en'];

    return name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9\s]/g, ' ') // Solo letras, números y espacios
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopwords.includes(word))
      .join(' ')
      .trim();
  },

  /**
   * Calcula el score de matching entre un item de scouting y un producto de proveedor.
   * Score = 0.70*fuzzy_match + 0.30*category_match
   */
  calculateMatchScore: (scoutingItem, providerProduct, categoryMatch = 0) => {
    const nameSimilarity = utils.fuzzyMatch(scoutingItem.name, providerProduct.name);
    const score = (0.70 * nameSimilarity) + (0.30 * categoryMatch);
    return Math.min(Math.max(score, 0), 1); // Clamp entre 0 y 1
  },

  /**
   * Calcula la similitud de texto entre dos cadenas (Jaccard index simple de trigramas o palabras).
   * Para simplicidad en cliente, usaremos tokens de palabras.
   */
  textSimilarity: (s1, s2) => {
    if (!s1 || !s2) return 0;
    const normalize = s => s.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    const a = new Set(normalize(s1));
    const b = new Set(normalize(s2));
    const intersection = new Set([...a].filter(x => b.has(x)));
    const union = new Set([...a, ...b]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  },

  /**
   * Calcula el margen potencial entre precio de scouting y costo de proveedor.
   * Retorna { margin_abs, margin_pct }
   */
  calculatePotentialMargin: (scoutingPvp, providerCost, taxRate = 0.15) => {
    if (!scoutingPvp || !providerCost) {
      return { margin_abs: 0, margin_pct: 0 };
    }

    const costWithTax = providerCost * (1 + taxRate);
    const margin_abs = scoutingPvp - costWithTax;
    const margin_pct = scoutingPvp > 0 ? (margin_abs / scoutingPvp) * 100 : 0;

    return {
      margin_abs: Math.round(margin_abs * 100) / 100,
      margin_pct: Math.round(margin_pct * 100) / 100
    };
  },

  /**
   * Calcula la cercanía de precios.
   * Penaliza si la diferencia es mayor al 60%.
   * Retorna un valor entre 0 y 1.
   */
  priceNearness: (p1, p2) => {
    if (!p1 || !p2 || p1 === 0 || p2 === 0) return 0;
    const diff = Math.abs(p1 - p2);
    const max = Math.max(p1, p2);
    const pctDiff = diff / max;

    if (pctDiff > 0.60) return 0; // Penalización fuerte
    return 1 - pctDiff; // 1 si son iguales, 0.4 si diff es 60%
  },

  /**
   * Normaliza un nombre para búsquedas.
   */
  normalizeName: (name) => {
    return name ? name.toLowerCase().trim() : '';
  },

  /**
   * Formatea moneda.
   */
  formatCurrency: (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount);
  },

  /**
   * Formatea porcentaje.
   */
  formatPercent: (val) => {
    return new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(val);
  }
};

// Export individual functions for convenience
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
};

export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  return formatNumber(value, decimals) + '%';
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-ES');
};

export const showToast = (message, type = 'info') => {
  // Simple toast implementation
  console.log(`[${type.toUpperCase()}] ${message}`);
  // TODO: Implement actual toast UI
};

export const showLoading = (message = 'Cargando...') => {
  console.log(`[LOADING] ${message}`);
  // TODO: Implement actual loading UI
};

export const hideLoading = () => {
  console.log('[LOADING] Hidden');
  // TODO: Implement actual loading UI
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const calculateMargen = (pvp, costo, ivaRate = 0.15) => {
  if (!pvp || !costo || pvp === 0) return 0;
  const pvpSinIva = pvp / (1 + ivaRate);
  const margen = ((pvpSinIva - costo) / pvpSinIva) * 100;
  return Math.max(0, margen);
};

export const confirm = async (message, title = 'Confirmar') => {
  return window.confirm(message);
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateRUC = (ruc) => {
  if (!ruc) return false;
  if (ruc === '1') return true; // Default value
  return /^\d{1,13}$/.test(ruc);
};

export const validatePhone = (phone) => {
  if (!phone) return false;
  return /^[\d\s\-\+\(\)]{7,20}$/.test(phone);
};

export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    showToast('No hay datos para exportar', 'warning');
    return;
  }

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};
