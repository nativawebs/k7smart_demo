/**
 * API Extensions Module
 * New architecture functions for Scouting, Matching, Traffic, and Ad Spend
 */

import { getSupabase } from './auth.js';
import { utils } from './utils.js';
import { showToast } from './utils.js';

// Helper function for error handling
function handleError(error, operation = 'operación') {
    console.error(`Error en ${operation}:`, error);
    showToast(`Error en ${operation}: ${error.message}`, 'error');
    return { success: false, error: error.message };
}

// ============================================
// NEW ARCHITECTURE: Traffic & Ad Spend
// ============================================

/**
 * Get traffic daily data
 */
export async function getTrafficDaily({ dateFrom, dateTo, source, page = 1, limit = 30 } = {}) {
    try {
        const supabase = getSupabase();
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('traffic_daily')
            .select('*', { count: 'exact' });

        if (dateFrom) {
            query = query.gte('date', dateFrom);
        }

        if (dateTo) {
            query = query.lte('date', dateTo);
        }

        if (source) {
            query = query.eq('source', source);
        }

        query = query.order('date', { ascending: false });
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
        return handleError(error, 'obtener tráfico diario');
    }
}

/**
 * Upsert traffic daily data (bulk)
 */
export async function upsertTrafficDaily(trafficData) {
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('traffic_daily')
            .upsert(trafficData, {
                onConflict: 'date,source',
                ignoreDuplicates: false
            })
            .select();

        if (error) throw error;

        showToast(`${data.length} registros de tráfico procesados`, 'success');
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'procesar tráfico diario');
    }
}

/**
 * Get ad spend daily data
 */
export async function getAdSpendDaily({ dateFrom, dateTo, channel, page = 1, limit = 30 } = {}) {
    try {
        const supabase = getSupabase();
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('ad_spend_daily')
            .select('*', { count: 'exact' });

        if (dateFrom) {
            query = query.gte('date', dateFrom);
        }

        if (dateTo) {
            query = query.lte('date', dateTo);
        }

        if (channel) {
            query = query.eq('channel', channel);
        }

        query = query.order('date', { ascending: false });
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
        return handleError(error, 'obtener gasto publicitario');
    }
}

/**
 * Upsert ad spend daily data (bulk)
 */
export async function upsertAdSpendDaily(adSpendData) {
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('ad_spend_daily')
            .upsert(adSpendData, {
                onConflict: 'date,channel',
                ignoreDuplicates: false
            })
            .select();

        if (error) throw error;

        showToast(`${data.length} registros de gasto publicitario procesados`, 'success');
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'procesar gasto publicitario');
    }
}

// ============================================
// NEW ARCHITECTURE: Provider Products
// ============================================

/**
 * Get provider products
 */
export async function getProviderProducts({ providerId, page = 1, limit = 20, search = '' } = {}) {
    try {
        const supabase = getSupabase();
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('provider_products')
            .select(`
        *,
        providers(name, ruc),
        categories(name, slug)
      `, { count: 'exact' });

        if (providerId) {
            query = query.eq('provider_id', providerId);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,sku_ext.ilike.%${search}%`);
        }

        query = query.order('updated_at', { ascending: false });
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
        return handleError(error, 'obtener productos de proveedor');
    }
}

/**
 * Get provider product by ID
 */
export async function getProviderProduct(id) {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('provider_products')
            .select(`
        *,
        providers(name, ruc),
        categories(name, slug)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        return handleError(error, 'obtener producto de proveedor');
    }
}

/**
 * Create provider product
 */
export async function createProviderProduct(productData) {
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('provider_products')
            .insert([productData])
            .select()
            .single();

        if (error) throw error;

        showToast('Producto de proveedor creado exitosamente', 'success');
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'crear producto de proveedor');
    }
}

/**
 * Update provider product
 */
export async function updateProviderProduct(id, updates) {
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('provider_products')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        showToast('Producto de proveedor actualizado exitosamente', 'success');
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'actualizar producto de proveedor');
    }
}

