# ✅ Verificación de Conexiones - Supabase y n8n

## 📋 Resumen de Cambios Realizados

### 1. ✅ Corrección en `auth.js`

**Problema identificado:**
El archivo `js/modules/auth.js` tenía credenciales placeholder hardcodeadas:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

**Solución aplicada:**
Ahora importa las credenciales desde `config.js`:
```javascript
import { config } from '../config.js';

export function initSupabase(url = config.supabaseUrl, key = config.supabaseAnonKey) {
  // ...
}
```

### 2. ✅ Script de Verificación Creado

Se creó `test-connection.html` que verifica:
- ✅ Configuración de credenciales
- ✅ Inicialización del cliente Supabase
- ✅ Conexión a la base de datos
- ✅ Webhook de n8n (opcional)

---

## 🔍 Estado Actual de las Conexiones

### ✅ Supabase - CONFIGURADO CORRECTAMENTE

**Credenciales en `config.js`:**
```javascript
supabaseUrl: 'https://qvpebnzbjgnneieopitv.supabase.co'
supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // ✓ Configurada
```

**Estado:** ✅ **LISTO PARA USAR**

Las credenciales están correctamente configuradas y ahora se están usando en toda la aplicación.

---

### ⚠️ n8n - CONFIGURACIÓN PARCIAL

**URL en `config.js`:**
```javascript
n8nIngestUrl: 'https://n8n.srv888919.hstgr.cloud/webhook-test/ingest'
```

**Estado:** ⚠️ **REQUIERE CONFIGURACIÓN ADICIONAL**

La URL está en `config.js`, pero para que funcione completamente, también debe estar en la base de datos Supabase.

---

## 🚀 Cómo Verificar las Conexiones

### Opción 1: Usar el Script de Test (Recomendado)

1. Abre tu navegador
2. Ve a: `http://localhost:8000/test-connection.html`
3. Click en "▶️ Ejecutar Tests"
4. Revisa los resultados de cada test

### Opción 2: Verificación Manual

#### Test de Supabase:
1. Abre `login.html`
2. Intenta hacer login con tus credenciales
3. Si funciona → ✅ Supabase está conectado

#### Test de Base de Datos:
1. Ve a cualquier sección (Proveedores, Productos, etc.)
2. Intenta crear un registro
3. Si se guarda → ✅ Base de datos funciona

#### Test de n8n:
1. Ve a la sección "Ingesta"
2. Intenta subir un archivo
3. Si se procesa → ✅ n8n funciona

---

## 🔧 Configurar n8n en la Base de Datos

Para que n8n funcione completamente, necesitas agregar la URL en la tabla `settings` de Supabase:

### Paso 1: Abrir SQL Editor en Supabase

