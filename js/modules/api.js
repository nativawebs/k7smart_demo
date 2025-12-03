/**
 * API Module
 * Handles all Supabase database operations
 */

import { getSupabase } from './auth.js';
import state from './state.js';
import * as dummy from './dummy.js';
import { showToast } from './utils.js';
import { utils } from './utils.js'; // K7Smart: Utils for matching
import * as apiExtensions from './api-extensions.js'; // NEW: Extended API functions


/**
 * Check if dummy mode is enabled
 */
function isDummyMode() {
  return state.getState().dummyMode;
}

/**
 * Handle API errors
 */
function handleError(error, operation = 'operación') {
  console.error(`Error en ${operation}:`, error);
  showToast(`Error en ${operation}: ${error.message}`, 'error');
  return { success: false, error };
}

// ============================================
// KPIs
// ============================================

/**
 * Get KPIs
 */
export async function getKPIs() {
  if (isDummyMode()) {
    return { success: true, data: dummy.getDummyKPIs() };
  }

  try {
    const supabase = getSupabase();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // 1. Get Sales Data (from daily_sales)
    const { data: currentSales, error: salesError } = await supabase
      .from('daily_sales')
      .select('*')
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

    if (salesError) throw salesError;

    const { data: prevSales, error: prevSalesError } = await supabase
      .from('daily_sales')
      .select('*')
      .gte('date', sixtyDaysAgo.toISOString().split('T')[0])
      .lt('date', thirtyDaysAgo.toISOString().split('T')[0]);

    if (prevSalesError) throw prevSalesError;

    // 2. Get Traffic Data (from traffic_daily)
    const { data: currentTraffic, error: trafficError } = await supabase
      .from('traffic_daily')
      .select('*')
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

    const { data: prevTraffic, error: prevTrafficError } = await supabase
      .from('traffic_daily')
      .select('*')
      .gte('date', sixtyDaysAgo.toISOString().split('T')[0])
      .lt('date', thirtyDaysAgo.toISOString().split('T')[0]);

    // 3. Get Ad Spend Data (from ad_spend_daily)
    const { data: currentAds, error: adsError } = await supabase
      .from('ad_spend_daily')
      .select('*')
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

    const { data: prevAds, error: prevAdsError } = await supabase
      .from('ad_spend_daily')
      .select('*')
      .gte('date', sixtyDaysAgo.toISOString().split('T')[0])
      .lt('date', thirtyDaysAgo.toISOString().split('T')[0]);

    // Calculate Aggregates
    const totalSales = currentSales.reduce((sum, item) => sum + (item.total_sales || 0), 0);
    const totalRevenue = currentSales.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
    const totalMargin = currentSales.reduce((sum, item) => sum + (item.total_margin || 0), 0);
    const totalOrders = currentSales.reduce((sum, item) => sum + (item.orders_count || 0), 0);

    // Use new tables if available, fallback to daily_sales columns if not
    const totalVisits = currentTraffic && currentTraffic.length > 0
      ? currentTraffic.reduce((sum, item) => sum + (item.sessions || 0), 0)
      : currentSales.reduce((sum, item) => sum + (item.visits || 0), 0);

    const totalAdSpend = currentAds && currentAds.length > 0
      ? currentAds.reduce((sum, item) => sum + (item.amount || 0), 0)
      : currentSales.reduce((sum, item) => sum + (item.ad_spend || 0), 0);

    const marginPercent = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;
    const aov = totalOrders > 0 ? totalSales / totalOrders : 0;
    const roas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;
    const conversionRate = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;

    // Previous Period Aggregates
    const prevTotalSales = prevSales.reduce((sum, item) => sum + (item.total_sales || 0), 0);
    const prevTotalRevenue = prevSales.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
    const prevTotalMargin = prevSales.reduce((sum, item) => sum + (item.total_margin || 0), 0);
    const prevTotalOrders = prevSales.reduce((sum, item) => sum + (item.orders_count || 0), 0);

    const prevTotalVisits = prevTraffic && prevTraffic.length > 0
      ? prevTraffic.reduce((sum, item) => sum + (item.sessions || 0), 0)
      : prevSales.reduce((sum, item) => sum + (item.visits || 0), 0);

    const prevTotalAdSpend = prevAds && prevAds.length > 0
      ? prevAds.reduce((sum, item) => sum + (item.amount || 0), 0)
      : prevSales.reduce((sum, item) => sum + (item.ad_spend || 0), 0);

    const prevMarginPercent = prevTotalRevenue > 0 ? (prevTotalMargin / prevTotalRevenue) * 100 : 0;
    const prevAov = prevTotalOrders > 0 ? prevTotalSales / prevTotalOrders : 0;
    const prevRoas = prevTotalAdSpend > 0 ? prevTotalRevenue / prevTotalAdSpend : 0;
    const prevConversionRate = prevTotalVisits > 0 ? (prevTotalOrders / prevTotalVisits) * 100 : 0;

    // Calculate changes
    const salesChange = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;
    const aovChange = prevAov > 0 ? ((aov - prevAov) / prevAov) * 100 : 0;
    const marginChange = prevMarginPercent > 0 ? ((marginPercent - prevMarginPercent) / prevMarginPercent) * 100 : 0;
    const roasChange = prevRoas > 0 ? ((roas - prevRoas) / prevRoas) * 100 : 0;
    const conversionChange = prevConversionRate > 0 ? ((conversionRate - prevConversionRate) / prevConversionRate) * 100 : 0;

    return {
      success: true,
      data: {
        sales: { value: totalSales, change: salesChange, trend: salesChange >= 0 ? 'up' : 'down' },
        aov: { value: aov, change: aovChange, trend: aovChange >= 0 ? 'up' : 'down' },
        margin: { value: marginPercent, change: marginChange, trend: marginChange >= 0 ? 'up' : 'down' },
        roas: { value: roas, change: roasChange, trend: roasChange >= 0 ? 'up' : 'down' },
        conversion: { value: conversionRate, change: conversionChange, trend: conversionChange >= 0 ? 'up' : 'down' }
      }
    };
  } catch (error) {
    return handleError(error, 'obtener KPIs');
  }
}

