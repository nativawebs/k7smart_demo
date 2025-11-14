/**
 * Configuration File
 * IMPORTANTE: Este archivo contiene credenciales reales de Supabase
 * NO subir a repositorios públicos
 */

export const config = {
  // Supabase Configuration
  // Reemplaza estos valores con tus credenciales reales de Supabase
  supabaseUrl: 'https://qvpebnzbjgnneieopitv.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cGVibnpiamdubmVpZW9waXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NzkwMjAsImV4cCI6MjA3ODU1NTAyMH0.mrIph7DHmgM2o7i5UiCy0CwMUJ-N70QGL_LlfQWfLaE',
  
  // n8n Webhook (opcional)
  n8nIngestUrl: 'https://n8n.srv888919.hstgr.cloud/webhook-test/ingest',
  
  // App Settings
  defaultTaxRate: 0.15,
  
  // PlacetoPay (for future use)
  placetopayLogin: '',
  placetopayTrankey: ''
};

// INSTRUCCIONES PARA INTEGRAR SUPABASE:
// 
// 1. Ve a https://supabase.com y crea un proyecto (si no lo has hecho)
// 
// 2. Obtén tus credenciales:
//    - En el dashboard de Supabase, ve a Settings > API
//    - Copia "Project URL" y pégalo en supabaseUrl
//    - Copia "anon public" key y pégala en supabaseAnonKey
//
// 3. Crea las tablas necesarias ejecutando este SQL en SQL Editor:
//
/*

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Proveedores
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  ruc TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  commission_rate NUMERIC,
  zones TEXT,
  shipping_cost_policy TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Categorías
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Productos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  default_provider_id UUID REFERENCES providers(id),
  cogs NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Precios de Productos
CREATE TABLE IF NOT EXISTS product_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  provider_id UUID REFERENCES providers(id),
  date DATE NOT NULL,
  price_net NUMERIC NOT NULL,
  tax_rate NUMERIC DEFAULT 0.15,
  price_gross NUMERIC,
  cogs NUMERIC,
  shipping_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Configuración
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Historial de Ingesta
CREATE TABLE IF NOT EXISTS ingest_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  filetype TEXT NOT NULL,
  file_url TEXT,
  target_table TEXT,
  status TEXT DEFAULT 'pending',
  log_url TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingest_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Permitir acceso a usuarios autenticados
CREATE POLICY "Allow authenticated users" ON providers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON categories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON products
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON product_prices
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON settings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON ingest_history
  FOR ALL USING (auth.role() = 'authenticated');

-- Insertar configuración inicial
INSERT INTO settings (key, value, updated_at) VALUES
  ('tax_rate', '{"value": 0.15, "label": "IVA"}', NOW()),
  ('dummy_mode', '{"enabled": true}', NOW()),
  ('n8n_webhook', '{"url": ""}', NOW()),
  ('placetopay_login', '{"value": ""}', NOW()),
  ('placetopay_trankey', '{"value": ""}', NOW())
ON CONFLICT (key) DO NOTHING;

*/
//
// 4. Crear usuario admin:
//    - Ve a Authentication > Users
//    - Click en "Add user" > "Create new user"
//    - Ingresa email y contraseña
//    - Guarda las credenciales
//
// 5. Crear bucket de Storage (para ingesta de archivos):
//    - Ve a Storage
//    - Click en "New bucket"
//    - Nombre: "ingest"
//    - Público: No (privado)
//    - Click en "Create bucket"
//
// 6. Configurar políticas de Storage:
//    - En el bucket "ingest", ve a Policies
//    - Agrega política para INSERT: authenticated users
//    - Agrega política para SELECT: authenticated users
//
// 7. Guarda este archivo y recarga la aplicación
