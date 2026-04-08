import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { FileDown, FileText, CalendarCheck, GraduationCap, ChevronRight, Download, FileSpreadsheet, Table } from 'lucide-react';
import * as XLSX from 'xlsx';
import { EXPORT_TEMPLATES } from '../templates/exportTemplates';

const Reports = () => {
  const { students, classes, subjects, attendance, grades, currentUser, periodDates, instrumentEvaluations, instruments } = useStore();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('1');

  const periods = ['1', '2', '3', '4'];

  const exportAttendance = () => {
    if (!selectedClass) {
      alert('Por favor selecciona un grado/sección');
      return;
    }

    const classStudents = students.filter(s => s.gradeLevel === selectedClass);
    if (classStudents.length === 0) {
      alert('No hay estudiantes en esta sección');
      return;
    }

    const period = periodDates[selectedPeriod];
    const allDates = [...new Set(attendance.map(a => a.date))]
      .filter(date => date >= period.start && date <= period.end)
      .sort();
    
    if (allDates.length === 0) {
      alert(`No hay registros de asistencia para el Bimestre ${selectedPeriod} en las fechas configuradas (${period.start} a ${period.end}).`);
      return;
    }
    
    const data = classStudents.map(student => {
      const row = { 'Estudiante': student.name };
      let presentCount = 0;
      let absentCount = 0;
      let tardyCount = 0;
      let justifiedCount = 0;

      allDates.forEach(date => {
        const dayRecord = attendance.find(a => a.date === date);
        const status = dayRecord?.records?.[student.id] || '-';
        const formattedDate = new Date(date).toLocaleDateString('es-PE', { 
          day: '2-digit', 
          month: '2-digit' 
        });
        row[formattedDate] = status;

        if (status === 'P') presentCount++;
        if (status === 'F') absentCount++;
        if (status === 'T') tardyCount++;
        if (status === 'J') justifiedCount++;
      });

      row['Total P'] = presentCount;
      row['Total F'] = absentCount;
      row['Total T'] = tardyCount;
      row['Total J'] = justifiedCount;

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencia');
    
    const dateCols = allDates.length;
    const wscols = [
      { wch: 35 }, // Estudiante
      ...Array(dateCols).fill({ wch: 10 }), // Fechas
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 } // Totales
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Asistencia_${selectedClass.replace(/ /g, '_')}_Bimestre_${selectedPeriod}.xlsx`);
  };

  const exportAuxiliaryRegister = () => {
    if (!selectedClass || !selectedSubject) {
      alert('Por favor selecciona un grado/sección y un área');
      return;
    }

    const classStudents = students.filter(s => s.gradeLevel === selectedClass);
    const subject = subjects.find(s => s.id === selectedSubject);
    
    if (!subject) return;

    const data = classStudents.map(student => {
      const row = { 'Estudiante': student.name };
      
      subject.competencies.forEach(comp => {
        const grade = grades.find(g => 
          g.studentId === student.id && 
          g.subject === subject.name && 
          g.competencyId === comp.id && 
          g.period === selectedPeriod
        );
        row[comp.name] = grade ? grade.score : '-';
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Bimestre ${selectedPeriod}`);

    const wscols = [
      { wch: 40 }, // Estudiante
      ...subject.competencies.map(() => ({ wch: 50 })) // Competencias
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Registro_Auxiliar_${subject.name}_${selectedClass.replace(/ /g, '_')}_B${selectedPeriod}.xlsx`);
  };

  const exportFinalReport = () => {
    if (!selectedClass || !selectedSubject) {
      alert('Por favor selecciona un grado/sección y un área');
      return;
    }

    const classStudents = students
      .filter(s => s.gradeLevel === selectedClass)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    const subject = subjects.find(s => s.id === selectedSubject);
    if (!subject) return;

    const headerRows = [
      ['REGISTRO FINAL'],
      [''],
      ['Área:', subject.name],
      ['Grado y Sección:', selectedClass],
      ['Docente:', currentUser?.name || 'Administrador'],
      ['Periodo:', `Bimestre ${selectedPeriod}`],
      ['']
    ];

    const dataHeaders = ['N°', 'Estudiante'];
    subject.competencies.forEach(comp => {
      dataHeaders.push(comp.name);
      dataHeaders.push('Conclusión Descriptiva');
    });

    const studentData = classStudents.map((student, index) => {
      const row = [index + 1, student.name];
      subject.competencies.forEach(comp => {
        const grade = grades.find(g => 
          g.studentId === student.id && 
          g.subject === subject.name && 
          g.competencyId === comp.id && 
          g.period === selectedPeriod
        );
        row.push(grade ? (grade.score || '-') : '-');
        row.push(grade ? (grade.conclusion || '-') : '-');
      });
      return row;
    });

    const worksheetData = [...headerRows, dataHeaders, ...studentData];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Final');

    const wscols = [
      { wch: 5 },
      { wch: 40 },
    ];
    subject.competencies.forEach(() => {
      wscols.push({ wch: 15 });
      wscols.push({ wch: 50 });
    });
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Reporte_Final_${subject.name}_${selectedClass.replace(/ /g, '_')}_B${selectedPeriod}.xlsx`);
  };

  const exportInstrumentGrades = () => {
    if (!selectedClass || !selectedSubject) {
      alert('Por favor selecciona un grado/sección y un área');
      return;
    }

    const classStudents = students
      .filter(s => s.gradeLevel === selectedClass)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    const subject = subjects.find(s => s.id === selectedSubject);
    if (!subject) return;

    const subjectEvals = instrumentEvaluations.filter(ev => 
      ev.subjectId === selectedSubject || ev.subject_name === subject.name
    );

    const studentData = [];
    classStudents.forEach((student, idx) => {
      const studentEvals = subjectEvals.filter(ev => 
        ev.studentId === student.id && ev.period === selectedPeriod
      );

      if (studentEvals.length > 0) {
        studentEvals.forEach(ev => {
          studentData.push({
            'N°': idx + 1,
            'Estudiante': student.name,
            'Instrumento': instruments.find(i => i.id === ev.instrumentId)?.title || ev.activityName || 'Sin título',
            'Actividad': ev.activityName || '-',
            'Puntaje': ev.score ?? '-',
            'Nivel': ev.qualitative || '-',
            'Bimestre': ev.period
          });
        });
      } else {
        studentData.push({
          'N°': idx + 1,
          'Estudiante': student.name,
          'Instrumento': '-',
          'Actividad': '-',
          'Puntaje': '-',
          'Nivel': '-',
          'Bimestre': selectedPeriod
        });
      }
    });

    if (studentData.every(row => row['Puntaje'] === '-')) {
      alert('No hay evaluaciones registradas para este período');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(studentData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Calificaciones');

    worksheet['!cols'] = [
      { wch: 5 },   // N°
      { wch: 40 },  // Estudiante
      { wch: 30 },  // Instrumento
      { wch: 25 },  // Actividad
      { wch: 10 },  // Puntaje
      { wch: 10 },  // Nivel
      { wch: 10 }   // Bimestre
    ];

    XLSX.writeFile(workbook, `Calificaciones_${subject.name}_${selectedClass.replace(/ /g, '_')}_B${selectedPeriod}.xlsx`);
  };

  const exportStudentList = () => {
    if (!selectedClass) {
      alert('Por favor selecciona un grado/sección');
      return;
    }

    const classStudents = students.filter(s => s.gradeLevel === selectedClass);
    
    if (classStudents.length === 0) {
      alert('No hay estudiantes en esta sección');
      return;
    }

    const data = classStudents.map((student, idx) => ({
      'N°': idx + 1,
      'Estudiante': student.name,
      'DNI': student.dni || '-',
      'Fecha de Nacimiento': student.birthDate || '-',
      'Nombre del Apoderado': student.guardianName || '-',
      'Teléfono': student.guardianPhone || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudiantes');

    worksheet['!cols'] = [
      { wch: 5 },   // N°
      { wch: 40 },  // Estudiante
      { wch: 12 },  // DNI
      { wch: 20 },  // Fecha Nac
      { wch: 40 },  // Apoderado
      { wch: 15 }   // Teléfono
    ];

    XLSX.writeFile(workbook, `Lista_Estudiantes_${selectedClass.replace(/ /g, '_')}.xlsx`);
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h2 className="page-title">Centro de Reportes</h2>
          <p className="page-subtitle">Exporta registros de asistencia y evaluaciones en formato Excel</p>
        </div>
        <FileDown size={32} className="text-accent" />
      </header>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
        
        {/* Card Asistencia */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
              <CalendarCheck size={24} color="var(--accent-primary)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Reporte de Asistencia</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Seleccionar Grado y Sección
              </label>
              <select 
                className="input-field"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">-- Elige una sección --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Seleccionar Bimestre
              </label>
              <select 
                className="input-field"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                {periods.map(p => (
                  <option key={p} value={p}>Bimestre {p}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={exportAttendance}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '1rem' }}
            >
              <Download size={20} />
              Exportar Asistencia de Bimestre {selectedPeriod}
            </button>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f1f5f9', borderRadius: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <p><strong>Nota:</strong> El reporte incluirá todas las fechas registradas hasta el momento para la sección seleccionada.</p>
          </div>
        </div>

        {/* Card Registros Auxiliares */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
              <GraduationCap size={24} color="var(--success-color)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Registros Auxiliares</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Sección
                </label>
                <select 
                  className="input-field"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">-- Sección --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Periodo
                </label>
                <select 
                  className="input-field"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  {periods.map(p => (
                    <option key={p} value={p}>Bimestre {p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Área Curricular
              </label>
              <select 
                className="input-field"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">-- Selecciona el Área --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={exportAuxiliaryRegister}
              className="btn-primary"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                padding: '1rem',
                backgroundColor: 'var(--success-color)',
                boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)'
              }}
            >
              <FileText size={20} />
              Generar Registro Auxiliar
            </button>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f1f5f9', borderRadius: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <p><strong>Nota:</strong> Este reporte unifica todas las notas registradas por competencia para el área y periodo seleccionados.</p>
          </div>
        </div>

        {/* Card Reporte Final */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px' }}>
              <FileDown size={24} color="var(--accent-primary)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Reporte Final (Oficial)</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Sección
                </label>
                <select 
                  className="input-field"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">-- Sección --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Periodo
                </label>
                <select 
                  className="input-field"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  {periods.map(p => (
                    <option key={p} value={p}>Bimestre {p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Área Curricular
              </label>
              <select 
                className="input-field"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">-- Selecciona el Área --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={exportFinalReport}
              className="btn-primary"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                padding: '1rem',
                backgroundColor: 'var(--accent-primary)',
                boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.39)'
              }}
            >
              <Download size={20} />
              Generar Registro Final (Excel)
            </button>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f1f5f9', borderRadius: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <p><strong>Nota:</strong> Este reporte incluye el número de orden, notas finales y conclusiones descriptivas por cada competencia.</p>
          </div>
        </div>

        {/* Card Calificaciones por Instrumento */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ padding: '10px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '12px' }}>
              <FileSpreadsheet size={24} color="#f97316" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Calificaciones por Instrumento</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Sección
                </label>
                <select 
                  className="input-field"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">-- Sección --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Periodo
                </label>
                <select 
                  className="input-field"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  {periods.map(p => (
                    <option key={p} value={p}>Bimestre {p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Área Curricular
              </label>
              <select 
                className="input-field"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">-- Selecciona el Área --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={exportInstrumentGrades}
              className="btn-primary"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                padding: '1rem',
                backgroundColor: '#f97316',
                boxShadow: '0 4px 14px 0 rgba(249, 115, 22, 0.39)'
              }}
            >
              <Download size={20} />
              Exportar Calificaciones por Instrumento
            </button>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f1f5f9', borderRadius: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <p><strong>Nota:</strong> Este reporte lista todas las evaluaciones por instrumento, incluyendo puntaje y nivel cualitativo.</p>
          </div>
        </div>

        {/* Card Lista de Estudiantes */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ padding: '10px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px' }}>
              <Table size={24} color="#22c55e" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Lista de Estudiantes</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Seleccionar Grado y Sección
              </label>
              <select 
                className="input-field"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">-- Elige una sección --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={exportStudentList}
              className="btn-primary"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                padding: '1rem',
                backgroundColor: '#22c55e',
                boxShadow: '0 4px 14px 0 rgba(34, 197, 94, 0.39)'
              }}
            >
              <Download size={20} />
              Exportar Lista de Estudiantes
            </button>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f1f5f9', borderRadius: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <p><strong>Nota:</strong> Este reporte incluye el número de orden, nombres, DNI, fecha de nacimiento y datos del apoderado.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;
