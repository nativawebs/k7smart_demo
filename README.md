# Kiosko7 Admin Panel

Panel de administración interno para gestión de datos y análisis de Kiosko7. Frontend estático con HTML + CSS + JS vanilla, Bootstrap 5, Chart.js 4 y Supabase.

## 🚀 Características

- **Dashboard**: KPIs en tiempo real (Ventas, AOV, Margen, ROAS, Conversión) con gráficos interactivos
- **CRUDs**: Gestión completa de Proveedores, Productos/Precios y Categorías
- **Comparativas**: Análisis de precios por proveedor con márgenes y series temporales
- **Ingesta de Datos**: Carga de CSV/JSON/PDF con integración a n8n para ETL
- **Configuración**: IVA configurable, webhooks y toggles del sistema
- **Dummy Data**: Switch para alternar entre datos de prueba y datos reales
- **Dark Mode**: Tema oscuro con persistencia
- **Responsive**: Diseño adaptable a todos los dispositivos

## 📋 Requisitos Previos

- Cuenta de Supabase activa
- (Opcional) Instancia de n8n para procesamiento ETL
- Navegador web moderno (Chrome, Firefox, Safari, Edge)

## 🛠️ Configuración Inicial

### 1. Configurar Variables de Entorno

Copia el archivo `.env.example` y renómbralo a `.env`:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key-aqui
N8N_INGEST_URL=https://tu-n8n.com/webhook/ingest
```

**Nota**: Para desarrollo local, puedes crear un archivo `js/config.js` con las credenciales:

```javascript
export const config = {
  supabaseUrl: 'https://tu-proyecto.supabase.co',
  supabaseAnonKey: 'tu-anon-key-aqui',
  n8nIngestUrl: 'https://tu-n8n.com/webhook/ingest'
};
```

### 2. Configurar Supabase

#### A. Crear Usuario Admin

1. Ve a tu proyecto en Supabase
2. Navega a **Authentication** > **Users**
3. Click en **Add user** > **Create new user**
4. Ingresa email y contraseña para el admin
5. Guarda las credenciales de forma segura

#### B. Verificar Tablas

Las siguientes tablas deben existir en tu base de datos:

- `providers` - Proveedores
- `categories` - Categorías de productos
- `products` - Productos
- `product_prices` - Histórico de precios
- `settings` - Configuración del sistema
- `ingest_history` - Historial de cargas de datos

#### C. Configurar Row Level Security (RLS)

Asegúrate de que RLS esté habilitado en todas las tablas. Ejemplo de políticas:

```sql
-- Permitir lectura/escritura solo a usuarios autenticados
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
```

#### D. Crear Bucket de Storage

1. Ve a **Storage** en Supabase
2. Click en **New bucket**
3. Nombre: `ingest`
4. Público: No (privado)
5. Configurar política de acceso:

```sql
-- Permitir upload solo a usuarios autenticados
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ingest');

-- Permitir lectura solo a usuarios autenticados
CREATE POLICY "Allow authenticated reads" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'ingest');
```

#### E. Configurar Settings Iniciales

Ejecuta en SQL Editor de Supabase:

```sql
-- Insertar configuración inicial
INSERT INTO settings (key, value, updated_at) VALUES
  ('tax_rate', '{"value": 0.15, "label": "IVA"}', NOW()),
  ('dummy_mode', '{"enabled": true}', NOW()),
  ('n8n_webhook', '{"url": ""}', NOW()),
  ('placetopay_login', '{"value": ""}', NOW()),
  ('placetopay_trankey', '{"value": ""}', NOW())
ON CONFLICT (key) DO NOTHING;
```

### 3. Configurar n8n (Opcional)

Si deseas usar el módulo de ingesta con procesamiento ETL:

1. Crea un workflow en n8n
2. Agrega un nodo **Webhook** al inicio
3. Configura el webhook para recibir POST con:
   - `file_url`: URL del archivo en Supabase Storage
   - `file_type`: Tipo de archivo (csv, json, pdf)
   - `target_table`: Tabla destino
   - `uploaded_by`: ID del usuario
4. Agrega nodos para procesar y cargar datos a Supabase
5. Copia la URL del webhook y agrégala a tu `.env`

## 🚀 Ejecución Local

### Opción 1: Servidor HTTP Simple (Python)

```bash
cd kiosko7-admin
python -m http.server 8000
```

Abre en el navegador: `http://localhost:8000`

