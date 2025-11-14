/**
 * Dummy Data Module
 * Provides realistic test data for development and testing
 */

/**
 * Generate random number between min and max
 */
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random float between min and max
 */
function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

/**
 * Generate date range
 */
function generateDateRange(days = 30) {
  const dates = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

/**
 * Get dummy KPIs
 */
export function getDummyKPIs() {
  return {
    sales: {
      value: randomFloat(50000, 150000, 2),
      change: randomFloat(-15, 25, 1),
      trend: 'up'
    },
    aov: {
      value: randomFloat(800, 1500, 2),
      change: randomFloat(-10, 15, 1),
      trend: 'up'
    },
    margin: {
      value: randomFloat(15, 35, 1),
      change: randomFloat(-5, 10, 1),
      trend: 'up'
    },
    roas: {
      value: randomFloat(2.5, 5.5, 2),
      change: randomFloat(-8, 20, 1),
      trend: 'up'
    },
    conversion: {
      value: randomFloat(2, 6, 2),
      change: randomFloat(-3, 8, 1),
      trend: 'up'
    }
  };
}

/**
 * Get dummy sales daily data
 */
export function getDummySalesDaily(days = 30) {
  const dates = generateDateRange(days);
  
  return dates.map(date => ({
    date,
    revenue: randomFloat(1500, 5000, 2),
    margin: randomFloat(300, 1500, 2),
    orders: random(20, 80),
    customers: random(15, 60)
  }));
}

/**
 * Get dummy top categories
 */
export function getDummyTopCategories(limit = 5) {
  const categories = [
    'Bebidas',
    'Snacks',
    'Lácteos',
    'Panadería',
    'Congelados',
    'Limpieza',
    'Higiene Personal',
    'Golosinas'
  ];
  
  return categories.slice(0, limit).map(category => ({
    category,
    revenue: randomFloat(5000, 20000, 2),
    margin: randomFloat(1000, 6000, 2),
    units: random(100, 500),
    margin_percent: randomFloat(15, 35, 1)
  }));
}

/**
 * Get dummy top providers
 */
export function getDummyTopProviders(limit = 5) {
  const providers = [
    'Conaprole',
    'Coca-Cola',
    'PepsiCo',
    'Arcor',
    'Nestlé',
    'Unilever',
    'Bimbo',
    'Mondelez'
  ];
  
  return providers.slice(0, limit).map(provider => ({
    provider,
    margin_contrib: randomFloat(2000, 8000, 2),
    revenue: randomFloat(10000, 30000, 2),
    margin_percent: randomFloat(18, 32, 1),
    products: random(15, 50)
  }));
}

/**
 * Get dummy providers list
 */
export function getDummyProviders(page = 1, limit = 10) {
  const providers = [
    { name: 'Conaprole', ruc: '210000000018', email: 'ventas@conaprole.com.uy', phone: '+598 2924 0101' },
    { name: 'Coca-Cola', ruc: '210000000026', email: 'contacto@coca-cola.com.uy', phone: '+598 2902 0202' },
    { name: 'PepsiCo', ruc: '210000000034', email: 'ventas@pepsico.com.uy', phone: '+598 2903 0303' },
    { name: 'Arcor', ruc: '210000000042', email: 'info@arcor.com.uy', phone: '+598 2904 0404' },
    { name: 'Nestlé', ruc: '210000000059', email: 'ventas@nestle.com.uy', phone: '+598 2905 0505' },
    { name: 'Unilever', ruc: '210000000067', email: 'contacto@unilever.com.uy', phone: '+598 2906 0606' },
    { name: 'Bimbo', ruc: '210000000075', email: 'ventas@bimbo.com.uy', phone: '+598 2907 0707' },
    { name: 'Mondelez', ruc: '210000000083', email: 'info@mondelez.com.uy', phone: '+598 2908 0808' },
    { name: 'Danone', ruc: '210000000091', email: 'ventas@danone.com.uy', phone: '+598 2909 0909' },
    { name: 'Kraft Heinz', ruc: '210000000109', email: 'contacto@kraftheinz.com.uy', phone: '+598 2910 1010' }
  ];
  
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    data: providers.slice(start, end).map((p, i) => ({
      id: `provider-${start + i + 1}`,
      ...p,
      commission_rate: randomFloat(5, 15, 2),
      zones: 'Montevideo, Canelones',
      shipping_cost_policy: 'Gratis sobre $2000',
      status: random(0, 10) > 2 ? 'active' : 'inactive',
      created_at: new Date(Date.now() - random(30, 365) * 24 * 60 * 60 * 1000).toISOString()
    })),
    total: providers.length,
    page,
    limit
  };
}

