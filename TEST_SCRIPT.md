# Script de Testing Completo - Kiosko7 Admin

## Pre-requisitos

1. **Limpiar localStorage**
   - Abre la consola del navegador (F12)
   - Ejecuta: `localStorage.clear()`
   - Recarga la página (Ctrl + F5)

2. **Verificar Supabase**
   - Asegúrate de que las credenciales en `js/config.js` son correctas
   - Verifica que tienes conexión a internet

---

## TEST 1: Verificar Estado Inicial (Modo Dummy OFF)

### Pasos:
1. Abre `index.html` en el navegador
2. Inicia sesión si es necesario

### Verificaciones:
- [ ] El badge "Modo Dummy" NO debe estar visible en el topbar
- [ ] El botón debe decir "Usar Datos Dummy"
- [ ] El botón debe tener estilo outline (no verde)
- [ ] Los KPIs deben mostrar datos reales (o ceros si no hay datos)

### Consola del Navegador:
```javascript
// Ejecuta esto en la consola:
console.log('Dummy Mode:', localStorage.getItem('k7_dummy_mode'));
// Debe mostrar: null o "false"
```

**Resultado Esperado**: ✅ Modo dummy DESACTIVADO por defecto

---

## TEST 2: Toggle Modo Dummy - Activar

### Pasos:
1. En el Dashboard, haz clic en el botón "Usar Datos Dummy"

### Verificaciones:
- [ ] El badge "Modo Dummy" DEBE aparecer en el topbar
- [ ] El botón debe cambiar a color verde (btn-success)
- [ ] El texto del botón debe cambiar a "Usar Datos Reales"
- [ ] Los KPIs deben cambiar a datos de prueba
- [ ] Los gráficos deben actualizarse con datos dummy

### Consola del Navegador:
```javascript
// Ejecuta esto en la consola:
console.log('Dummy Mode:', localStorage.getItem('k7_dummy_mode'));
// Debe mostrar: "true"
```

**Resultado Esperado**: ✅ Modo dummy ACTIVADO correctamente

---

## TEST 3: Toggle Modo Dummy - Desactivar

### Pasos:
1. Con el modo dummy activo, haz clic en el botón "Usar Datos Reales"

### Verificaciones:
- [ ] El badge "Modo Dummy" DEBE desaparecer
- [ ] El botón debe volver a estilo outline
- [ ] El texto del botón debe cambiar a "Usar Datos Dummy"
- [ ] Los KPIs deben volver a mostrar datos reales
- [ ] Los gráficos deben actualizarse con datos reales

### Consola del Navegador:
```javascript
// Ejecuta esto en la consola:
console.log('Dummy Mode:', localStorage.getItem('k7_dummy_mode'));
// Debe mostrar: "false"
```

**Resultado Esperado**: ✅ Modo dummy DESACTIVADO correctamente

---

## TEST 4: Persistencia del Estado

### Pasos:
1. Activa el modo dummy
2. Recarga la página (F5)

### Verificaciones:
- [ ] El badge "Modo Dummy" sigue visible después de recargar
- [ ] El botón mantiene el color verde
- [ ] El texto sigue siendo "Usar Datos Reales"

### Pasos Adicionales:
3. Desactiva el modo dummy
4. Recarga la página (F5)

### Verificaciones:
- [ ] El badge "Modo Dummy" NO está visible después de recargar
- [ ] El botón mantiene el estilo outline
- [ ] El texto sigue siendo "Usar Datos Dummy"

**Resultado Esperado**: ✅ El estado se persiste correctamente en localStorage

---

## TEST 5: Crear Nuevo Proveedor (Modo Dummy OFF)

### Pre-requisito:
- Asegúrate de que el modo dummy está DESACTIVADO

### Pasos:
1. Ve a `providers.html`
2. Haz clic en el botón "Nuevo Proveedor"
3. Completa el formulario:
   - **Nombre**: Test Provider 001
   - **RUC**: 123456789012
   - **Email**: test001@example.com
   - **Teléfono**: 099123456
   - **Comisión**: 10
   - **Estado**: Activo
   - **Zonas**: Montevideo
   - **Política de Envío**: Gratis sobre $2000
4. Haz clic en "Guardar"

### Verificaciones:
- [ ] El modal se abre correctamente
- [ ] Todos los campos son editables
- [ ] Al hacer clic en "Guardar", aparece un mensaje de éxito
- [ ] El modal se cierra automáticamente
- [ ] El proveedor aparece en la tabla
- [ ] Los datos del proveedor son correctos

### Consola del Navegador:
```javascript
// Busca mensajes de éxito o error
// Debe mostrar: "Proveedor creado exitosamente"
```

### Verificación en Supabase:
1. Abre tu proyecto en Supabase
2. Ve a Table Editor → providers
3. Verifica que el nuevo proveedor existe

**Resultado Esperado**: ✅ Proveedor creado en Supabase

---

## TEST 6: Crear Nuevo Proveedor (Modo Dummy ON)