### Opción 2: Live Server (Node.js)

```bash
npx live-server kiosko7-admin
```

### Opción 3: VS Code Live Server

1. Instala la extensión "Live Server"
2. Click derecho en `index.html`
3. Selecciona "Open with Live Server"

## 📱 Uso del Panel

### Login

1. Abre `login.html` en tu navegador
2. Ingresa las credenciales del usuario admin creado en Supabase
3. Click en "Iniciar Sesión"

### Dashboard

- **KPIs**: Visualiza métricas clave en tiempo real
- **Gráficos**: Ventas vs Margen, Top Categorías, Top Proveedores
- **Dummy Switch**: Toggle en la barra superior para alternar entre datos de prueba y reales

### Proveedores

- **Crear**: Click en "Nuevo Proveedor"
- **Editar**: Click en el ícono de lápiz en la tabla
- **Eliminar**: Click en el ícono de papelera (requiere confirmación)
- **Buscar**: Usa el campo de búsqueda (debounce 300ms)
- **Exportar**: Click en "Exportar CSV"

### Productos & Precios

- **Gestión de Productos**: CRUD completo con SKU, nombre, categoría, proveedor
- **Histórico de Precios**: Ver evolución de precios por proveedor
- **Cálculo de IVA**: Automático según configuración (default 15%)
- **Carga Masiva**: Upload CSV/JSON con preview y validación

### Categorías

- **Jerarquía**: Soporte para categorías padre/hijo
- **CRUD Simple**: Crear, editar y eliminar categorías

### Comparativas

1. Selecciona una categoría
2. Selecciona uno o más proveedores
3. Define rango de fechas
4. Alterna entre tabs:
   - **Último Precio**: Comparación actual con gráfico de márgenes
   - **Serie Temporal**: Evolución de precios y márgenes en el tiempo
5. Exporta resultados a CSV

### Ingesta de Datos

1. **Subir Archivo**: Arrastra o selecciona CSV/JSON/PDF
2. **Preview**: Revisa los datos antes de enviar
3. **Procesar**: Envía a n8n para ETL automático
4. **Historial**: Consulta cargas previas y su estado

#### Plantillas CSV

Descarga plantillas desde la interfaz:

- `providers.csv`: name, ruc, email, phone, commission_rate, zones, shipping_cost_policy, status
- `products.csv`: sku, name, category_slug, default_provider_ruc, cogs, notes
- `product_prices.csv`: sku, provider_ruc, date, price_net, tax_rate, cogs, shipping_cost
- `categories.csv`: name, slug, parent_slug, active

### Configuración

- **IVA Global**: Configura el porcentaje de IVA (default 15%)
- **Webhook n8n**: URL del webhook para ingesta
- **Dummy Mode**: Activa/desactiva datos de prueba globalmente
- **PlacetoPay**: Credenciales para integración futura
- **Test Webhook**: Envía ping a n8n para verificar conectividad

## ⌨️ Atajos de Teclado

- `/` - Enfocar búsqueda
- `g d` - Ir a Dashboard
- `g p` - Ir a Proveedores
- `g r` - Ir a Productos
- `g c` - Ir a Comparativas
- `Esc` - Cerrar modales

## 🎨 Personalización

### Colores

Edita `assets/css/custom.css`:

```css
:root {
  --primary-color: #ff6b35; /* Naranja Kiosko7 */
  --secondary-color: #000000; /* Negro */
  --background-color: #ffffff; /* Blanco */
  --hover-color: #000000;
  --active-color: #000000;
}
```

### Dark Mode

El tema oscuro se activa automáticamente según preferencias del sistema o mediante el toggle en la barra superior. La preferencia se guarda en `localStorage`.

## 🚀 Despliegue en Google Cloud Platform

