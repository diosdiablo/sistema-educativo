import * as XLSX from 'xlsx';

export const TEMPLATE_CONFIG = {
  attendance: {
    id: 'attendance',
    name: 'Registro de Asistencia',
    description: 'Plantilla para exportar asistencia diaria',
    templateFile: 'asistencia.xlsx',
    requiredColumns: ['Estudiante'],
    dataStartRow: 2
  },
  
  auxiliaryRegister: {
    id: 'auxiliaryRegister',
    name: 'Registro de Calificaciones',
    description: 'Plantilla simple con estudiantes, competencias y promedio',
    templateFile: 'calificaciones_simple.xlsx',
    requiredColumns: ['N°'],
    dataStartRow: 3
  },
  
  finalReport: {
    id: 'finalReport',
    name: 'Reporte Final',
    description: 'Plantilla oficial con conclusiones descriptivas',
    templateFile: 'reporte_final.xlsx',
    requiredColumns: ['Estudiante'],
    dataStartRow: 9
  },

  instrumentGrades: {
    id: 'instrumentGrades',
    name: 'Calificaciones por Instrumento',
    description: 'Plantilla para exportar evaluaciones por instrumento',
    templateFile: 'instrumentos.xlsx',
    requiredColumns: ['Estudiante'],
    dataStartRow: 4
  },

  studentList: {
    id: 'studentList',
    name: 'Lista de Estudiantes',
    description: 'Plantilla para exportar lista de estudiantes',
    templateFile: 'lista_estudiantes.xlsx',
    requiredColumns: ['Estudiante'],
    dataStartRow: 2
  }
};

export const createSimpleGradesTemplate = (subject, period, className) => {
  const wb = XLSX.utils.book_new();
  
  // Crear hoja
  const ws = XLSX.utils.aoa_to_sheet([
    [`REGISTRO DE CALIFICACIONES - ${subject.name}`],
    [`Grado: ${className}`],
    [`Bimestre: ${period}`],
    [],
    ['N°', 'Estudiante', ...subject.competencies.map(c => c.name), 'PROMEDIO']
  ]);
  
  ws['!cols'] = [
    { wch: 5 },  // N°
    { wch: 30 }, // Estudiante
    ...subject.competencies.map(() => ({ wch: 15 })), // Competencias
    { wch: 10 }  // Promedio
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Calificaciones');
  return wb;
};

export const loadTemplate = async (templateFileName) => {
  try {
    const response = await fetch(`/templates/${templateFileName}`);
    if (!response.ok) {
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    return workbook;
  } catch (error) {
    console.warn(`No se encontró plantilla: ${templateFileName}`);
    return null;
  }
};

export const fillTemplateWithData = (workbook, data, config) => {
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const dataStartRow = config.dataStartRow || 2;
  
  data.forEach((rowData, rowIndex) => {
    const excelRow = dataStartRow + rowIndex;
    
    Object.entries(rowData).forEach(([key, value]) => {
      let colIndex = -1;
      
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let col = 0; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: dataStartRow - 1, c: col });
        const cellValue = worksheet[cellRef]?.v;
        
        if (cellValue && String(cellValue).toLowerCase().trim() === String(key).toLowerCase().trim()) {
          colIndex = col;
          break;
        }
      }
      
      if (colIndex !== -1) {
        const targetCell = XLSX.utils.encode_cell({ r: excelRow, c: colIndex });
        worksheet[targetCell] = { t: typeof value === 'number' ? 'n' : 's', v: value };
      }
    });
  });
  
  return workbook;
};

export const createWorkbookFromData = (data, sheetName = 'Sheet1') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return workbook;
};

export const buildAttendanceData = (students, attendance, dates) => {
  const rows = [];
  
  students.forEach(student => {
    const row = { Estudiante: student.name };
    
    dates.forEach(date => {
      const record = attendance.find(a => a.date === date);
      const status = record?.records?.[student.id] || '-';
      row[date] = status;
    });
    
    rows.push(row);
  });
  
  return rows;
};

export const getQualitativeGrade = (score, maxScore = 20) => {
  if (score === null || score === undefined || score === '-') return '-';
  if (maxScore === 0) return 'C';
  const percentage = (score / maxScore) * 100;
  if (percentage >= 90) return 'AD';
  if (percentage >= 70) return 'A';
  if (percentage >= 50) return 'B';
  return 'C';
};

// Calcular promedio cualitativo de varias calificaciones
const getAverageQualitative = (scores) => {
  const validScores = scores.filter(s => typeof s === 'number');
  if (validScores.length === 0) return '-';
  
  const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length;
  return getQualitativeGrade(avg);
};

export const buildAuxiliaryRegisterData = (students, instrumentEvaluations, subject, period) => {
  return students.map((student, idx) => {
    // Filtrar evaluaciones de este estudiante para este período
    const studentEvals = instrumentEvaluations.filter(ev => 
      ev.studentId === student.id && 
      ev.period === period
    );
    
    const row = { 
      'N°': idx + 1,
      'Estudiante': student.name 
    };
    
    // Para cada competencia, buscar las calificaciones
    subject.competencies.forEach(comp => {
      // Buscar evaluaciones que coincidan con esta competencia
      const compEvals = studentEvals.filter(ev => 
        ev.competencyId === comp.id
      );
      
      // Obtener las calificaciones (scores)
      const scores = compEvals.map(ev => ev.score);
      
      // Calcular promedio cualitativo
      row[comp.name] = getAverageQualitative(scores);
    });
    
    // Promedio general
    const allScores = studentEvals.map(ev => ev.score).filter(s => typeof s === 'number');
    row['PROMEDIO'] = getAverageQualitative(allScores);
    
    return row;
  });
};

