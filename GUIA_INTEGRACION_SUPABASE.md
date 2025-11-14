# 🚀 Guía Completa de Integración con Supabase

Esta guía te llevará paso a paso para integrar tu panel de administración Kiosko7 con Supabase.

## 📋 Índice

1. [Crear Proyecto en Supabase](#1-crear-proyecto-en-supabase)
2. [Obtener Credenciales](#2-obtener-credenciales)
3. [Crear Tablas en la Base de Datos](#3-crear-tablas-en-la-base-de-datos)
4. [Configurar Row Level Security (RLS)](#4-configurar-row-level-security-rls)
5. [Crear Usuario Admin](#5-crear-usuario-admin)
6. [Configurar Storage](#6-configurar-storage)
7. [Configurar el Proyecto](#7-configurar-el-proyecto)
8. [Verificar la Integración](#8-verificar-la-integración)

---

## 1. Crear Proyecto en Supabase

### Paso 1.1: Registrarse en Supabase
1. Ve a [https://supabase.com](https://supabase.com)
2. Click en "Start your project"
3. Regístrate con GitHub, Google o email

### Paso 1.2: Crear Nuevo Proyecto
1. Click en "New Project"
2. Selecciona tu organización (o crea una nueva)
3. Completa los datos:
   - **Project name**: `kiosko7-admin` (o el nombre que prefieras)
   - **Database Password**: Genera una contraseña segura (guárdala!)
   - **Region**: Selecciona la más cercana a Uruguay (ej: `South America (São Paulo)`)
   - **Pricing Plan**: Free (suficiente para empezar)
4. Click en "Create new project"
5. Espera 2-3 minutos mientras se crea el proyecto

---

## 2. Obtener Credenciales

### Paso 2.1: Acceder a la Configuración
1. Una vez creado el proyecto, ve al dashboard
2. En el menú lateral, click en **Settings** (⚙️)
3. Click en **API**

### Paso 2.2: Copiar Credenciales
Verás dos secciones importantes:

#### Project URL
```
https://abcdefghijklmnop.supabase.co
```
**Copia esta URL completa**

#### Project API keys
Encontrarás dos keys:
- `anon` `public` - **Esta es la que necesitas** ✅
- `service_role` `secret` - **NO uses esta** ❌

**Copia la key `anon public`** (es una cadena larga que empieza con `eyJ...`)

### Paso 2.3: Guardar Credenciales
Abre el archivo `kiosko7-admin/js/config.js` y reemplaza:

```javascript
export const config = {
  supabaseUrl: 'https://abcdefghijklmnop.supabase.co', // ← Tu Project URL
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // ← Tu anon public key
  // ... resto de la configuración
};
```

---

## 3. Crear Tablas en la Base de Datos

### Paso 3.1: Abrir SQL Editor
1. En el menú lateral de Supabase, click en **SQL Editor**
2. Click en **New query**

### Paso 3.2: Ejecutar Script SQL
Copia y pega el siguiente script completo:

```sql
-- ============================================
-- KIOSKO7 ADMIN - SCHEMA COMPLETO
-- ============================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: PROVIDERS (Proveedores)
-- ============================================
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

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_providers_name ON providers(name);
CREATE INDEX IF NOT EXISTS idx_providers_ruc ON providers(ruc);
CREATE INDEX IF NOT EXISTS idx_providers_status ON providers(status);

-- ============================================
-- TABLA: CATEGORIES (Categorías)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(active);

-- ============================================
-- TABLA: PRODUCTS (Productos)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  default_provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  cogs NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_provider ON products(default_provider_id);

-- ============================================
-- TABLA: PRODUCT_PRICES (Precios de Productos)
-- ============================================
CREATE TABLE IF NOT EXISTS product_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  price_net NUMERIC NOT NULL,
  tax_rate NUMERIC DEFAULT 0.15,
  price_gross NUMERIC,
  cogs NUMERIC DEFAULT 0,
  shipping_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_product_prices_product ON product_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_provider ON product_prices(provider_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_date ON product_prices(date);

-- Trigger para calcular price_gross automáticamente
CREATE OR REPLACE FUNCTION calculate_price_gross()
RETURNS TRIGGER AS $$
BEGIN
  NEW.price_gross := NEW.price_net * (1 + NEW.tax_rate);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_price_gross
  BEFORE INSERT OR UPDATE ON product_prices
  FOR EACH ROW
  EXECUTE FUNCTION calculate_price_gross();

-- ============================================
-- TABLA: SETTINGS (Configuración)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_settings_timestamp
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- TABLA: INGEST_HISTORY (Historial de Ingesta)
-- ============================================
CREATE TABLE IF NOT EXISTS ingest_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  filetype TEXT NOT NULL,
  file_url TEXT,
  target_table TEXT,
  status TEXT DEFAULT 'pending',
  log_url TEXT,
  uploaded_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ingest_history_status ON ingest_history(status);
CREATE INDEX IF NOT EXISTS idx_ingest_history_date ON ingest_history(created_at);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar configuración inicial
INSERT INTO settings (key, value, updated_at) VALUES
  ('tax_rate', '{"value": 0.15, "label": "IVA"}', NOW()),
  ('dummy_mode', '{"enabled": true}', NOW()),
  ('n8n_webhook', '{"url": ""}', NOW()),
  ('placetopay_login', '{"value": ""}', NOW()),
  ('placetopay_trankey', '{"value": ""}', NOW())
ON CONFLICT (key) DO NOTHING;

-- Insertar categorías de ejemplo (opcional)
INSERT INTO categories (name, slug, parent_id, active) VALUES
  ('Bebidas', 'bebidas', NULL, true),
  ('Snacks', 'snacks', NULL, true),
  ('Lácteos', 'lacteos', NULL, true),
  ('Panadería', 'panaderia', NULL, true),
  ('Congelados', 'congelados', NULL, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- CONFIRMACIÓN
-- ============================================
SELECT 'Tablas creadas exitosamente!' as message;
```

### Paso 3.3: Ejecutar el Script
1. Click en **Run** (o presiona `Ctrl+Enter`)
2. Deberías ver el mensaje: "Tablas creadas exitosamente!"
3. Si hay errores, léelos cuidadosamente y corrígelos

---

## 4. Configurar Row Level Security (RLS)

### Paso 4.1: Habilitar RLS
En el mismo SQL Editor, ejecuta:

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingest_history ENABLE ROW LEVEL SECURITY;
```

### Paso 4.2: Crear Políticas de Acceso
Ejecuta este script para permitir acceso a usuarios autenticados:

```sql
-- Políticas para PROVIDERS
CREATE POLICY "Allow authenticated read" ON providers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert" ON providers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON providers
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON providers
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para CATEGORIES
CREATE POLICY "Allow authenticated read" ON categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON categories
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para PRODUCTS
CREATE POLICY "Allow authenticated read" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON products
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para PRODUCT_PRICES
CREATE POLICY "Allow authenticated read" ON product_prices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert" ON product_prices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON product_prices
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON product_prices
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para SETTINGS
CREATE POLICY "Allow authenticated read" ON settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON settings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para INGEST_HISTORY
CREATE POLICY "Allow authenticated read" ON ingest_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert" ON ingest_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

---

## 5. Crear Usuario Admin

### Paso 5.1: Ir a Authentication
1. En el menú lateral, click en **Authentication**
2. Click en **Users**

### Paso 5.2: Crear Usuario
1. Click en **Add user** (botón verde)
2. Selecciona **Create new user**
3. Completa:
   - **Email**: `admin@kiosko7.com` (o el que prefieras)
   - **Password**: Crea una contraseña segura
   - **Auto Confirm User**: ✅ Activado
4. Click en **Create user**

### Paso 5.3: Guardar Credenciales
**¡IMPORTANTE!** Guarda estas credenciales en un lugar seguro:
- Email: `admin@kiosko7.com`
- Password: `tu-contraseña-segura`

Las necesitarás para hacer login en el panel.

---

## 6. Configurar Storage

### Paso 6.1: Crear Bucket
1. En el menú lateral, click en **Storage**
2. Click en **New bucket**
3. Completa:
   - **Name**: `ingest`
   - **Public bucket**: ❌ Desactivado (privado)
4. Click en **Create bucket**

### Paso 6.2: Configurar Políticas de Storage
1. Click en el bucket `ingest`
2. Ve a la pestaña **Policies**
3. Click en **New policy**

#### Política para INSERT (subir archivos):
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ingest');
```

#### Política para SELECT (leer archivos):
```sql
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ingest');
```

---

## 7. Configurar el Proyecto

### Paso 7.1: Actualizar config.js
Ya deberías tener actualizado el archivo `js/config.js` con tus credenciales del Paso 2.

### Paso 7.2: Verificar Estructura
Asegúrate de que tu proyecto tenga esta estructura:

```
kiosko7-admin/
├── js/
│   ├── config.js          ← Con tus credenciales
│   ├── modules/
│   └── views/
├── assets/
├── index.html
├── login.html
└── ...
```

---

## 8. Verificar la Integración

### Paso 8.1: Iniciar Servidor Local
Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
# Opción 1: Python
python -m http.server 8000

# Opción 2: Node.js
npx http-server -p 8000

# Opción 3: PHP
php -S localhost:8000
```

### Paso 8.2: Abrir en el Navegador
1. Abre tu navegador
2. Ve a: `http://localhost:8000/login.html`

### Paso 8.3: Hacer Login
1. Ingresa el email y contraseña del usuario admin que creaste
2. Click en "Iniciar Sesión"
3. Deberías ser redirigido al Dashboard

### Paso 8.4: Verificar Funcionalidades

#### ✅ Dashboard
- Deberías ver los KPIs
- Los gráficos deberían cargar
- El badge "Modo Dummy" debería estar visible

#### ✅ Proveedores
1. Ve a Proveedores
2. Click en "Nuevo Proveedor"
3. Completa el formulario
4. Click en "Guardar"
5. Deberías ver el proveedor en la tabla

#### ✅ Productos
1. Ve a Productos
2. Intenta crear un producto
3. Verifica que se guarde correctamente

#### ✅ Categorías
1. Ve a Categorías
2. Deberías ver las categorías de ejemplo
3. Intenta crear una nueva

#### ✅ Settings
1. Ve a Configuración
2. Cambia el IVA a 18%
3. Click en "Guardar IVA"
4. Recarga la página
5. El valor debería persistir

---

## 🎉 ¡Integración Completa!

Si todos los pasos anteriores funcionaron, tu panel está completamente integrado con Supabase.

## 🔧 Troubleshooting

### Error: "Invalid API key"
- Verifica que copiaste la key `anon public` correcta
- Asegúrate de que no haya espacios extra

### Error: "Row Level Security policy violation"
- Verifica que las políticas RLS estén creadas
- Confirma que el usuario esté autenticado

### No se cargan los datos
- Abre la consola del navegador (F12)
- Busca errores en rojo
- Verifica la conexión a internet

### Error al crear registros
- Verifica que las tablas existan
- Confirma que las políticas RLS permitan INSERT

---

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica los logs de Supabase (Logs en el dashboard)
3. Consulta la documentación de Supabase: https://supabase.com/docs

---

**¡Listo para usar!** 🚀
