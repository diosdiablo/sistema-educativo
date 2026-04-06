const fs = require('fs');

const backup = JSON.parse(fs.readFileSync('C:/Users/diosd/Downloads/backup_agrop110_2026-04-05.json', 'utf8'));

const students = backup.data.students;

console.log('-- Students import');
console.log('-- Total:', students.length);

students.forEach(s => {
  const id = s.id || `student-${s['N°'] || Math.random().toString(36).substr(2, 9)}`;
  const name = (s.name || s['APELLIDOS Y NOMBRES'] || '').replace(/'/g, "''");
  const dni = s.dni || s['DNI'] || '';
  const classId = s.class_id || (s.gradeLevel ? s.gradeLevel.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50) : 'unknown');
  const guardianName = (s.guardianName || s['ASOCIADO'] || '').replace(/'/g, "''");
  const guardianDni = s.guardianDni || s['DNI_2'] || '';
  const guardianPhone = s.guardianPhone || s['CELULAR'] || '';
  const birthDate = s.birthDate || '';

  console.log(`INSERT INTO students (id, name, dni, class_id, guardian_name, guardian_dni, guardian_phone, birth_date) VALUES ('${id}', '${name}', '${dni}', '${classId}', '${guardianName}', '${guardianDni}', '${guardianPhone}', '${birthDate}');`);
});