/**
 * Get sales daily data
 */
export async function getSalesDaily(days = 30) {
  if (isDummyMode()) {
    return { success: true, data: dummy.getDummySalesDaily(days) };
  }

  try {
    const supabase = getSupabase();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('daily_sales')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    // Transform to match chart format
    const chartData = (data || []).map(item => ({
      date: item.date,
      revenue: item.total_sales || 0,
      margin: item.total_margin || 0,
      orders: item.orders_count || 0
    }));

    return { success: true, data: chartData };
  } catch (error) {
    return handleError(error, 'obtener ventas diarias');
  }
}

/**
 * Get top categories
 */
export async function getTopCategories(limit = 5) {
  if (isDummyMode()) {
    return { success: true, data: dummy.getDummyTopCategories(limit) };
  }

  try {
    const supabase = getSupabase();

    // Use the view for better performance
    const { data, error } = await supabase
      .from('v_sales_by_category')
      .select('*')
      .order('total_sales', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Transform to match expected format
    const categories = (data || []).map(cat => ({
      category: cat.category_name,
      revenue: cat.total_sales || 0,
      margin: cat.total_margin || 0,
      units: cat.total_units_sold || 0,
      margin_percent: cat.margin_percent || 0
    }));

    return { success: true, data: categories };
  } catch (error) {
    return handleError(error, 'obtener top categorías');
  }
}

/**
 * Get top providers
 */
export async function getTopProviders(limit = 5) {
  if (isDummyMode()) {
    return { success: true, data: dummy.getDummyTopProviders(limit) };
  }

  try {
    const supabase = getSupabase();

    // Use the view for better performance
    const { data, error } = await supabase
      .from('v_sales_by_provider')
      .select('*')
      .order('total_margin', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Transform to match expected format
    const providers = (data || []).map(prov => ({
      provider: prov.provider_name,
      margin_contrib: prov.total_margin || 0,
      revenue: prov.total_sales || 0,
      margin_percent: prov.margin_percent || 0,
      products: prov.transactions_count || 0
    }));

    return { success: true, data: providers };
  } catch (error) {
    return handleError(error, 'obtener top proveedores');
  }
}

/**
 * Get top reference products
 */
export async function getTopReferenceProducts(limit = 10) {
  if (isDummyMode()) {
    return { success: true, data: dummy.getDummyProducts(1, limit).data };
  }

  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('product_references')
      .select(`
        *,
        products(*, categories(name))
      `)
      .not('status_referencia', 'is', null)
      .limit(limit * 2);

    if (error) throw error;

    const products = (data || [])
      .map(ref => ({
        ...ref.products,
        link_referencia: ref.link_referencia,
        plataforma_referencia: ref.plataforma_referencia,
        status_referencia: ref.status_referencia,
        precio_referencia_pvp: ref.precio_referencia_pvp
      }))
      .sort((a, b) => {
        const priority = { 'Más vendido': 1, 'Mejor precio': 2, 'Normal': 3 };
        return (priority[a.status_referencia] || 99) - (priority[b.status_referencia] || 99);
      })
      .slice(0, limit);

    return { success: true, data: products };
  } catch (error) {
    return handleError(error, 'obtener top productos referencia');
  }
}

/**
 * Get top selling products (Kiosko 7)
 */
export async function getTopSellingProducts(limit = 10) {
  if (isDummyMode()) {
    return { success: true, data: dummy.getDummyProducts(1, limit).data };
  }

  try {
    const supabase = getSupabase();

    // Aggregate sales by product from sales_transactions
    // Note: This assumes we want top selling by units sold
    const { data, error } = await supabase
      .from('sales_transactions')
      .select('product_name, product_sku, quantity, total_price_net');

    if (error) throw error;

    // Group and aggregate in JS (since we can't easily do complex group by with simple select)
    // For better performance with large data, create a database view
    const productStats = {};

    (data || []).forEach(item => {
      const key = item.product_sku || item.product_name;
      if (!productStats[key]) {
        productStats[key] = {
          product_name: item.product_name,
          product_sku: item.product_sku,
          total_units_sold: 0,
          total_sales: 0
        };
      }
      productStats[key].total_units_sold += (item.quantity || 0);
      productStats[key].total_sales += (item.total_price_net || 0);
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.total_units_sold - a.total_units_sold)
      .slice(0, limit);

    return { success: true, data: topProducts };
  } catch (error) {
    return handleError(error, 'obtener top productos vendidos');
  }
}

/**
 * Get top reference categories
 */
export async function getTopReferenceCategories(limit = 5) {
  if (isDummyMode()) {
    return { success: true, data: [] };
  }

  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('product_references')
      .select(`
        precio_referencia_pvp,
        products(costo_proveedor, category_id, categories(name))
      `)
      .not('precio_referencia_pvp', 'is', null);

    if (error) throw error;

    const categoryStats = {};

    (data || []).forEach(ref => {
      const product = ref.products;
      if (!product || !product.categories) return;

      const catName = product.categories.name;
      if (!categoryStats[catName]) {
        categoryStats[catName] = {
          name: catName,
          totalRefPrice: 0,
          totalCost: 0,
          count: 0
        };
      }

      categoryStats[catName].totalRefPrice += (ref.precio_referencia_pvp || 0);
      categoryStats[catName].totalCost += (product.costo_proveedor || 0);
      categoryStats[catName].count++;
    });

    const categories = Object.values(categoryStats).map(c => {
      const avgRefPrice = c.totalRefPrice / c.count;
      const avgCost = c.totalCost / c.count;
      const margin = avgRefPrice > 0 ? ((avgRefPrice - avgCost) / avgRefPrice) * 100 : 0;

      return {
        category: c.name,
        avgPrice: avgRefPrice,
        margin: margin,
        count: c.count
      };
    });

    categories.sort((a, b) => b.margin - a.margin);

    return { success: true, data: categories.slice(0, limit) };
  } catch (error) {
    return handleError(error, 'obtener categorías referencia');
  }
}

// ============================================
// Providers
// ============================================

/**
 * Get providers list
 */
export async function getProviders({ page = 1, limit = 10, search = '', sortBy = 'name', sortOrder = 'asc' } = {}) {
  if (isDummyMode()) {
    return { success: true, ...dummy.getDummyProviders(page, limit) };
  }

  try {
    const supabase = getSupabase();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('providers')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,ruc.ilike.%${search}%,email.ilike.%${search}%`);
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      total: count || 0,
      page,
      limit
    };
  } catch (error) {
    return handleError(error, 'obtener proveedores');
  }
}

/**
 * Get provider by ID
 */
export async function getProvider(id) {
  if (isDummyMode()) {
    const providers = dummy.getDummyProviders(1, 100);
    const provider = providers.data.find(p => p.id === id);
    return { success: true, data: provider };
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return handleError(error, 'obtener proveedor');
  }
}

/**
 * Create provider
 */
export async function createProvider(provider) {
  if (isDummyMode()) {
    showToast('Modo dummy: No se puede crear en base de datos', 'warning');
    return { success: false, error: 'Dummy mode' };
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('providers')
      .insert([provider])
      .select()
      .single();

    if (error) throw error;

    showToast('Proveedor creado exitosamente', 'success');
    return { success: true, data };
  } catch (error) {
    return handleError(error, 'crear proveedor');
  }
}

/**
 * Update provider
 */
export async function updateProvider(id, updates) {
  if (isDummyMode()) {
    showToast('Modo dummy: No se puede actualizar en base de datos', 'warning');
    return { success: false, error: 'Dummy mode' };
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('providers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    showToast('Proveedor actualizado exitosamente', 'success');
    return { success: true, data };
  } catch (error) {
    return handleError(error, 'actualizar proveedor');
  }
}

/**
 * Delete provider
 */
export async function deleteProvider(id) {
  if (isDummyMode()) {
    showToast('Modo dummy: No se puede eliminar de base de datos', 'warning');
    return { success: false, error: 'Dummy mode' };
  }

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('providers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    showToast('Proveedor eliminado exitosamente', 'success');
    return { success: true };
  } catch (error) {
    return handleError(error, 'eliminar proveedor');
  }
}

// ============================================
// Categories
// ============================================

/**
 * Get categories list
 */
export async function getCategories({ page = 1, limit = 10, search = '', sortBy = 'name', sortOrder = 'asc' } = {}) {
  if (isDummyMode()) {
    return { success: true, ...dummy.getDummyCategories(page, limit) };
  }

  try {
    const supabase = getSupabase();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('categories')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      total: count || 0,
      page,
      limit
    };
  } catch (error) {
    return handleError(error, 'obtener categorías');
  }
}

/**
 * Get all categories (for selects)
 */
export async function getAllCategories() {
  if (isDummyMode()) {
    return { success: true, data: dummy.getDummyCategories(1, 100).data };
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    return handleError(error, 'obtener todas las categorías');
  }
}

/**
 * Create category
 */
export async function createCategory(category) {
  if (isDummyMode()) {
    showToast('Modo dummy: No se puede crear en base de datos', 'warning');
    return { success: false, error: 'Dummy mode' };
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single();

    if (error) throw error;

    showToast('Categoría creada exitosamente', 'success');
    return { success: true, data };
  } catch (error) {
    return handleError(error, 'crear categoría');
  }
}

/**
 * Update category
 */
export async function updateCategory(id, updates) {
  if (isDummyMode()) {
    showToast('Modo dummy: No se puede actualizar en base de datos', 'warning');
    return { success: false, error: 'Dummy mode' };
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    showToast('Categoría actualizada exitosamente', 'success');
    return { success: true, data };
  } catch (error) {
    return handleError(error, 'actualizar categoría');
  }
}

/**
 * Delete category
 */
export async function deleteCategory(id) {
  if (isDummyMode()) {
    showToast('Modo dummy: No se puede eliminar de base de datos', 'warning');
    return { success: false, error: 'Dummy mode' };
  }

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    showToast('Categoría eliminada exitosamente', 'success');
    return { success: true };
  } catch (error) {
    return handleError(error, 'eliminar categoría');
  }
}

// ============================================
// Products
// ============================================

/**
 * Get products list
 */
export async function getProducts({ page = 1, limit = 10, search = '', sortBy = 'name', sortOrder = 'asc' } = {}) {
  if (isDummyMode()) {
    return { success: true, ...dummy.getDummyProducts(page, limit) };
  }

  try {
    const supabase = getSupabase();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('products')
      .select(`
        *,
        categories(name),
        providers(name),
        product_references(*)
      `, { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    // Flatten product_references data
    const products = (data || []).map(p => ({
      ...p,
      link_referencia: p.product_references?.link_referencia,
      plataforma_referencia: p.product_references?.plataforma_referencia,
      status_referencia: p.product_references?.status_referencia,
      precio_referencia_pvp: p.product_references?.precio_referencia_pvp,
      product_references: undefined
    }));

    return {
      success: true,
      data: products,
      total: count || 0,
      page,
      limit
    };
  } catch (error) {
    return handleError(error, 'obtener productos');
  }
}

/**
 * Get product by ID
 */
export async function getProduct(id) {
  if (isDummyMode()) {
    const products = dummy.getDummyProducts(1, 1000);
    const product = products.data.find(p => p.id === id);
    return { success: true, data: product };
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(name),
        providers(name),
        product_references(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Flatten product_references data
    const product = {
      ...data,
      link_referencia: data.product_references?.link_referencia,
      plataforma_referencia: data.product_references?.plataforma_referencia,
      status_referencia: data.product_references?.status_referencia,
      precio_referencia_pvp: data.product_references?.precio_referencia_pvp,
      product_references: undefined
    };

    return { success: true, data: product };
  } catch (error) {
    return handleError(error, 'obtener producto');
  }
}

/**
 * Create product with references
 */
export async function createProduct(productData) {
  if (isDummyMode()) {
    showToast('Modo dummy: No se puede crear en base de datos', 'warning');
    return { success: false, error: 'Dummy mode' };
  }

  try {
    const supabase = getSupabase();

    // Separate product data from reference data
    const { link_referencia, plataforma_referencia, status_referencia, precio_referencia_pvp, ...product } = productData;

    // Create product
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) throw error;

    // Create reference if any reference data exists
    if (link_referencia || plataforma_referencia || status_referencia || precio_referencia_pvp) {
      const { error: refError } = await supabase
        .from('product_references')
        .insert([{
          product_id: data.id,
          link_referencia,
          plataforma_referencia,
          status_referencia,
          precio_referencia_pvp
        }]);

      if (refError) console.error('Error creating reference:', refError);
    }

    showToast('Producto creado exitosamente', 'success');
    return { success: true, data };
  } catch (error) {
    return handleError(error, 'crear producto');
  }
}

/**
 * Update product with references
 */
export async function updateProduct(id, productData) {
  if (isDummyMode()) {
    showToast('Modo dummy: No se puede actualizar en base de datos', 'warning');
    return { success: false, error: 'Dummy mode' };
  }

  try {
    const supabase = getSupabase();

    // Separate product data from reference data
    const { link_referencia, plataforma_referencia, status_referencia, precio_referencia_pvp, ...product } = productData;

    // Update product
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update or create reference
    const hasReferenceData = link_referencia || plataforma_referencia || status_referencia || precio_referencia_pvp;

    if (hasReferenceData) {
      // Try to update first
      const { error: updateError } = await supabase
        .from('product_references')
        .update({
          link_referencia,
          plataforma_referencia,
          status_referencia,
          precio_referencia_pvp,
          updated_at: new Date().toISOString()
        })
        .eq('product_id', id);

      // If update failed (no row exists), insert
      if (updateError) {
        await supabase
          .from('product_references')
          .insert([{
            product_id: id,
            link_referencia,
            plataforma_referencia,
            status_referencia,
            precio_referencia_pvp
          }]);
      }
    }

    showToast('Producto actualizado exitosamente', 'success');
    return { success: true, data };
  } catch (error) {
    return handleError(error, 'actualizar producto');
  }
}

/**
 * Delete product
 */
export async function deleteProduct(id) {
  if (isDummyMode()) {
    showToast('Modo dummy: No se puede eliminar de base de datos', 'warning');
    return { success: false, error: 'Dummy mode' };
  }

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    showToast('Producto eliminado exitosamente', 'success');
    return { success: true };
  } catch (error) {
    return handleError(error, 'eliminar producto');
  }
}

/**
 * Get product prices history
 */
export async function getProductPrices(productId, days = 30) {
  if (isDummyMode()) {
    return { success: true, data: dummy.getDummyProductPrices(productId, days) };
  }

  try {
    const supabase = getSupabase();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('product_prices')
      .select(`
        *,
        providers(name)
      `)
      .eq('product_id', productId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    return handleError(error, 'obtener precios del producto');
  }
}

/**
 * Get comparative data
 */
export async function getComparative(categoryId, providerIds, dateFrom, dateTo) {
  if (isDummyMode()) {
    return { success: true, data: dummy.getDummyComparative(categoryId, providerIds, dateFrom, dateTo) };
  }

  try {
    const supabase = getSupabase();

    // Get products in category
    let productsQuery = supabase
      .from('products')
      .select('id, name, sku');

    if (categoryId) {
      productsQuery = productsQuery.eq('category_id', categoryId);
    }

    const { data: products, error: productsError } = await productsQuery;
    if (productsError) throw productsError;

    const productIds = products.map(p => p.id);

    // Get prices
    let pricesQuery = supabase
      .from('product_prices')
      .select(`
        *,
        products(name, sku),
        providers(name)
      `)
      .in('product_id', productIds);

    if (providerIds && providerIds.length > 0) {
      pricesQuery = pricesQuery.in('provider_id', providerIds);
    }

    if (dateFrom) {
      pricesQuery = pricesQuery.gte('date', dateFrom);
    }

    if (dateTo) {
      pricesQuery = pricesQuery.lte('date', dateTo);
    }

    pricesQuery = pricesQuery.order('date', { ascending: true });

    const { data: prices, error: pricesError } = await pricesQuery;
    if (pricesError) throw pricesError;

    return { success: true, data: prices || [] };
  } catch (error) {
    return handleError(error, 'obtener comparativa');
  }
}

  // ============================================
  // Settings
  // ============================================

  /**
   * Get settings
   */
  export async function getSettings() {
    if (isDummyMode()) {
      return { success: true, data: dummy.getDummySettings() };
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;

      // Convert array to object
      const settings = {};
      data.forEach(item => {
        settings[item.key] = item.value;
      });

      return { success: true, data: settings };
    } catch (error) {
      return handleError(error, 'obtener configuración');
    }
  }

  /**
   * Save settings
   */
  export async function saveSettings(settings) {
    if (isDummyMode()) {
      showToast('Modo dummy: No se puede guardar en base de datos', 'warning');
      return { success: false, error: 'Dummy mode' };
    }

    try {
      const supabase = getSupabase();

      // Update each setting
      const promises = Object.entries(settings).map(([key, value]) =>
        supabase
          .from('settings')
          .upsert({ key, value, updated_at: new Date().toISOString() })
      );

      await Promise.all(promises);

      showToast('Configuración guardada exitosamente', 'success');
      return { success: true };
    } catch (error) {
      return handleError(error, 'guardar configuración');
    }
  }

  // ============================================
  // Ingest
  // ============================================

  /**
   * Upload file to Supabase Storage
   */
  export async function uploadIngestFile(file, targetTable) {
    if (isDummyMode()) {
      showToast('Modo dummy: No se puede subir archivo', 'warning');
      return { success: false, error: 'Dummy mode' };
    }

    try {
      const supabase = getSupabase();
      const fileName = `${Date.now()}_${file.name}`;

      const { data, error } = await supabase.storage
        .from('ingest')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('ingest')
        .getPublicUrl(fileName);

      return {
        success: true,
        data: {
          path: data.path,
          url: urlData.publicUrl
        }
      };
    } catch (error) {
      return handleError(error, 'subir archivo');
    }
  }

  /**
   * Trigger n8n webhook
   */
  export async function triggerN8nIngest(fileUrl, fileType, targetTable, uploadedBy) {
    try {
      const settings = await getSettings();
      const webhookUrl = settings.data?.n8n_webhook?.url;

      if (!webhookUrl) {
        showToast('URL de webhook no configurada', 'warning');
        return { success: false, error: 'No webhook URL' };
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file_url: fileUrl,
          file_type: fileType,
          target_table: targetTable,
          uploaded_by: uploadedBy,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      showToast('Archivo enviado a procesamiento', 'success');

      return { success: true, data };
    } catch (error) {
      return handleError(error, 'enviar a n8n');
    }
  }

  /**
   * Get ingest history
   */
  export async function getIngestHistory({ page = 1, limit = 10 } = {}) {
    if (isDummyMode()) {
      return { success: true, ...dummy.getDummyIngestHistory(page, limit) };
    }

    try {
      const supabase = getSupabase();
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from('ingest_history')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      return handleError(error, 'obtener historial de ingesta');
    }
  }

  /**
   * Create ingest history record
   */
  export async function createIngestRecord(record) {
    if (isDummyMode()) {
      return { success: true, data: record };
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('ingest_history')
        .insert([record])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return handleError(error, 'crear registro de ingesta');
    }
  }

  // ============================================
  // Daily Sales
  // ============================================

  export async function getDailySales({ page = 1, limit = 30, dateFrom, dateTo, sortBy = 'date', sortOrder = 'desc' } = {}) {
    if (isDummyMode()) {
      return { success: true, data: [], total: 0 };
    }

    try {
      const supabase = getSupabase();
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('daily_sales')
        .select('*', { count: 'exact' });

      if (dateFrom) {
        query = query.gte('date', dateFrom);
      }

      if (dateTo) {
        query = query.lte('date', dateTo);
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      return handleError(error, 'obtener ventas diarias');
    }
  }

  export async function getDailySaleByDate(date) {
    if (isDummyMode()) {
      return { success: true, data: null };
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('daily_sales')
        .select('*')
        .eq('date', date)
        .maybeSingle();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return handleError(error, 'obtener venta diaria');
    }
  }

  export async function createDailySale(sale) {
    if (isDummyMode()) {
      showToast('Modo dummy: No se puede guardar en base de datos', 'warning');
      return { success: false, error: 'Dummy mode' };
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('daily_sales')
        .insert([sale])
        .select()
        .single();

      if (error) throw error;

      showToast('Venta diaria registrada exitosamente', 'success');
      return { success: true, data };
    } catch (error) {
      return handleError(error, 'crear venta diaria');
    }
  }

  export async function updateDailySale(id, updates) {
    if (isDummyMode()) {
      showToast('Modo dummy: No se puede actualizar en base de datos', 'warning');
      return { success: false, error: 'Dummy mode' };
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('daily_sales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      showToast('Venta diaria actualizada exitosamente', 'success');
      return { success: true, data };
    } catch (error) {
      return handleError(error, 'actualizar venta diaria');
    }
  }

  export async function deleteDailySale(id) {
    if (isDummyMode()) {
      showToast('Modo dummy: No se puede eliminar de base de datos', 'warning');
      return { success: false, error: 'Dummy mode' };
    }

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('daily_sales')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('Venta diaria eliminada exitosamente', 'success');
      return { success: true };
    } catch (error) {
      return handleError(error, 'eliminar venta diaria');
    }
  }

  // ============================================
  // Sales Transactions
  // ============================================

  export async function getSalesTransactions({ page = 1, limit = 50, dateFrom, dateTo, productId, categoryId, providerId, sortBy = 'transaction_date', sortOrder = 'desc' } = {}) {
    if (isDummyMode()) {
      return { success: true, data: [], total: 0 };
    }

    try {
      const supabase = getSupabase();
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('sales_transactions')
        .select('*', { count: 'exact' });

      if (dateFrom) {
        query = query.gte('transaction_date', dateFrom);
      }

      if (dateTo) {
        query = query.lte('transaction_date', dateTo);
      }

      if (productId) {
        query = query.eq('product_id', productId);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (providerId) {
        query = query.eq('provider_id', providerId);
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      return handleError(error, 'obtener transacciones de ventas');
    }
  }

  export async function getSalesTransaction(id) {
    if (isDummyMode()) {
      return { success: true, data: null };
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('sales_transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return handleError(error, 'obtener transacción de venta');
    }
  }

  export async function createSalesTransaction(transaction) {
    if (isDummyMode()) {
      showToast('Modo dummy: No se puede guardar en base de datos', 'warning');
      return { success: false, error: 'Dummy mode' };
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('sales_transactions')
        .insert([transaction])
        .select()
        .single();

      if (error) throw error;

      showToast('Transacción registrada exitosamente', 'success');
      return { success: true, data };
    } catch (error) {
      return handleError(error, 'crear transacción de venta');
    }
  }

  export async function createSalesTransactionsBulk(transactions) {
    if (isDummyMode()) {
      showToast('Modo dummy: No se puede guardar en base de datos', 'warning');
      return { success: false, error: 'Dummy mode' };
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('sales_transactions')
        .insert(transactions)
        .select();

      if (error) throw error;

      showToast(`${transactions.length} transacciones registradas exitosamente`, 'success');
      return { success: true, data };
    } catch (error) {
      return handleError(error, 'crear transacciones de venta');
    }
  }

  export async function updateSalesTransaction(id, updates) {
    if (isDummyMode()) {
      showToast('Modo dummy: No se puede actualizar en base de datos', 'warning');
      return { success: false, error: 'Dummy mode' };
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('sales_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      showToast('Transacción actualizada exitosamente', 'success');
      return { success: true, data };
    } catch (error) {
      return handleError(error, 'actualizar transacción de venta');
    }
  }

  export async function deleteSalesTransaction(id) {
    if (isDummyMode()) {
      showToast('Modo dummy: No se puede eliminar de base de datos', 'warning');
      return { success: false, error: 'Dummy mode' };
    }

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('sales_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('Transacción eliminada exitosamente', 'success');
      return { success: true };
    } catch (error) {
      return handleError(error, 'eliminar transacción de venta');
    }
  }

  export async function processSalesCSV(csvData, type = 'daily') {
    try {
      const results = {
        success: 0,
        errors: 0,
        details: []
      };

      if (type === 'daily') {
        for (const row of csvData) {
          try {
            const sale = {
              date: row.fecha || row.date,
              total_sales: parseFloat(row.ventas_brutas || row.total_sales || 0),
              total_revenue: parseFloat(row.ventas_netas || row.total_revenue || 0),
              total_costs: parseFloat(row.costos || row.total_costs || 0),
              total_margin: parseFloat(row.margen || row.total_margin || 0),
              orders_count: parseInt(row.ordenes || row.orders_count || 0),
              units_sold: parseInt(row.unidades || row.units_sold || 0),
              ad_spend: parseFloat(row.gasto_publicitario || row.ad_spend || 0),
              visits: parseInt(row.visitas || row.visits || 0),
              source: 'csv',
              notes: row.notas || row.notes || ''
            };

            const result = await createDailySale(sale);
            if (result.success) {
              results.success++;
            } else {
              results.errors++;
              results.details.push({ row, error: result.error });
            }
          } catch (error) {
            results.errors++;
            results.details.push({ row, error: error.message });
          }
        }
      } else if (type === 'transactions') {
        for (const row of csvData) {
          try {
            const transaction = {
              transaction_date: row.fecha || row.transaction_date,
              transaction_number: row.numero_ticket || row.transaction_number,
              product_name: row.producto || row.product_name,
              product_sku: row.sku || row.product_sku,
              quantity: parseInt(row.cantidad || row.quantity || 1),
              unit_price_gross: parseFloat(row.precio_unitario || row.unit_price_gross || 0),
              unit_price_net: parseFloat(row.precio_neto || row.unit_price_net || 0),
              unit_cost: parseFloat(row.costo || row.unit_cost || 0),
              payment_method: row.metodo_pago || row.payment_method || 'cash',
              source: 'csv'
            };

            const result = await createSalesTransaction(transaction);
            if (result.success) {
              results.success++;
            } else {
              results.errors++;
              results.details.push({ row, error: result.error });
            }
          } catch (error) {
            results.errors++;
            results.details.push({ row, error: error.message });
          }
        }
      }

      showToast(`Procesado: ${results.success} exitosos, ${results.errors} errores`, results.errors > 0 ? 'warning' : 'success');
      return { success: true, data: results };
    } catch (error) {
      return handleError(error, 'procesar CSV de ventas');
    }
  }

  // ============================================
  // Scouting
  // ============================================

  /**
   * List scouting items
   */
  export async function listScouting({ q = '', platform = '', dateFrom = '', dateTo = '', limit = 50, offset = 0 } = {}) {
    if (isDummyMode()) {
      // Return dummy data
      return { success: true, data: [], total: 0 };
    }

    try {
      const supabase = getSupabase();
      let query = supabase
        .from('scouting_items')
        .select('*', { count: 'exact' });

      if (q) {
        query = query.or(`name.ilike.%${q}%,url.ilike.%${q}%`);
      }
      if (platform) {
        query = query.eq('platform', platform);
      }
      if (dateFrom) {
        query = query.gte('collected_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('collected_at', dateTo);
      }

      query = query
        .order('collected_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return { success: true, data, total: count };
    } catch (error) {
      return handleError(error, 'listar scouting items');
    }
  }

  /**
   * Upsert scouting items (Bulk)
   */
  export async function upsertScoutingItems(rows) {
    if (isDummyMode()) {
      showToast('Modo dummy: No se puede guardar', 'warning');
      return { success: false };
    }

    try {
      const supabase = getSupabase();

      // Process in chunks of 100 to avoid request size limits
      const chunkSize = 100;
      const results = [];

      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { data, error } = await supabase
          .from('scouting_items')
          .upsert(chunk, { onConflict: 'platform, url, name' })
          .select();

        if (error) throw error;
        results.push(...(data || []));
      }

      return { success: true, data: results };
    } catch (error) {
      return handleError(error, 'guardar scouting items');
    }
  }

  /**
   * Upsert traffic daily (Bulk)
   */
  export async function upsertTrafficDaily(rows) {
    if (isDummyMode()) return { success: true, data: [] };

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('traffic_daily')
        .upsert(rows, { onConflict: 'date' })
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error, 'guardar tráfico diario');
    }
  }

  /**
   * Upsert ad spend daily (Bulk)
   */
  export async function upsertAdSpendDaily(rows) {
    if (isDummyMode()) return { success: true, data: [] };

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('ad_spend_daily')
        .upsert(rows, { onConflict: 'date, channel' })
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error, 'guardar gasto publicitario');
    }
  }

  /**
   * Upsert provider products (Bulk)
   */
  export async function upsertProviderProducts(rows) {
    if (isDummyMode()) return { success: true, data: [] };

    try {
      const supabase = getSupabase();

      // Process in chunks
      const chunkSize = 100;
      const results = [];

      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { data, error } = await supabase
          .from('provider_products')
          .upsert(chunk, { onConflict: 'provider_id, sku_ext' })
          .select();

        if (error) throw error;
        results.push(...(data || []));
      }

      return { success: true, data: results };
    } catch (error) {
      return handleError(error, 'guardar productos proveedor');
    }
  }

  export async function listCategoryMapExternal({ platform } = {}) {
    if (isDummyMode()) return { success: true, data: [] };

    try {
      const supabase = getSupabase();
      let query = supabase.from('category_map_external').select('*, categories(name)');

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return handleError(error, 'listar mapeo categorías');
    }
  }

  export async function saveCandidate({ scouting_item_id, provider_product_id, score, matched_on, notes }) {
    if (isDummyMode()) return { success: false };

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('product_candidates')
        .upsert({
          scouting_item_id,
          provider_product_id,
          score,
          matched_on,
          notes
        }, { onConflict: 'scouting_item_id, provider_product_id' })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error, 'guardar candidato');
    }
  }

  /**
   * List opportunities (View)
   */
  export async function listOpportunities({ minScore = 0, minMarginPct = 0 } = {}) {
    if (isDummyMode()) return { success: true, data: [] };

    try {
      const supabase = getSupabase();
      let query = supabase
        .from('v_margin_opportunity')
        .select('*');

      if (minScore > 0) {
        query = query.gte('score', minScore);
      }
      // Note: minMarginPct is 0.20 for 20%
      if (minMarginPct !== undefined) {
        query = query.gte('potential_margin_pct', minMarginPct);
      }

      const { data, error } = await query.order('potential_margin_pct', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error, 'listar oportunidades');
    }
  }

  // ============================================
  // Provider Comparison (A <-> B)
  // ============================================

  /**
   * Search provider products
   */
  export async function searchProviderProducts({ provider_id, q = '', category_id = null }) {
    if (isDummyMode()) return { success: true, data: [] };

    try {
      const supabase = getSupabase();
      let query = supabase
        .from('provider_products')
        .select('*, categories(name)');

      if (provider_id) {
        query = query.eq('provider_id', provider_id);
      }
      if (q) {
        query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,sku_ext.ilike.%${q}%`);
      }
      if (category_id) {
        query = query.eq('category_id', category_id);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return handleError(error, 'buscar productos proveedor');
    }
  }

  /**
   * Get provider price latest info
   */
  export async function getProviderPriceLatest(provider_product_id) {
    if (isDummyMode()) return { success: true, data: null };

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('v_provider_price_latest')
        .select('*')
        .eq('provider_product_id', provider_product_id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error, 'obtener precio reciente');
    }
  }

  /**
   * Save provider link (A <-> B)
   */
  export async function saveProviderLink({ source_id, target_id, relation_type, score, rationale }) {
    if (isDummyMode()) return { success: false };

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('provider_product_links')
        .upsert({
          source_provider_product_id: source_id,
          target_provider_product_id: target_id,
          relation_type,
          score,
          rationale
        }, { onConflict: 'source_provider_product_id, target_provider_product_id' })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error, 'guardar link proveedor');
    }
  }

  // ============================================
  // Analytics (Traffic & Ads)
  // ============================================

  /**
   * Get Traffic Daily
   */
  export async function getTrafficDaily({ days = 30 } = {}) {
    if (isDummyMode()) return { success: true, data: [] };

    try {
      const supabase = getSupabase();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('traffic_daily')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error, 'obtener tráfico diario');
    }
  }

  /**
   * Get Ad Spend Daily
   */
  export async function getAdSpendDaily({ days = 30 } = {}) {
    if (isDummyMode()) return { success: true, data: [] };

    try {
      const supabase = getSupabase();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('ad_spend_daily')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error, 'obtener gasto ads diario');
    }
  }

  // ============================================
  // Settings
  // ============================================

  /**
   * Get Tax Rate
   */
  export async function getTaxRate() {
    if (isDummyMode()) return { success: true, data: 0.15 };

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'tax_rate')
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore not found

      return { success: true, data: data?.value?.value || 0.15 };
    } catch (error) {
      return handleError(error, 'obtener tasa impuesto');
    }
  }

  /**
   * Update Tax Rate
   */
  export async function updateTaxRate(rate) {
    if (isDummyMode()) return { success: false };

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('settings')
        .upsert({
          key: 'tax_rate',
          value: { value: rate },
          description: 'Tasa de IVA por defecto'
        })
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return handleError(error, 'actualizar tasa impuesto');
    }
  }


  /**
   * Suggest links between two providers
   */
  export async function suggestProviderLinks({ source_provider_product_id, providers = [] }) {
    if (isDummyMode()) return { success: true, data: [] };
    try {
      const supabase = getSupabase();

      // 1. Get source product
      const { data: source, error: srcError } = await supabase
        .from('provider_products')
        .select('*')
        .eq('id', source_provider_product_id)
        .single();

      if (srcError) throw srcError;

      // 2. Get target products from other providers
      // Filter by providers list if provided
      let query = supabase.from('provider_products').select('*, providers(name)').neq('id', source_provider_product_id);

      if (providers.length > 0) {
        query = query.in('provider_id', providers);
      }

      // Optimization: Text search
      const searchTerms = source.name.split(' ').filter(w => w.length > 3).slice(0, 2).join(' ') || source.name;
      query = query.textSearch('name', searchTerms, { config: 'english', type: 'websearch' }).limit(50);

      const { data: targets, error: tgtError } = await query;
      if (tgtError) throw tgtError;

      // 3. Compute scores
      const results = (targets || []).map(target => {
        const textSim = utils.textSimilarity(source.name, target.name);
        const priceNearness = utils.priceNearness(source.pvp, target.pvp);
        const catMatch = (source.category_id === target.category_id) ? 1.0 : 0.0;
        const logisticsBonus = (target.is_dropshipping ? 0.05 : 0) + (target.lead_time_days <= 2 ? 0.05 : 0);

        const score = utils.calculateMatchScore(textSim, catMatch, priceNearness, logisticsBonus);

        // Determine relation type suggestion
        let relation = 'none';
        if (score >= 0.90) relation = 'exact';
        else if (score >= 0.70) relation = 'similar';

        return {
          target_product: target,
          score: score.toFixed(2),
          relation_suggested: relation,
          details: { textSim, priceNearness, logisticsBonus }
        };
      }).sort((a, b) => b.score - a.score).filter(x => x.score > 0.5);

      return { success: true, data: results, source };
    } catch (error) {
      return handleError(error, 'sugerir links proveedores');
    }
  }

