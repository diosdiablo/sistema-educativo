const fs = require('fs');
const b = JSON.parse(fs.readFileSync('C:/Users/diosd/Downloads/backup_agrop110_2026-04-05.json','utf8'));

// Classes
console.log('-- CLASSES');
b.data.classes?.forEach(c => {
  console.log(`INSERT INTO classes (id, name) VALUES ('${c.id}', '${(c.name||'').replace(/'/g,"''")}') ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name;`);
});

// Subjects
console.log('-- SUBJECTS');
b.data.subjects?.forEach(s => {
  const comp = typeof s.competencies === 'string' ? s.competencies : JSON.stringify(s.competencies||[]);
  console.log(`INSERT INTO subjects (id, name, competencies) VALUES ('${s.id}', '${(s.name||'').replace(/'/g,"''")}', '${comp.replace(/'/g,"''")}') ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, competencies=EXCLUDED.competencies;`);
});

// Instruments
console.log('-- INSTRUMENTS');
b.data.instruments?.forEach(i => {
  console.log(`INSERT INTO instruments (id, name, type, subject_id, class_id, date, max_score, description) VALUES ('${i.id}', '${(i.name||'').replace(/'/g,"''")}', '${i.type||''}', '${i.subjectId||''}', '${i.classId||''}', '${i.date||''}', ${i.maxScore||20}, '${(i.description||'').replace(/'/g,"''")}') ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, type=EXCLUDED.type, max_score=EXCLUDED.max_score;`);
});

// Grades
console.log('-- GRADES');
b.data.grades?.forEach(g => {
  console.log(`INSERT INTO grades (id, student_id, subject, competency_id, period, score, conclusion) VALUES ('${g.id||Date.now()+Math.random()}','${g.studentId}', '${(g.subject||'').replace(/'/g,"''")}', '${g.competencyId||''}', '${g.period}', ${g.score||0}, '${(g.conclusion||'').replace(/'/g,"''")}') ON CONFLICT (id) DO UPDATE SET score=EXCLUDED.score, conclusion=EXCLUDED.conclusion;`);
});

// Schedule
console.log('-- SCHEDULE');
b.data.schedule?.forEach(s => {
  console.log(`INSERT INTO schedule (id, class_id, subject_id, day_of_week, start_time, end_time) VALUES ('${s.id}', '${s.classId||''}', '${s.subjectId||''}', ${s.dayOfWeek||1}, '${s.startTime||''}', '${s.endTime||''}') ON CONFLICT (id) DO UPDATE SET class_id=EXCLUDED.class_id, subject_id=EXCLUDED.subject_id;`);
});

// Diagnostic Evaluations
console.log('-- DIAGNOSTIC_EVALUATIONS');
b.data.diagnosticEvaluations?.forEach(d => {
  const results = JSON.stringify(d.studentResults||[]).replace(/'/g,"''");
  console.log(`INSERT INTO diagnostic_evaluations (id, class_id, subject_id, period, proficiency_level, student_results, observations) VALUES ('${d.id}', '${d.classId}', '${d.subjectId}', '${d.period}', '${d.proficiencyLevel||''}', '${results}', '${(d.observations||'').replace(/'/g,"''")}') ON CONFLICT (id) DO UPDATE SET proficiency_level=EXCLUDED.proficiency_level, student_results=EXCLUDED.student_results;`);
});
