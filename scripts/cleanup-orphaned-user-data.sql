-- Verificar usuarios actuales
SELECT id, name, username FROM users;

-- Ver registros huérfanos en schedule (user_id que no existe en users)
SELECT s.id, s.user_id, s.class_id, s.subject_id, s.day, s.time 
FROM schedule s 
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id);

-- Ver registros huérfanos en instruments
SELECT i.id, i.title, i.type, i.user_id 
FROM instruments i 
WHERE i.user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = i.user_id);

-- Ver registros huérfanos en instrument_evaluations
SELECT ie.id, ie.instrument_id, ie.student_id, ie.user_id 
FROM instrument_evaluations ie 
WHERE ie.user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ie.user_id);

-- ELIMINAR registros huérfanos en schedule
DELETE FROM schedule 
WHERE user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = schedule.user_id);

-- ELIMINAR registros huérfanos en instruments
DELETE FROM instruments 
WHERE user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = instruments.user_id);

-- ELIMINAR registros huérfanos en instrument_evaluations
DELETE FROM instrument_evaluations 
WHERE user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = instrument_evaluations.user_id);

-- ELIMINAR registros huérfanos en planning_documents
DELETE FROM planning_documents 
WHERE uploaded_by IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = planning_documents.uploaded_by);

-- ELIMINAR registros huérfanos en learning_sessions
DELETE FROM learning_sessions 
WHERE uploaded_by IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = learning_sessions.uploaded_by);

SELECT 'Registros huérfanos eliminados correctamente' as resultado;