export default {
  getKPIs,
  getSalesDaily,
  getTopCategories,
  getTopProviders,
  getProviders,
  getProvider,
  createProvider,
  updateProvider,
  deleteProvider,
  getCategories,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductPrices,
  getComparative,
  getSettings,
  saveSettings,
  uploadIngestFile,
  triggerN8nIngest,
  getIngestHistory,
  createIngestRecord,
  getDailySales,
  getDailySaleByDate,
  createDailySale,
  updateDailySale,
  deleteDailySale,
  getSalesTransactions,
  getSalesTransaction,
  createSalesTransaction,
  createSalesTransactionsBulk,
  updateSalesTransaction,
  deleteSalesTransaction,
  processSalesCSV,

  // NEW ARCHITECTURE: Re-export from api-extensions
  listScouting: apiExtensions.listScouting,
  getScoutingItem: apiExtensions.getScoutingItem,
  createScoutingItem: apiExtensions.createScoutingItem,
  updateScoutingItem: apiExtensions.updateScoutingItem,
  deleteScoutingItem: apiExtensions.deleteScoutingItem,
  upsertScoutingItems: apiExtensions.upsertScoutingItems,
  getScoutingPriceHistory: apiExtensions.getScoutingPriceHistory,

  listCategoryMapExternal: apiExtensions.listCategoryMapExternal,
  createCategoryMapping: apiExtensions.createCategoryMapping,

  suggestCandidatesForScouting: apiExtensions.suggestCandidatesForScouting,
  getProductCandidates: apiExtensions.getProductCandidates,
  saveCandidate: apiExtensions.saveCandidate,

  listOpportunities: apiExtensions.listOpportunities,

  getProviderProducts: apiExtensions.getProviderProducts,
  getProviderProduct: apiExtensions.getProviderProduct,
  createProviderProduct: apiExtensions.createProviderProduct,
  updateProviderProduct: apiExtensions.updateProviderProduct,
  deleteProviderProduct: apiExtensions.deleteProviderProduct,
  searchProviderProducts: apiExtensions.searchProviderProducts,
  getProviderPriceHistory: apiExtensions.getProviderPriceHistory,
  getProviderPriceLatest: apiExtensions.getProviderPriceLatest,

  saveProviderLink: apiExtensions.saveProviderLink,

  getTrafficDaily: apiExtensions.getTrafficDaily,
  upsertTrafficDaily: apiExtensions.upsertTrafficDaily,

  getAdSpendDaily: apiExtensions.getAdSpendDaily,
  upsertAdSpendDaily: apiExtensions.upsertAdSpendDaily,

  upsertProviderProducts: apiExtensions.upsertProviderProducts,

  suggestProviderLinks,

  getTaxRate: apiExtensions.getTaxRate,
  updateTaxRate: apiExtensions.updateTaxRate,

  getBuyDecisions: apiExtensions.getBuyDecisions,
  createBuyDecision: apiExtensions.createBuyDecision,
  updateBuyDecision: apiExtensions.updateBuyDecision
};