/**
 * Get dummy categories list
 */
export function getDummyCategories(page = 1, limit = 10) {
  const categories = [
    { name: 'Bebidas', slug: 'bebidas', parent_id: null },
    { name: 'Bebidas Alcohólicas', slug: 'bebidas-alcoholicas', parent_id: 'cat-1' },
    { name: 'Bebidas Sin Alcohol', slug: 'bebidas-sin-alcohol', parent_id: 'cat-1' },
    { name: 'Snacks', slug: 'snacks', parent_id: null },
    { name: 'Papas Fritas', slug: 'papas-fritas', parent_id: 'cat-4' },
    { name: 'Lácteos', slug: 'lacteos', parent_id: null },
    { name: 'Leche', slug: 'leche', parent_id: 'cat-6' },
    { name: 'Yogurt', slug: 'yogurt', parent_id: 'cat-6' },
    { name: 'Panadería', slug: 'panaderia', parent_id: null },
    { name: 'Congelados', slug: 'congelados', parent_id: null }
  ];
  
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    data: categories.slice(start, end).map((c, i) => ({
      id: `cat-${start + i + 1}`,
      ...c,
      active: random(0, 10) > 1,
      created_at: new Date(Date.now() - random(60, 365) * 24 * 60 * 60 * 1000).toISOString()
    })),
    total: categories.length,
    page,
    limit
  };
}

/**
 * Get dummy products list
 */
export function getDummyProducts(page = 1, limit = 10) {
  const products = [
    { sku: 'BEB-001', name: 'Coca-Cola 2L', category: 'Bebidas Sin Alcohol', provider: 'Coca-Cola' },
    { sku: 'BEB-002', name: 'Pepsi 2L', category: 'Bebidas Sin Alcohol', provider: 'PepsiCo' },
    { sku: 'SNK-001', name: 'Papas Lays Original 150g', category: 'Papas Fritas', provider: 'PepsiCo' },
    { sku: 'SNK-002', name: 'Doritos Nacho 150g', category: 'Snacks', provider: 'PepsiCo' },
    { sku: 'LAC-001', name: 'Leche Conaprole Entera 1L', category: 'Leche', provider: 'Conaprole' },
    { sku: 'LAC-002', name: 'Yogurt Conaprole Frutilla 1kg', category: 'Yogurt', provider: 'Conaprole' },
    { sku: 'PAN-001', name: 'Pan Bimbo Blanco 500g', category: 'Panadería', provider: 'Bimbo' },
    { sku: 'GOL-001', name: 'Chocolate Milka 100g', category: 'Golosinas', provider: 'Mondelez' },
    { sku: 'GOL-002', name: 'Galletas Oreo 118g', category: 'Golosinas', provider: 'Mondelez' },
    { sku: 'BEB-003', name: 'Agua Salus 2L', category: 'Bebidas Sin Alcohol', provider: 'Coca-Cola' }
  ];
  
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    data: products.slice(start, end).map((p, i) => {
      const cogs = randomFloat(50, 300, 2);
      const priceNet = cogs * randomFloat(1.3, 2.0, 2);
      const taxRate = 0.15;
      const priceGross = priceNet * (1 + taxRate);
      const margin = ((priceNet - cogs) / priceNet) * 100;
      
      return {
        id: `prod-${start + i + 1}`,
        ...p,
        cogs,
        price_net: priceNet,
        tax_rate: taxRate,
        price_gross: priceGross,
        margin: margin,
        stock: random(0, 100),
        created_at: new Date(Date.now() - random(30, 180) * 24 * 60 * 60 * 1000).toISOString()
      };
    }),
    total: products.length,
    page,
    limit
  };
}

/**
 * Get dummy product prices history
 */
