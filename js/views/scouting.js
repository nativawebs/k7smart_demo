/**
 * Scouting View
 * Gestión de productos de competencia (benchmark) y matching con proveedores
 */
import state from '../modules/state.js';
import * as api from '../modules/api.js';
import { showToast, showLoading, hideLoading, formatCurrency, formatDate, confirm } from '../modules/utils.js';
import { signOut, getCurrentUser, initSupabase } from '../modules/auth.js';

let currentPage = 1;
const itemsPerPage = 20;
let currentScoutingItem = null;
let editingScoutingId = null;
let scoutingModal = null;

async function init() {
    try {
        try {
            const configModule = await import('../config.js');
            if (configModule.config) {
                initSupabase(configModule.config.supabaseUrl, configModule.config.supabaseAnonKey);
            }
        } catch (e) {
            console.log('Config not found');
        }
        
        const user = await getCurrentUser();
        if (user) {
            document.getElementById('user-email').textContent = user.email;
        }

        // Initialize modal
        const modalEl = document.getElementById('scoutingModal');
        scoutingModal = new bootstrap.Modal(modalEl);

        setupEventListeners();
        await loadScoutingItems();
    } catch (error) {
        console.error('Error initializing scouting:', error);
    }
}
function setupEventListeners() {
    // Sidebar toggle
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
        state.toggleSidebar();
    });

    // Dark mode toggle
    document.getElementById('dark-mode-toggle')?.addEventListener('click', () => {
        const isDark = state.toggleDarkMode();
        document.querySelector('#dark-mode-toggle i').className = isDark ? 'bi bi-sun' : 'bi bi-moon-stars';
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await signOut();
    });

    // New scouting item
    document.getElementById('new-scouting-btn')?.addEventListener('click', () => {
        openScoutingModal();
    });

    // Filter button
    document.getElementById('filter-btn')?.addEventListener('click', () => {
        currentPage = 1;
        loadScoutingItems();
    });

    // Search on Enter
    document.getElementById('search-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentPage = 1;
            loadScoutingItems();
        }
    });

    // Form submit
    document.getElementById('scouting-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveScoutingItem();
    });
}
/**
 * Open scouting modal for create/edit
 */
function openScoutingModal(item = null) {
    editingScoutingId = item?.id || null;
    document.getElementById('scoutingModalLabel').textContent = item ? 'Editar Producto Scouting' : 'Nuevo Producto Scouting';

    if (item) {
        document.getElementById('scouting-name').value = item.name || '';
        document.getElementById('scouting-platform').value = item.platform || '';
        document.getElementById('scouting-pvp').value = item.pvp || '';
        document.getElementById('scouting-url').value = item.url || '';
        document.getElementById('scouting-category').value = item.category_external || '';
        document.getElementById('scouting-currency').value = item.currency || 'USD';
        document.getElementById('scouting-stock').value = item.stock_estimate || '';
    } else {
        document.getElementById('scouting-form').reset();
        document.getElementById('scouting-currency').value = 'USD';
    }

    scoutingModal.show();
}

/**
 * Save scouting item (create or update)
 */
async function saveScoutingItem() {
    const itemData = {
        name: document.getElementById('scouting-name').value.trim(),
        platform: document.getElementById('scouting-platform').value,
        pvp: parseFloat(document.getElementById('scouting-pvp').value),
        url: document.getElementById('scouting-url').value.trim() || null,
        category_external: document.getElementById('scouting-category').value.trim() || null,
        currency: document.getElementById('scouting-currency').value,
        stock_estimate: document.getElementById('scouting-stock').value ? parseInt(document.getElementById('scouting-stock').value) : null
    };

    if (!itemData.name || !itemData.platform || !itemData.pvp) {
        showToast('Completa los campos requeridos', 'warning');
        return;
    }

    showLoading(editingScoutingId ? 'Actualizando...' : 'Creando...');

    const result = editingScoutingId
        ? await api.updateScoutingItem(editingScoutingId, itemData)
        : await api.createScoutingItem(itemData);

    hideLoading();

    if (result.success) {
        scoutingModal.hide();
        await loadScoutingItems();
    }
}

/**
 * Edit scouting item
 */
window.editScoutingItem = async function(id) {
    showLoading('Cargando...');
    const result = await api.getScoutingItem(id);
    hideLoading();
    
    if (result.success && result.data) {
        openScoutingModal(result.data);
    }
};

/**
 * Delete scouting item
 */
