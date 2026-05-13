import { useState, useMemo, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Printer, FileText, Search, Users, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const GRADE_TO_NUM = { AD: 4, A: 3, B: 2, C: 1 };
const NUM_TO_GRADE = (n) => {
  if (n >= 3.5) return 'AD';
  if (n >= 2.5) return 'A';
  if (n >= 1.5) return 'B';
  return 'C';
};
const GRADE_COLOR = { AD: '#10b981', A: '#3b82f6', B: '#f59e0b', C: '#ef4444' };
const PERIODS = ['1', '2', '3', '4'];
const PERIOD_LABEL = { '1': 'I Bimestre', '2': 'II Bimestre', '3': 'III Bimestre', '4': 'IV Bimestre' };

const cellStyle = (grade) => ({
  textAlign: 'center', padding: '6px 10px', fontSize: '0.85rem',
  fontWeight: grade ? 700 : 400,
  color: grade && grade !== '-' ? GRADE_COLOR[grade] || '#1e293b' : '#94a3b8',
  borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0',
});

export default function BoletaNotas() {
  const { students, subjects, instrumentEvaluations, grades: legacyGrades } = useStore();
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const q = searchTerm.toLowerCase().trim();
    return students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.dni && s.dni.includes(q)) ||
      (s.gradeLevel && s.gradeLevel.toLowerCase().includes(q))
    );
  }, [students, searchTerm]);

  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);

  const studentEvals = useMemo(() => {
    if (!selectedStudent) return [];
    return instrumentEvaluations.filter(e => e.studentId === selectedStudent.id);
  }, [instrumentEvaluations, selectedStudent]);

  const studentLegacy = useMemo(() => {
    if (!selectedStudent) return [];
    return legacyGrades.filter(g => g.studentId === selectedStudent.id);
  }, [legacyGrades, selectedStudent]);

  const getGrade = (subject, competencyId, period) => {
    const ev = studentEvals.find(e => e.subjectId === subject.id && e.competencyId === competencyId && e.period === period);
    if (ev) return ev.qualitative || NUM_TO_GRADE((ev.score / (ev.maxPossible || 20)) * 4);
    const gr = studentLegacy.find(g => g.subject === subject.name && g.competencyId === competencyId && g.period === period);
    if (gr && gr.score) return gr.conclusion || NUM_TO_GRADE(GRADE_TO_NUM[gr.score] || 0);
    return '-';
  };

  const calcAvg = (grades) => {
    const nums = grades.filter(g => g !== '-').map(g => GRADE_TO_NUM[g]).filter(Boolean);
    if (nums.length === 0) return '-';
    return NUM_TO_GRADE(nums.reduce((a, b) => a + b, 0) / nums.length);
  };

  const handlePrint = () => window.print();

  const pdfContainerRef = useRef(null);
  const [generatingPdf, setGeneratingPdf] = useState('');

  const escHtml = (str) => {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  };

  const gradeGroups = useMemo(() => {
    const groups = {};
    students.forEach(s => {
      const g = s.gradeLevel || 'Sin grado';
      if (!groups[g]) groups[g] = [];
      groups[g].push(s);
    });
    return groups;
  }, [students]);

  const cellStyleStr = (grade) => [
    'text-align:center;padding:6px 10px;font-size:0.85rem;',
    `font-weight:${grade ? 700 : 400};`,
    `color:${grade && grade !== '-' ? GRADE_COLOR[grade] || '#1e293b' : '#94a3b8'};`,
    'border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;'
  ].join('');

  const buildBoletaHTML = (student) => {
    const evals = instrumentEvaluations.filter(e => e.studentId === student.id);
    const legacy = legacyGrades.filter(g => g.studentId === student.id);
    const getG = (subject, competencyId, period) => {
      const ev = evals.find(e => e.subjectId === subject.id && e.competencyId === competencyId && e.period === period);
      if (ev) return ev.qualitative || NUM_TO_GRADE((ev.score / (ev.maxPossible || 20)) * 4);
      const gr = legacy.find(g => g.subject === subject.name && g.competencyId === competencyId && g.period === period);
      if (gr && gr.score) return gr.conclusion || NUM_TO_GRADE(GRADE_TO_NUM[gr.score] || 0);
      return '-';
    };
    const calcA = (grades) => {
      const nums = grades.filter(g => g !== '-').map(g => GRADE_TO_NUM[g]).filter(Boolean);
      if (nums.length === 0) return '-';
      return NUM_TO_GRADE(nums.reduce((a, b) => a + b, 0) / nums.length);
    };

    let subjectsHtml = '';
    subjects.forEach(sub => {
      const compRows = sub.competencies.map(comp => {
        const grades = PERIODS.map(p => getG(sub, comp.id, p));
        return { name: comp.name, grades, avg: calcA(grades) };
      });
      const periodAvgs = PERIODS.map((p, pi) => calcA(compRows.map(r => r.grades[pi])));
      const overallAvg = calcA(compRows.flatMap(r => r.grades));

      let compsHtml = '';
      compRows.forEach(comp => {
        compsHtml += `<tr>
          <td style="padding:6px 12px;font-size:0.85rem;color:#334155;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0">${escHtml(comp.name)}</td>
          ${comp.grades.map(g => `<td style="${cellStyleStr(g)}">${g}</td>`).join('')}
          <td style="${cellStyleStr(comp.avg)}font-weight:800;background:#f8fafc">${comp.avg}</td>
        </tr>`;
      });

      subjectsHtml += `<div style="margin-bottom:16px;page-break-inside:avoid">
        <h3 style="font-size:0.85rem;font-weight:800;text-transform:uppercase;padding:0.5rem 0.75rem;background:#004d4d;color:white;border-radius:8px 8px 0 0;letter-spacing:0.05em;margin:0">${escHtml(sub.name)}</h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-top:none">
          <thead>
            <tr style="background:#f1f5f9">
              <th style="text-align:left;padding:8px 12px;font-size:0.8rem;color:#475569;font-weight:700;border-bottom:2px solid #cbd5e1;border-right:1px solid #e2e8f0">Competencias</th>
              ${PERIODS.map(p => `<th style="text-align:center;padding:8px 6px;font-size:0.75rem;color:#475569;font-weight:700;border-bottom:2px solid #cbd5e1;border-right:1px solid #e2e8f0;width:80px">${PERIOD_LABEL[p]}</th>`).join('')}
              <th style="text-align:center;padding:8px 6px;font-size:0.75rem;color:#475569;font-weight:700;border-bottom:2px solid #cbd5e1;width:70px">Prom.</th>
            </tr>
          </thead>
          <tbody>
            ${compsHtml}
            <tr style="background:#f8fafc">
              <td style="padding:8px 12px;font-size:0.8rem;font-weight:800;color:#1e293b;border-top:2px solid #cbd5e1;border-right:1px solid #e2e8f0">Promedio del Área</td>
              ${periodAvgs.map(avg => `<td style="${cellStyleStr(avg)}border-top:2px solid #cbd5e1;font-weight:800;font-size:0.9rem">${avg}</td>`).join('')}
              <td style="${cellStyleStr(overallAvg)}border-top:2px solid #cbd5e1;font-weight:800;font-size:0.9rem;background:#e2e8f0">${overallAvg}</td>
            </tr>
          </tbody>
        </table>
      </div>`;
    });

    return `<div style="font-family:Arial,Helvetica,sans-serif;padding:20px;max-width:1000px;margin:0 auto">
      <div style="text-align:center;margin-bottom:16px;padding-bottom:10px;border-bottom:3px double #1e293b">
        <h2 style="font-size:1.3rem;font-weight:800;margin:0 0 2px 0;letter-spacing:-0.5px">I.E.P. 110 - PORTAL AGRO</h2>
        <p style="font-size:0.85rem;color:#64748b;margin:0">BOLETA DE NOTAS - AÑO ESCOLAR 2026</p>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:16px;padding:10px 14px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0">
        <div>
          <p style="font-size:0.85rem;color:#64748b;margin:0"><strong>Apellidos y Nombres:</strong></p>
          <p style="font-size:1rem;font-weight:700;color:#1e293b;margin:0">${escHtml(student.name)}</p>
        </div>
        <div style="text-align:right">
          <p style="font-size:0.85rem;color:#64748b;margin:0"><strong>Grado/Sección:</strong></p>
          <p style="font-size:1rem;font-weight:700;color:#1e293b;margin:0">${escHtml(student.gradeLevel)}</p>
        </div>
      </div>
      ${subjectsHtml}
      <div style="margin-top:16px;padding:8px 12px;background:#fefce8;border-radius:8px;border:1px solid #fde68a;font-size:0.8rem;color:#92400e">
        <strong>Leyenda:</strong> AD = Destacado (18-20) | A = Logrado (14-17) | B = En Proceso (11-13) | C = En Inicio (0-10)
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:24px;padding-top:10px;font-size:0.85rem">
        <div style="text-align:center;flex:1">
          <div style="border-top:1px solid #1e293b;padding-top:6px;margin:0 2rem">Docente</div>
        </div>
        <div style="text-align:center;flex:1">
          <div style="border-top:1px solid #1e293b;padding-top:6px;margin:0 2rem">Director(a)</div>
        </div>
      </div>
    </div>`;
  };

  const handleGeneratePDF = async (grade) => {
    setGeneratingPdf(grade);
    const group = gradeGroups[grade] || [];
    if (group.length === 0) { setGeneratingPdf(''); return; }
    const container = pdfContainerRef.current;
    if (!container) { setGeneratingPdf(''); return; }
    const allHtml = group.map((s, i) =>
      buildBoletaHTML(s) + (i < group.length - 1 ? '<div style="page-break-after:always"></div>' : '')
    ).join('');
    container.innerHTML = allHtml;
    try {
      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `Boletas_${grade.replace(/[^a-zA-Z0-9_]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(container).save();
    } catch (e) {
      console.error('PDF generation error:', e);
    }
    container.innerHTML = '';
    setGeneratingPdf('');
  };

  const subjectData = useMemo(() => {
    if (!selectedStudent) return [];
    return subjects.map(sub => {
      const compRows = sub.competencies.map(comp => {
        const grades = PERIODS.map(p => getGrade(sub, comp.id, p));
        return { name: comp.name, grades, avg: calcAvg(grades) };
      });
      const periodAvgs = PERIODS.map((p, pi) => calcAvg(compRows.map(r => r.grades[pi])));
      const overallAvg = calcAvg(compRows.flatMap(r => r.grades));
      return { name: sub.name, competencies: compRows, periodAvgs, overallAvg };
    });
  }, [selectedStudent, subjects, studentEvals, studentLegacy]);

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '1.5rem' }}>
      <style>{`
        @media print {
          @page { margin: 1.5cm; size: A4 portrait; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .app-container .main-content { padding: 0 !important; }
          #boleta { padding: 0 !important; }
          #boleta table { page-break-inside: auto; }
          #boleta tr { page-break-inside: avoid; }
          #boleta thead { display: table-header-group; }
          #boleta h3 { page-break-after: avoid; }
        }
        @media screen {
          .print-only { display: none; }
        }
      `}</style>

      <div className="no-print" style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #fbbf24 100%)',
        borderRadius: '20px', padding: '2rem 2.5rem', marginBottom: '1.5rem',
        color: 'white', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-30%', right: '-5%', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-15%', left: '-2%', width: '120px', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '56px', height: '56px', background: 'rgba(255,255,255,0.2)',
            borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)'
          }}>
            <FileText size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Boleta de Notas</h2>
            <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>Reporte oficial de calificaciones por áreas y competencias</p>
          </div>
        </div>
      </div>

      <div className="no-print" style={{
        background: 'white', borderRadius: '16px', padding: '1.5rem',
        border: '1px solid #e2e8f0', marginBottom: '1.5rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Users size={22} color="#d97706" />
          </div>
          <div>
            <label style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', display: 'block' }}>
              Seleccionar Alumno
            </label>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Busca por nombre, DNI o grado</span>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Buscar alumno por nombre, DNI o grado..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setSelectedStudentId(''); }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              className="input-field"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
          {searchTerm && searchFocused && filteredStudents.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
              background: 'white', borderRadius: '12px', marginTop: '4px',
              border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              maxHeight: '280px', overflowY: 'auto'
            }}>
              {filteredStudents.map(s => (
                <div key={s.id} onClick={() => { setSelectedStudentId(s.id); setSearchTerm(''); setSearchFocused(false); }}
                  style={{
                    padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.9rem',
                    borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fefce8'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <span style={{ color: '#1e293b', fontWeight: 500 }}>{s.name}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{s.gradeLevel}</span>
                </div>
              ))}
            </div>
          )}
          {searchTerm && searchFocused && filteredStudents.length === 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
              background: 'white', borderRadius: '12px', marginTop: '4px',
              border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem'
            }}>
              No se encontraron alumnos
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.75rem' }}>
          {selectedStudent ? (
            <>
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', background: '#fefce8', borderRadius: '12px',
                border: '1px solid #fde68a'
              }}>
                <Users size={18} color="#d97706" />
                <span style={{ fontWeight: 600, color: '#1e293b', flex: 1 }}>
                  {students.find(s => s.id === selectedStudentId)?.name}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#92400e', background: '#fde68a', padding: '2px 10px', borderRadius: '999px' }}>
                  {students.find(s => s.id === selectedStudentId)?.gradeLevel}
                </span>
                <button onClick={() => { setSelectedStudentId(''); setSearchTerm(''); }}
                  style={{ background: 'none', border: 'none', color: '#92400e', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, padding: '4px 8px', borderRadius: '8px' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fde68a'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >Cambiar</button>
              </div>
              <button onClick={handlePrint} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white', border: 'none', fontWeight: 600, fontSize: '0.9rem',
              cursor: 'pointer', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
              transition: 'all 0.2s ease', whiteSpace: 'nowrap'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.3)'; }}
            >
              <Printer size={18} /> Imprimir / PDF
            </button>
          </>
          ) : null}
        </div>

        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Download size={18} color="#d97706" />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>Generar PDF por Grado</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {Object.entries(gradeGroups).map(([grade, sts]) => (
              <button key={grade} onClick={() => handleGeneratePDF(grade)}
                disabled={generatingPdf === grade}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 1rem', borderRadius: '10px',
                  background: generatingPdf === grade ? '#e2e8f0' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: generatingPdf === grade ? '#94a3b8' : 'white',
                  border: 'none', fontWeight: 600, fontSize: '0.8rem',
                  cursor: generatingPdf === grade ? 'not-allowed' : 'pointer',
                  boxShadow: generatingPdf === grade ? 'none' : '0 4px 12px rgba(245, 158, 11, 0.25)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { if (generatingPdf !== grade) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.35)'; } }}
                onMouseLeave={e => { if (generatingPdf !== grade) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.25)'; } }}
              >
                <FileText size={14} />
                {grade} ({sts.length})
                {generatingPdf === grade && <span style={{ fontSize: '0.75rem' }}>⋯</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedStudent && (
        <div id="boleta">
          <div style={{
            textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1rem',
            borderBottom: '3px double #1e293b'
          }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.15rem', letterSpacing: '-0.5px' }}>I.E.P. 110 - PORTAL AGRO</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>BOLETA DE NOTAS - AÑO ESCOLAR 2026</p>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem',
            padding: '1rem 1.25rem', background: '#f8fafc', borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}><strong>Apellidos y Nombres:</strong></p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{selectedStudent.name}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}><strong>Grado/Sección:</strong></p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{selectedStudent.gradeLevel}</p>
            </div>
          </div>

          {subjectData.map((sub, si) => (
            <div key={si} style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
              <h3 style={{
                fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase',
                padding: '0.5rem 0.75rem', background: '#004d4d', color: 'white',
                borderRadius: '8px 8px 0 0', letterSpacing: '0.05em'
              }}>{sub.name}</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%', borderCollapse: 'collapse',
                  border: '1px solid #e2e8f0', borderTop: 'none'
                }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.8rem', color: '#475569', fontWeight: 700, borderBottom: '2px solid #cbd5e1', borderRight: '1px solid #e2e8f0' }}>
                        Competencias
                      </th>
                      {PERIODS.map(p => (
                        <th key={p} style={{ textAlign: 'center', padding: '8px 6px', fontSize: '0.75rem', color: '#475569', fontWeight: 700, borderBottom: '2px solid #cbd5e1', borderRight: '1px solid #e2e8f0', width: '80px' }}>
                          {PERIOD_LABEL[p]}
                        </th>
                      ))}
                      <th style={{ textAlign: 'center', padding: '8px 6px', fontSize: '0.75rem', color: '#475569', fontWeight: 700, borderBottom: '2px solid #cbd5e1', width: '70px' }}>
                        Prom.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sub.competencies.map((comp, ci) => (
                      <tr key={ci}>
                        <td style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                          {comp.name}
                        </td>
                        {comp.grades.map((g, pi) => (
                          <td key={pi} style={cellStyle(g)}>{g}</td>
                        ))}
                        <td style={{ ...cellStyle(comp.avg), fontWeight: 800, background: '#f8fafc' }}>{comp.avg}</td>
                      </tr>
                    ))}
                    <tr style={{ background: '#f8fafc' }}>
                      <td style={{ padding: '8px 12px', fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', borderTop: '2px solid #cbd5e1', borderRight: '1px solid #e2e8f0' }}>
                        Promedio del Área
                      </td>
                      {sub.periodAvgs.map((avg, pi) => (
                        <td key={pi} style={{ ...cellStyle(avg), borderTop: '2px solid #cbd5e1', fontWeight: 800, fontSize: '0.9rem' }}>{avg}</td>
                      ))}
                      <td style={{ ...cellStyle(sub.overallAvg), borderTop: '2px solid #cbd5e1', fontWeight: 800, fontSize: '0.9rem', background: '#e2e8f0' }}>{sub.overallAvg}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div style={{
            marginTop: '2rem', padding: '0.75rem 1rem',
            background: '#fefce8', borderRadius: '8px',
            border: '1px solid #fde68a', fontSize: '0.8rem', color: '#92400e'
          }}>
            <strong>Leyenda:</strong>{' '}
            AD = Destacado (18-20) | A = Logrado (14-17) | B = En Proceso (11-13) | C = En Inicio (0-10)
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem',
            paddingTop: '1rem', fontSize: '0.85rem'
          }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ borderTop: '1px solid #1e293b', paddingTop: '0.5rem', margin: '0 2rem' }}>
                Docente
              </div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ borderTop: '1px solid #1e293b', paddingTop: '0.5rem', margin: '0 2rem' }}>
                Director(a)
              </div>
            </div>
          </div>
        </div>
      )}
      <div ref={pdfContainerRef} style={{ position: 'fixed', left: 0, top: 0, width: '1000px', opacity: 0, pointerEvents: 'none', zIndex: -1 }} />
    </div>
  );
}
