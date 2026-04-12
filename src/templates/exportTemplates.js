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
    name: 'Registro Auxiliar 2026',
    description: 'Plantilla oficial de evaluación 2026 - SECUNDARIA',
    templateFile: 'REGISTRO AUXILIAR 2026.xlsx',
    requiredColumns: ['N° DE ORDEN'],
    dataStartRow: 10,
    headerRows: 9
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
      
      if (colIndex === -1) {
        for (let col = 0; col <= range.e.c; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
          const cellValue = worksheet[cellRef]?.v;
          if (cellValue && String(cellValue).toLowerCase().trim() === String(key).toLowerCase().trim()) {
            colIndex = col;
            break;
          }
        }
      }
      
      if (colIndex === -1) {
        colIndex = Object.keys(rowData).indexOf(key);
      }
      
      if (colIndex >= 0) {
        const cellRef = XLSX.utils.encode_cell({ r: excelRow, c: colIndex });
        worksheet[cellRef] = { t: 's', v: String(value) };
      }
    });
  });
  
  return workbook;
};

export const createWorkbookFromData = (data, options = {}) => {
  const { 
    sheetName = 'Datos',
    columnWidths = {},
    headerRow = 0 
  } = options;
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  if (Object.keys(columnWidths).length > 0) {
    worksheet['!cols'] = Object.keys(data[0] || {}).map(key => ({
      wch: columnWidths[key] || 15
    }));
  }
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  return workbook;
};

export const buildAttendanceData = (students, attendanceRecords, dates) => {
  return students.map(student => {
    const row = { 'Estudiante': student.name };
    
    dates.forEach(date => {
      const dayRecord = attendanceRecords.find(a => a.date === date);
      const status = dayRecord?.records?.[student.id] || '-';
      const formattedDate = new Date(date).toLocaleDateString('es-PE', { 
        day: '2-digit', 
        month: '2-digit' 
      });
      row[formattedDate] = status;
    });

    let totals = { P: 0, F: 0, T: 0, J: 0 };
    attendanceRecords.forEach(dayRecord => {
      const status = dayRecord.records?.[student.id];
      if (status === 'P') totals.P++;
      if (status === 'F') totals.F++;
      if (status === 'T') totals.T++;
      if (status === 'J') totals.J++;
    });

    row['Total P'] = totals.P;
    row['Total F'] = totals.F;
    row['Total T'] = totals.T;
    row['Total J'] = totals.J;

    return row;
  });
};

export const buildAuxiliaryRegisterData = (students, grades, subject, period) => {
  return students.map(student => {
    const row = { 'Estudiante': student.name };
    
    subject.competencies.forEach(comp => {
      const grade = grades.find(g => 
        g.studentId === student.id && 
        g.subject === subject.name && 
        g.competencyId === comp.id && 
        g.period === period
      );
      row[comp.name] = grade?.score ?? '-';
    });

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
          'Instrumento': instruments.find(i => i.id === ev.instrumentId)?.title || ev.activityName || '-',
          'Actividad': ev.activityName || '-',
          'Puntaje': ev.score ?? '-',
          'Nivel': ev.qualitative || '-',
          'Bimestre': ev.period
        });
      });
    } else {
      data.push({
        'N°': idx + 1,
        'Estudiante': student.name,
        'Instrumento': '-',
        'Actividad': '-',
        'Puntaje': '-',
        'Nivel': '-',
        'Bimestre': period
      });
    }
  });

  return data;
};

export const TEMPLATE_INSTRUCTIONS = `
INSTRUCCIONES PARA PLANTILLAS PERSONALIZADAS
============================================

Ubicación de plantillas:
Coloca tus archivos .xlsx en: /public/templates/

Nombres de archivos aceptados:
- asistencia.xlsx
- registro_auxiliar.xlsx
- reporte_final.xlsx
- instrumentos.xlsx
- lista_estudiantes.xlsx

Estructura requerida:
- La primera fila debe contener los encabezados de columna
- Los encabezados deben coincidir con los nombres de datos:
  * "Estudiante" - Nombre del estudiante
  * "N°" - Número de orden
  * "DNI" - Número de documento
  * etc.

- A partir de la segunda/tercera fila se llenarán los datos automáticamente

Si no hay plantilla, el sistema generará el formato automáticamente.
`;