### Pre-requisito:
- Activa el modo dummy desde el Dashboard

### Pasos:
1. Ve a `providers.html`
2. Haz clic en el botón "Nuevo Proveedor"
3. Completa el formulario con datos de prueba
4. Haz clic en "Guardar"

### Verificaciones:
- [ ] Aparece un mensaje de advertencia: "Modo dummy: No se puede crear en base de datos"
- [ ] El modal NO se cierra
- [ ] El proveedor NO aparece en la tabla
- [ ] NO se crea ningún registro en Supabase

**Resultado Esperado**: ✅ Operación bloqueada correctamente en modo dummy

---

## TEST 7: Crear Nuevo Producto (Modo Dummy OFF)

### Pre-requisito:
- Desactiva el modo dummy
- Asegúrate de tener al menos 1 categoría y 1 proveedor

### Pasos:
1. Ve a `products.html`
2. Haz clic en el botón "Nuevo Producto"
3. Completa el formulario:
   - **SKU**: TEST001
   - **Nombre**: Producto Test 001
   - **Categoría**: (selecciona una existente)
   - **Proveedor**: (selecciona uno existente)
   - **COGS**: 100
   - **Notas**: Producto de prueba
4. Haz clic en "Guardar"

### Verificaciones:
- [ ] El modal se abre correctamente
- [ ] Los selects de categoría y proveedor tienen opciones
- [ ] Al hacer clic en "Guardar", aparece un mensaje de éxito
- [ ] El modal se cierra automáticamente
- [ ] El producto aparece en la tabla
- [ ] Los datos del producto son correctos

### Verificación en Supabase:
1. Ve a Table Editor → products
2. Verifica que el nuevo producto existe

**Resultado Esperado**: ✅ Producto creado en Supabase

---

## TEST 8: Crear Nueva Categoría (Modo Dummy OFF)

### Pre-requisito:
- Desactiva el modo dummy

### Pasos:
1. Ve a `categories.html`
2. Haz clic en el botón "Nueva Categoría"
3. Completa el formulario:
   - **Nombre**: Categoría Test 001
   - **Slug**: (se genera automáticamente: categoria-test-001)
   - **Padre**: Sin padre
   - **Estado**: Activa (checked)
4. Haz clic en "Guardar"

### Verificaciones:
- [ ] El modal se abre correctamente
- [ ] El slug se genera automáticamente al escribir el nombre
- [ ] Al hacer clic en "Guardar", aparece un mensaje de éxito
- [ ] El modal se cierra automáticamente
- [ ] La categoría aparece en la tabla
- [ ] Los datos de la categoría son correctos

### Verificación en Supabase:
1. Ve a Table Editor → categories
2. Verifica que la nueva categoría existe

**Resultado Esperado**: ✅ Categoría creada en Supabase

---

## TEST 9: Validaciones de Formularios

### Test 9.1: Proveedor - Campos Requeridos
1. Ve a `providers.html`
2. Haz clic en "Nuevo Proveedor"
3. Deja campos vacíos y haz clic en "Guardar"

**Verificación**: 
- [ ] Aparece mensaje: "Por favor completa todos los campos requeridos"

### Test 9.2: Proveedor - Email Inválido
1. Ingresa un email inválido (ej: "test")
2. Haz clic en "Guardar"

**Verificación**: 
- [ ] Aparece mensaje: "Email inválido"

### Test 9.3: Proveedor - RUC Inválido
1. Ingresa un RUC con menos de 12 dígitos
2. Haz clic en "Guardar"

**Verificación**: 
- [ ] Aparece mensaje: "RUC inválido (debe tener 12 dígitos)"

### Test 9.4: Producto - Campos Requeridos
1. Ve a `products.html`
2. Haz clic en "Nuevo Producto"
3. Deja SKU o Nombre vacíos
4. Haz clic en "Guardar"

**Verificación**: 
- [ ] Aparece mensaje: "Completa los campos requeridos"

### Test 9.5: Categoría - Campos Requeridos
1. Ve a `categories.html`
2. Haz clic en "Nueva Categoría"
3. Deja Nombre o Slug vacíos
4. Haz clic en "Guardar"

**Verificación**: 
- [ ] Aparece mensaje: "Completa los campos requeridos"

**Resultado Esperado**: ✅ Todas las validaciones funcionan correctamente

---

## TEST 10: Editar Registros

### Test 10.1: Editar Proveedor
1. Ve a `providers.html`
2. Haz clic en el botón de editar (lápiz) de un proveedor
3. Modifica el nombre
4. Haz clic en "Guardar"

**Verificaciones**:
- [ ] El modal se abre con los datos actuales
- [ ] Los cambios se guardan correctamente
- [ ] Aparece mensaje de éxito
- [ ] La tabla se actualiza

### Test 10.2: Editar Producto
1. Ve a `products.html`
2. Haz clic en el botón de editar de un producto
3. Modifica el COGS
4. Haz clic en "Guardar"

**Verificaciones**:
- [ ] El modal se abre con los datos actuales
- [ ] Los cambios se guardan correctamente
- [ ] La tabla se actualiza

