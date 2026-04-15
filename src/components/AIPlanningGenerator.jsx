import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, Loader2, Copy, Download, X, ChevronDown, ChevronRight, BookOpen, Clock, Target, Package, PlayCircle, CheckCircle, Lightbulb, Save } from 'lucide-react';
import { generateLessonPlan, formatLessonPlanAsText } from '../lib/deepseek';

export default function AIPlanningGenerator() {
  const { classes = [], subjects = [], addPlanningDocument, currentUser } = useStore();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    inicio: true,
    desarrollo: true,
    cierre: true,
    evaluacion: true
  });

  const [formData, setFormData] = useState({
    subjectId: '',
    classId: '',
    topic: '',
    duration: 90,
    period: '2026'
  });

  const grades = [...new Set(classes.map(c => c.name.split(' - ')[0]))].sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  const handleGenerate = async () => {
    if (!formData.subjectId || !formData.classId || !formData.topic) {
      setError('Completa todos los campos requeridos');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedPlan(null);

    try {
      const subject = subjects.find(s => s.id === formData.subjectId);
      const cls = classes.find(c => c.id === formData.classId);
      
      const plan = await generateLessonPlan({
        subject: subject?.name || formData.subjectId,
        grade: cls?.name || formData.classId,
        topic: formData.topic,
        duration: formData.duration,
        period: formData.period
      });

      setGeneratedPlan(plan);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedPlan) {
      const text = formatLessonPlanAsText(generatedPlan);
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveAsDocument = () => {
    if (!generatedPlan) return;

    const text = formatLessonPlanAsText(generatedPlan);
    const blob = new Blob([text], { type: 'text/plain' });
    const reader = new FileReader();
    reader.onload = (e) => {
      const cls = classes.find(c => c.id === formData.classId);
      addPlanningDocument({
        gradeLevel: cls?.name.split(' - ')[0] || '',
        sections: [formData.classId],
        subjectId: formData.subjectId,
        title: generatedPlan.titulo,
        description: `Plan de clase generado con IA - ${formData.topic}`,
        period: formData.period,
        fileData: e.target.result,
        fileName: `${generatedPlan.titulo.replace(/\s+/g, '_')}.txt`,
        isAIGenerated: true
      });
      alert('Plan de clase guardado exitosamente');
    };
    reader.readAsDataURL(blob);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      {!showGenerator ? (
        <button
          onClick={() => setShowGenerator(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.5rem',
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '14px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.95rem',
            boxShadow: '0 4px 20px rgba(124, 58, 237, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 25px rgba(124, 58, 237, 0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(124, 58, 237, 0.3)'; }}
        >
          <Sparkles size={20} />
          Generar Plan con IA
        </button>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '1.5rem',
          boxShadow: '0 4px 25px rgba(0,0,0,0.1)',
          border: '2px solid #7c3aed20'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={22} color="white" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Generador de Planes con IA
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  DeepSeek · Modelo gratuito
                </p>
              </div>
            </div>
            <button
              onClick={() => { setShowGenerator(false); setGeneratedPlan(null); }}
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '10px',
                padding: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={20} color="var(--text-secondary)" />
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Área Curricular *
              </label>
              <select
                className="input-field"
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              >
                <option value="">Seleccionar Área</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Grado y Sección *
              </label>
              <select
                className="input-field"
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              >
                <option value="">Seleccionar</option>
                {classes.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Duración (minutos)
              </label>
              <select
                className="input-field"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              >
                <option value={45}>45 minutos</option>
                <option value={90}>90 minutos</option>
                <option value={120}>120 minutos</option>
                <option value={180}>180 minutos (3 horas)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Periodo
              </label>
              <select
                className="input-field"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Tema de la Sesión *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Ej: Resolución de ecuaciones lineales, El sistema respiratorio, La Revolución Francesa..."
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            />
          </div>

          {error && (
            <div style={{
              padding: '1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              color: '#dc2626',
              fontSize: '0.9rem',
              marginBottom: '1rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '1rem',
              background: isGenerating ? '#9ca3af' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'all 0.3s ease'
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Generando plan con IA...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Generar Plan de Clase
              </>
            )}
          </button>

          {generatedPlan && (
            <div style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                <button
                  onClick={handleCopy}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: copied ? '#10b981' : '#f1f5f9',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: copied ? 'white' : 'var(--text-primary)'
                  }}
                >
                  <Copy size={16} />
                  {copied ? '¡Copiado!' : 'Copiar'}
                </button>
                <button
                  onClick={handleSaveAsDocument}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: '#10b981',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: 'white'
                  }}
                >
                  <Save size={16} />
                  Guardar
                </button>
              </div>

              <div style={{
                background: '#faf5ff',
                borderRadius: '16px',
                padding: '1.25rem',
                border: '1px solid #e9d5ff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Sparkles size={18} color="#7c3aed" />
                  <span style={{ fontWeight: 700, color: '#7c3aed', fontSize: '0.9rem' }}>Plan Generado con IA</span>
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  {generatedPlan.titulo}
                </h2>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'white', padding: '0.4rem 0.75rem', borderRadius: '20px' }}>
                    <BookOpen size={14} /> {generatedPlan.area}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'white', padding: '0.4rem 0.75rem', borderRadius: '20px' }}>
                    <Clock size={14} /> {generatedPlan.duracion}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'white', padding: '0.4rem 0.75rem', borderRadius: '20px' }}>
                    <Target size={14} /> {generatedPlan.competencia}
                  </span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    📚 Capacidades
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {generatedPlan.capacidades.map((cap, i) => (
                      <span key={i} style={{ fontSize: '0.8rem', background: 'white', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    🎯 Objetivos
                  </h4>
                  {generatedPlan.objetivos.map((obj, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <CheckCircle size={14} color="#10b981" style={{ marginTop: '3px', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.85rem' }}>{obj}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    📦 Recursos
                  </h4>
                  <span style={{ fontSize: '0.85rem' }}>{generatedPlan.recursos.join(', ')}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    onClick={() => toggleSection('inicio')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: expandedSections.inicio ? '#fef3c7' : '#f8fafc',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      color: '#d97706'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🚀 INICIO
                      <span style={{ fontSize: '0.75rem', background: '#fbbf24', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                        {generatedPlan.secuencia.inicio.tiempo}
                      </span>
                    </div>
                    {expandedSections.inicio ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  {expandedSections.inicio && (
                    <div style={{ padding: '0 0.5rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
                      <p style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{generatedPlan.secuencia.inicio.descripcion}</p>
                      {generatedPlan.secuencia.inicio.actividades.map((act, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.25rem' }}>
                          <span>•</span>
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => toggleSection('desarrollo')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: expandedSections.desarrollo ? '#dbeafe' : '#f8fafc',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      color: '#2563eb'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      📖 DESARROLLO
                      <span style={{ fontSize: '0.75rem', background: '#3b82f6', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                        {generatedPlan.secuencia.desarrollo.tiempo}
                      </span>
                    </div>
                    {expandedSections.desarrollo ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  {expandedSections.desarrollo && (
                    <div style={{ padding: '0 0.5rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
                      <p style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{generatedPlan.secuencia.desarrollo.descripcion}</p>
                      {generatedPlan.secuencia.desarrollo.actividades.map((act, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.25rem' }}>
                          <span>•</span>
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => toggleSection('cierre')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: expandedSections.cierre ? '#dcfce7' : '#f8fafc',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      color: '#16a34a'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🔚 CIERRE
                      <span style={{ fontSize: '0.75rem', background: '#22c55e', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                        {generatedPlan.secuencia.cierre.tiempo}
                      </span>
                    </div>
                    {expandedSections.cierre ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  {expandedSections.cierre && (
                    <div style={{ padding: '0 0.5rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
                      <p style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{generatedPlan.secuencia.cierre.descripcion}</p>
                      {generatedPlan.secuencia.cierre.actividades.map((act, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.25rem' }}>
                          <span>•</span>
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => toggleSection('evaluacion')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: expandedSections.evaluacion ? '#fae8ff' : '#f8fafc',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      color: '#a21caf'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      📝 EVALUACIÓN
                    </div>
                    {expandedSections.evaluacion ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  {expandedSections.evaluacion && (
                    <div style={{ padding: '0 0.5rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
                      <p style={{ marginBottom: '0.5rem' }}><strong>Técnicas:</strong> {generatedPlan.evaluacion.tecnicas.join(', ')}</p>
                      <p style={{ marginBottom: '0.5rem' }}><strong>Instrumentos:</strong> {generatedPlan.evaluacion.instrumentos.join(', ')}</p>
                      <p style={{ marginBottom: '0.5rem' }}><strong>Criterios:</strong></p>
                      {generatedPlan.evaluacion.criterios.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.25rem' }}>
                          <span>•</span>
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fcd34d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Lightbulb size={16} color="#d97706" />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#d97706' }}>Reflexión Metacognitiva</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                    <p><strong>Antes:</strong> {generatedPlan.reflexion.antes.join(', ')}</p>
                    <p><strong>Durante:</strong> {generatedPlan.reflexion.durante.join(', ')}</p>
                    <p><strong>Después:</strong> {generatedPlan.reflexion.despues.join(', ')}</p>
                  </div>
                </div>

                {generatedPlan.tarea && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #86efac' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#16a34a' }}>📋 Tarea para casa:</span>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', marginBottom: 0 }}>{generatedPlan.tarea}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