### Opción 1: Cloud Storage + Cloud CDN

1. **Crear Bucket**:
```bash
gsutil mb -p tu-proyecto -c STANDARD -l us-central1 gs://kiosko7-admin
```

2. **Configurar como sitio web**:
```bash
gsutil web set -m index.html -e 404.html gs://kiosko7-admin
```

3. **Hacer público**:
```bash
gsutil iam ch allUsers:objectViewer gs://kiosko7-admin
```

4. **Subir archivos**:
```bash
gsutil -m rsync -r -d ./kiosko7-admin gs://kiosko7-admin
```

5. **Configurar Cloud CDN**:
   - Ve a Cloud Console > Network Services > Cloud CDN
   - Crea un backend bucket apuntando a tu bucket
   - Configura un Load Balancer con HTTPS
   - Asocia tu dominio

### Opción 2: Firebase Hosting

1. **Instalar Firebase CLI**:
```bash
npm install -g firebase-tools
```

2. **Inicializar**:
```bash
cd kiosko7-admin
firebase init hosting
```

3. **Configurar `firebase.json`**:
```json
{
  "hosting": {
    "public": ".",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

4. **Desplegar**:
```bash
firebase deploy --only hosting
```

## 🔒 Seguridad

- ✅ Autenticación requerida en todas las vistas
- ✅ RLS habilitado en Supabase
- ✅ Tokens de sesión con expiración automática
- ✅ Validación de inputs en cliente y servidor
- ✅ HTTPS obligatorio en producción
- ✅ CORS configurado correctamente

## 🐛 Troubleshooting

### Error: "Invalid API key"
- Verifica que `SUPABASE_ANON_KEY` sea correcta
- Asegúrate de usar la clave "anon/public" no la "service_role"

### Error: "Row Level Security policy violation"
- Verifica que las políticas RLS estén configuradas
- Confirma que el usuario esté autenticado

### No se cargan los datos
- Activa el Dummy Switch para verificar que la UI funciona
- Revisa la consola del navegador para errores
- Verifica la conexión a Supabase

### Webhook n8n no responde
- Verifica la URL del webhook en Settings
- Usa el botón "Test Webhook" para diagnosticar
- Revisa los logs de n8n

## 📚 Estructura del Proyecto

```
kiosko7-admin/
├── assets/
│   ├── css/
│   │   └── custom.css          # Estilos personalizados
│   └── img/
│       └── logo.svg             # Logo Kiosko7
├── js/
│   ├── modules/
│   │   ├── auth.js              # Autenticación Supabase
│   │   ├── api.js               # Operaciones CRUD
│   │   ├── utils.js             # Utilidades generales
│   │   ├── charts.js            # Configuración Chart.js
│   │   ├── dummy.js             # Datos de prueba
│   │   └── state.js             # Estado global
│   └── views/
│       ├── dashboard.js         # Lógica Dashboard
│       ├── providers.js         # Lógica Proveedores
│       ├── products.js          # Lógica Productos
│       ├── categories.js        # Lógica Categorías
│       ├── compare.js           # Lógica Comparativas
│       ├── ingest.js            # Lógica Ingesta
│       └── settings.js          # Lógica Configuración
├── templates/
│   └── partials/
│       ├── navbar.html          # Barra superior
│       ├── sidebar.html         # Menú lateral
│       └── kpi-cards.html       # Tarjetas KPI
├── index.html                   # Dashboard
├── providers.html               # Proveedores
├── products.html                # Productos
├── categories.html              # Categorías
├── compare.html                 # Comparativas
├── ingest.html                  # Ingesta
├── settings.html                # Configuración
├── login.html                   # Login
├── .env.example                 # Variables de entorno
└── README.md                    # Este archivo
```

## 🤝 Contribución

Este es un proyecto interno de Kiosko7. Para sugerencias o reportes de bugs, contacta al equipo de desarrollo.

## 📄 Licencia

Propiedad de Kiosko7. Todos los derechos reservados.

## 📞 Soporte

Para soporte técnico, contacta a: tech@kiosko7.com

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2025
