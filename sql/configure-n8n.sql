-- ============================================
-- CONFIGURACIÓN DE N8N WEBHOOK
-- ============================================
-- Este script configura la URL del webhook de n8n en la base de datos
-- Ejecuta este script en el SQL Editor de Supabase

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

-- Verificar que se guardó correctamente
SELECT 
  key,
  value,
  updated_at
FROM settings 
WHERE key = 'n8n_webhook';

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- key          | value                                                    | updated_at
-- -------------|----------------------------------------------------------|-------------------
-- n8n_webhook  | {"url": "https://n8n.srv888919.hstgr.cloud/webhook-..."}| 2024-01-XX XX:XX:XX

-- ============================================
-- NOTAS:
-- ============================================
-- 1. Si necesitas cambiar la URL, simplemente ejecuta este script con la nueva URL
-- 2. La aplicación leerá esta configuración desde la tabla settings
-- 3. También puedes cambiar la URL desde la interfaz web en Settings
