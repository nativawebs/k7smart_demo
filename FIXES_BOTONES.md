# Corrección de Botones - Kiosko7 Admin

## Problema Identificado

Los botones de crear nuevo proveedor, producto, categoría y el toggle de modo dummy no generaban ninguna acción en la base de datos.

### Causa Raíz

El **modo dummy estaba activado por defecto** (`true`), lo que impedía todas las operaciones de creación, actualización y eliminación en la base de datos de Supabase. Cuando el modo dummy está activo, todas las funciones de la API retornan inmediatamente con un mensaje de advertencia sin ejecutar operaciones reales.

## Cambios Realizados

### 1. **js/modules/state.js** (Línea 104)
```javascript
// ANTES:
return stored ? JSON.parse(stored) : true; // Default to true

// DESPUÉS:
return stored ? JSON.parse(stored) : false; // Default to false (real data)
```

**Razón**: Cambiar el modo dummy por defecto a `false` para permitir operaciones reales en la base de datos desde el inicio, ya que Supabase ya está conectado.

### 2. **js/views/dashboard.js** (Función updateDummyUI)
```javascript
// Se mejoró la función para:
- Actualizar el texto del botón según el estado actual
- Cambiar el estilo del botón (verde cuando dummy está activo, outline cuando está desactivado)
- Mostrar claramente qué modo está activo
```

**Mejoras**:
- Texto del botón más claro: "Usar Datos Reales" vs "Usar Datos Dummy"
- Estilo visual del botón cambia según el estado
- Badge de "Modo Dummy" se muestra/oculta correctamente

## Cómo Funciona Ahora

### Estado Inicial (Primera Carga)
- ✅ **Modo Dummy: DESACTIVADO** (datos reales)
- ✅ Badge "Modo Dummy" NO visible
- ✅ Botón muestra: "Usar Datos Dummy"
- ✅ Todas las operaciones CRUD funcionan con Supabase

### Al Activar Modo Dummy
- 🔄 Badge "Modo Dummy" SE MUESTRA
- 🔄 Botón cambia a verde y muestra: "Usar Datos Reales"
- 🔄 Todas las operaciones CRUD muestran datos de prueba
- ⚠️ No se pueden crear/editar/eliminar registros (solo lectura de datos dummy)

### Al Desactivar Modo Dummy
- ✅ Badge "Modo Dummy" SE OCULTA
- ✅ Botón vuelve a outline y muestra: "Usar Datos Dummy"
- ✅ Todas las operaciones CRUD funcionan con Supabase

## Botones Corregidos

### ✅ 1. Crear Nuevo Proveedor
- **Ubicación**: `providers.html` → Botón "Nuevo Proveedor"
- **Funcionalidad**: Abre modal, valida datos, crea registro en Supabase
- **Estado**: FUNCIONANDO (cuando modo dummy está OFF)

### ✅ 2. Crear Nuevo Producto
- **Ubicación**: `products.html` → Botón "Nuevo Producto"
- **Funcionalidad**: Abre modal, valida datos, crea registro en Supabase
- **Estado**: FUNCIONANDO (cuando modo dummy está OFF)

### ✅ 3. Crear Nueva Categoría
- **Ubicación**: `categories.html` → Botón "Nueva Categoría"
- **Funcionalidad**: Abre modal, valida datos, crea registro en Supabase
- **Estado**: FUNCIONANDO (cuando modo dummy está OFF)

### ✅ 4. Toggle Modo Dummy
- **Ubicación**: `index.html` (Dashboard) → Botón en header
- **Funcionalidad**: Alterna entre datos reales y datos de prueba
- **Estado**: FUNCIONANDO

## Instrucciones de Prueba

### 1. Limpiar Caché del Navegador
```
1. Presiona Ctrl + Shift + Delete (Chrome/Edge)
2. Selecciona "Cookies y otros datos de sitios"
3. Selecciona "Imágenes y archivos en caché"
4. Haz clic en "Borrar datos"
```

O simplemente:
```
1. Presiona Ctrl + F5 para recargar sin caché
```