export function getDummyProductPrices(productId, days = 30) {
  const dates = generateDateRange(days);
  const providers = ['Coca-Cola', 'PepsiCo', 'Conaprole'];
  
  const prices = [];
  
  providers.forEach(provider => {
    let basePrice = randomFloat(80, 150, 2);
    
    dates.forEach(date => {
      // Add some variation
      const variation = randomFloat(-5, 5, 2);
      const priceNet = Math.max(50, basePrice + variation);
      const cogs = priceNet * randomFloat(0.5, 0.7, 2);
      const taxRate = 0.15;
      const priceGross = priceNet * (1 + taxRate);
      const shippingCost = randomFloat(0, 10, 2);
      const margin = ((priceNet - cogs - shippingCost) / priceNet) * 100;
      
      prices.push({
        id: `price-${prices.length + 1}`,
        product_id: productId,
        provider,
        date,
        price_net: priceNet,
        tax_rate: taxRate,
        price_gross: priceGross,
        cogs,
        shipping_cost: shippingCost,
        margin
      });
      
      basePrice = priceNet; // Use current as base for next
    });
  });
  
  return prices;
}

/**
 * Get dummy comparative data
 */
export function getDummyComparative(categoryId, providerIds, dateFrom, dateTo) {
  const providers = providerIds || ['Coca-Cola', 'PepsiCo', 'Conaprole'];
  
  // Last price comparison
  const lastPrices = providers.map(provider => {
    const priceNet = randomFloat(80, 150, 2);
    const cogs = priceNet * randomFloat(0.5, 0.7, 2);
    const shippingCost = randomFloat(0, 10, 2);
    const taxRate = 0.15;
    const priceGross = priceNet * (1 + taxRate);
    const margin = ((priceNet - cogs - shippingCost) / priceNet) * 100;
    
    return {
      provider,
      price_net: priceNet,
      price_gross: priceGross,
      cogs,
      shipping_cost: shippingCost,
      margin,
      tax_rate: taxRate
    };
  });
  
  // Time series
  const dates = generateDateRange(30);
  const timeSeries = [];
  
  providers.forEach(provider => {
    let basePrice = randomFloat(80, 150, 2);
    
    dates.forEach(date => {
      const variation = randomFloat(-5, 5, 2);
      const priceNet = Math.max(50, basePrice + variation);
      const cogs = priceNet * randomFloat(0.5, 0.7, 2);
      const shippingCost = randomFloat(0, 10, 2);
      const margin = ((priceNet - cogs - shippingCost) / priceNet) * 100;
      
      timeSeries.push({
        date,
        provider,
        price_net: priceNet,
        cogs,
        shipping_cost: shippingCost,
        margin
      });
      
      basePrice = priceNet;
    });
  });
  
  return {
    lastPrices,
    timeSeries
  };
}

/**
 * Get dummy settings
 */
export function getDummySettings() {
  return {
    tax_rate: { value: 0.15, label: 'IVA' },
    dummy_mode: { enabled: true },
    n8n_webhook: { url: 'https://n8n.example.com/webhook/ingest' },
    placetopay_login: { value: '' },
    placetopay_trankey: { value: '' }
  };
}

/**
 * Get dummy ingest history
 */
export function getDummyIngestHistory(page = 1, limit = 10) {
  const files = [
    { filename: 'productos_2024_01.csv', filetype: 'csv', target_table: 'products', status: 'processed' },
    { filename: 'precios_enero.csv', filetype: 'csv', target_table: 'product_prices', status: 'processed' },
    { filename: 'proveedores.json', filetype: 'json', target_table: 'providers', status: 'processed' },
    { filename: 'categorias.csv', filetype: 'csv', target_table: 'categories', status: 'processed' },
    { filename: 'productos_nuevos.csv', filetype: 'csv', target_table: 'products', status: 'pending' },
    { filename: 'precios_actualizados.csv', filetype: 'csv', target_table: 'product_prices', status: 'error' }
  ];
  
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    data: files.slice(start, end).map((f, i) => ({
      id: `ingest-${start + i + 1}`,
      ...f,
      file_url: `https://storage.supabase.co/ingest/${f.filename}`,
      log_url: f.status === 'error' ? 'https://n8n.example.com/logs/123' : null,
      uploaded_by: 'admin@kiosko7.com',
      created_at: new Date(Date.now() - random(1, 30) * 24 * 60 * 60 * 1000).toISOString()
    })),
    total: files.length,
    page,
    limit
  };
}

export default {
  getDummyKPIs,
  getDummySalesDaily,
  getDummyTopCategories,
  getDummyTopProviders,
  getDummyProviders,
  getDummyCategories,
  getDummyProducts,
  getDummyProductPrices,
  getDummyComparative,
  getDummySettings,
  getDummyIngestHistory
};
