import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Download, Save, RotateCcw, Check, Plus, Trash2, Edit2, X, Settings, ClipboardCheck, Users, BookOpen } from 'lucide-react';
import * as XLSX from 'xlsx';

const NIVEL_COLORS = {
  AD: { bg: '#10b981', text: '#ffffff' },
  A: { bg: '#3b82f6', text: '#ffffff' },
  B: { bg: '#f59e0b', text: '#ffffff' },
  C: { bg: '#ef4444', text: '#ffffff' },
};

const NIVELES_LOGRO = [
  { code: 'AD', label: 'Logro Destacado', minPercent: 90, color: '#10b981' },
  { code: 'A', label: 'Logro Esperado', minPercent: 70, color: '#3b82f6' },
  { code: 'B', label: 'En Proceso', minPercent: 50, color: '#f59e0b' },
  { code: 'C', label: 'En Inicio', minPercent: 0, color: '#ef4444' },
];

const CICLOS = {
  '1ro': 'VI', '2do': 'VI', '3ro': 'VII', '4to': 'VII', '5to': 'VIII',
};

function getCiclo(gradeLevel) {
  const match = gradeLevel?.match(/(\d+ro)/);
  return match ? CICLOS[match[1]] || 'VI' : 'VI';
}

function getNivelFromScore(correct, total) {
  if (total === 0) return '';
  const percent = (correct / total) * 100;
  for (const nivel of NIVELES_LOGRO) {
    if (percent >= nivel.minPercent) return nivel.code;
  }
  return 'C';
}

