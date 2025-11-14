# Instrucciones para Actualizar GitHub

## 📋 Archivos Modificados

Los siguientes archivos fueron modificados para corregir los botones:

1. ✏️ **js/modules/state.js** - Cambio de modo dummy por defecto
2. ✏️ **js/views/dashboard.js** - Mejora de UI del toggle button
3. ➕ **FIXES_BOTONES.md** - Documentación de correcciones (NUEVO)
4. ➕ **TEST_SCRIPT.md** - Script de testing completo (NUEVO)
5. ➕ **INSTRUCCIONES_GIT.md** - Este archivo (NUEVO)

---

## 🚀 Opción 1: Actualizar con Git (Recomendado)

### Paso 1: Abrir Terminal en la Carpeta del Proyecto

```bash
cd C:\Users\DELL\Desktop\kiosko7-admin
```

### Paso 2: Verificar el Estado de Git

```bash
git status
```

Esto te mostrará todos los archivos modificados y nuevos.

### Paso 3: Agregar los Archivos Modificados

```bash
# Agregar todos los archivos modificados
git add .

# O agregar archivos específicos:
git add js/modules/state.js
git add js/views/dashboard.js
git add FIXES_BOTONES.md
git add TEST_SCRIPT.md
git add INSTRUCCIONES_GIT.md
```

### Paso 4: Hacer Commit con Mensaje Descriptivo

```bash
git commit -m "fix: Corregir botones de crear proveedor/producto/categoría y toggle dummy mode

- Cambiar modo dummy por defecto a false para permitir operaciones reales
- Mejorar UI del botón toggle con feedback visual
- Agregar documentación completa de correcciones
- Agregar script de testing detallado

Fixes: Botones no generaban acciones en base de datos"
```

### Paso 5: Subir los Cambios a GitHub

```bash
# Si es la primera vez o no tienes configurado el remote:
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# Subir los cambios a la rama principal
git push origin main

# O si tu rama se llama master:
git push origin master
```

---

## 🔧 Opción 2: Si No Tienes Git Configurado

### Paso 1: Inicializar Git (si no está inicializado)

```bash
cd C:\Users\DELL\Desktop\kiosko7-admin
git init
```

### Paso 2: Configurar tu Información

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

### Paso 3: Agregar el Repositorio Remoto

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
```

### Paso 4: Agregar y Hacer Commit

```bash
git add .
git commit -m "fix: Corregir botones de crear y toggle dummy mode"
```

### Paso 5: Subir los Cambios

```bash
# Primera vez (crear rama main y subir)
git branch -M main
git push -u origin main

# O si ya existe:
git push origin main
```

---

## 🌐 Opción 3: Usar GitHub Desktop (Interfaz Gráfica)

### Paso 1: Abrir GitHub Desktop

1. Abre la aplicación GitHub Desktop
2. Si no la tienes, descárgala de: https://desktop.github.com/

### Paso 2: Agregar el Repositorio

1. Click en "File" → "Add Local Repository"
2. Selecciona la carpeta: `C:\Users\DELL\Desktop\kiosko7-admin`
3. Click en "Add Repository"

### Paso 3: Revisar los Cambios

1. Verás todos los archivos modificados en la lista
2. Revisa los cambios en el panel derecho

### Paso 4: Hacer Commit

1. En el campo "Summary", escribe:
   ```
   fix: Corregir botones de crear y toggle dummy mode
   ```

2. En el campo "Description", escribe:
   ```
   - Cambiar modo dummy por defecto a false
   - Mejorar UI del botón toggle
   - Agregar documentación completa
   - Agregar script de testing
   ```

3. Click en "Commit to main"

### Paso 5: Push a GitHub

1. Click en "Push origin" en la parte superior
2. Espera a que se complete la subida

---

## 🔍 Opción 4: Subir Manualmente desde GitHub.com

### Paso 1: Ir a tu Repositorio en GitHub

1. Abre tu navegador
2. Ve a: `https://github.com/TU_USUARIO/TU_REPOSITORIO`

### Paso 2: Subir Archivos Modificados

Para cada archivo modificado:

1. Navega a la carpeta del archivo en GitHub
2. Click en el archivo existente
3. Click en el ícono de lápiz (Edit)
4. Copia el contenido del archivo local y pégalo
5. Scroll hacia abajo
6. En "Commit changes", escribe: `fix: Actualizar [nombre del archivo]`
7. Click en "Commit changes"

### Paso 3: Subir Archivos Nuevos

Para los archivos nuevos (FIXES_BOTONES.md, TEST_SCRIPT.md, INSTRUCCIONES_GIT.md):

1. Ve a la carpeta raíz del repositorio
2. Click en "Add file" → "Upload files"
3. Arrastra los archivos nuevos
4. Escribe el mensaje de commit
5. Click en "Commit changes"

---

## ✅ Verificar que se Subió Correctamente

### Desde la Terminal:

```bash
# Ver el último commit
git log -1

# Ver el estado
git status

# Ver los cambios remotos
git remote -v
```

### Desde GitHub.com:

1. Ve a tu repositorio
2. Verifica que aparezcan los archivos modificados
3. Click en "Commits" para ver el historial
4. Verifica que tu último commit aparezca

---

## 🆘 Solución de Problemas Comunes

### Error: "fatal: not a git repository"

**Solución:**
```bash
cd C:\Users\DELL\Desktop\kiosko7-admin
git init
```

### Error: "remote origin already exists"

**Solución:**
```bash
git remote remove origin
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
```

### Error: "failed to push some refs"

**Solución:**
```bash
# Primero traer los cambios remotos
git pull origin main --rebase

# Luego subir
git push origin main
```

### Error: "Permission denied (publickey)"

**Solución:**
```bash
# Usar HTTPS en lugar de SSH
git remote set-url origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
```

### Error: "Updates were rejected"

**Solución:**
```bash
# Forzar el push (¡cuidado! esto sobrescribe el remoto)
git push origin main --force

# O mejor, hacer pull primero
git pull origin main --allow-unrelated-histories
git push origin main
```

---

## 📝 Comandos Útiles de Git

```bash
# Ver el estado actual
git status

# Ver el historial de commits
git log

# Ver los cambios en un archivo
git diff js/modules/state.js

# Ver las ramas
git branch

# Cambiar de rama
git checkout nombre-rama

# Crear una nueva rama
git checkout -b nueva-rama

# Ver los remotos configurados
git remote -v

# Actualizar desde GitHub
git pull origin main

# Deshacer cambios locales (¡cuidado!)
git checkout -- archivo.js

# Ver quién modificó cada línea
git blame archivo.js
```

---

## 🎯 Resumen Rápido (Comandos Esenciales)

```bash
# 1. Ir a la carpeta
cd C:\Users\DELL\Desktop\kiosko7-admin

# 2. Agregar cambios
git add .

# 3. Hacer commit
git commit -m "fix: Corregir botones de crear y toggle dummy mode"

# 4. Subir a GitHub
git push origin main
```

---

## 📞 Necesitas Ayuda?

Si encuentras algún problema:

1. Copia el mensaje de error completo
2. Busca en Google: "git [mensaje de error]"
3. O pregúntame y te ayudo a resolverlo

---

## ✨ Después de Subir a GitHub

1. ✅ Verifica que los archivos estén en GitHub
2. ✅ Comparte el link del repositorio si es necesario
3. ✅ Otros desarrolladores pueden clonar y usar los cambios
4. ✅ Puedes hacer deploy desde GitHub a tu servidor

---

**Fecha**: 2025
**Versión**: 1.0
