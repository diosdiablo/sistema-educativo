import { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Trash2, Upload, FileText, X, Download, Eye, Search, FolderOpen, Calendar, User, BookOpen, GraduationCap } from 'lucide-react';

export default function PlanningDocuments() {
  const { classes, subjects, planningDocuments, addPlanningDocument, deletePlanningDocument, isAdmin, currentUser } = useStore();
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [filterGrade, setFilterGrade] = useState('Todos');
  const [filterSubject, setFilterSubject] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredDocuments = useMemo(() => {
    let docs = planningDocuments || [];
    
    if (filterGrade !== 'Todos') {
      docs = docs.filter(d => d.gradeLevel === filterGrade);
    }
    
    if (filterSubject !== 'Todos') {
      docs = docs.filter(d => d.subjectId === filterSubject);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      docs = docs.filter(d => 
        d.title?.toLowerCase().includes(term) || 
        d.description?.toLowerCase().includes(term)
      );
    }
    
    return docs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }, [planningDocuments || [], filterGrade, filterSubject, searchTerm]);

  const getGradeDisplay = (doc) => {
    const gradeName = doc.gradeLevel || 'Grado';
    const sectionNames = doc.sections?.map(sid => {
      const cls = classes.find(c => c.id === sid);
      return cls?.name?.split(' - ')[1] || sid;
    }).join(', ') || '';
    return sectionNames ? `${gradeName} (${sectionNames})` : gradeName;
  };
  const getSubjectName = (subjectId) => subjects.find(s => s.id === subjectId)?.name || 'Área no encontrada';

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const gradientColors = [
    ['#3b82f6', '#2563eb'],
    ['#10b981', '#059669'],
    ['#f59e0b', '#d97706'],
    ['#ef4444', '#dc2626'],
    ['#8b5cf6', '#7c3aed'],
    ['#ec4899', '#db2777']
  ];

  return (
    <div className="animate-fade-in">
      {/* Header con gradiente */}
      <div style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #fbbf24 100%)',
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
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
              <FolderOpen size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Planificación Docente</h2>
              <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>Gestiona los documentos de planificación por grado y área</p>
            </div>
          </div>
          
          {isAdmin && (
            <button 
              style={{
                background: 'white',
                color: '#d97706',
                border: 'none',
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'; }}
              onClick={() => setShowUploadModal(true)}
            >
              <Plus size={18} /> Subir Documento
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text"
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        
        <select 
          className="input-field"
          value={filterGrade}
          onChange={e => setFilterGrade(e.target.value)}
          style={{ minWidth: '180px' }}
        >
          <option value="Todos">Todos los Grados</option>
          {[...new Set(classes.map(c => c.name.split(' - ')[0]))].map(grade => (
            <option key={grade} value={grade}>{grade}</option>
          ))}
        </select>
        
        <select 
          className="input-field"
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          style={{ minWidth: '180px' }}
        >
          <option value="Todos">Todas las Áreas</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <div style={{ 
          padding: '0.5rem 1rem', 
          background: 'linear-gradient(135deg, #f59e0b15, #fbbf2415)',
          borderRadius: '10px',
          border: '1px solid #f59e0b30',
          fontWeight: 600,
          color: '#d97706',
          fontSize: '0.85rem'
        }}>
          {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Grid de documentos */}
      {filteredDocuments.length === 0 ? (
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
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <FileText size={40} color="white" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No hay documentos de planificación
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>
            {isAdmin ? 'Sube el primer documento de planificación para comenzar.' : 'No hay documentos cargados aún.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredDocuments.map((doc, idx) => {
            const [color1, color2] = gradientColors[idx % gradientColors.length];
            return (
              <div key={doc.id} style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1.25rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: `1px solid ${color1}20`,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${color1}, ${color2})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 15px ${color1}40`
                  }}>
                    <FileText size={24} color="white" />
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  {doc.title}
                </h3>
                
                {doc.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                    {doc.description}
                  </p>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <GraduationCap size={14} color={color1} />
                    <span>{getGradeDisplay(doc)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <BookOpen size={14} color={color1} />
                    <span>{getSubjectName(doc.subjectId)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <Calendar size={14} color={color1} />
                    <span>{doc.period}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  <button
                    onClick={() => setViewingDoc(doc)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem',
                      background: `linear-gradient(135deg, ${color1}, ${color2})`,
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <Eye size={16} /> Ver
                  </button>
                  <a
                    href={doc.fileData}
                    download={doc.fileName || 'documento.pdf'}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem',
                      background: 'white',
                      border: `1px solid ${color1}`,
                      borderRadius: '10px',
                      color: color1,
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `${color1}10`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                  >
                    <Download size={16} /> Descargar
                  </a>
                </div>
                
                <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                  Subido por {doc.uploadedBy} el {formatDate(doc.uploadedAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de subida */}
      {showUploadModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          padding: '4rem 1rem', zIndex: 1000, overflowY: 'auto'
        }}>
          <div style={{ 
            maxWidth: '500px', width: '100%', 
            background: 'white', borderRadius: '24px', padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative'
          }} className="animate-fade-in">
            <div style={{ 
              position: 'absolute', top: '-30%', right: '-10%',
              width: '150px', height: '150px',
              background: 'linear-gradient(135deg, #f59e0b20, #d9770620)',
              borderRadius: '50%'
            }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Upload size={24} color="white" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Subir Documento</h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                <X size={24} color="var(--text-secondary)" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Título del Documento *</label>
                <input 
                  type="text"
                  className="input-field"
                  placeholder="Ej. Planificación Mensual - Marzo 2026"
                  value={uploadData.title}
                  onChange={e => setUploadData({ ...uploadData, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Grado *</label>
                <select 
                  className="input-field"
                  value={uploadData.gradeLevel}
                  onChange={e => setUploadData({ ...uploadData, gradeLevel: e.target.value, sections: [] })}
                >
                  <option value="">Seleccionar Grado</option>
                  {[...new Set(classes.map(c => c.name.split(' - ')[0]))].sort().map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

              {uploadData.gradeLevel && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Secciones * (selecciona una o varias)
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {classes
                      .filter(c => c.name.startsWith(uploadData.gradeLevel))
                      .map(cls => {
                        const section = cls.name.split(' - ')[1];
                        const isSelected = uploadData.sections.includes(cls.id);
                        return (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => {
                              const newSections = isSelected
                                ? uploadData.sections.filter(s => s !== cls.id)
                                : [...uploadData.sections, cls.id];
                              setUploadData({ ...uploadData, sections: newSections });
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              border: isSelected ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                              background: isSelected ? '#fef3c7' : 'white',
                              color: isSelected ? '#d97706' : 'var(--text-primary)',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {section}
                          </button>
                        );
                      })
                    }
                  </div>
                  {uploadData.sections.length > 0 && (
                    <p style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.5rem' }}>
                      ✓ Seleccionadas: {uploadData.sections.length} sección(es)
                    </p>
                  )}
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Área Curricular *</label>
                <select 
                  className="input-field"
                  value={uploadData.subjectId}
                  onChange={e => setUploadData({ ...uploadData, subjectId: e.target.value })}
                >
                  <option value="">Seleccionar Área</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Archivo PDF *</label>
                <input 
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  style={{ 
                    padding: '0.6rem', 
                    border: '1px dashed #cbd5e1', 
                    borderRadius: '8px',
                    width: '100%'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Descripción (opcional)</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Descripción breve del contenido del documento..."
                  value={uploadData.description}
                  onChange={e => setUploadData({ ...uploadData, description: e.target.value })}
                />
              </div>

              {uploadData.fileName && (
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem',
                  background: '#f0fdf4',
                  borderRadius: '10px',
                  border: '1px solid #22c55e40',
                  color: '#16a34a'
                }}>
                  <FileText size={18} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{uploadData.fileName}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  style={{ 
                    flex: 1, padding: '0.75rem', borderRadius: '12px',
                    background: '#f1f5f9', color: 'var(--text-secondary)',
                    border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600
                  }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleUpload}
                  style={{ 
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white',
                    border: 'none', borderRadius: '12px', padding: '0.75rem', cursor: 'pointer', fontWeight: 600
                  }}
                >
                  <Upload size={18} /> Subir Documento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualización */}
      {viewingDoc && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '2rem', zIndex: 1100
        }}>
          <div style={{ 
            maxWidth: '900px', width: '100%', height: '90vh',
            background: 'white', borderRadius: '24px',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden'
          }} className="animate-fade-in">
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{viewingDoc.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                  {getGradeDisplay(viewingDoc)} - {getSubjectName(viewingDoc.subjectId)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a
                  href={viewingDoc.fileData}
                  download={viewingDoc.fileName || 'documento.pdf'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: '#f59e0b',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={16} /> Descargar
                </a>
                <button 
                  onClick={() => setViewingDoc(null)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <iframe 
                src={viewingDoc.fileData}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={viewingDoc.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}