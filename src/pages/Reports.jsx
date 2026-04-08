import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { FileDown, FileText, CalendarCheck, GraduationCap, ChevronRight, Download, FileSpreadsheet, Table, FolderOpen } from 'lucide-react';
import * as XLSX from 'xlsx';
import { loadTemplate, createWorkbookFromData, buildAttendanceData, buildAuxiliaryRegisterData, buildFinalReportData, buildStudentListData, buildInstrumentGradesData } from '../templates/exportTemplates';

const Reports = () => {
  const { students, classes, subjects, attendance, grades, currentUser, periodDates, instrumentEvaluations, instruments } = useStore();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('1');

  const periods = ['1', '2', '3', '4'];

  const exportAttendance = async () => {
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
    
    const data = buildAttendanceData(classStudents, attendance, allDates);

    const template = await loadTemplate('asistencia.xlsx');
    let workbook;
    
    if (template) {
      const sheetName = template.SheetNames[0];
      const worksheet = template.Sheets[sheetName];
      
      data.forEach((row, rowIndex) => {
        Object.entries(row).forEach(([key, value]) => {
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
          for (let col = 0; col <= range.e.c; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: 1, c: col });
            const header = worksheet[cellRef]?.v;
            if (header && String(header).toLowerCase().trim() === String(key).toLowerCase().trim()) {
              const targetCell = XLSX.utils.encode_cell({ r: 2 + rowIndex, c: col });
              worksheet[targetCell] = { t: 's', v: String(value) };
              break;
            }
          }
        });
      });
      
      workbook = template;
    } else {
      const worksheet = XLSX.utils.json_to_sheet(data);
      workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencia');
      
      const dateCols = allDates.length;
      const wscols = [
        { wch: 35 },
        ...Array(dateCols).fill({ wch: 10 }),
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }
      ];
      worksheet['!cols'] = wscols;
    }

    XLSX.writeFile(workbook, `Asistencia_${selectedClass.replace(/ /g, '_')}_Bimestre_${selectedPeriod}.xlsx`);
  };

  const exportAuxiliaryRegister = async () => {
    if (!selectedClass || !selectedSubject) {
      alert('Por favor selecciona un grado/sección y un área');
      return;
    }

    const classStudents = students.filter(s => s.gradeLevel === selectedClass);
    const subject = subjects.find(s => s.id === selectedSubject);
    
    if (!subject) return;

    const data = buildAuxiliaryRegisterData(classStudents, grades, subject, selectedPeriod);

    const template = await loadTemplate('registro_auxiliar.xlsx');
    let workbook;
    
    if (template) {
      const sheetName = template.SheetNames[0];
      const worksheet = template.Sheets[sheetName];
      
      data.forEach((row, rowIndex) => {
        Object.entries(row).forEach(([key, value]) => {
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
          for (let col = 0; col <= range.e.c; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: 2, c: col });
            const header = worksheet[cellRef]?.v;
            if (header && String(header).toLowerCase().trim() === String(key).toLowerCase().trim()) {
              const targetCell = XLSX.utils.encode_cell({ r: 3 + rowIndex, c: col });
              worksheet[targetCell] = { t: 's', v: String(value) };
              break;
            }
          }
        });
      });
      
      workbook = template;
    } else {
      const worksheet = XLSX.utils.json_to_sheet(data);
      workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Bimestre ${selectedPeriod}`);

      const wscols = [
        { wch: 40 },
        ...subject.competencies.map(() => ({ wch: 50 }))
      ];
      worksheet['!cols'] = wscols;
    }

    XLSX.writeFile(workbook, `Registro_Auxiliar_${subject.name}_${selectedClass.replace(/ /g, '_')}_B${selectedPeriod}.xlsx`);
  };

  const exportFinalReport = async () => {
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

    const template = await loadTemplate('reporte_final.xlsx');
    let workbook;
    
    if (template) {
      const sheetName = template.SheetNames[0];
      const worksheet = template.Sheets[sheetName];
      
      const worksheetData = [...headerRows, dataHeaders, ...studentData];
      const newWorksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, newWorksheet, 'Reporte Final');
      
      const wscols = [{ wch: 5 }, { wch: 40 }];
      subject.competencies.forEach(() => {
        wscols.push({ wch: 15 });
        wscols.push({ wch: 50 });
      });
      newWorksheet['!cols'] = wscols;
    } else {
      const worksheetData = [...headerRows, dataHeaders, ...studentData];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Final');

      const wscols = [{ wch: 5 }, { wch: 40 }];
      subject.competencies.forEach(() => {
        wscols.push({ wch: 15 });
        wscols.push({ wch: 50 });
      });
      worksheet['!cols'] = wscols;
    }

    XLSX.writeFile(workbook, `Reporte_Final_${subject.name}_${selectedClass.replace(/ /g, '_')}_B${selectedPeriod}.xlsx`);
  };

  const exportInstrumentGrades = async () => {
    if (!selectedClass || !selectedSubject) {
      alert('Por favor selecciona un grado/sección y un área');
      return;
    }

    const classStudents = students
      .filter(s => s.gradeLevel === selectedClass)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    const subject = subjects.find(s => s.id === selectedSubject);
    if (!subject) return;

    const data = buildInstrumentGradesData(classStudents, instrumentEvaluations, instruments, selectedPeriod);

    if (data.every(row => row['Puntaje'] === '-')) {
      alert('No hay evaluaciones registradas para este período');
      return;
    }

    const template = await loadTemplate('instrumentos.xlsx');
    let workbook;
    
    if (template) {
      const sheetName = template.SheetNames[0];
      const worksheet = template.Sheets[sheetName];
      
      data.forEach((row, rowIndex) => {
        Object.entries(row).forEach(([key, value]) => {
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
          for (let col = 0; col <= range.e.c; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: 3, c: col });
            const header = worksheet[cellRef]?.v;
            if (header && String(header).toLowerCase().trim() === String(key).toLowerCase().trim()) {
              const targetCell = XLSX.utils.encode_cell({ r: 4 + rowIndex, c: col });
              worksheet[targetCell] = { t: 's', v: String(value) };
              break;
            }
          }
        });
      });
      
      workbook = template;
    } else {
      const worksheet = XLSX.utils.json_to_sheet(data);
      workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Calificaciones');

      worksheet['!cols'] = [
        { wch: 5 },
        { wch: 40 },
        { wch: 30 },
        { wch: 25 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 }
      ];
    }

    XLSX.writeFile(workbook, `Calificaciones_${subject.name}_${selectedClass.replace(/ /g, '_')}_B${selectedPeriod}.xlsx`);
  };

  const exportStudentList = async () => {
    if (!selectedClass) {
      alert('Por favor selecciona un grado/sección');
      return;
    }

    const classStudents = students.filter(s => s.gradeLevel === selectedClass);
    
    if (classStudents.length === 0) {
      alert('No hay estudiantes en esta sección');
      return;
    }

    const data = buildStudentListData(classStudents);

    const template = await loadTemplate('lista_estudiantes.xlsx');
    let workbook;
    
    if (template) {
      const sheetName = template.SheetNames[0];
      const worksheet = template.Sheets[sheetName];
      
      data.forEach((row, rowIndex) => {
        Object.entries(row).forEach(([key, value]) => {
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
          for (let col = 0; col <= range.e.c; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: 1, c: col });
            const header = worksheet[cellRef]?.v;
            if (header && String(header).toLowerCase().trim() === String(key).toLowerCase().trim()) {
              const targetCell = XLSX.utils.encode_cell({ r: 2 + rowIndex, c: col });
              worksheet[targetCell] = { t: 's', v: String(value) };
              break;
            }
          }
        });
      });
      
      workbook = template;
    } else {
      const worksheet = XLSX.utils.json_to_sheet(data);
      workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudiantes');

      worksheet['!cols'] = [
        { wch: 5 },
        { wch: 40 },
        { wch: 12 },
        { wch: 20 },
        { wch: 40 },
        { wch: 15 }
      ];
    }

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

      {/* Sección de ayuda para plantillas */}
      <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <div style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px' }}>
            <FolderOpen size={24} color="#8b5cf6" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Plantillas Personalizadas</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Usa las plantillas de tu institución como base
            </p>
          </div>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: '1rem' }}>
            <strong>Ubicación de plantillas:</strong><br />
            <code style={{ background: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
              public/templates/
            </code>
          </p>

          <p style={{ marginBottom: '0.75rem' }}><strong>Archivos de plantilla que puedes usar:</strong></p>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li><code>asistencia.xlsx</code> - Para exportar asistencia</li>
            <li><code>registro_auxiliar.xlsx</code> - Para registros de calificaciones</li>
            <li><code>reporte_final.xlsx</code> - Para reporte final oficial</li>
            <li><code>instrumentos.xlsx</code> - Para calificaciones por instrumento</li>
            <li><code>lista_estudiantes.xlsx</code> - Para lista de estudiantes</li>
          </ul>

          <p style={{ marginBottom: '0.75rem' }}><strong>Cómo usar:</strong></p>
          <ol style={{ marginLeft: '1.5rem' }}>
            <li>Copia tus plantillas de Excel en la carpeta <code>public/templates/</code></li>
            <li>Asegúrate de que los encabezados de columna coincidan con los datos esperados:<br />
              <code>Estudiante</code>, <code>N°</code>, <code>DNI</code>, <code>Instrumento</code>, etc.
            </li>
            <li>Al exportar, el sistema usará tu plantilla y llenará los datos automáticamente</li>
            <li>Si no hay plantilla, se generará el formato predeterminado</li>
          </ol>

          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <p style={{ margin: 0, fontSize: '0.8rem' }}>
              💡 <strong>Tip:</strong> Los encabezados deben estar en la primera fila de datos para que el sistema pueda identificarlos correctamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
