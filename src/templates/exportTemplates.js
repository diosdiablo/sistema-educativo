import * as XLSX from 'xlsx';

export const EXPORT_TEMPLATES = {
  attendance: {
    id: 'attendance',
    name: 'Registro de Asistencia',
    description: 'Plantilla para exportar asistencia diaria',
    headerRows: 1,
    columns: {
      student: { header: 'Estudiante', width: 35 },
      dates: { header: 'Fecha (dd/mm)', width: 12 },
      totals: { header: 'Totales', width: 10 }
    },
    styles: {
      title: { fontSize: 14, bold: true, alignment: 'center' },
      header: { bold: true, fill: 'D9E1F2' },
      totals: { bold: true, fill: 'E2EFDA' }
    }
  },
  
  auxiliaryRegister: {
    id: 'auxiliaryRegister',
    name: 'Registro Auxiliar',
    description: 'Plantilla para exportar calificaciones por competencia',
    headerRows: 2,
    columns: {
      student: { header: 'Estudiante', width: 40 },
      competency: { header: 'Competencia', width: 50 },
      score: { header: 'Nota', width: 10 }
    },
    styles: {
      title: { fontSize: 14, bold: true, alignment: 'center' },
      header: { bold: true, fill: 'D9E1F2' },
      score: { alignment: 'center' }
    }
  },
  
  finalReport: {
    id: 'finalReport',
    name: 'Reporte Final',
    description: 'Plantilla oficial con conclusiones descriptivas',
    headerRows: 8,
    columns: {
      order: { header: 'N°', width: 5 },
      student: { header: 'Estudiante', width: 40 },
      score: { header: 'Nota', width: 12 },
      conclusion: { header: 'Conclusión Descriptiva', width: 50 }
    },
    styles: {
      title: { fontSize: 16, bold: true, alignment: 'center' },
      header: { bold: true, fill: 'D9E1F2' },
      infoLabel: { bold: true },
      infoValue: { }
    }
  },

  instrumentGrades: {
    id: 'instrumentGrades',
    name: 'Calificaciones por Instrumento',
    description: 'Plantilla para exportar evaluaciones por instrumento',
    headerRows: 3,
    columns: {
      order: { header: 'N°', width: 5 },
      student: { header: 'Estudiante', width: 40 },
      instrument: { header: 'Instrumento', width: 35 },
      activity: { header: 'Actividad', width: 25 },
      score: { header: 'Puntaje', width: 10 },
      qualitative: { header: 'Nivel', width: 10 },
      period: { header: 'Bimestre', width: 10 }
    },
    styles: {
      title: { fontSize: 14, bold: true, alignment: 'center' },
      header: { bold: true, fill: 'D9E1F2' }
    }
  }
};

export const createStyledWorksheet = (data, options = {}) => {
  const {
    title = '',
    titleRow = null,
    headerRow = null,
    infoRows = [],
    columnWidths = {},
    freezeRows = 0,
    freezeCols = 1
  } = options;

  const worksheet = XLSX.utils.json_to_sheet(data, { 
    header: Object.keys(data[0] || {}),
    skipHeader: false 
  });

  worksheet['!cols'] = Object.keys(data[0] || {}).map(key => ({
    wch: columnWidths[key] || 15
  }));

  worksheet['!freeze'] = { xSplit: freezeCols, ySplit: freezeRows };

  return worksheet;
};

export const buildAttendanceData = (students, attendanceRecords, dates, period) => {
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

export const buildFinalReportData = (students, grades, subject, period, teacherName = '') => {
  const infoRows = [
    ['ÁREA CURRICULAR:', subject.name],
    ['GRADO Y SECCIÓN:', ''],
    ['DOCENTE:', teacherName],
    ['BIMESTRE:', period],
    [''],
    ['N°', 'Estudiante', ...subject.competencies.flatMap(c => [c.name, 'Conclusión Descriptiva'])]
  ];

  const studentRows = students.map((student, idx) => {
    const row = [idx + 1, student.name];
    subject.competencies.forEach(comp => {
      const grade = grades.find(g => 
        g.studentId === student.id && 
        g.subject === subject.name && 
        g.competencyId === comp.id && 
        g.period === period
      );
      row.push(grade?.score ?? '-');
      row.push(grade?.conclusion ?? '-');
    });
    return row;
  });

  return { infoRows, studentRows };
};

export const applyStylesToWorksheet = (worksheet, dataLength, styles) => {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  if (styles.header) {
    for (let col = 0; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellRef]) continue;
      worksheet[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: styles.header.fill || 'D9E1F2' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
      };
    }
  }

  return worksheet;
};