/**
 * Delete provider product
 */
export async function deleteProviderProduct(id) {
    try {
        const supabase = getSupabase();

        const { error } = await supabase
            .from('provider_products')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast('Producto de proveedor eliminado exitosamente', 'success');
        return { success: true };
    } catch (error) {
        return handleError(error, 'eliminar producto de proveedor');
    }
}

/**
 * Upsert provider products (bulk)
 */
export async function upsertProviderProducts(productsData) {
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('provider_products')
            .upsert(productsData, {
                onConflict: 'provider_id,sku_ext',
                ignoreDuplicates: false
            })
            .select();

        if (error) throw error;

        showToast(`${data.length} productos de proveedor procesados`, 'success');
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'procesar productos de proveedor');
    }
}

/**
 * Get provider price history
 */
export async function getProviderPriceHistory(providerProductId, days = 30) {
    try {
        const supabase = getSupabase();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('provider_price_history')
            .select('*')
            .eq('provider_product_id', providerProductId)
            .gte('date', startDate.toISOString().split('T')[0])
            .order('date', { ascending: false });

        if (error) throw error;

        return { success: true, data: data || [] };
    } catch (error) {
        return handleError(error, 'obtener histórico de precios');
    }
}

// ============================================
// NEW ARCHITECTURE: Scouting Items
// ============================================

/**
 * Get scouting items (list)
 */
