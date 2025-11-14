/**
 * Charts Module
 * Handles Chart.js configuration and creation
 */

/**
 * Default chart colors (Kiosko7 theme)
 */
const COLORS = {
  primary: '#ff6b35',
  secondary: '#000000',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  light: '#f8f9fa',
  dark: '#343a40',
  
  // Chart palette
  palette: [
    '#ff6b35',
    '#004e89',
    '#1a659e',
    '#f77f00',
    '#06d6a0',
    '#ef476f',
    '#118ab2',
    '#073b4c',
    '#ffd166',
    '#06ffa5'
  ]
};

/**
 * Get theme-aware colors
 */
function getThemeColors() {
  const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
  
  return {
    text: isDark ? '#e6edf3' : '#212529',
    grid: isDark ? '#30363d' : '#dee2e6',
    background: isDark ? '#161b22' : '#ffffff'
  };
}

/**
 * Default chart options
 */
function getDefaultOptions() {
  const theme = getThemeColors();
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: theme.text,
          font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            size: 12
          },
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: theme.background,
        titleColor: theme.text,
        bodyColor: theme.text,
        borderColor: theme.grid,
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('es-UY', {
                style: 'currency',
                currency: 'USD'
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: theme.grid,
          drawBorder: false
        },
        ticks: {
          color: theme.text,
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: theme.grid,
          drawBorder: false
        },
        ticks: {
          color: theme.text,
          font: {
            size: 11
          },
          callback: function(value) {
            return new Intl.NumberFormat('es-UY', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0
            }).format(value);
          }
        }
      }
    }
  };
}

/**
 * Create line chart
 */
export function createLineChart(canvasId, data, options = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas ${canvasId} not found`);
    return null;
  }
  
  const defaultOpts = getDefaultOptions();
  const mergedOptions = {
    ...defaultOpts,
    ...options,
    plugins: {
      ...defaultOpts.plugins,
      ...options.plugins
    }
  };
  
  return new Chart(ctx, {
    type: 'line',
    data: data,
    options: mergedOptions
  });
}

/**
 * Create bar chart
 */
export function createBarChart(canvasId, data, options = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas ${canvasId} not found`);
    return null;
  }
  
  const defaultOpts = getDefaultOptions();
  const mergedOptions = {
    ...defaultOpts,
    ...options,
    plugins: {
      ...defaultOpts.plugins,
      ...options.plugins
    }
  };
  
  return new Chart(ctx, {
    type: 'bar',
    data: data,
    options: mergedOptions
  });
}

/**
 * Create stacked bar chart
 */
export function createStackedBarChart(canvasId, data, options = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas ${canvasId} not found`);
    return null;
  }
  
  const defaultOpts = getDefaultOptions();
  const mergedOptions = {
    ...defaultOpts,
    ...options,
    plugins: {
      ...defaultOpts.plugins,
      ...options.plugins
    },
    scales: {
      ...defaultOpts.scales,
      x: {
        ...defaultOpts.scales.x,
        stacked: true
      },
      y: {
        ...defaultOpts.scales.y,
        stacked: true
      }
    }
  };
  
  return new Chart(ctx, {
    type: 'bar',
    data: data,
    options: mergedOptions
  });
}

/**
 * Create doughnut chart
 */
export function createDoughnutChart(canvasId, data, options = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas ${canvasId} not found`);
    return null;
  }
  
  const theme = getThemeColors();
  const defaultOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.text,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: theme.background,
        titleColor: theme.text,
        bodyColor: theme.text,
        borderColor: theme.grid,
        borderWidth: 1,
        padding: 12
      }
    }
  };
  
  const mergedOptions = {
    ...defaultOpts,
    ...options,
    plugins: {
      ...defaultOpts.plugins,
      ...options.plugins
    }
  };
  
  return new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: mergedOptions
  });
}

/**
 * Prepare sales vs margin data
 */
