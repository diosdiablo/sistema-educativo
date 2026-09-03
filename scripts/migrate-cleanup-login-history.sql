-- Migración: limpiar registros viejos de login_history
-- Elimina registros con más de 90 días
DELETE FROM login_history
WHERE login_at < NOW() - INTERVAL '90 days';