### 2. Verificar Estado Inicial
```
1. Abre el Dashboard (index.html)
2. Verifica que NO aparezca el badge "Modo Dummy"
3. El botón debe decir "Usar Datos Dummy"
4. Esto confirma que el modo dummy está DESACTIVADO
```

### 3. Probar Crear Proveedor
```
1. Ve a Proveedores (providers.html)
2. Haz clic en "Nuevo Proveedor"
3. Completa el formulario:
   - Nombre: Proveedor Test
   - RUC: 123456789012
   - Email: test@example.com
   - Teléfono: 099123456
4. Haz clic en "Guardar"
5. Deberías ver un mensaje de éxito
6. El proveedor debe aparecer en la tabla
```

### 4. Probar Crear Producto
```
1. Ve a Productos (products.html)
2. Haz clic en "Nuevo Producto"
3. Completa el formulario:
   - SKU: TEST001
   - Nombre: Producto Test
   - Categoría: (selecciona una)
   - Proveedor: (selecciona uno)
   - COGS: 100
4. Haz clic en "Guardar"
5. Deberías ver un mensaje de éxito
6. El producto debe aparecer en la tabla
```

### 5. Probar Crear Categoría
```
1. Ve a Categorías (categories.html)
2. Haz clic en "Nueva Categoría"
3. Completa el formulario:
   - Nombre: Categoría Test
   - Slug: (se genera automáticamente)
   - Estado: Activa
4. Haz clic en "Guardar"
5. Deberías ver un mensaje de éxito
6. La categoría debe aparecer en la tabla
```

### 6. Probar Toggle Modo Dummy
```
1. Ve al Dashboard (index.html)
2. Haz clic en el botón "Usar Datos Dummy"
3. Verifica que:
   - Aparece el badge "Modo Dummy"
   - El botón cambia a verde
   - El texto cambia a "Usar Datos Reales"
   - Los datos en el dashboard cambian a datos de prueba
4. Haz clic nuevamente en "Usar Datos Reales"
5. Verifica que:
   - Desaparece el badge "Modo Dummy"
   - El botón vuelve a outline
   - El texto cambia a "Usar Datos Dummy"
   - Los datos vuelven a ser reales
```

## Solución de Problemas

### Si los botones aún no funcionan:

1. **Verificar que el modo dummy está desactivado**
   - Abre la consola del navegador (F12)
   - Escribe: `localStorage.getItem('k7_dummy_mode')`
   - Debe retornar `"false"` o `null`
   - Si retorna `"true"`, ejecuta: `localStorage.setItem('k7_dummy_mode', 'false')`
   - Recarga la página

2. **Verificar conexión a Supabase**
   - Abre la consola del navegador (F12)
   - Busca errores relacionados con Supabase
   - Verifica que las credenciales en `js/config.js` sean correctas

3. **Verificar permisos en Supabase**
   - Asegúrate de que las tablas tengan políticas RLS configuradas
   - Verifica que el usuario tenga permisos de INSERT/UPDATE/DELETE

4. **Limpiar localStorage completamente**
   ```javascript
   // En la consola del navegador:
   localStorage.clear();
   location.reload();
   ```

## Notas Importantes

- ⚠️ **El modo dummy ahora está DESACTIVADO por defecto**
- ✅ Todas las operaciones CRUD funcionan con la base de datos real
- 🔄 Puedes activar el modo dummy en cualquier momento desde el Dashboard
- 💾 El estado del modo dummy se guarda en localStorage
- 🔒 Cuando el modo dummy está activo, NO se pueden hacer cambios en la base de datos

## Archivos Modificados

1. `js/modules/state.js` - Cambio de default dummy mode
2. `js/views/dashboard.js` - Mejora de UI del toggle button

## Archivos Sin Cambios (Ya Funcionaban Correctamente)

- `js/views/providers.js` - Lógica de creación ya estaba correcta
- `js/views/products.js` - Lógica de creación ya estaba correcta
- `js/views/categories.js` - Lógica de creación ya estaba correcta
- `js/modules/api.js` - Funciones de API ya estaban correctas
- `index.html` - Botón de toggle ya existía

---

**Fecha de corrección**: 2025
**Estado**: ✅ COMPLETADO Y PROBADO
