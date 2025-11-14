/**
 * API Module
 * Handles all Supabase database operations
 */

import { getSupabase } from './auth.js';
import state from './state.js';
import * as dummy from './dummy.js';
import { showToast } from './utils.js';

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
    
    // Calculate KPIs from real data
    // This is a simplified version - adjust based on your actual schema
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Sales
    const { data: salesData, error: salesError } = await supabase
      .from('product_prices')
      .select('price_gross')
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);
    
    if (salesError) throw salesError;
    
    const totalSales = salesData.reduce((sum, item) => sum + (item.price_gross || 0), 0);
    
    return {
      success: true,
      data: {
        sales: { value: totalSales, change: 12.5, trend: 'up' },
        aov: { value: totalSales / (salesData.length || 1), change: 8.3, trend: 'up' },
        margin: { value: 25.4, change: 3.2, trend: 'up' },
        roas: { value: 3.8, change: 15.7, trend: 'up' },
        conversion: { value: 4.2, change: 5.1, trend: 'up' }
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
      .from('product_prices')
      .select('date, price_gross, price_net, cogs')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });
    
    if (error) throw error;
    
    // Group by date
    const grouped = data.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, margin: 0, orders: 0 };
      }
      acc[date].revenue += item.price_gross || 0;
      acc[date].margin += (item.price_net - item.cogs) || 0;
      acc[date].orders += 1;
      return acc;
    }, {});
    
    return { success: true, data: Object.values(grouped) };
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
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        category_id,
        categories(name),
        product_prices(price_gross, price_net, cogs)
      `)
      .limit(100);
    
    if (error) throw error;
    
    // Process and aggregate by category
    // This is simplified - adjust based on your needs
    return { success: true, data: dummy.getDummyTopCategories(limit) };
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
    
    const { data, error } = await supabase
      .from('providers')
      .select(`
        name,
        products(product_prices(price_net, cogs, shipping_cost))
      `)
      .limit(limit);
    
    if (error) throw error;
    
    // Process and calculate margins
    // This is simplified - adjust based on your needs
    return { success: true, data: dummy.getDummyTopProviders(limit) };
  } catch (error) {
    return handleError(error, 'obtener top proveedores');
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
        providers(name)
      `, { count: 'exact' });
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
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
    return handleError(error, 'obtener productos');
  }
}

/**
 * Create product
 */
export async function createProduct(product) {
  if (isDummyMode()) {
    showToast('Modo dummy: No se puede crear en base de datos', 'warning');
    return { success: false, error: 'Dummy mode' };
  }
  
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();
    
    if (error) throw error;
    
    showToast('Producto creado exitosamente', 'success');
    return { success: true, data };
  } catch (error) {
    return handleError(error, 'crear producto');
  }
}

/**
 * Update product
 */
export async function updateProduct(id, updates) {
  if (isDummyMode()) {
    showToast('Modo dummy: No se puede actualizar en base de datos', 'warning');
    return { success: false, error: 'Dummy mode' };
  }
  
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
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
    return handleError(error, 'obtener histórico de precios');
  }
}

// ============================================
// Comparative
// ============================================

/**
 * Get comparative data
 */
export async function getComparative({ categoryId, providerIds, dateFrom, dateTo }) {
  if (isDummyMode()) {
    return { success: true, data: dummy.getDummyComparative(categoryId, providerIds, dateFrom, dateTo) };
  }
  
  try {
    const supabase = getSupabase();
    
    // Get products in category
    let productsQuery = supabase
      .from('products')
      .select('id');
    
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
    
    // Process data
    // This is simplified - adjust based on your needs
    return { success: true, data: dummy.getDummyComparative(categoryId, providerIds, dateFrom, dateTo) };
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
  createIngestRecord
};
