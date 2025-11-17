# Script para actualizar logos y agregar enlace a providers-compare en todos los archivos HTML

$files = @(
    "products.html",
    "categories.html",
    "compare.html",
    "ingest.html",
    "settings.html",
    "login.html",
    "providers-compare.html"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Actualizando $file..."
        
        # Leer contenido
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # Reemplazar logo URL
        $content = $content -replace 'https://negociolisto\.online/wp-content/uploads/2025/11/logo_k7-3\.svg', 'assets/img/k7_smart.svg'
        
        # Reemplazar texto del logo
        $content = $content -replace '<span class="sidebar-logo-text">Kiosko7</span>', '<span class="sidebar-logo-text">k7</span>'
        
        # Agregar enlace a providers-compare si no existe y si el archivo tiene la sección de Análisis
        if ($content -match '<h6 class="nav-section-title">Análisis</h6>' -and $content -notmatch 'providers-compare\.html') {
            $analysisSection = @'
        <div class="nav-section">
          <h6 class="nav-section-title">Análisis</h6>
          <ul>
            <li class="nav-item">
              <a href="compare.html" class="nav-link">
                <i class="bi bi-graph-up-arrow"></i>
                <span class="nav-link-text">Comparativas</span>
              </a>
            </li>
          </ul>
        </div>
'@
            
            $newAnalysisSection = @'
        <div class="nav-section">
          <h6 class="nav-section-title">Análisis</h6>
          <ul>
            <li class="nav-item">
              <a href="compare.html" class="nav-link">
                <i class="bi bi-graph-up-arrow"></i>
                <span class="nav-link-text">Comparativas</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="providers-compare.html" class="nav-link">
                <i class="bi bi-arrow-left-right"></i>
                <span class="nav-link-text">Comparar Proveedores</span>
              </a>
            </li>
          </ul>
        </div>
'@
            
            $content = $content -replace [regex]::Escape($analysisSection), $newAnalysisSection
        }
        
        # Guardar archivo
        $content | Set-Content $file -Encoding UTF8 -NoNewline
        
        Write-Host "✓ $file actualizado"
    } else {
        Write-Host "✗ $file no encontrado"
    }
}

Write-Host "`nActualización completada!"
