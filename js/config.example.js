/**
 * Configuration File
 * Copy this file to config.js and update with your actual credentials
 */

export const config = {
  // Supabase Configuration
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseAnonKey: 'your-anon-key-here',
  
  // n8n Webhook
  n8nIngestUrl: 'https://your-n8n-instance.com/webhook/ingest',
  
  // App Settings
  defaultTaxRate: 0.15,
  
  // PlacetoPay (for future use)
  placetopayLogin: '',
  placetopayTrankey: ''
};