export const buildFinalReportData = (students, grades, subject, period) => {
  return students.map((student, idx) => {
    const row = { 'N°': idx + 1, 'Estudiante': student.name };
    
    subject.competencies.forEach(comp => {
      const grade = grades.find(g => 
        g.studentId === student.id && 
        g.subject === subject.name && 
        g.competencyId === comp.id && 
        g.period === period
      );
      row[comp.name] = grade?.score ?? '-';
      row[`${comp.name} - Conclusión`] = grade?.conclusion ?? '-';
    });

    return row;
  });
};

export const buildStudentListData = (students) => {
  return students.map((student, idx) => ({
    'N°': idx + 1,
    'Estudiante': student.name,
    'DNI': student.dni || '-',
    'Fecha de Nacimiento': student.birthDate || '-',
    'Nombre del Apoderado': student.guardianName || '-',
    'Teléfono': student.guardianPhone || '-'
  }));
};

export const buildInstrumentGradesData = (students, evaluations, instruments, period) => {
  const data = [];
  
  students.forEach((student, idx) => {
    const studentEvals = evaluations.filter(ev => 
      ev.studentId === student.id && ev.period === period
    );

    if (studentEvals.length > 0) {
      studentEvals.forEach(ev => {
        data.push({
          'N°': idx + 1,
          'Estudiante': student.name,
          'Instrumento': ev.activityName || ev.instrumentName || '-',
          'Puntaje': ev.score,
          'Máximo': ev.maxPossible || 20,
          'Fecha': ev.date || '-'
        });
      });
    }
  });
  
  return data;
};

export const buildDetailedGradesReport = (students, instrumentEvaluations, subject, period) => {
  const maxGradesPerCompetency = {};
  
  students.forEach(student => {
    const studentEvals = instrumentEvaluations.filter(ev => 
      ev.studentId === student.id && ev.period === period
    );
    
    subject.competencies.forEach(comp => {
      const compCount = studentEvals.filter(ev => ev.competencyId === comp.id).length;
      if (!maxGradesPerCompetency[comp.id] || compCount > maxGradesPerCompetency[comp.id]) {
        maxGradesPerCompetency[comp.id] = compCount;
      }
    });
  });
  
  const headerRow1 = [];
  const headerRow2 = ['Estudiante'];
  
  subject.competencies.forEach(comp => {
    const numCols = maxGradesPerCompetency[comp.id] || 1;
    headerRow1.push(comp.name);
    for (let i = 1; i < numCols; i++) {
      headerRow1.push('');
    }
    for (let i = 0; i < numCols; i++) {
      headerRow2.push(`c${i + 1}`);
    }
  });
  headerRow1.push('PROMEDIO');
  headerRow2.push('PROM');
  
  const data = [];
  
  students.forEach((student) => {
    const studentEvals = instrumentEvaluations.filter(ev => 
      ev.studentId === student.id && ev.period === period
    );
    
    const row = [student.name];
    
    subject.competencies.forEach(comp => {
      const compEvals = studentEvals.filter(ev => ev.competencyId === comp.id);
      const numCols = maxGradesPerCompetency[comp.id] || 1;
      
      for (let i = 0; i < numCols; i++) {
        if (i < compEvals.length) {
          row.push(compEvals[i].score ?? '-');
        } else {
          row.push('-');
        }
      }
    });
    
    const allScores = studentEvals.map(ev => ev.score).filter(s => typeof s === 'number');
    const avg = allScores.length > 0 
      ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1)
      : '-';
    row.push(avg);
    
    data.push({ _row: row });
  });
  
  return { headerRow1, headerRow2, data, maxGradesPerCompetency };
};

export const exportDetailedGradesToExcel = (students, instrumentEvaluations, subject, period, className, periodName) => {
  const { headerRow1, headerRow2, data, maxGradesPerCompetency } = buildDetailedGradesReport(students, instrumentEvaluations, subject, period);
  
  const wb = XLSX.utils.book_new();
  
  const cols = [{ wch: 30 }];
  subject.competencies.forEach(comp => {
    const numCols = maxGradesPerCompetency[comp.id] || 1;
    for (let i = 0; i < numCols; i++) {
      cols.push({ wch: 10 });
    }
  });
  cols.push({ wch: 12 });
  
  const rows = [
    [`REGISTRO DE CALIFICACIONES DETALLADO - ${subject.name}`],
    [`Grado: ${className}`],
    [`Bimestre: ${periodName}`],
    [],
    headerRow1,
    headerRow2,
    ...data.map(d => d._row)
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = cols;
  
  XLSX.utils.book_append_sheet(wb, ws, 'Calificaciones Detallado');
  return wb;
};