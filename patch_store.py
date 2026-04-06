import re

with open("src/context/StoreContext.jsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update fetch mapping in initialSync 
students_fetch = """      if (studentsData?.length > 0) {
        setStudents(studentsData.map(s => ({
          ...s,
          gradeLevel: s.class_id || s.gradeLevel,
          guardianName: s.guardian_name || s.guardianName,
          guardianDni: s.guardian_dni || s.guardianDni,
          guardianPhone: s.guardian_phone || s.guardianPhone,
          birthDate: s.birth_date || s.birthDate
        })));
      }"""
code = re.sub(r'      if \(studentsData\?.length > 0\) \{[\s\S]*?\}', students_fetch, code, count=1)

attendance_fetch = """      if (attendanceData?.length > 0) {
        setAttendance(attendanceData.map(a => ({
          ...a,
          records: typeof a.records === 'string' ? JSON.parse(a.records) : (a.records || {})
        })));
      }"""
code = re.sub(r'      if \(attendanceData\?.length > 0\) \{[\s\S]*?\}', attendance_fetch, code, count=1)

# 2. Update syncToSupabase
sync_to_supabase_new = """  const syncToSupabase = useCallback(async (table, data) => {
    if (!isOnline || !data || data.length === 0) return;
    
    let mappedData = data;
    if (table === 'students') {
      mappedData = data.map(s => ({ id: s.id, name: s.name, dni: s.dni || null, class_id: s.gradeLevel || 'Sin asignar', guardian_name: s.guardianName || null, guardian_dni: s.guardianDni || null, guardian_phone: s.guardianPhone || null, birth_date: s.birthDate || null }));
    } else if (table === 'attendance') {
      mappedData = data.map(a => ({ id: a.id, student_id: 'batch', date: a.date, records: a.records }));
    } else if (table === 'grades') {
      mappedData = data.map(g => ({ id: g.id, student_id: g.studentId || g.student_id, subject: g.subject, competency_id: g.competencyId || g.competency_id, period: g.period, score: g.score, conclusion: g.conclusion || null }));
    } else if (table === 'subjects') {
      mappedData = data.map(s => ({ id: s.id, name: s.name, competencies: s.competencies || [] }));
    } else if (table === 'classes') {
      mappedData = data.map(c => ({ id: c.id, name: c.name }));
    } else if (table === 'instruments') {
      mappedData = data.map(i => ({ id: i.id, name: i.name, type: i.type || null, subject_id: i.subjectId || i.subject_id || null, class_id: i.classId || i.class_id || null, date: i.date || null, max_score: i.maxScore || i.max_score || null, description: i.description || null }));
    } else if (table === 'instrument_evaluations') {
      mappedData = data.map(e => ({ id: e.id, instrument_id: e.instrumentId || e.instrument_id, student_id: e.studentId || e.student_id, score: e.score, observations: e.observations || null, date: e.date || null }));
    } else if (table === 'schedule') {
      mappedData = data.map(s => ({ id: s.id, class_id: s.classId || s.class_id, subject_id: s.subjectId || s.subject_id, day_of_week: s.dayOfWeek || s.day_of_week || 1, start_time: s.startTime || s.start_time || null, end_time: s.endTime || s.end_time || null }));
    } else if (table === 'diagnostic_evaluations') {
      mappedData = data.map(d => ({ id: d.id, class_id: d.classId || d.class_id, subject_id: d.subjectId || d.subject_id, period: d.period, proficiency_level: d.proficiencyLevel || d.proficiency_level || null, student_results: d.studentResults || d.student_results || [], observations: d.observations || null }));
    } else if (table === 'period_dates') {
      mappedData = data.map(p => ({ id: p.id, start_date: p.start_date || p.start || null, end_date: p.end_date || p.end || null }));
    } else if (table === 'users') {
      mappedData = data.map(u => ({ id: u.id, name: u.name, username: u.username, password: u.password, role: u.role, assignments: u.assignments || [] }));
    }

    try {
      const { error } = await supabase.from(table).upsert(mappedData, { onConflict: 'id' });
      if (error) {
        console.error(`Supabase error upserting to ${table}:`, error);
        alert(`Error guardando en nube (${table}): ${error.message}`);
      }
    } catch (err) {
      console.error(`Sync exception for ${table}:`, err);
    }
  }, [isOnline]);"""
code = re.sub(r'  const syncToSupabase = useCallback\(async \(table, data\) => \{[\s\S]*?\}, \[isOnline\]\);', sync_to_supabase_new, code)

# 3. Clean manual sync mappings since syncToSupabase will handle it now
manual_sync_new = """      await Promise.all([
        syncToSupabase('users', users),
        syncToSupabase('students', students),
        syncToSupabase('subjects', subjects),
        syncToSupabase('classes', classes),
        syncToSupabase('grades', grades),
        syncToSupabase('attendance', attendance),
        syncToSupabase('instruments', instruments),
        syncToSupabase('instrument_evaluations', instrumentEvaluations),
        syncToSupabase('schedule', schedule),
        syncToSupabase('diagnostic_evaluations', diagnosticEvaluations),
        syncToSupabase('period_dates', Object.entries(periodDates).map(([id, dates]) => ({ id, start_date: dates.start, end_date: dates.end })))
      ]);"""
code = re.sub(r'      await Promise\.all\(\[[\s\S]*?\]\);', manual_sync_new, code)

# 4. Cleanup other syncToSupabase mappings in the file to just pass the array
code = code.replace("syncToSupabase('subjects', [{ ...newSubject, competencies: JSON.stringify(newSubject.competencies) }])", "syncToSupabase('subjects', [newSubject])")
code = code.replace("syncToSupabase('subjects', [{ ...newSubj, competencies: JSON.stringify(newSubj.competencies) }])", "syncToSupabase('subjects', [newSubj])")

code = re.sub(r"syncToSupabase\('attendance', \[\{\s*\.\.\.newRecord,\s*student_id:\s*'batch',\s*records:\s*JSON\.stringify\(newRecord\.records\)\s*\}\]\);\s*", "syncToSupabase('attendance', [newRecord]);\n  ", code)
code = re.sub(r"syncToSupabase\('attendance', \[\{\s*\.\.\.newRecord,\s*student_id:\s*'batch'\s*\}\]\);\s*", "syncToSupabase('attendance', [newRecord]);\n  ", code)

code = re.sub(r"syncToSupabase\('grades', \[\{\s*\.\.\.newRecord,\s*student_id:\s*newRecord\.studentId,\s*competency_id:\s*newRecord\.competencyId\s*\}\]\);\s*", "syncToSupabase('grades', [newRecord]);\n  ", code)

code = re.sub(r"syncToSupabase\('instrument_evaluations', \[\{\s*\.\.\.newEval,\s*instrument_id:\s*newEval\.instrumentId,\s*student_id:\s*newEval\.studentId\s*\}\]\);\s*", "syncToSupabase('instrument_evaluations', [newEval]);\n  ", code)

code = re.sub(r"syncToSupabase\('schedule', \[\{\s*\.\.\.newItem,\s*class_id:\s*newItem\.classId,\s*subject_id:\s*newItem\.subjectId\s*\}\]\);\s*", "syncToSupabase('schedule', [newItem]);\n  ", code)

code = re.sub(r"syncToSupabase\('diagnostic_evaluations', \[\{\s*\.\.\.newEval,\s*class_id:\s*newEval\.classId,\s*subject_id:\s*newEval\.subjectId\s*\}\]\);\s*", "syncToSupabase('diagnostic_evaluations', [newEval]);\n  ", code)

code = re.sub(r"syncToSupabase\('students', \[\{\s*\.\.\.newStudent,\s*grade_level:\s*newStudent\.gradeLevel[\s\S]*?birth_date:\s*newStudent\.birthDate\s*\}\]\);\s*", "syncToSupabase('students', [newStudent]);\n  ", code)
code = re.sub(r"syncToSupabase\('students', processedStudents\.map\(s => \(\{\s*\.\.\.s,\s*grade_level:\s*s\.gradeLevel[\s\S]*?birth_date:\s*s\.birthDate\s*\}\)\)\);\s*", "syncToSupabase('students', processedStudents);\n  ", code)

with open("src/context/StoreContext.jsx", "w", encoding="utf-8") as f:
    f.write(code)