export async function listScouting({ platform, page = 1, limit = 20, search = '', dateFrom } = {}) {
    try {
        const supabase = getSupabase();
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('scouting_items')
            .select('*', { count: 'exact' });

        if (platform) {
            query = query.eq('platform', platform);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,category_external.ilike.%${search}%`);
        }

        if (dateFrom) {
            query = query.gte('collected_at', dateFrom);
        }

        query = query.order('collected_at', { ascending: false });
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
        return handleError(error, 'obtener items de scouting');
    }
}

/**
 * Get scouting item by ID
 */
export async function getScoutingItem(id) {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('scouting_items')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        return handleError(error, 'obtener item de scouting');
    }
}

/**
 * Create scouting item
 */
export async function createScoutingItem(itemData) {
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('scouting_items')
            .insert([itemData])
            .select()
            .single();

        if (error) throw error;

        showToast('Item de scouting creado exitosamente', 'success');
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'crear item de scouting');
    }
}

/**
 * Update scouting item
 */
export async function updateScoutingItem(id, updates) {
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('scouting_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        showToast('Item de scouting actualizado exitosamente', 'success');
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'actualizar item de scouting');
    }
}

/**
 * Delete scouting item
 */
export async function deleteScoutingItem(id) {
    try {
        const supabase = getSupabase();

        const { error } = await supabase
            .from('scouting_items')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast('Item de scouting eliminado exitosamente', 'success');
        return { success: true };
    } catch (error) {
        return handleError(error, 'eliminar item de scouting');
    }
}

/**
 * Upsert scouting items (bulk)
 */
export async function upsertScoutingItems(itemsData) {
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('scouting_items')
            .upsert(itemsData, {
                onConflict: 'platform,url',
                ignoreDuplicates: false
            })
            .select();

        if (error) throw error;

        showToast(`${data.length} items de scouting procesados`, 'success');
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'procesar items de scouting');
    }
}

/**
 * Get scouting price history
 */
export async function getScoutingPriceHistory(scoutingItemId, days = 30) {
    try {
        const supabase = getSupabase();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('scouting_price_history')
            .select('*')
            .eq('scouting_item_id', scoutingItemId)
            .gte('date', startDate.toISOString().split('T')[0])
            .order('date', { ascending: false });

        if (error) throw error;

        return { success: true, data: data || [] };
    } catch (error) {
        return handleError(error, 'obtener histórico de precios de scouting');
    }
}

// ============================================
// NEW ARCHITECTURE: Matching & Decisions
// ============================================

/**
 * Suggest candidates for a scouting item using fuzzy matching
 */
export async function suggestCandidatesForScouting(scoutingItemId, options = {}) {
    try {
        const { threshold = 0.6, limit = 10 } = options;

        // Get scouting item
        const scoutingResult = await getScoutingItem(scoutingItemId);
        if (!scoutingResult.success) throw new Error('Scouting item not found');

        const scoutingItem = scoutingResult.data;

        // Get all provider products
        const productsResult = await getProviderProducts({ page: 1, limit: 1000 });
        if (!productsResult.success) throw new Error('Error loading provider products');

        const providerProducts = productsResult.data;

        // Get tax rate
        const taxRateResult = await getTaxRate();
        const taxRate = taxRateResult.success ? taxRateResult.data : 0.15;

        // Calculate match scores using fuzzy matching
        const candidates = providerProducts.map(providerProduct => {
            // Calculate category match (1 if same, 0 if different)
            const categoryMatch = scoutingItem.category_external && providerProduct.categories?.slug
                ? (scoutingItem.category_external.toLowerCase().includes(providerProduct.categories.slug.toLowerCase()) ? 1 : 0)
                : 0;

            // Calculate overall score using fuzzy matching
            const score = utils.calculateMatchScore(scoutingItem, providerProduct, categoryMatch);

            // Calculate potential margin
            const margin = utils.calculatePotentialMargin(
                scoutingItem.pvp,
                providerProduct.cost,
                taxRate
            );

            return {
                scouting_item_id: scoutingItemId,
                provider_product_id: providerProduct.id,
                provider_product: providerProduct,
                score,
                matched_on: {
                    name_similarity: utils.fuzzyMatch(scoutingItem.name, providerProduct.name),
                    category_match: categoryMatch
                },
                potential_margin_abs: margin.margin_abs,
                potential_margin_pct: margin.margin_pct,
                is_dropshipping: providerProduct.is_dropshipping,
                lead_time_days: providerProduct.lead_time_days
            };
        })
            .filter(c => c.score >= threshold)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return { success: true, data: candidates };
    } catch (error) {
        return handleError(error, 'sugerir candidatos');
    }
}

/**
 * Get product candidates for a scouting item
 */
export async function getProductCandidates(scoutingItemId) {
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('product_candidates')
            .select(`
        *,
        scouting_items(*),
        provider_products(*, providers(name))
      `)
            .eq('scouting_item_id', scoutingItemId)
            .order('score', { ascending: false });

        if (error) throw error;

        return { success: true, data: data || [] };
    } catch (error) {
        return handleError(error, 'obtener candidatos');
    }
}

/**
 * Save a candidate match
 */
export async function saveCandidate(candidateData) {
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('product_candidates')
            .upsert([candidateData], {
                onConflict: 'scouting_item_id,provider_product_id'
            })
            .select()
            .single();

        if (error) throw error;

        showToast('Candidato guardado exitosamente', 'success');
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'guardar candidato');
    }
}

/**
 * Save provider product link
 */
export async function saveProviderLink(linkData) {
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('provider_product_links')
            .upsert([linkData], {
                onConflict: 'source_provider_product_id,target_provider_product_id'
            })
            .select()
            .single();

        if (error) throw error;

        showToast('Vínculo guardado exitosamente', 'success');
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'guardar vínculo');
    }
}

/**
 * Get buy decisions
 */
export async function getBuyDecisions({ status, page = 1, limit = 20 } = {}) {
    try {
        const supabase = getSupabase();
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('buy_decisions')
            .select(`
        *,
        product_candidates(
          *,
          scouting_items(*),
          provider_products(*, providers(name))
        )
      `, { count: 'exact' });

        if (status) {
            query = query.eq('status', status);
        }

        query = query.order('decided_at', { ascending: false });
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
        return handleError(error, 'obtener decisiones de compra');
    }
}

/**
 * Create buy decision
 */
export async function createBuyDecision(decisionData) {
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('buy_decisions')
            .insert([decisionData])
            .select()
            .single();

        if (error) throw error;

        showToast('Decisión de compra registrada exitosamente', 'success');
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'crear decisión de compra');
    }
}

/**
 * Update buy decision
 */
export async function updateBuyDecision(id, updates) {
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('buy_decisions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        showToast('Decisión de compra actualizada exitosamente', 'success');
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'actualizar decisión de compra');
    }
}

// ============================================
// NEW ARCHITECTURE: Category Mapping
// ============================================

/**
 * List category mappings
 */
export async function listCategoryMapExternal({ platform } = {}) {
    try {
        const supabase = getSupabase();

        let query = supabase
            .from('category_map_external')
            .select(`
        *,
        categories(name, slug)
      `);

        if (platform) {
            query = query.eq('platform', platform);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, data: data || [] };
    } catch (error) {
        return handleError(error, 'obtener mapeo de categorías');
    }
}

/**
 * Create category mapping
 */
export async function createCategoryMapping(mappingData) {
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('category_map_external')
            .upsert([mappingData], {
                onConflict: 'platform,category_external'
            })
            .select()
            .single();

        if (error) throw error;

        showToast('Mapeo de categoría creado exitosamente', 'success');
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'crear mapeo de categoría');
    }
}

// ============================================
// HELPERS
// ============================================

/**
 * Get tax rate from settings
 */
export async function getTaxRate() {
    try {
        // Import getSettings from main api.js
        const { getSettings } = await import('./api.js');
        const result = await getSettings();
        if (result.success && result.data?.tax_rate?.value) {
            return { success: true, data: result.data.tax_rate.value };
        }
        return { success: true, data: 0.15 }; // Default 15%
    } catch (error) {
        return { success: true, data: 0.15 }; // Default on error
    }
}

/**
 * Update tax rate
 */
export async function updateTaxRate(rate) {
    try {
        const { saveSettings } = await import('./api.js');
        const result = await saveSettings({
            tax_rate: { value: rate }
        });
        return result;
    } catch (error) {
        return handleError(error, 'actualizar tasa de IVA');
    }
}

/**
 * List margin opportunities (view)
 */
export async function listOpportunities({ minMarginPct = 15, limit = 50 } = {}) {
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('v_margin_opportunity')
            .select('*')
            .gte('potential_margin_pct', minMarginPct / 100)
            .order('potential_margin_abs', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return { success: true, data: data || [] };
    } catch (error) {
        return handleError(error, 'obtener oportunidades de margen');
    }
}

/**
 * Search provider products (for matching)
 */
export async function searchProviderProducts({ query, providerId, limit = 20 } = {}) {
    try {
        const supabase = getSupabase();

        let dbQuery = supabase
            .from('provider_products')
            .select(`
        *,
        providers(name),
        categories(name, slug)
      `);

        if (query) {
            dbQuery = dbQuery.or(`name.ilike.%${query}%,sku.ilike.%${query}%,sku_ext.ilike.%${query}%`);
        }

        if (providerId) {
            dbQuery = dbQuery.eq('provider_id', providerId);
        }

        dbQuery = dbQuery.limit(limit);

        const { data, error } = await dbQuery;

        if (error) throw error;

        return { success: true, data: data || [] };
    } catch (error) {
        return handleError(error, 'buscar productos de proveedor');
    }
}

/**
 * Get latest provider prices (view)
 */
export async function getProviderPriceLatest({ providerId } = {}) {
    try {
        const supabase = getSupabase();

        let query = supabase
            .from('v_provider_price_latest')
            .select('*');

        if (providerId) {
            query = query.eq('provider_id', providerId);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, data: data || [] };
    } catch (error) {
        return handleError(error, 'obtener últimos precios de proveedores');
    }
}