### Test 10.3: Editar Categoría
1. Ve a `categories.html`
2. Haz clic en el botón de editar de una categoría
3. Modifica el nombre
4. Haz clic en "Guardar"

**Verificaciones**:
- [ ] El modal se abre con los datos actuales
- [ ] El slug se actualiza automáticamente
- [ ] Los cambios se guardan correctamente

**Resultado Esperado**: ✅ Todas las ediciones funcionan correctamente

---

## TEST 11: Eliminar Registros

### Test 11.1: Eliminar Proveedor
1. Ve a `providers.html`
2. Haz clic en el botón de eliminar (basura) de un proveedor de prueba
3. Confirma la eliminación

**Verificaciones**:
- [ ] Aparece un diálogo de confirmación
- [ ] Al confirmar, aparece mensaje de éxito
- [ ] El proveedor desaparece de la tabla
- [ ] El registro se elimina de Supabase

### Test 11.2: Eliminar Producto
1. Ve a `products.html`
2. Haz clic en el botón de eliminar de un producto de prueba
3. Confirma la eliminación

**Verificaciones**:
- [ ] Aparece diálogo de confirmación
- [ ] El producto se elimina correctamente

### Test 11.3: Eliminar Categoría
1. Ve a `categories.html`
2. Haz clic en el botón de eliminar de una categoría de prueba
3. Confirma la eliminación

**Verificaciones**:
- [ ] Aparece diálogo de confirmación
- [ ] La categoría se elimina correctamente

**Resultado Esperado**: ✅ Todas las eliminaciones funcionan correctamente

---

## TEST 12: Filtros y Búsqueda

### Test 12.1: Búsqueda de Proveedores
1. Ve a `providers.html`
2. Escribe en el campo de búsqueda

**Verificaciones**:
- [ ] La tabla se filtra en tiempo real
- [ ] Los resultados coinciden con el término de búsqueda

### Test 12.2: Filtro por Estado
1. Selecciona "Activos" en el filtro de estado

**Verificaciones**:
- [ ] Solo se muestran proveedores activos

### Test 12.3: Ordenamiento
1. Cambia el orden a "Nombre (Z-A)"

**Verificaciones**:
- [ ] La tabla se reordena correctamente

**Resultado Esperado**: ✅ Filtros y búsqueda funcionan correctamente

---

## TEST 13: Paginación

### Test 13.1: Navegación entre Páginas
1. Si tienes más de 10 registros, verifica la paginación
2. Haz clic en "Página 2"

**Verificaciones**:
- [ ] La tabla muestra los siguientes registros
- [ ] El contador "Mostrando X a Y de Z" se actualiza
- [ ] Los botones de navegación funcionan

**Resultado Esperado**: ✅ Paginación funciona correctamente

---

## TEST 14: Exportar CSV

### Test 14.1: Exportar Proveedores
1. Ve a `providers.html`
2. Haz clic en "Exportar CSV"

**Verificaciones**:
- [ ] Se descarga un archivo CSV
- [ ] El archivo contiene todos los proveedores
- [ ] Los datos están correctamente formateados

**Resultado Esperado**: ✅ Exportación funciona correctamente

---

## Resumen de Testing

### Checklist Final:
- [ ] TEST 1: Estado inicial (Dummy OFF) ✅
- [ ] TEST 2: Activar modo dummy ✅
- [ ] TEST 3: Desactivar modo dummy ✅
- [ ] TEST 4: Persistencia del estado ✅
- [ ] TEST 5: Crear proveedor (Dummy OFF) ✅
- [ ] TEST 6: Crear proveedor (Dummy ON) ✅
- [ ] TEST 7: Crear producto ✅
- [ ] TEST 8: Crear categoría ✅
- [ ] TEST 9: Validaciones ✅
- [ ] TEST 10: Editar registros ✅
- [ ] TEST 11: Eliminar registros ✅
- [ ] TEST 12: Filtros y búsqueda ✅
- [ ] TEST 13: Paginación ✅
- [ ] TEST 14: Exportar CSV ✅

---

## Reporte de Bugs

Si encuentras algún problema durante el testing, documéntalo aquí:

### Bug #1:
- **Descripción**: 
- **Pasos para reproducir**: 
- **Resultado esperado**: 
- **Resultado actual**: 
- **Severidad**: (Crítico/Alto/Medio/Bajo)

### Bug #2:
- **Descripción**: 
- **Pasos para reproducir**: 
- **Resultado esperado**: 
- **Resultado actual**: 
- **Severidad**: 

---

## Notas Adicionales

- Todos los tests deben ejecutarse con el modo dummy DESACTIVADO para verificar operaciones reales
- Verifica siempre en Supabase que los cambios se reflejan en la base de datos
- Si encuentras errores, revisa la consola del navegador para más detalles
- Asegúrate de tener permisos adecuados en Supabase (RLS policies)

---

**Fecha de creación**: 2025
**Versión**: 1.0
