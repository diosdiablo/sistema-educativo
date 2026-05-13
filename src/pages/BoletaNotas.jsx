import { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Printer, FileText, Search, Users, GraduationCap } from 'lucide-react';

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
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem' }}>
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
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-30%', left: '-5%', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
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

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 0px', minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Buscar alumno..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setSelectedStudentId(''); }}
              className="input-field"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
          <div style={{ flex: '1 1 0px', minWidth: '220px' }}>
            <select
              value={selectedStudentId}
              onChange={e => { setSelectedStudentId(e.target.value); setSearchTerm(''); }}
              className="input-field"
              style={{ background: selectedStudentId ? '#fefce8' : 'white', borderColor: selectedStudentId ? '#f59e0b' : '#e2e8f0' }}
            >
              <option value="">{searchTerm && filteredStudents.length === 0 ? 'Sin resultados' : '-- Seleccionar alumno --'}</option>
              {filteredStudents.map(s => (
                <option key={s.id} value={s.id}>{s.name} - {s.gradeLevel}</option>
              ))}
            </select>
          </div>
          {selectedStudent && (
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
          )}
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
    </div>
  );
}