export default function DiagnosticEvaluation() {
  const { 
    students, subjects, classes, currentUser, isAdmin,
    saveDiagnosticEvaluation, getDiagnosticEvaluation, 
    instruments, addInstrument, updateInstrument, deleteInstrument
  } = useStore();
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [period, setPeriod] = useState('DIAGNOSTICA');
  const [evaluations, setEvaluations] = useState({});
  const [saved, setSaved] = useState(false);
  const [showRubricModal, setShowRubricModal] = useState(false);
  const [rubricConfig, setRubricConfig] = useState({
    mode: 'preguntas',
    competencies: []
  });
  const [tooltipInfo, setTooltipInfo] = useState({ show: false, x: 0, y: 0, text: '' });

  const availableSubjects = useMemo(() => {
    if (isAdmin || !currentUser?.assignments || currentUser.assignments.length === 0) {
      return subjects;
    }
    const subjectIds = [...new Set(currentUser.assignments.map(a => a.subjectId))];
    return subjects.filter(s => subjectIds.includes(s.id));
  }, [isAdmin, currentUser, subjects]);

  const selectedSubjectData = useMemo(() => {
    return subjects.find(s => s.id === selectedSubject);
  }, [subjects, selectedSubject]);

  const isMathSubject = selectedSubject?.includes('mat');

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    const cleanSelected = selectedClass.trim().toLowerCase();
    return students
      .filter(s => {
        const cleanGrade = (s.gradeLevel || '').trim().toLowerCase();
        const cleanClass = (s.classId || '').trim().toLowerCase();
        return cleanGrade === cleanSelected || cleanClass === cleanSelected;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedClass]);

  const competencyCount = selectedSubjectData?.competencies?.length || 4;

  const getRubricKey = () => `${selectedSubject}_${period}`;

  const loadRubric = () => {
    const key = getRubricKey();
    const saved = instruments.find(i => i.id === key);
    const isMath = selectedSubject?.includes('mat');
    
    if (saved && saved.config) {
      setRubricConfig(saved.config);
    } else if (isMath) {
      const defaultRubricConfig = {
        mode: 'rubrica',
        competencies: selectedSubjectData?.competencies?.map((c, idx) => ({
          id: c.id || `comp-${idx}`,
          name: c.name,
          levels: [
            { 
              code: 'AD', 
              minCorrect: 2, 
              description: '2 correctas',
              descriptor: 'El estudiante demuestra un dominio pleno de la competencia, resolviendo correctamente las situaciones problemáticas propuestas con autonomía y transferenciade conocimientos a nuevos contextos.'
            },
            { 
              code: 'A', 
              minCorrect: 1, 
              description: '1 correcta',
              descriptor: 'El estudiante resuelve situaciones problemáticas propuestas demostrando dominio de la competencia, aunque con algunas dificultades que son superadas con apoyo.'
            },
            { 
              code: 'B', 
              minCorrect: 0, 
              description: 'En proceso',
              descriptor: 'El estudiante resuelve solo algunas situaciones problemáticas de la competencia requiere apoyo constante para resolver situaciones nuevas.'
            },
            { 
              code: 'C', 
              minCorrect: 0, 
              description: 'En inicio',
              descriptor: 'El estudiante no logra resolver las situaciones problemáticas propuestas de la competencia, requiere apoyo permanente.'
            }
          ]
        })) || []
      };
      setRubricConfig(defaultRubricConfig);
    } else {
      const defaultConfig = {
        mode: 'preguntas',
        competencies: selectedSubjectData?.competencies?.map((c, idx) => ({
          id: c.id || `comp-${idx}`,
          name: c.name,
          totalQuestions: 10,
          levels: [
            { code: 'AD', minCorrect: 9, description: '9-10 respuestas correctas' },
            { code: 'A', minCorrect: 7, description: '7-8 respuestas correctas' },
            { code: 'B', minCorrect: 5, description: '5-6 respuestas correctas' },
            { code: 'C', minCorrect: 0, description: '0-4 respuestas correctas' },
          ]
        })) || []
      };
      setRubricConfig(defaultConfig);
    }
  };

  useEffect(() => {
    if (selectedSubject && period) {
      loadRubric();
    }
  }, [selectedSubject, period]);

  const calculateNivel = (correct, total, mode = 'preguntas') => {
    if (total === 0 || correct < 0) return '';
    const percentage = (correct / total) * 100;
    
    if (mode === 'rubrica') {
      if (correct >= 2) return 'AD';
      if (correct === 1) return 'A';
      return 'C';
    }
    
    if (percentage >= 90) return 'AD';
    if (percentage >= 70) return 'A';
    if (percentage >= 50) return 'B';
    return 'C';
  };

  const recalculateEvaluations = (currentEvaluations, newRubric) => {
    const updated = { ...currentEvaluations };
    Object.keys(updated).forEach(studentId => {
      Object.keys(updated[studentId]).forEach(compIdx => {
        const grade = updated[studentId][compIdx];
        const newCompConfig = newRubric.competencies[parseInt(compIdx)];
        if (newCompConfig && grade?.correct !== undefined) {
          const newTotal = newCompConfig.totalQuestions;
          const newNivel = calculateNivel(grade.correct, newTotal);
          updated[studentId][compIdx] = { ...grade, total: newTotal, nivel: newNivel };
        }
      });
    });
    return updated;
  };

  const saveRubric = () => {
    const key = getRubricKey();
    const existing = instruments.find(i => i.id === key);
    const evaluationsChanged = Object.keys(evaluations).length > 0;
    
    if (existing) {
      updateInstrument(key, { config: rubricConfig });
    } else {
      addInstrument({ id: key, config: rubricConfig });
    }

    if (evaluationsChanged) {
      const recalculated = recalculateEvaluations(evaluations, rubricConfig);
      setEvaluations(recalculated);
      setSaved(false);
    }

    setShowRubricModal(false);
    alert('Rúbrica guardada correctamente');
  };

  const handleCorrectChange = (studentId, competencyIndex, value) => {
    const rubric = rubricConfig.competencies[competencyIndex];
    const mode = rubricConfig.mode || 'preguntas';
    
    if (mode === 'rubrica') {
      setEvaluations(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [competencyIndex]: { nivel: value }
        }
      }));
    } else {
      const correct = parseInt(value) || 0;
      const total = rubric?.totalQuestions || 10;
      const nivel = calculateNivel(correct, total, 'preguntas');
      
      setEvaluations(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [competencyIndex]: { correct, total, nivel }
        }
      }));
    }
    setSaved(false);
  };

  const handleLoadExisting = () => {
    if (!selectedClass || !selectedSubject) return;
    const existing = getDiagnosticEvaluation(selectedClass, selectedSubject, period);
    if (existing && existing.grades) {
      const recalculated = recalculateEvaluations(existing.grades, rubricConfig);
      setEvaluations(recalculated);
    } else {
      setEvaluations({});
    }
    setSaved(false);
  };

  const handleSave = () => {
    if (!selectedClass || !selectedSubject) {
      alert('Selecciona un grado y un área curricular');
      return;
    }
    
    saveDiagnosticEvaluation({
      classId: selectedClass,
      subjectId: selectedSubject,
      period,
      grades: evaluations,
      teacherName: currentUser?.name || '',
      createdAt: new Date().toISOString()
    });
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const calculateStats = () => {
    const stats = { AD: 0, A: 0, B: 0, C: 0 };
    const competencyStats = [];
    
    for (let i = 0; i < competencyCount; i++) {
      competencyStats.push({ AD: 0, A: 0, B: 0, C: 0 });
    }
    
    filteredStudents.forEach(student => {
      const studentGrades = evaluations[student.id] || {};
      Object.entries(studentGrades).forEach(([compIdx, grade]) => {
        if (grade?.nivel && stats[grade.nivel] !== undefined) {
          stats[grade.nivel]++;
          const idx = parseInt(compIdx);
          if (competencyStats[idx] && competencyStats[idx][grade.nivel] !== undefined) {
            competencyStats[idx][grade.nivel]++;
          }
        }
      });
    });
    
    return { stats, competencyStats };
  };

  const generateExcel = () => {
    if (!selectedClass || !selectedSubject || filteredStudents.length === 0) {
      alert('Selecciona un grado y área para generar el reporte');
      return;
    }

    const { stats, competencyStats } = calculateStats();
    const subjectData = subjects.find(s => s.id === selectedSubject);
    const ciclo = getCiclo(selectedClass);
    const teacherName = currentUser?.name || 'Docente';
    const totalStudents = filteredStudents.length;

    const calcPct = (count) => totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(2) : '0.00';
    
    const c1Name = rubricConfig.competencies[0]?.name || '';
    const c2Name = rubricConfig.competencies[1]?.name || '';
    const c3Name = rubricConfig.competencies[2]?.name || '';
    const c4Name = rubricConfig.competencies[3]?.name || '';
    
    let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body { font-family: Arial, sans-serif; margin: 10px; }
table { border-collapse: collapse; margin-bottom: 0; font-size: 11px; }
td, th { border: 1px solid #000; padding: 4px 6px; }
.grade-ad { background: #10b981; color: white; font-weight: bold; text-align: center; }
.grade-a { background: #3b82f6; color: white; font-weight: bold; text-align: center; }
.grade-b { background: #f59e0b; color: white; font-weight: bold; text-align: center; }
.grade-c { background: #ef4444; color: white; font-weight: bold; text-align: center; }
.nivel-c { background: #fecaca; text-align: center; }
.nivel-b { background: #fef08a; text-align: center; }
.nivel-a { background: #bfdbfe; text-align: center; }
.nivel-ad { background: #bbf7d0; text-align: center; }
.student-name { font-weight: 500; }
.comp-header { background: #e5e7eb; font-weight: bold; font-size: 9px; text-align: center; }
</style>
</head>
<body>
<h2 style="text-align: center; margin: 5px 0; font-size: 14px;">I.E.P. AGROPECUARIO 110 - YURIMAGUAS</h2>
<p style="text-align: center; margin: 5px 0; font-weight: bold;">MAPA DE CALOR SOBRE RESULTADOS DE LA EVALUACIÓN DIAGNÓSTICA</p>

<table>
  <tr>
    <td style="width: 80px;"><strong>GRADO Y SECCIÓN:</strong></td>
    <td style="width: 80px;">${selectedClass.replace(/"/g, '')}</td>
    <td style="width: 60px;"><strong>DOCENTE:</strong></td>
    <td colspan="2">${teacherName}</td>
  </tr>
  <tr>
    <td><strong>ÁREA:</strong></td>
    <td colspan="2">${subjectData?.name?.toUpperCase() || ''}</td>
    <td style="width: 50px;"><strong>CICLO:</strong></td>
    <td>${ciclo}</td>
  </tr>
  <tr>
    <td style="width: 40px; text-align: center;"><strong>N°</strong></td>
    <td style="width: 180px;"><strong>APELLIDOS Y NOMBRES</strong></td>
    <td class="comp-header" style="width: 150px;"><strong>C1:</strong> ${c1Name.substring(0, 40)}</td>
    <td class="comp-header" style="width: 150px;"><strong>C2:</strong> ${c2Name.substring(0, 40)}</td>
    <td class="comp-header" style="width: 150px;"><strong>C3:</strong> ${c3Name.substring(0, 40)}</td>
    <td class="comp-header" style="width: 150px;"><strong>C4:</strong> ${c4Name.substring(0, 40)}</td>
    <td colspan="5" rowspan="${filteredStudents.length + 5}" style="vertical-align: top; background: #f5f5f5;">
      <div style="text-align: center; font-weight: bold;">ESTADÍSTICA SEGÚN LAS COMPETENCIAS</div>
      <table style="font-size: 10px; margin-top: 5px; width: 100%;">
        <tr>
          <td></td>
          <td style="text-align:center; font-weight:bold;">C1</td>
          <td style="text-align:center; font-weight:bold;">C2</td>
          <td style="text-align:center; font-weight:bold;">C3</td>
          <td style="text-align:center; font-weight:bold;">C4</td>
        </tr>
        <tr>
          <td class="nivel-c" style="font-weight:bold;">C</td>
          <td style="text-align:center;">${calcPct(competencyStats[0]?.C || 0)}%</td>
          <td style="text-align:center;">${calcPct(competencyStats[1]?.C || 0)}%</td>
          <td style="text-align:center;">${calcPct(competencyStats[2]?.C || 0)}%</td>
          <td style="text-align:center;">${calcPct(competencyStats[3]?.C || 0)}%</td>
        </tr>
        <tr>
          <td class="nivel-b" style="font-weight:bold;">B</td>
          <td style="text-align:center;">${calcPct(competencyStats[0]?.B || 0)}%</td>
          <td style="text-align:center;">${calcPct(competencyStats[1]?.B || 0)}%</td>
          <td style="text-align:center;">${calcPct(competencyStats[2]?.B || 0)}%</td>
          <td style="text-align:center;">${calcPct(competencyStats[3]?.B || 0)}%</td>
        </tr>
        <tr>
          <td class="nivel-a" style="font-weight:bold;">A</td>
          <td style="text-align:center;">${calcPct(competencyStats[0]?.A || 0)}%</td>
          <td style="text-align:center;">${calcPct(competencyStats[1]?.A || 0)}%</td>
          <td style="text-align:center;">${calcPct(competencyStats[2]?.A || 0)}%</td>
          <td style="text-align:center;">${calcPct(competencyStats[3]?.A || 0)}%</td>
        </tr>
        <tr>
          <td class="nivel-ad" style="font-weight:bold;">AD</td>
          <td style="text-align:center;">${calcPct(competencyStats[0]?.AD || 0)}%</td>
          <td style="text-align:center;">${calcPct(competencyStats[1]?.AD || 0)}%</td>
          <td style="text-align:center;">${calcPct(competencyStats[2]?.AD || 0)}%</td>
          <td style="text-align:center;">${calcPct(competencyStats[3]?.AD || 0)}%</td>
        </tr>
      </table>
    </td>
  </tr>
`;

    filteredStudents.forEach((student, idx) => {
      const studentGrades = evaluations[student.id] || {};
      const g0 = studentGrades[0]?.nivel || '';
      const g1 = studentGrades[1]?.nivel || '';
      const g2 = studentGrades[2]?.nivel || '';
      const g3 = studentGrades[3]?.nivel || '';
      
      html += `
  <tr>
    <td style="text-align: center;">${idx + 1}</td>
    <td class="student-name">${student.name}</td>
    <td class="${g0 ? 'grade-' + g0.toLowerCase() : ''}">${g0}</td>
    <td class="${g1 ? 'grade-' + g1.toLowerCase() : ''}">${g1}</td>
    <td class="${g2 ? 'grade-' + g2.toLowerCase() : ''}">${g2}</td>
    <td class="${g3 ? 'grade-' + g3.toLowerCase() : ''}">${g3}</td>
</tr>
`;
    });

    for (let i = filteredStudents.length; i < 40; i++) {
      html += `
  <tr>
    <td style="text-align: center;">${i + 1}</td>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
</tr>
`;
    }

    html += `
</table>
</body>
</html>`;

    const blob = new Blob([html], { type: 'application/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = `mapa_calor_${selectedClass.replace(/"/g, '').replace(/\s+/g, '_')}_${subjectData?.name?.replace(/\s+/g, '_') || 'AREA'}_${new Date().toISOString().split('T')[0]}.xls`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (window.confirm('¿Limpiar todas las calificaciones de esta evaluación?')) {
      setEvaluations({});
      setSaved(false);
    }
  };

  const getGradeColor = (grade) => {
    const nivel = NIVELES_LOGRO.find(n => n.code === grade);
    return nivel?.color || '#6b7280';
  };

  const updateCompetencyConfig = (index, field, value) => {
    setRubricConfig(prev => {
      if (field === 'mode') {
        return { ...prev, mode: value };
      }
      const comp = prev.competencies[index];
      if (prev.mode === 'preguntas') {
        const oldTotal = comp?.totalQuestions || 10;
        const newTotal = parseInt(value) || 10;
        
        if (field === 'totalQuestions' && newTotal !== oldTotal) {
          return {
            ...prev,
            competencies: prev.competencies.map((c, i) => {
              if (i !== index) return c;
              const updatedLevels = c.levels.map(l => ({
                ...l,
                minCorrect: l.code === 'C' ? 0 : Math.max(1, Math.round(l.minCorrect * newTotal / oldTotal))
              }));
              return {
                ...c,
                totalQuestions: newTotal,
                levels: updatedLevels
              };
            })
          };
        }
      }
      
      return {
        ...prev,
        competencies: prev.competencies.map((c, i) => 
          i === index ? { ...c, [field]: value } : c
        )
      };
    });
  };

  const updateLevelConfig = (compIndex, levelIndex, field, value) => {
    setRubricConfig(prev => ({
      ...prev,
      competencies: prev.competencies.map((c, i) => 
        i === compIndex ? {
          ...c,
          levels: c.levels.map((l, li) => 
            li === levelIndex ? { ...l, [field]: field === 'minCorrect' ? parseInt(value) : value } : l
          )
        } : c
      )
    }));
  };

  const gradientColors = [
    ['#ec4899', '#db2777'],
    ['#8b5cf6', '#7c3aed'],
    ['#06b6d4', '#0891b2'],
    ['#f59e0b', '#d97706']
  ];

  return (
    <div className="animate-fade-in">
      {/* Header con gradiente */}
      <div style={{
        background: 'linear-gradient(135deg, #ec4899 0%, #db2777 50%, #f472b6 100%)',
        borderRadius: '20px',
        padding: '2rem 2.5rem',
        marginBottom: '1.5rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '300px',
          height: '300px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-5%',
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%'
        }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)'
          }}>
            <ClipboardCheck size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Evaluación Diagnóstica</h2>
            <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>Registra y genera mapas de calor</p>
          </div>
        </div>
      </div>

      {/* Tarjeta de configuración */}
      <div style={{ 
        background: 'white', 
        borderRadius: '20px', 
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(236, 72, 153, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ec4899, #db2777)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Settings size={20} color="white" />
            </div>
            <h3 style={{ color: '#ec4899', margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>Configuración de Evaluación</h3>
          </div>
          {selectedSubject && (
            <button 
              onClick={() => setShowRubricModal(true)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'linear-gradient(135deg, #ec4899, #db2777)', color: 'white', border: 'none',
                padding: '0.6rem 1rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(236, 72, 153, 0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <Settings size={16} /> Configurar Rúbrica
            </button>
          )}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="input-label">Grado y Sección</label>
            <select 
              className="input-field" 
              value={selectedClass}
              onChange={e => { setSelectedClass(e.target.value); setEvaluations({}); setSaved(false); }}
            >
              <option value="">Seleccionar Grado</option>
              {classes.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="input-label">Área Curricular</label>
            <select 
              className="input-field" 
              value={selectedSubject}
              onChange={e => { setSelectedSubject(e.target.value); setEvaluations({}); setSaved(false); }}
            >
              <option value="">Seleccionar Área</option>
              {availableSubjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">Periodo</label>
            <select 
              className="input-field" 
              value={period}
              onChange={e => { setPeriod(e.target.value); setSaved(false); }}
            >
              <option value="DIAGNOSTICA">Evaluación Diagnóstica</option>
              <option value="1">Bimestre 1</option>
              <option value="2">Bimestre 2</option>
              <option value="3">Bimestre 3</option>
              <option value="4">Bimestre 4</option>
            </select>
          </div>
        </div>

        {selectedClass && selectedSubject && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <button onClick={handleLoadExisting} style={{ 
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
              padding: '0.6rem 1rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
            >
              <RotateCcw size={16} /> Cargar Datos
            </button>
            <button onClick={handleReset} style={{ 
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca',
              padding: '0.6rem 1rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
            >
              <RotateCcw size={16} /> Limpiar Todo
            </button>
            <button onClick={handleSave} style={{ 
              display: 'flex', alignItems: 'center', gap: '8px',
              background: saved ? '#10b981' : 'linear-gradient(135deg, #ec4899, #db2777)', color: 'white', border: 'none',
              padding: '0.6rem 1rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => { if (!saved) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(236, 72, 153, 0.4)'; } }}
            onMouseLeave={(e) => { if (!saved) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; } }}
            >
              {saved ? <Check size={16} /> : <Save size={16} />}
              {saved ? '¡Guardado!' : 'Guardar'}
            </button>
            <button 
              onClick={generateExcel}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none',
                padding: '0.6rem 1rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <Download size={16} /> Exportar
            </button>
          </div>
        )}
      </div>

      {/* Info de clase y estudiante */}
      {selectedClass && selectedSubject && (
        <>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-30%',
              right: '-10%',
              width: '150px',
              height: '150px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BookOpen size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{selectedClass}</h4>
                  <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>{selectedSubjectData?.name}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{filteredStudents.length}</div>
                <div style={{ opacity: 0.8, fontSize: '0.85rem' }}>estudiantes</div>
              </div>
            </div>
          </div>

          {/* Leyenda de niveles */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {NIVELES_LOGRO.map(nivel => (
              <div key={nivel.code} style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: `${nivel.color}15`,
                borderRadius: '10px',
                border: `1px solid ${nivel.color}30`
              }}>
                <div style={{ 
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: nivel.color, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.85rem'
                }}>
                  {nivel.code}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {nivel.label}
                </span>
              </div>
            ))}
          </div>

          {filteredStudents.length === 0 ? (
            <div style={{
              background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
              borderRadius: '20px',
              padding: '4rem 2rem',
              textAlign: 'center',
              border: '2px dashed #cbd5e1'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <Users size={40} color="white" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                No hay estudiantes
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                No hay estudiantes registrados en {selectedClass}.
              </p>
            </div>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <table className="styled-table" style={{ minWidth: '800px', tableLayout: 'auto' }}>
                <thead>
                  <tr>
                    <th style={{ 
                      width: '60px', 
                      background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', 
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      padding: '1rem',
                      textAlign: 'center'
                    }}>N°</th>
                    <th style={{ 
                      minWidth: '180px', 
                      background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', 
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      padding: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={16} />
                        Apellidos y Nombre
                      </div>
                    </th>
                    {rubricConfig.competencies.map((comp, idx) => {
                      const [color1, color2] = gradientColors[idx % gradientColors.length];
                      return (
                        <th key={comp.id || idx} style={{ 
                          minWidth: '200px', 
                          textAlign: 'center',
                          background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          padding: '1rem'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <span>{comp.name.substring(0, 18)}{comp.name.length > 18 ? '...' : ''}</span>
                            <span style={{ fontSize: '0.65rem', fontWeight: 400, opacity: 0.9 }}>
                              {rubricConfig.mode === 'rubrica' ? 'Rúbrica' : `Total: ${comp.totalQuestions}`}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                    <th style={{ 
                      width: '80px', 
                      background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', 
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      padding: '1rem',
                      textAlign: 'center'
                    }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, idx) => {
                    const studentGrades = evaluations[student.id] || {};
                    return (
                      <tr key={student.id}>
                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{student.name}</td>
                        {rubricConfig.competencies.map((comp, compIdx) => {
                          const grade = studentGrades[compIdx];
                          const nivel = rubricConfig.mode === 'rubrica' 
                            ? grade?.nivel || ''
                            : (grade?.correct !== undefined
                                ? calculateNivel(grade.correct, comp.totalQuestions, 'preguntas')
                                : '');
                          return (
                            <td key={compIdx} style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                {rubricConfig.mode === 'rubrica' ? (
                                  <div style={{ display: 'flex', gap: '2px' }}>
                                    {['AD', 'A', 'B', 'C'].map(nivelCode => {
                                      const level = comp.levels.find(l => l.code === nivelCode);
                                      const isSelected = nivel === nivelCode;
                                      return (
                                        <button
                                          key={nivelCode}
                                          onClick={() => handleCorrectChange(student.id, compIdx, nivelCode)}
                                          onMouseEnter={(e) => {
                                            const row = e.target.closest('tr');
                                            const rect = row.getBoundingClientRect();
                                            setTooltipInfo({
                                              show: true,
                                              x: window.innerWidth / 2,
                                              y: rect.top - 10,
                                              text: level?.descriptor || level?.description || '',
                                              code: level?.code
                                            });
                                          }}
                                          onMouseLeave={() => setTooltipInfo(prev => ({ ...prev, show: false }))}
                                          style={{
                                            padding: '6px 10px',
                                            borderRadius: '8px',
                                            border: isSelected ? `2px solid ${getGradeColor(nivelCode)}` : '1px solid #e2e8f0',
                                            background: isSelected ? getGradeColor(nivelCode) : 'white',
                                            color: isSelected ? 'white' : getGradeColor(nivelCode),
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            minWidth: '36px'
                                          }}
                                        >
                                          {nivelCode}
                                        </button>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <input
                                    type="number"
                                    min="0"
                                    max={comp.totalQuestions}
                                    value={grade?.correct ?? ''}
                                    onChange={e => handleCorrectChange(student.id, compIdx, e.target.value)}
                                    placeholder="0"
                                    style={{
                                      width: '70px',
                                      padding: '0.5rem',
                                      borderRadius: '8px',
                                      border: `2px solid ${nivel ? getGradeColor(nivel) : '#e2e8f0'}`,
                                      background: nivel ? `${getGradeColor(nivel)}10` : 'white',
                                      color: 'var(--text-primary)',
                                      fontWeight: 600,
                                      textAlign: 'center',
                                      fontSize: '0.95rem'
                                    }}
                                  />
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            style={{ 
                              padding: '0.5rem', 
                              borderRadius: '8px',
                              background: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                            onClick={() => {
                              const newGrades = {};
                              for (let i = 0; i < rubricConfig.competencies.length; i++) {
                                newGrades[i] = {};
                              }
                              setEvaluations(prev => ({ ...prev, [student.id]: newGrades }));
                              setSaved(false);
                            }}
                            title="Limpiar"
                          >
                            <RotateCcw size={14} color="#64748b" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {(!selectedClass || !selectedSubject) && (
        <div style={{
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
          borderRadius: '20px',
          padding: '4rem 2rem',
          textAlign: 'center',
          border: '2px dashed #cbd5e1'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <ClipboardCheck size={40} color="white" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Selecciona un Grado y un Área
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>
            Para comenzar a registrar la evaluación diagnóstica, primero selecciona el grado/sección y el área curricular.
          </p>
        </div>
      )}

      {/* Modal de Rúbrica */}
      {showRubricModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          padding: '2rem 1rem', zIndex: 1000, overflowY: 'auto'
        }}>
          <div style={{ 
            maxWidth: '900px', width: '100%', 
            background: 'white', borderRadius: '24px', padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative'
          }} className="animate-fade-in">
            <div style={{ 
              position: 'absolute', top: '-30%', right: '-10%',
              width: '150px', height: '150px',
              background: 'linear-gradient(135deg, #ec489920, #db277720)',
              borderRadius: '50%'
            }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ec4899, #db2777)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Settings size={24} color="white" />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Configurar Rúbrica</h3>
              </div>
              <button onClick={() => setShowRubricModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                <X size={24} color="var(--text-secondary)" />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fdf2f8', borderRadius: '12px', border: '1px solid #fce7f3' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#be185d' }}>Modo de Evaluación</label>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
                  <input
                    type="radio"
                    name="evalMode"
                    checked={rubricConfig.mode === 'preguntas'}
                    onChange={() => updateCompetencyConfig(0, 'mode', 'preguntas')}
                  />
                  Por Preguntas
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
                  <input
                    type="radio"
                    name="evalMode"
                    checked={rubricConfig.mode === 'rubrica'}
                    onChange={() => updateCompetencyConfig(0, 'mode', 'rubrica')}
                  />
                  Rúbrica (seleccionar nivel)
                </label>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#9d174d', marginTop: '0.5rem' }}>
                {rubricConfig.mode === 'rubrica' 
                  ? 'Para Matemática: el docente selecciona directamente el nivel AD, A, B o C basado en una rúbrica con descriptores por cada competencia.'
                  : 'Ingresa el número de respuestas correctas y el sistema calcula el nivel automáticamente.'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
              {rubricConfig.competencies.map((comp, compIdx) => {
                const [color1, color2] = gradientColors[compIdx % gradientColors.length];
                return (
                  <div key={comp.id || compIdx} style={{ 
                    border: `1px solid ${color1}30`, 
                    borderRadius: '16px', 
                    padding: '1.25rem',
                    background: `linear-gradient(135deg, ${color1}08, ${color2}08)`
                  }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nombre de Competencia</label>
                      <input
                        type="text"
                        className="input-field"
                        value={comp.name}
                        onChange={e => updateCompetencyConfig(compIdx, 'name', e.target.value)}
                      />
                    </div>
                    
                    {rubricConfig.mode === 'preguntas' ? (
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total de Preguntas</label>
                        <input
                          type="number"
                          className="input-field"
                          style={{ width: '100px' }}
                          value={comp.totalQuestions}
                          min="1"
                          max="100"
                          onChange={e => updateCompetencyConfig(compIdx, 'totalQuestions', parseInt(e.target.value) || 10)}
                        />
                      </div>
                    ) : null}

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {rubricConfig.mode === 'rubrica' ? 'Descriptores por Nivel de Logro' : 'Niveles de Logro'}
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                        {comp.levels.map((level, levelIdx) => (
                          <div key={level.code} style={{
                            padding: '0.75rem',
                            borderRadius: '10px',
                            border: `2px solid ${getGradeColor(level.code)}`,
                            background: 'white'
                          }}>
                            <div style={{ 
                              display: 'flex', alignItems: 'center', gap: '0.5rem',
                              marginBottom: '0.5rem',
                              fontWeight: 700,
                              color: getGradeColor(level.code)
                            }}>
                              {level.code}
                            </div>
                            {rubricConfig.mode === 'rubrica' ? (
                              <textarea
                                className="input-field"
                                style={{ fontSize: '0.75rem', minHeight: '80px', resize: 'vertical' }}
                                value={level.descriptor || ''}
                                placeholder="Descriptor para este nivel..."
                                onChange={e => updateLevelConfig(compIdx, levelIdx, 'descriptor', e.target.value)}
                              />
                            ) : (
                              <>
                                <input
                                  type="number"
                                  className="input-field"
                                  style={{ marginBottom: '0.25rem', fontSize: '0.85rem' }}
                                  value={level.minCorrect}
                                  min="0"
                                  onChange={e => updateLevelConfig(compIdx, levelIdx, 'minCorrect', e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="input-field"
                                  style={{ fontSize: '0.75rem' }}
                                  value={level.description}
                                  onChange={e => updateLevelConfig(compIdx, levelIdx, 'description', e.target.value)}
                                />
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowRubricModal(false)}
                style={{ 
                  padding: '0.75rem 1.5rem', borderRadius: '12px',
                  background: '#f1f5f9', color: 'var(--text-secondary)',
                  border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600
                }}
              >
                Cancelar
              </button>
              <button 
                onClick={saveRubric} 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, #ec4899, #db2777)', color: 'white', border: 'none',
                  padding: '0.75rem 1.5rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 600
                }}
              >
                <Save size={16} /> Guardar Rúbrica
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltipInfo.show && tooltipInfo.text && (
        <div style={{
          position: 'fixed',
          left: tooltipInfo.x,
          top: tooltipInfo.y,
          transform: 'translate(-50%, 0)',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          color: '#1e293b',
          padding: '14px 18px',
          borderRadius: '12px',
          fontSize: '0.85rem',
          maxWidth: '400px',
          zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(16,185,129,0.1)',
          pointerEvents: 'none',
          textAlign: 'center'
        }}>
          <div style={{ 
            display: 'inline-block',
            padding: '4px 12px', 
            borderRadius: '6px', 
            background: getGradeColor(tooltipInfo.code), 
            color: 'white', 
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            {tooltipInfo.code}
          </div>
          <div style={{ color: '#475569', lineHeight: '1.5' }}>{tooltipInfo.text}</div>
        </div>
      )}
    </div>
  );
}