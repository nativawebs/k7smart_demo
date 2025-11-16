/**
 * Authentication Module
 * Handles Supabase authentication
 */

import state from './state.js';
import { showToast, showLoading, hideLoading } from './utils.js';
import { config } from '../config.js';

let supabaseClient = null;

/**
 * Initialize Supabase client
 */
export function initSupabase(url = config.supabaseUrl, key = config.supabaseAnonKey) {
  if (typeof supabase === 'undefined') {
    console.error('Supabase library not loaded');
    return null;
  }
  
  supabaseClient = supabase.createClient(url, key);
  return supabaseClient;
}

/**
 * Get Supabase client
 */
export function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = initSupabase();
  }
  return supabaseClient;
}

/**
 * Sign in with email and password
 */
export async function signIn(email, password) {
  try {
    showLoading('Iniciando sesión...');
    
    const client = getSupabase();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    });
    
    hideLoading();
    
    if (error) {
      console.error('Sign in error:', error);
      showToast(error.message || 'Error al iniciar sesión', 'error');
      return { success: false, error };
    }
    
    if (data.user) {
      state.setUser(data.user);
      showToast('Sesión iniciada correctamente', 'success');
      return { success: true, user: data.user };
    }
    
    return { success: false, error: 'No user returned' };
  } catch (error) {
    hideLoading();
    console.error('Sign in exception:', error);
    showToast('Error al iniciar sesión', 'error');
    return { success: false, error };
  }
}

/**
 * Sign out
 */
export async function signOut() {
  try {
    showLoading('Cerrando sesión...');
    
    const client = getSupabase();
    const { error } = await client.auth.signOut();
    
    hideLoading();
    
    if (error) {
      console.error('Sign out error:', error);
      showToast('Error al cerrar sesión', 'error');
      return { success: false, error };
    }
    
    state.clearUser();
    showToast('Sesión cerrada correctamente', 'success');
    
    // Redirect to login
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 500);
    
    return { success: true };
  } catch (error) {
    hideLoading();
    console.error('Sign out exception:', error);
    showToast('Error al cerrar sesión', 'error');
    return { success: false, error };
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const client = getSupabase();
    const { data, error } = await client.auth.getSession();
    
    if (error) {
      console.error('Get session error:', error);
      return null;
    }
    
    return data.session;
  } catch (error) {
    console.error('Get session exception:', error);
    return null;
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    const client = getSupabase();
    const { data, error } = await client.auth.getUser();
    
    if (error) {
      console.error('Get user error:', error);
      return null;
    }
    
    if (data.user) {
      state.setUser(data.user);
    }
    
    return data.user;
  } catch (error) {
    console.error('Get user exception:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await getSession();
  return session !== null;
}

/**
 * Require authentication (redirect to login if not authenticated)
 */
export async function requireAuth() {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    // Save current URL to redirect back after login
    sessionStorage.setItem('k7_redirect_after_login', window.location.pathname);
    window.location.href = '/login.html';
    return false;
  }
  
  // Get and store user
  await getCurrentUser();
  return true;
}

/**
 * Redirect after login
 */
export function redirectAfterLogin() {
  const redirectUrl = sessionStorage.getItem('k7_redirect_after_login');
  sessionStorage.removeItem('k7_redirect_after_login');
  
  if (redirectUrl && redirectUrl !== '/login.html') {
    window.location.href = redirectUrl;
  } else {
    window.location.href = '/index.html';
  }
}

/**
 * Setup auth state listener
 */
export function setupAuthListener() {
  const client = getSupabase();
  
  client.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);
    
    if (event === 'SIGNED_IN') {
      state.setUser(session.user);
    } else if (event === 'SIGNED_OUT') {
      state.clearUser();
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('login.html')) {
        window.location.href = '/login.html';
      }
    } else if (event === 'TOKEN_REFRESHED') {
      console.log('Token refreshed');
    } else if (event === 'USER_UPDATED') {
      state.setUser(session.user);
    }
  });
}

/**
 * Reset password
 */
export async function resetPassword(email) {
  try {
    showLoading('Enviando correo...');
    
    const client = getSupabase();
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password.html`
    });
    
    hideLoading();
    
    if (error) {
      console.error('Reset password error:', error);
      showToast(error.message || 'Error al enviar correo', 'error');
      return { success: false, error };
    }
    
    showToast('Correo de recuperación enviado', 'success');
    return { success: true };
  } catch (error) {
    hideLoading();
    console.error('Reset password exception:', error);
    showToast('Error al enviar correo', 'error');
    return { success: false, error };
  }
}

/**
 * Update password
 */
export async function updatePassword(newPassword) {
  try {
    showLoading('Actualizando contraseña...');
    
    const client = getSupabase();
    const { error } = await client.auth.updateUser({
      password: newPassword
    });
    
    hideLoading();
    
    if (error) {
      console.error('Update password error:', error);
      showToast(error.message || 'Error al actualizar contraseña', 'error');
      return { success: false, error };
    }
    
    showToast('Contraseña actualizada correctamente', 'success');
    return { success: true };
  } catch (error) {
    hideLoading();
    console.error('Update password exception:', error);
    showToast('Error al actualizar contraseña', 'error');
    return { success: false, error };
  }
}

/**
 * Initialize auth module
 */
export function initAuth() {
  // Initialize Supabase
  initSupabase();
  
  // Setup auth listener
  setupAuthListener();
  
  // Check if on login page
  const isLoginPage = window.location.pathname.includes('login.html');
  
  if (!isLoginPage) {
    // Require authentication for all other pages
    requireAuth();
  }
}

// Auto-initialize if not on login page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.includes('login.html')) {
      initAuth();
    }
  });
} else {
  if (!window.location.pathname.includes('login.html')) {
    initAuth();
  }
}

export default {
  initSupabase,
  getSupabase,
  signIn,
  signOut,
  getSession,
  getCurrentUser,
  isAuthenticated,
  requireAuth,
  redirectAfterLogin,
  setupAuthListener,
  resetPassword,
  updatePassword,
  initAuth
};
