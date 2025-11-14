# Kiosko7 Admin Panel - Proyecto Completo

## 📋 Resumen del Proyecto

Panel de administración interno completo para Kiosko7, desarrollado con tecnologías web estáticas (HTML + CSS + JS vanilla) sin frameworks SPA. El proyecto está listo para ser desplegado y utilizado.

## ✅ Archivos Creados

### Estructura Completa (25 archivos)

```
kiosko7-admin/
├── .env.example                      ✅ Variables de entorno
├── README.md                         ✅ Documentación completa
├── PROYECTO_COMPLETO.md             ✅ Este archivo
│
├── assets/
│   └── css/
│       └── custom.css               ✅ Estilos personalizados (800+ líneas)
│
├── js/
│   ├── config.example.js            ✅ Configuración de ejemplo
│   │
│   ├── modules/
│   │   ├── state.js                 ✅ Gestión de estado global
│   │   ├── utils.js                 ✅ Utilidades (50+ funciones)
│   │   ├── auth.js                  ✅ Autenticación Supabase
│   │   ├── dummy.js                 ✅ Datos de prueba
│   │   ├── api.js                   ✅ Operaciones CRUD
│   │   └── charts.js                ✅ Configuración Chart.js
│   │
│   └── views/
│       ├── dashboard.js             ✅ Lógica Dashboard
│       ├── providers.js             ✅ Lógica Proveedores
│       ├── products.js              ✅ Lógica Productos
│       ├── categories.js            ✅ Lógica Categorías
│       ├── compare.js               ✅ Lógica Comparativas
│       ├── ingest.js                ✅ Lógica Ingesta
│       └── settings.js              ✅ Lógica Configuración
│
├── login.html                       ✅ Página de login
├── index.html                       ✅ Dashboard principal
├── providers.html                   ✅ Gestión de proveedores
├── products.html                    ✅ Gestión de productos
├── categories.html                  ✅ Gestión de categorías
├── compare.html                     ✅ Comparativas de precios
├── ingest.html                      ✅ Ingesta de datos
└── settings.html                    ✅ Configuración del sistema
```

## 🎯 Funcionalidades Implementadas

### ✅ Autenticación y Seguridad
- Login con Supabase Auth
- Protección de rutas (redirect a login si no autenticado)
- Gestión de sesiones
- Logout funcional

### ✅ Dashboard (index.html)
- 5 KPI cards: Ventas, AOV, Margen, ROAS, Conversión
- Gráfico de línea: Ventas vs Margen (30 días)
- Gráfico de barras: Top 5 Categorías
- Gráfico de barras: Top 5 Proveedores
- Switch Dummy/Real data
- Responsive design

### ✅ Proveedores (providers.html)
- CRUD completo (Create, Read, Update, Delete)
- Búsqueda con debounce (300ms)
- Filtros por estado
- Ordenamiento por columnas
- Paginación server-side
- Exportar a CSV
- Validación de formularios (RUC, email, teléfono)
- Modal para crear/editar

### ✅ Productos (products.html)
- CRUD completo
- Búsqueda por SKU/nombre
- Filtro por categoría
- Cálculo automático de márgenes
- Gestión de precios (neto/bruto)
- IVA configurable
- Exportar a CSV

### ✅ Categorías (categories.html)
- CRUD simple
- Soporte para categorías padre/hijo
- Generación automática de slug
- Estado activo/inactivo

### ✅ Comparativas (compare.html)
- Filtros: categoría, proveedores, rango de fechas
- Tab "Último Precio": tabla comparativa + gráfico de márgenes
- Tab "Serie Temporal": evolución de precios y márgenes
- Exportar resultados a CSV
- Gráficos interactivos con Chart.js

### ✅ Ingesta de Datos (ingest.html)
- Upload de archivos CSV/JSON/PDF
- Vista previa de datos (CSV/JSON)
- Integración con webhook n8n
- Historial de cargas con estados
- Plantillas descargables para cada tipo de dato
- Validación de tamaño (máx 10MB)

### ✅ Configuración (settings.html)
- IVA global configurable (default 15%)
- Toggle Dummy Mode con persistencia
- URL webhook n8n con test de conexión
- Credenciales PlacetoPay (placeholder)
- Información del sistema

### ✅ Características Generales
- **Dark Mode**: Toggle con persistencia en localStorage
- **Sidebar**: Colapsable con persistencia
- **Responsive**: Diseño adaptable a móviles/tablets/desktop
- **Keyboard Shortcuts**: 
  - `g + d` → Dashboard
  - `g + p` → Proveedores
  - `g + r` → Productos
  - `g + c` → Comparativas
  - `/` → Focus en búsqueda
- **Toasts**: Notificaciones de éxito/error/info/warning
- **Loading Spinners**: Feedback visual en operaciones async
- **Confirmaciones**: Modales de confirmación para acciones destructivas
- **Accesibilidad**: Labels, aria-attributes, contraste adecuado

## 🎨 Diseño y UI

