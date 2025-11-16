-- ============================================
-- AGREGAR CAMPOS ADICIONALES A PROVEEDORES
-- ============================================
-- Este script agrega campos para ciudad, locación y tiempos de entrega

-- Agregar columnas a la tabla providers
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS delivery_time_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Crear índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_providers_city ON providers(city);
CREATE INDEX IF NOT EXISTS idx_providers_delivery_time ON providers(delivery_time_days);

-- Comentarios para documentación
COMMENT ON COLUMN providers.city IS 'Ciudad donde opera el proveedor';
COMMENT ON COLUMN providers.location IS 'Dirección o ubicación específica';
COMMENT ON COLUMN providers.delivery_time_days IS 'Tiempo de entrega en días';
COMMENT ON COLUMN providers.delivery_notes IS 'Notas adicionales sobre entregas';

-- Verificar que se agregaron correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'providers'
ORDER BY ordinal_position;