export function prepareSalesMarginData(salesData) {
  const labels = salesData.map(d => {
    const date = new Date(d.date);
    return date.toLocaleDateString('es-UY', { month: 'short', day: 'numeric' });
  });
  
  return {
    labels,
    datasets: [
      {
        label: 'Ventas',
        data: salesData.map(d => d.revenue),
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '20',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Margen',
        data: salesData.map(d => d.margin),
        borderColor: COLORS.success,
        backgroundColor: COLORS.success + '20',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ]
  };
}

/**
 * Prepare top categories data
 */
export function prepareTopCategoriesData(categoriesData) {
  return {
    labels: categoriesData.map(c => c.category),
    datasets: [
      {
        label: 'Ventas',
        data: categoriesData.map(c => c.revenue),
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        borderWidth: 1
      },
      {
        label: 'Margen',
        data: categoriesData.map(c => c.margin),
        backgroundColor: COLORS.success,
        borderColor: COLORS.success,
        borderWidth: 1
      }
    ]
  };
}

/**
 * Prepare top providers data (stacked)
 */
export function prepareTopProvidersData(providersData) {
  return {
    labels: providersData.map(p => p.provider),
    datasets: [
      {
        label: 'Contribución al Margen',
        data: providersData.map(p => p.margin_contrib),
        backgroundColor: COLORS.palette.slice(0, providersData.length),
        borderWidth: 0
      }
    ]
  };
}

/**
 * Prepare price comparison data
 */
export function preparePriceComparisonData(pricesData) {
  return {
    labels: pricesData.map(p => p.provider),
    datasets: [
      {
        label: 'Precio Neto',
        data: pricesData.map(p => p.price_net),
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        borderWidth: 1
      }
    ]
  };
}

/**
 * Prepare margin comparison data
 */
export function prepareMarginComparisonData(pricesData) {
  return {
    labels: pricesData.map(p => p.provider),
    datasets: [
      {
        label: 'Margen %',
        data: pricesData.map(p => p.margin),
        backgroundColor: pricesData.map(p => 
          p.margin > 25 ? COLORS.success : 
          p.margin > 15 ? COLORS.warning : 
          COLORS.danger
        ),
        borderWidth: 0
      }
    ]
  };
}

/**
 * Prepare time series data (multiple providers)
 */
export function prepareTimeSeriesData(timeSeriesData, metric = 'price_net') {
  // Group by provider
  const providers = [...new Set(timeSeriesData.map(d => d.provider))];
  const dates = [...new Set(timeSeriesData.map(d => d.date))].sort();
  
  const labels = dates.map(date => {
    const d = new Date(date);
    return d.toLocaleDateString('es-UY', { month: 'short', day: 'numeric' });
  });
  
  const datasets = providers.map((provider, index) => {
    const providerData = timeSeriesData.filter(d => d.provider === provider);
    const data = dates.map(date => {
      const item = providerData.find(d => d.date === date);
      return item ? item[metric] : null;
    });
    
    return {
      label: provider,
      data: data,
      borderColor: COLORS.palette[index % COLORS.palette.length],
      backgroundColor: COLORS.palette[index % COLORS.palette.length] + '20',
      borderWidth: 2,
      fill: false,
      tension: 0.4
    };
  });
  
  return { labels, datasets };
}

/**
 * Update chart data
 */
export function updateChart(chart, newData) {
  if (!chart) return;
  
  chart.data = newData;
  chart.update();
}

/**
 * Destroy chart
 */
export function destroyChart(chart) {
  if (chart) {
    chart.destroy();
  }
}

/**
 * Update chart theme
 */
export function updateChartTheme(chart) {
  if (!chart) return;
  
  const theme = getThemeColors();
  
  // Update scales
  if (chart.options.scales) {
    if (chart.options.scales.x) {
      chart.options.scales.x.grid.color = theme.grid;
      chart.options.scales.x.ticks.color = theme.text;
    }
    if (chart.options.scales.y) {
      chart.options.scales.y.grid.color = theme.grid;
      chart.options.scales.y.ticks.color = theme.text;
    }
  }
  
  // Update legend
  if (chart.options.plugins?.legend?.labels) {
    chart.options.plugins.legend.labels.color = theme.text;
  }
  
  // Update tooltip
  if (chart.options.plugins?.tooltip) {
    chart.options.plugins.tooltip.backgroundColor = theme.background;
    chart.options.plugins.tooltip.titleColor = theme.text;
    chart.options.plugins.tooltip.bodyColor = theme.text;
    chart.options.plugins.tooltip.borderColor = theme.grid;
  }
  
  chart.update();
}

/**
 * Get color palette
 */
export function getColorPalette() {
  return COLORS.palette;
}

/**
 * Get primary color
 */
export function getPrimaryColor() {
  return COLORS.primary;
}

export default {
  createLineChart,
  createBarChart,
  createStackedBarChart,
  createDoughnutChart,
  prepareSalesMarginData,
  prepareTopCategoriesData,
  prepareTopProvidersData,
  preparePriceComparisonData,
  prepareMarginComparisonData,
  prepareTimeSeriesData,
  updateChart,
  destroyChart,
  updateChartTheme,
  getColorPalette,
  getPrimaryColor
};