window.deleteScoutingItem = async function(id) {
    const confirmed = await confirm('¿Eliminar este producto de scouting?');
    if (!confirmed) return;

    showLoading('Eliminando...');
    const result = await api.deleteScoutingItem(id);
    hideLoading();

    if (result.success) {
        await loadScoutingItems();
    }
};
async function loadScoutingItems() {
    const tbody = document.getElementById('scouting-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-5"><div class="spinner-border text-primary"></div></td></tr>';
    const search = document.getElementById('search-input').value;
    const platform = document.getElementById('platform-filter').value;
    const dateFrom = document.getElementById('date-filter').value;
    const result = await api.listScouting({
        search,
        platform,
        dateFrom,
        page: currentPage,
        limit: itemsPerPage
    });
    if (result.success) {
        renderTable(result.data, result.total);
        renderPagination(result.total);
    } else {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-danger">Error al cargar datos</td></tr>';
    }
}
function renderTable(items, total) {
    const tbody = document.getElementById('scouting-table-body');
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-5 text-muted"><i class="bi bi-inbox fs-1"></i><p class="mt-2">No hay productos de scouting. Agrega uno para comenzar.</p></td></tr>';
        return;
    }
    
    tbody.innerHTML = items.map(item => `
    <tr>
      <td>
        <div class="fw-semibold">${item.name}</div>
        ${item.url ? `<a href="${item.url}" target="_blank" class="small text-decoration-none"><i class="bi bi-box-arrow-up-right"></i> Ver en ${item.platform}</a>` : ''}
      </td>
      <td><span class="badge bg-primary">${item.platform}</span></td>
      <td class="fw-bold text-success">${formatCurrency(item.pvp)} <small class="text-muted fw-normal">${item.currency}</small></td>
      <td><span class="badge bg-light text-dark border">${item.category_external || 'Sin categoría'}</span></td>
      <td>
        <span class="badge bg-secondary" id="match-status-${item.id}">Sin Match</span>
      </td>
      <td>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-primary match-btn" data-id="${item.id}" data-name="${item.name}" data-platform="${item.platform}" data-price="${item.pvp}" title="Comparar con proveedores">
            <i class="bi bi-arrow-left-right"></i> Comparar
          </button>
          <button class="btn btn-outline-secondary" onclick="window.editScoutingItem('${item.id}')" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-danger" onclick="window.deleteScoutingItem('${item.id}')" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
  
    document.querySelectorAll('.match-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            openMatchModal({
                id: btn.dataset.id,
                name: btn.dataset.name,
                platform: btn.dataset.platform,
                price: parseFloat(btn.dataset.price)
            });
        });
    });
    
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, total);
    document.getElementById('pagination-info').textContent = `Mostrando ${start}-${end} de ${total}`;
}
function renderPagination(total) {
    const totalPages = Math.ceil(total / itemsPerPage);
    const pagination = document.getElementById('pagination');
    let html = '';
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${currentPage - 1}">Anterior</a>
  </li>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<li class="page-item ${currentPage === i ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a>
      </li>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${currentPage + 1}">Siguiente</a>
  </li>`;
    pagination.innerHTML = html;
    pagination.querySelectorAll('a.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page);
            if (page && page !== currentPage && page > 0 && page <= totalPages) {
                currentPage = page;
                loadScoutingItems();
            }
        });
    });
}
async function openMatchModal(item) {
    currentScoutingItem = item;
    document.getElementById('modal-scouting-name').textContent = item.name;
    document.getElementById('modal-scouting-platform').textContent = item.platform;
    document.getElementById('modal-scouting-price').textContent = formatCurrency(item.price);
    const modal = new bootstrap.Modal(document.getElementById('matchModal'));
    modal.show();
    await loadCandidates(item.id);
}
async function loadCandidates(scoutingId) {
    const list = document.getElementById('candidates-list');
    const loader = document.getElementById('loading-candidates');
    list.innerHTML = '';
    loader.style.display = 'block';
    
    const result = await api.suggestCandidatesForScouting(scoutingId);
    loader.style.display = 'none';
    
    if (result.success && result.data.length > 0) {
        list.innerHTML = result.data.map(item => {
            const cand = item.provider_product;
            const score = item.score;
            const margin = item.potential_margin_pct || 0;
            
            let badgeClass = 'bg-secondary';
            if (score >= 0.9) badgeClass = 'bg-success';
            else if (score >= 0.7) badgeClass = 'bg-warning text-dark';
            
            let marginClass = 'text-muted';
            if (margin > 20) marginClass = 'text-success';
            else if (margin > 10) marginClass = 'text-warning';
            else if (margin > 0) marginClass = 'text-danger';
            
            return `
      <button type="button" class="list-group-item list-group-item-action candidate-item" onclick="selectCandidate('${cand.id}', ${score})">
        <div class="d-flex w-100 justify-content-between align-items-start">
          <div class="flex-grow-1">
            <h6 class="mb-1">${cand.name}</h6>
            <div class="d-flex gap-3 text-muted small">
              <span><i class="bi bi-building"></i> ${cand.providers?.name || 'Proveedor'}</span>
              <span><i class="bi bi-tag"></i> Costo: ${formatCurrency(cand.cost || 0)}</span>
              <span><i class="bi bi-cash"></i> PVP: ${formatCurrency(cand.pvp || 0)}</span>
            </div>
          </div>
          <div class="text-end">
            <span class="badge ${badgeClass} mb-1">${(score * 100).toFixed(0)}% Match</span>
            <div class="small ${marginClass} fw-bold">Margen: ${margin.toFixed(1)}%</div>
          </div>
        </div>
      </button>
    `}).join('');
        window.selectCandidate = (providerProductId, score) => saveMatch(providerProductId, score);
    } else {
        list.innerHTML = '<div class="alert alert-warning"><i class="bi bi-exclamation-triangle"></i> No se encontraron productos similares en tu catálogo de proveedores</div>';
    }
}
async function saveMatch(providerProductId, score) {
    if (!currentScoutingItem) return;
    if (!confirm('¿Confirmar match con este producto?')) return;
    showLoading('Guardando match...');
    const result = await api.saveCandidate({
        scouting_item_id: currentScoutingItem.id,
        provider_product_id: providerProductId,
        score: score || 1.0,
        matched_on: { type: 'manual' },
        notes: 'Match manual'
    });
    hideLoading();
    if (result.success) {
        showToast('Match guardado exitosamente', 'success');
        bootstrap.Modal.getInstance(document.getElementById('matchModal')).hide();
        loadScoutingItems();
    } else {
        showToast('Error al guardar match', 'error');
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
