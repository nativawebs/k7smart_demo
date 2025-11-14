/**
 * Categories View
 */
import state from '../modules/state.js';
import * as api from '../modules/api.js';
import { showToast, showLoading, hideLoading, confirm } from '../modules/utils.js';
import { signOut, getCurrentUser, initSupabase } from '../modules/auth.js';

let editingCategoryId = null;
let categoryModal = null;

async function init() {
  try {
    try {
      const configModule = await import('../config.js');
      if (configModule.config) initSupabase(configModule.config.supabaseUrl, configModule.config.supabaseAnonKey);
    } catch (e) {}
    
    const user = await getCurrentUser();
    if (user) document.getElementById('user-email').textContent = user.email;
    
    categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));
    setupEventListeners();
    updateDummyUI();
    await loadCategories();
  } catch (error) {
    console.error('Error initializing categories:', error);
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
  
  document.getElementById('new-category-btn')?.addEventListener('click', () => openCategoryModal());
  document.getElementById('category-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveCategory();
  });
  
  document.getElementById('category-name')?.addEventListener('input', (e) => {
    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    document.getElementById('category-slug').value = slug;
  });
  
  state.subscribe('dummyMode', () => {
    updateDummyUI();
    loadCategories();
  });
}

function updateDummyUI() {
  const isDummy = state.getState().dummyMode;
  const badge = document.getElementById('dummy-badge');
  if (badge) badge.style.display = isDummy ? 'flex' : 'none';
}

async function loadCategories() {
  const tbody = document.getElementById('categories-table-body');
  tbody.innerHTML = '<tr><td colspan="5" class="text-center py-5"><div class="spinner-border text-primary"></div></td></tr>';
  
  const result = await api.getCategories({ page: 1, limit: 100 });
  
  if (result.success) {
    renderCategories(result.data);
    updateParentSelect(result.data);
  }
}

function renderCategories(categories) {
  const tbody = document.getElementById('categories-table-body');
  
  if (categories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-5 text-muted"><i class="bi bi-inbox fs-1"></i><p class="mt-2">No hay categorías</p></td></tr>';
    return;
  }
  
  tbody.innerHTML = categories.map(c => `
    <tr>
      <td><div class="fw-semibold">${c.name}</div></td>
      <td><code>${c.slug}</code></td>
      <td>${c.parent_id ? categories.find(p => p.id === c.parent_id)?.name || '-' : '-'}</td>
      <td><span class="badge ${c.active ? 'bg-success' : 'bg-secondary'}">${c.active ? 'Activa' : 'Inactiva'}</span></td>
      <td class="text-end">
        <div class="table-actions">
          <button class="btn btn-sm btn-icon btn-outline-primary" onclick="window.editCategory('${c.id}')" title="Editar"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-icon btn-outline-danger" onclick="window.deleteCategory('${c.id}')" title="Eliminar"><i class="bi bi-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updateParentSelect(categories) {
  const select = document.getElementById('category-parent');
  if (select) {
    select.innerHTML = '<option value="">Sin padre (categoría raíz)</option>' + 
      categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
}

function openCategoryModal(category = null) {
  editingCategoryId = category?.id || null;
  document.getElementById('categoryModalLabel').textContent = category ? 'Editar Categoría' : 'Nueva Categoría';
  
  if (category) {
    document.getElementById('category-name').value = category.name || '';
    document.getElementById('category-slug').value = category.slug || '';
    document.getElementById('category-parent').value = category.parent_id || '';
    document.getElementById('category-active').checked = category.active !== false;
  } else {
    document.getElementById('category-form').reset();
  }
  
  categoryModal.show();
}

window.editCategory = async function(id) {
  showLoading('Cargando...');
  const result = await api.getCategories({ page: 1, limit: 100 });
  hideLoading();
  if (result.success) {
    const category = result.data.find(c => c.id === id);
    if (category) openCategoryModal(category);
  }
};

window.deleteCategory = async function(id) {
  const confirmed = await confirm('¿Eliminar esta categoría?', 'Confirmar');
  if (confirmed) {
    showLoading('Eliminando...');
    const result = await api.deleteCategory(id);
    hideLoading();
    if (result.success) await loadCategories();
  }
};

async function saveCategory() {
  const categoryData = {
    name: document.getElementById('category-name').value.trim(),
    slug: document.getElementById('category-slug').value.trim(),
    parent_id: document.getElementById('category-parent').value || null,
    active: document.getElementById('category-active').checked
  };
  
  if (!categoryData.name || !categoryData.slug) {
    showToast('Completa los campos requeridos', 'warning');
    return;
  }
  
  showLoading(editingCategoryId ? 'Actualizando...' : 'Creando...');
  const result = editingCategoryId ? 
    await api.updateCategory(editingCategoryId, categoryData) : 
    await api.createCategory(categoryData);
  hideLoading();
  
  if (result.success) {
    categoryModal.hide();
    await loadCategories();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