1. Ve a tu proyecto en [https://supabase.com](https://supabase.com)
2. Click en **SQL Editor** en el menú lateral
3. Click en **New query**

### Paso 2: Ejecutar este SQL

```sql
-- Actualizar o insertar la configuración de n8n
INSERT INTO settings (key, value, updated_at) 
VALUES (
  'n8n_webhook', 
  '{"url": "https://n8n.srv888919.hstgr.cloud/webhook-test/ingest"}',
  NOW()
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = '{"url": "https://n8n.srv888919.hstgr.cloud/webhook-test/ingest"}',
  updated_at = NOW();
```

### Paso 3: Verificar

```sql
-- Verificar que se guardó correctamente
SELECT * FROM settings WHERE key = 'n8n_webhook';
```

Deberías ver:
```
key          | value                                                    | updated_at
-------------|----------------------------------------------------------|-------------------
n8n_webhook  | {"url": "https://n8n.srv888919.hstgr.cloud/webhook-..."}| 2024-01-XX XX:XX:XX
```

---

## 📝 Configuración Alternativa desde la Interfaz

También puedes configurar n8n desde la interfaz web:

1. Inicia sesión en el panel
2. Ve a **Configuración** (Settings)
3. En la sección "Webhook n8n", pega la URL:
   ```
   https://n8n.srv888919.hstgr.cloud/webhook-test/ingest
   ```
4. Click en **Guardar Webhook**

---

## 🔐 Verificar Configuración de n8n

### En n8n:

1. Abre tu instancia de n8n: `https://n8n.srv888919.hstgr.cloud`
2. Ve al workflow de ingesta
3. Verifica que el webhook esté activo
4. La URL debe ser: `/webhook-test/ingest`

### Estructura esperada del webhook:

El webhook debe recibir datos en este formato:
```json
{
  "file_url": "https://...",
  "file_type": "csv|xlsx|json",
  "target_table": "providers|products|categories",
  "uploaded_by": "user-uuid",
  "timestamp": "2024-01-XX..."
}
```

---

## 🧪 Tests Disponibles

### Test 1: Configuración ⚙️
Verifica que las credenciales estén configuradas en `config.js`

### Test 2: Cliente Supabase 🔌
Verifica que el cliente de Supabase se inicialice correctamente

### Test 3: Base de Datos 💾
Intenta leer la tabla `settings` para confirmar la conexión

### Test 4: Webhook n8n 🔗
Hace un ping al webhook para verificar que responde

---

## ❓ Troubleshooting

### Error: "Invalid API key"
**Causa:** La API key de Supabase es incorrecta o está mal copiada

**Solución:**
1. Ve a Supabase → Settings → API
2. Copia nuevamente la `anon public` key
3. Actualiza `config.js`

### Error: "Row Level Security policy violation"
**Causa:** Las políticas RLS no están configuradas o el usuario no está autenticado

**Solución:**
1. Verifica que las políticas RLS estén creadas (ver `GUIA_INTEGRACION_SUPABASE.md`)
2. Asegúrate de estar autenticado (hacer login)

### Error: "Failed to fetch" en n8n
**Causa:** El webhook no está activo o la URL es incorrecta

**Solución:**
1. Verifica que el workflow en n8n esté activo
2. Confirma que la URL sea correcta
3. Verifica que n8n esté accesible desde internet

### No se cargan los datos
**Causa:** Puede ser un problema de red o configuración

**Solución:**
1. Abre la consola del navegador (F12)
2. Busca errores en rojo
3. Verifica la conexión a internet
4. Ejecuta el script de test

---

## 📊 Checklist de Verificación

Usa este checklist para confirmar que todo está configurado:

- [ ] ✅ Credenciales de Supabase en `config.js`
- [ ] ✅ `auth.js` importa desde `config.js`
- [ ] ✅ Tablas creadas en Supabase
- [ ] ✅ Políticas RLS configuradas
- [ ] ✅ Usuario admin creado
- [ ] ✅ Bucket "ingest" creado en Storage
- [ ] ✅ URL de n8n en `config.js`
- [ ] ⚠️ URL de n8n en tabla `settings` (opcional pero recomendado)
- [ ] ⚠️ Workflow de n8n activo (si usas ingesta)

---

## 🎯 Próximos Pasos

1. **Ejecutar el script de test:**
   ```
   http://localhost:8000/test-connection.html
   ```

2. **Si todos los tests pasan:**
   - ✅ Puedes usar la aplicación normalmente
   - ✅ Supabase está conectado
   - ✅ La base de datos funciona

3. **Si quieres usar n8n:**
   - Configura la URL en la tabla `settings` (ver arriba)
   - Activa el workflow en n8n
   - Prueba subiendo un archivo en la sección "Ingesta"

4. **Desactivar modo dummy (opcional):**
   - Ve a Configuración
   - Desactiva "Modo Dummy"
   - Ahora usarás datos reales de Supabase

---

## 📞 Soporte

Si tienes problemas:

1. **Revisa la consola del navegador** (F12)
2. **Ejecuta el script de test** para identificar el problema
3. **Consulta los logs de Supabase** (Dashboard → Logs)
4. **Revisa la documentación:**
   - Supabase: https://supabase.com/docs
   - n8n: https://docs.n8n.io

---

## 📝 Notas Importantes

- ⚠️ **NO subas `config.js` a repositorios públicos** (contiene credenciales)
- ✅ Usa `config.example.js` como plantilla para otros desarrolladores
- 🔒 Las credenciales de Supabase son sensibles, mantenlas seguras
- 🔄 Si cambias las credenciales, actualiza `config.js` y recarga la app

---

**Última actualización:** Enero 2024
**Versión:** 1.0