### Colores
- **Principal**: Naranja (#ff6b35) - Kiosko7
- **Secundario**: Negro (#000000)
- **Fondo**: Blanco (#ffffff)
- **Hover/Active**: Negro
- **Success**: Verde (#28a745)
- **Danger**: Rojo (#dc3545)
- **Warning**: Amarillo (#ffc107)

### Componentes
- Bootstrap 5.3.2 (CDN)
- Bootstrap Icons 1.11.1
- Chart.js 4.4.0
- Supabase JS 2.x

### Logo
- URL: https://negociolisto.online/wp-content/uploads/2025/11/logo_k7-3.svg
- Integrado en sidebar y login

## 🔧 Configuración Necesaria

### 1. Crear archivo de configuración

Copiar `js/config.example.js` a `js/config.js` y actualizar:

```javascript
export const config = {
  supabaseUrl: 'https://tu-proyecto.supabase.co',
  supabaseAnonKey: 'tu-anon-key-aqui',
  n8nIngestUrl: 'https://tu-n8n.com/webhook/ingest'
};
```

### 2. Configurar Supabase

#### A. Crear usuario admin
1. Ir a Authentication > Users
2. Add user > Create new user
3. Ingresar email y contraseña

#### B. Habilitar RLS en todas las tablas
```sql
-- Ejemplo para tabla providers
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users" ON providers
  FOR ALL USING (auth.role() = 'authenticated');
```

#### C. Crear bucket de Storage
1. Ir a Storage
2. New bucket: `ingest`
3. Configurar políticas de acceso

#### D. Insertar settings iniciales
```sql
INSERT INTO settings (key, value, updated_at) VALUES
  ('tax_rate', '{"value": 0.15, "label": "IVA"}', NOW()),
  ('dummy_mode', '{"enabled": true}', NOW()),
  ('n8n_webhook', '{"url": ""}', NOW())
ON CONFLICT (key) DO NOTHING;
```

### 3. Configurar n8n (Opcional)

1. Crear workflow en n8n
2. Agregar nodo Webhook
3. Configurar procesamiento ETL
4. Copiar URL del webhook a Settings

## 🚀 Despliegue

### Opción 1: Servidor Local

```bash
cd kiosko7-admin
python -m http.server 8000
# Abrir http://localhost:8000
```

### Opción 2: Google Cloud Storage + CDN

```bash
# Crear bucket
gsutil mb -p tu-proyecto gs://kiosko7-admin

# Configurar como sitio web
gsutil web set -m index.html gs://kiosko7-admin

# Hacer público
gsutil iam ch allUsers:objectViewer gs://kiosko7-admin

# Subir archivos
gsutil -m rsync -r ./kiosko7-admin gs://kiosko7-admin
```

### Opción 3: Firebase Hosting

```bash
npm install -g firebase-tools
cd kiosko7-admin
firebase init hosting
firebase deploy --only hosting
```

## 📊 Esquema de Base de Datos

### Tablas Requeridas

```sql
-- Proveedores
CREATE TABLE providers (
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

-- Categorías
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Productos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  default_provider_id UUID REFERENCES providers(id),
  cogs NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Precios de Productos
CREATE TABLE product_prices (
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

-- Configuración
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historial de Ingesta
CREATE TABLE ingest_history (
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
```

## 📝 Notas Importantes

### Modo Dummy
- Por defecto está activado
- Usa datos de prueba generados en `js/modules/dummy.js`
- Permite probar la UI sin base de datos
- Se puede desactivar en Settings o con el toggle en topbar

### Datos de Prueba
- 10 proveedores de ejemplo
- 10 productos de ejemplo
- 10 categorías de ejemplo
- KPIs generados aleatoriamente
- Gráficos con datos simulados

### Validaciones
- Email: formato válido
- RUC: 12 dígitos
- Teléfono: mínimo 8 caracteres
- Archivos: máximo 10MB
- IVA: entre 0 y 100%

### Exportación CSV
- Todas las tablas tienen botón de exportación
- Incluye datos filtrados/buscados
- Formato compatible con Excel
- Nombre de archivo con fecha

## 🐛 Troubleshooting

### Error: "Invalid API key"
- Verificar `SUPABASE_ANON_KEY` en config.js
- Usar la clave "anon/public", no "service_role"

### Error: "RLS policy violation"
- Verificar que RLS esté configurado
- Confirmar que el usuario esté autenticado

### No se cargan los datos
- Activar Dummy Switch para verificar UI
- Revisar consola del navegador
- Verificar conexión a Supabase

### Webhook n8n no responde
- Verificar URL en Settings
- Usar botón "Test Webhook"
- Revisar logs de n8n

## 📞 Soporte

Para soporte técnico o consultas:
- Email: tech@kiosko7.com
- Documentación: Ver README.md

## 📄 Licencia

Propiedad de Kiosko7. Todos los derechos reservados.

---

**Versión**: 1.0.0  
**Fecha**: Diciembre 2025  
**Desarrollado por**: BLACKBOXAI  
**Estado**: ✅ Proyecto Completo y Funcional
