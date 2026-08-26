import * as XLSX from 'xlsx';
import JSZip from 'jszip';

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
export const getAverageQualitative = (scores) => {
  if (!scores || scores.length === 0) return '-';
  
  const validScores = scores.filter(s => typeof s === 'number');
  if (validScores.length > 0) {
    const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length;
    return getQualitativeGrade(avg);
  }
  
  const validQual = scores.filter(s => typeof s === 'string' && s !== '-' && s !== undefined);
  if (validQual.length === 0) return '-';
  
  if (validQual.length === 1) return validQual[0];
  
  const qualMap = { 'AD': 4, 'A': 3, 'B': 2, 'C': 1 };
  const numValues = validQual.map(q => qualMap[q] || 0);
  const avgNum = numValues.reduce((a, b) => a + b, 0) / numValues.length;
  
  if (avgNum >= 3.5) return 'AD';
  if (avgNum >= 2.5) return 'A';
  if (avgNum >= 1.5) return 'B';
  return 'C';
};

export const buildAuxiliaryRegisterData = (students, instrumentEvaluations, subject, period) => {
  return students.map((student, idx) => {
    const studentEvals = instrumentEvaluations.filter(ev => {
      if (ev.period !== period) return false;
      const idMatch = ev.studentId === student.id || ev.student_id === student.id;
      const nameMatch = ev.student_name && ev.student_name === student.name;
      return idMatch || nameMatch;
    });
    
    const row = { 
      'N°': idx + 1,
      'Estudiante': student.name 
    };
    
    subject.competencies.forEach(comp => {
      const compEvals = studentEvals.filter(ev => {
        const cid = ev.competencyId || ev.competency_id;
        return cid === comp.id || cid === '__all__';
      });
      
      const scores = compEvals.map(ev => ev.score !== null && ev.score !== undefined ? ev.score : ev.qualitative);
      
      row[comp.name] = getAverageQualitative(scores);
    });
    
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
    const studentEvals = evaluations.filter(ev => {
      if (ev.period !== period) return false;
      const idMatch = ev.studentId === student.id || ev.student_id === student.id;
      const nameMatch = ev.student_name && ev.student_name === student.name;
      return idMatch || nameMatch;
    });

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

export const buildDetailedGradesReport = (students, instrumentEvaluations, subjects, subjectId, period) => {
  const maxGradesPerCompetency = {};
  const subject = subjects.find(s => s.id === subjectId);
  if (!subject) return { headerRow1: [], headerRow2: [], data: [], maxGradesPerCompetency: {} };
  
  const studentsByName = {};
  students.forEach(s => { studentsByName[s.name] = s; });

  const getStudentEvals = (student) => {
    const evals = instrumentEvaluations.filter(ev => {
      if (ev.period !== period) return false;
      const idMatch = ev.studentId === student.id || ev.student_id === student.id;
      const nameMatch = ev.student_name && ev.student_name === student.name;
      return idMatch || nameMatch;
    });
    return evals;
  };
  
  students.forEach(student => {
    const studentEvals = getStudentEvals(student);
    
    subject.competencies.forEach(comp => {
      const compEvals = studentEvals.filter(ev => {
        const cid = ev.competencyId || ev.competency_id;
        return cid === comp.id;
      });
      const groupedByInstrument = {};
      compEvals.forEach(ev => {
        const key = ev.activityName || ev.instrumentId;
        if (!groupedByInstrument[key]) groupedByInstrument[key] = ev;
      });
      const compCount = Object.keys(groupedByInstrument).length;
      if (!maxGradesPerCompetency[comp.id] || compCount > maxGradesPerCompetency[comp.id]) {
        maxGradesPerCompetency[comp.id] = compCount;
      }
    });
  });
  
  const headerRow1 = ['ESTUDIANTE'];
  const headerRow2 = ['Estudiante'];
  
  subject.competencies.forEach(comp => {
    const numCols = maxGradesPerCompetency[comp.id] || 1;
    headerRow1.push(comp.name);
    for (let i = 1; i < numCols; i++) {
      headerRow1.push('');
    }
    headerRow1.push('PROMEDIO');
    for (let i = 0; i < numCols; i++) {
      headerRow2.push(`c${i + 1}`);
    }
    headerRow2.push('PROM');
  });
  
  const data = [];
  
  students.forEach((student) => {
    const studentEvals = getStudentEvals(student);
    
    const row = [student.name];
    
      subject.competencies.forEach(comp => {
      const compEvals = studentEvals.filter(ev => {
        const cid = ev.competencyId || ev.competency_id;
        return cid === comp.id;
      });
      const groupedByInstrument = {};
      compEvals.forEach(ev => {
        const key = ev.activityName || ev.instrumentId;
        if (!groupedByInstrument[key]) groupedByInstrument[key] = ev;
      });
      const instruments = Object.values(groupedByInstrument);
      const numCols = maxGradesPerCompetency[comp.id] || 1;
      const compQualitatives = [];
      
      for (let i = 0; i < numCols; i++) {
        if (i < instruments.length) {
          const qual = instruments[i].qualitative || '-';
          compQualitatives.push(qual);
          row.push(qual);
        } else {
          compQualitatives.push(null);
          row.push('-');
        }
      }
      
      const validQual = compQualitatives.filter(q => q !== null && q !== '-' && q !== undefined);
      const avgQual = getAverageQualitative(validQual);
      row.push(avgQual);
    });
    
    data.push({ _row: row });
  });
  
  return { headerRow1, headerRow2, data, maxGradesPerCompetency, subject };
};

export const exportDetailedGradesToExcel = (students, instrumentEvaluations, subjects, subjectId, period, className, periodName) => {
  const result = buildDetailedGradesReport(students, instrumentEvaluations, subjects, subjectId, period);
  if (!result.subject) return null;
  
  const { headerRow1, headerRow2, data, maxGradesPerCompetency, subject } = result;
  
  const wb = XLSX.utils.book_new();
  
  const cols = [{ wch: 30 }];
  subject.competencies.forEach(comp => {
    const numCols = maxGradesPerCompetency[comp.id] || 1;
    for (let i = 0; i < numCols; i++) {
      cols.push({ wch: 10 });
    }
    cols.push({ wch: 10 });
  });
  
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

const QUAL_TO_CONCLUSION = {
  'AD': 'Logra realizar las actividades propuestas de manera destacada, demostrando un dominio excelente.',
  'A': 'Logra realizar las actividades propuestas de manera satisfactoria.',
  'B': 'Presenta dificultades para realizar las actividades propuestas.',
  'C': 'No logra realizar las actividades propuestas.',
};

const QUAL_TO_NUMBER = { 'AD': 4, 'A': 3, 'B': 2, 'C': 1 };

const getQualFromScore = (score) => {
  if (score === null || score === undefined) return null;
  const n = Number(score);
  if (n >= 18) return 'AD';
  if (n >= 14) return 'A';
  if (n >= 11) return 'B';
  return 'C';
};

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function xmlSetCellText(xml, ref, text) {
  const escaped = escapeXml(text);
  const cellRe = new RegExp('(<c r="' + ref + '"[^>]*?>)([\\s\\S]*?)(</c>)');
  if (cellRe.test(xml)) {
    return xml.replace(cellRe, (_, open, _inner, close) => {
      let tag = open
        .replace(/\st="(?:s|str|inlineStr|e)"/g, '')
        .replace(/\s*\/\s*$/, '>');
      return tag + '<is><t>' + escaped + '</t></is>' + close;
    });
  }
  const emptyRe = new RegExp('(<c r="' + ref + '"[^>]*?)/>');
  if (emptyRe.test(xml)) {
    return xml.replace(emptyRe, '$1><is><t>' + escaped + '</t></is></c>');
  }
  return xml;
}

function xmlSetValueNoFormula(xml, ref, text) {
  const escaped = escapeXml(text);
  const cellRe = new RegExp('(<c r="' + ref + '"[^>]*?>)([\\s\\S]*?)(</c>)');
  if (!cellRe.test(xml)) {
    const emptyRe = new RegExp('(<c r="' + ref + '"[^>]*?)/>');
    if (emptyRe.test(xml)) {
      return xml.replace(emptyRe, '$1><v>' + escaped + '</v></c>');
    }
    return xml;
  }
  return xml.replace(cellRe, (_, open, _inner, close) => {
    let tag = open
      .replace(/\st="(?:s|str|inlineStr|e)"/g, '')
      .replace(/\s*\/\s*$/, '>');
    return tag + '<v>' + escaped + '</v>' + close;
  });
}

function xmlSetCellNum(xml, ref, num) {
  const val = String(num);
  const cellRe = new RegExp('(<c r="' + ref + '"[^>]*?>)([\\s\\S]*?)(</c>)');
  if (cellRe.test(xml)) {
    return xml.replace(cellRe, (_, open, _inner, close) => {
      let tag = open
        .replace(/\st="(?:s|str|inlineStr|e)"/g, '')
        .replace(/\s*\/\s*$/, '>');
      return tag + '<v>' + val + '</v>' + close;
    });
  }
  const emptyRe = new RegExp('(<c r="' + ref + '"[^>]*?)/>');
  if (emptyRe.test(xml)) {
    return xml.replace(emptyRe, '$1><v>' + val + '</v></c>');
  }
  return xml;
}

export const exportTemplateAuxiliar = async (
  students, instrumentEvaluations, subjects, subjectId, period,
  className, periodName, config = {}
) => {
  const subject = subjects.find(s => s.id === subjectId);
  if (!subject) return null;

  const resp = await fetch('/templates/plantilla-registro-auxiliar.xlsx');
  const buf = await resp.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);
  let xml = await zip.file('xl/worksheets/sheet1.xml').async('string');

  const iep = config.iep || 'IEP';
  const docente = config.docente || '';
  const seccion = config.seccion || '';
  const grado = config.grado || '';
  const trimestre = periodName || `Bimestre ${period}`;
  const year = new Date().getFullYear();

  xml = xmlSetCellText(xml, 'M3', iep);
  xml = xmlSetCellText(xml, 'M4', subject.name.toUpperCase());
  xml = xmlSetCellText(xml, 'M5', docente);
  xml = xmlSetCellText(xml, 'AH3', trimestre.toUpperCase());
  xml = xmlSetCellText(xml, 'AH4', grado.toUpperCase());
  xml = xmlSetCellText(xml, 'AH5', seccion.toUpperCase());

  const trimestreRe = /(<c r="Y3"[^>]*>)(?:<v>[^<]*<\/v>|<is>[^<]*<\/is>)?<\/c>/;
  if (trimestreRe.test(xml)) {
    xml = xml.replace(trimestreRe, '$1><is><t>BIMESTRE</t></is></c>');
  }

  const newTitle = `REGISTRO AUXILIAR DE EVALUACIÓN ${year} - SECUNDARIA`;
  const titleRe = /(<c r="D1"[^>]*>)(?:<v>[^<]*<\/v>|<is>[^<]*<\/is>)?<\/c>/;
  if (titleRe.test(xml)) {
    xml = xml.replace(titleRe, '$1><is><t>' + escapeXml(newTitle) + '</t></is></c>');
  }

  xml = xml.replace(/(<row r="(?:1[1-9]|2\d|3\d|40)"[^>]*>)([\s\S]*?)(<\/row>)/g, (match, open, content, close) => {
    return open + content.replace(/<v>[^<]*<\/v>/g, '<v></v>').replace(/<is><t>[^<]*<\/t><\/is>/g, '<is><t></t></is>') + close;
  });

  const competencies = (subject.competencies || []).slice(0, 4);
  const compCols = [
    { criteria: ['D', 'E', 'F', 'G'], nivel: 'K', conclusion: 'L' },
    { criteria: ['M', 'N', 'O', 'P'], nivel: 'T', conclusion: 'U' },
    { criteria: ['V', 'W', 'X', 'Y'], nivel: 'AC', conclusion: 'AD' },
    { criteria: ['AE', 'AF', 'AG', 'AH'], nivel: 'AL', conclusion: 'AM' },
  ];

  competencies.forEach((comp, ci) => {
    const col = compCols[ci];
    xml = xmlSetCellText(xml, `${col.criteria[0]}8`, comp.name);
    for (let c = 0; c < 4; c++) {
      xml = xmlSetCellText(xml, `${col.criteria[c]}10`, `Criterio ${c + 1}`);
    }
  });

  const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name));
  const maxRows = Math.max(sortedStudents.length, 10);

  const evalSubjectIds = [...new Set(instrumentEvaluations.map(ev => ev.subjectId || ev.subject_id))];
  const compIds = competencies.map(c => c.id);
  console.log('[EXPORT DEBUG] subject:', subject.name, 'id:', subject.id);
  console.log('[EXPORT DEBUG] competencies:', compIds);
  console.log('[EXPORT DEBUG] students:', sortedStudents.length, sortedStudents.map(s => s.name));
  console.log('[EXPORT DEBUG] period:', period, 'type:', typeof period);
  console.log('[EXPORT DEBUG] total evals:', instrumentEvaluations.length, 'subjectIds in evals:', evalSubjectIds);
  const matchingEvals = instrumentEvaluations.filter(ev => {
    const sid = ev.subjectId || ev.subject_id;
    return sid === subject.id || compIds.includes(ev.competencyId || ev.competency_id);
  });
  console.log('[EXPORT DEBUG] matching evals (by subject or competency):', matchingEvals.length);
  if (matchingEvals.length > 0) {
    const ev0 = matchingEvals[0];
    console.log('[EXPORT DEBUG] sample eval:', { studentId: ev0.studentId, student_id: ev0.student_id, student_name: ev0.student_name, competencyId: ev0.competencyId, competency_id: ev0.competency_id, subjectId: ev0.subjectId, subject_id: ev0.subject_id, period: ev0.period, periodo: ev0.periodo, classId: ev0.classId, class_id: ev0.class_id });
  }

  for (let si = 0; si < maxRows; si++) {
    const row = 11 + si;
    const rowRe = new RegExp('<row r="' + row + '"[^>]*>[\\s\\S]*?</row>');

    if (!rowRe.test(xml)) {
      const newRowXml = `<row r="${row}" spans="1:128" ht="49.95" customHeight="1" thickTop="1" thickBot="1" x14ac:dyDescent="0.35">` +
        `<c r="A${row}" s="6"/><c r="B${row}" s="72"/><c r="C${row}" s="35"/>` +
        `<c r="D${row}" s="7"/><c r="E${row}" s="8"/><c r="F${row}" s="8"/><c r="G${row}" s="8"/>` +
        `<c r="H${row}" s="8"/><c r="I${row}" s="8"/><c r="J${row}" s="9"/>` +
        `<c r="K${row}" s="60"/><c r="L${row}" s="67"/>` +
        `<c r="M${row}" s="7"/><c r="N${row}" s="8"/><c r="O${row}" s="8"/><c r="P${row}" s="8"/>` +
        `<c r="Q${row}" s="8"/><c r="R${row}" s="8"/><c r="S${row}" s="9"/>` +
        `<c r="T${row}" s="60"/><c r="U${row}" s="67"/>` +
        `<c r="V${row}" s="7"/><c r="W${row}" s="8"/><c r="X${row}" s="8"/><c r="Y${row}" s="8"/>` +
        `<c r="Z${row}" s="8"/><c r="AA${row}" s="8"/><c r="AB${row}" s="9"/>` +
        `<c r="AC${row}" s="60"/><c r="AD${row}" s="67"/>` +
        `<c r="AE${row}" s="7"/><c r="AF${row}" s="8"/><c r="AG${row}" s="8"/><c r="AH${row}" s="8"/>` +
        `<c r="AI${row}" s="8"/><c r="AJ${row}" s="8"/><c r="AK${row}" s="9"/>` +
        `<c r="AL${row}" s="60"/><c r="AM${row}" s="67"/>` +
        `<c r="AN${row}" s="2"/>` +
        `<c r="AO${row}" s="34"/><c r="AP${row}" s="34"/><c r="AQ${row}" s="34"/><c r="AR${row}" s="33"/>` +
        `</row>`;
      const prevRowRe = new RegExp('</row>\\s*(<row r="' + (row + 1) + '"|</sheetData>)');
      if (prevRowRe.test(xml)) {
        xml = xml.replace(prevRowRe, '</row>\n' + newRowXml + '\n$1');
      } else {
        const insertRef = new RegExp('</row>\\s*(<row r="' + (row - 1) + '")');
        if (insertRef.test(xml)) {
          xml = xml.replace(insertRef, '</row>\n' + newRowXml + '\n$1');
        } else {
          xml = xml.replace(/<\/sheetData>/, newRowXml + '\n</sheetData>');
        }
      }
    }

    if (si < sortedStudents.length) {
      const student = sortedStudents[si];
      xml = xmlSetCellNum(xml, `A${row}`, si + 1);
      xml = xmlSetCellText(xml, `B${row}`, student.name.toUpperCase());

      competencies.forEach((comp, ci) => {
        const col = compCols[ci];

        const stdEvals = instrumentEvaluations.filter(ev => {
          const cid = ev.competencyId || ev.competency_id;
          if (cid !== comp.id) return false;
          const evPeriod = ev.period !== undefined ? ev.period : ev.periodo;
          if (String(evPeriod) !== String(period)) return false;
          const idMatch = ev.studentId === student.id || ev.student_id === student.id;
          const nameMatch = ev.student_name && ev.student_name === student.name;
          return idMatch || nameMatch;
        });

        const groupedByInstrument = {};
        stdEvals.forEach(ev => {
          const key = ev.activityName || ev.instrumentId;
          if (!groupedByInstrument[key]) groupedByInstrument[key] = ev;
        });
        const instrs = Object.values(groupedByInstrument);

        const quals = [];
        for (let c = 0; c < 4; c++) {
          if (c < instrs.length) {
            const ev = instrs[c];
            const qual = ev ? (ev.qualitative || getQualFromScore(ev.score) || '') : '';
            quals.push(qual);
            xml = xmlSetCellText(xml, `${col.criteria[c]}${row}`, qual || '');
          } else {
            xml = xmlSetCellText(xml, `${col.criteria[c]}${row}`, '');
          }
        }

        const validQuals = quals.filter(q => q && q !== '');
        let avgQual = '';
        if (validQuals.length > 0) {
          const nums = validQuals.map(q => QUAL_TO_NUMBER[q]).filter(n => n);
          if (nums.length > 0) {
            const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
            if (avg >= 3.5) avgQual = 'AD';
            else if (avg >= 2.5) avgQual = 'A';
            else if (avg >= 1.5) avgQual = 'B';
            else avgQual = 'C';
          }
        }

        xml = xmlSetValueNoFormula(xml, `${col.nivel}${row}`, avgQual);
        xml = xmlSetCellText(xml, `${col.conclusion}${row}`, avgQual ? (QUAL_TO_CONCLUSION[avgQual] || '') : '');

        const summaryCols = ['AO', 'AP', 'AQ', 'AR'];
        xml = xmlSetValueNoFormula(xml, `${summaryCols[ci]}${row}`, avgQual);
      });
    } else {
      xml = xmlSetCellNum(xml, `A${row}`, si + 1);
      xml = xmlSetCellText(xml, `B${row}`, '');
      competencies.forEach((comp, ci) => {
        const col = compCols[ci];
        for (let c = 0; c < 4; c++) {
          xml = xmlSetCellText(xml, `${col.criteria[c]}${row}`, '');
        }
        xml = xmlSetValueNoFormula(xml, `${col.nivel}${row}`, '');
        xml = xmlSetCellText(xml, `${col.conclusion}${row}`, '');

        const summaryCols = ['AO', 'AP', 'AQ', 'AR'];
        xml = xmlSetValueNoFormula(xml, `${summaryCols[ci]}${row}`, '');
      });
    }
  }

  zip.file('xl/worksheets/sheet1.xml', xml);

  const outBuf = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
  return outBuf;
};