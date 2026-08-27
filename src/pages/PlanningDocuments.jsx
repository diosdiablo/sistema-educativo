import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Trash2, Upload, FileText, X, Download, Eye, Search, FolderOpen, Calendar, BookOpen, GraduationCap, ChevronRight, ChevronDown, Folder, LayoutGrid, List, BookMarked, Briefcase, Users, UserCheck } from 'lucide-react';
import AIPlanningGenerator from '../components/AIPlanningGenerator';

export default function PlanningDocuments() {
  try {
    const { classes = [], subjects = [], planningDocuments = [], learningSessions = [], addPlanningDocument, addLearningSession, deletePlanningDocument, deleteLearningSession, isAdmin, currentUser, getPlanningFileData } = useStore();
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [docFiles, setDocFiles] = useState({});
  const [docFileLoading, setDocFileLoading] = useState(false);

  const openDoc = async (doc) => {
    const cached = doc.fileData || docFiles[doc.id];
    if (cached) { setViewingDoc({ ...doc, fileData: cached }); return; }
    setViewingDoc(doc);
    setDocFileLoading(true);
    try {
      const fd = await getPlanningFileData(doc.id);
      if (fd) setDocFiles(prev => ({ ...prev, [doc.id]: fd }));
      setViewingDoc(v => (v && v.id === doc.id) ? { ...v, fileData: fd } : v);
    } catch (e) {
      console.error('Error loading file:', e);
    } finally {
      setDocFileLoading(false);
    }
  };

  const downloadDoc = async (doc) => {
    try {
      let fd = doc.fileData || docFiles[doc.id];
      if (!fd) {
        fd = await getPlanningFileData(doc.id);
        if (fd) setDocFiles(prev => ({ ...prev, [doc.id]: fd }));
      }
      if (!fd) return;
      const a = document.createElement('a');
      a.href = fd;
      a.download = doc.fileName || 'documento.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) { console.error('Download error:', e); }
  };
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [contentType, setContentType] = useState('planifications');
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [reportFiles, setReportFiles] = useState(() => {
    const saved = localStorage.getItem('edu_reports');
    return saved ? JSON.parse(saved) : [];
  });
  const [viewMode, setViewMode] = useState('grid');
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);

  // Guardar informes en localStorage
  useEffect(() => {
    localStorage.setItem('edu_reports', JSON.stringify(reportFiles));
  }, [reportFiles]);

  // Obtener lista de docentes únicos
  const teachers = useMemo(() => {
    const teacherMap = {};
    reportFiles.forEach(r => {
      if (!teacherMap[r.teacherId]) {
        teacherMap[r.teacherId] = {
          id: r.teacherId,
          name: r.teacherName || r.teacherId,
          count: 0
        };
      }
      teacherMap[r.teacherId].count++;
    });
    return Object.values(teacherMap);
  }, [reportFiles]);

  // Filtrar informes por docente seleccionado
  const myReports = useMemo(() => {
    if (isAdmin && selectedTeacherId) {
      return reportFiles.filter(r => r.teacherId === selectedTeacherId);
    }
    if (!currentUser) return [];
    return reportFiles.filter(r => r.teacherId === currentUser.id || r.teacherId === currentUser.username);
  }, [reportFiles, currentUser, isAdmin, selectedTeacherId]);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadData, setUploadData] = useState({
    gradeLevel: '',
    sections: [],
    subjectId: '',
    title: '',
    description: '',
    period: '2026',
    file: null,
    fileName: ''
  });

  const grades = useMemo(() => {
    try {
      if (!classes || classes.length === 0) return [];
      const gradeMap = new Map();
      classes.forEach(cls => {
        if (!cls || !cls.name) return;
        const grade = cls.name.split(' - ')[0];
        if (!gradeMap.has(grade)) {
          gradeMap.set(grade, {
            name: grade,
            sections: []
          });
        }
        gradeMap.get(grade).sections.push(cls);
      });
      return Array.from(gradeMap.values()).sort((a, b) => {
        const aNum = parseInt(a.name.replace(/\D/g, '')) || 0;
        const bNum = parseInt(b.name.replace(/\D/g, '')) || 0;
        return aNum - bNum;
      });
    } catch (e) {
      console.error('Error calculating grades:', e);
      return [];
    }
  }, [classes]);

  const docCountBySection = useMemo(() => {
    const counts = {};
    const docs = contentType === 'planifications' ? planningDocuments : learningSessions;
    (docs || []).forEach(doc => {
      (doc.sections || []).forEach(sectionId => {
        counts[sectionId] = (counts[sectionId] || 0) + 1;
      });
    });
    return counts;
  }, [planningDocuments, learningSessions, contentType]);

  const getDocCountForGrade = (gradeName) => {
    const gradeData = grades.find(g => g.name === gradeName);
    if (!gradeData) return 0;
    const gradeSections = gradeData.sections.map(s => s.id);
    return gradeSections.reduce((sum, sectionId) => sum + (docCountBySection[sectionId] || 0), 0);
  };

  const filteredDocuments = useMemo(() => {
    let docs;
    if (contentType === 'planifications') {
      docs = planningDocuments;
    } else if (contentType === 'sessions') {
      docs = learningSessions;
    } else {
      docs = myReports;
    }
    let filtered = docs || [];
    
    if (selectedSection) {
      filtered = filtered.filter(d => d.sections?.includes(selectedSection));
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        d.title?.toLowerCase().includes(term) || 
        d.description?.toLowerCase().includes(term)
      );
    }
    
    return filtered.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }, [planningDocuments, learningSessions, selectedSection, searchTerm, contentType]);

  const getSectionName = (sectionId) => {
    const cls = classes.find(c => c.id === sectionId);
    return cls?.name || 'Sección';
  };

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

  const handleDelete = (docId) => {
    if (window.confirm('¿Estás seguro de eliminar este documento?')) {
      if (contentType === 'planifications') {
        deletePlanningDocument(docId);
      } else {
        deleteLearningSession(docId);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Solo se permiten archivos PDF');
        return;
      }
      setUploadData({ ...uploadData, file, fileName: file.name });
    }
  };

  const handleUpload = () => {
    if (uploadData.sections.length === 0 || !uploadData.subjectId || !uploadData.title || !uploadData.file) {
      alert('Por favor completa todos los campos requeridos (selecciona al menos una sección)');
      return;
    }

    const firstClass = classes.find(c => uploadData.sections.includes(c.id));
    const gradeLevel = firstClass ? firstClass.name.split(' - ')[0] : '';

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const base64 = e.target.result;
        const docData = {
          gradeLevel,
          sections: uploadData.sections,
          subjectId: uploadData.subjectId,
          title: uploadData.title,
          description: uploadData.description,
          period: uploadData.period,
          fileData: base64,
          fileName: uploadData.fileName,
          uploadedBy: currentUser?.name || 'Usuario',
          uploadedById: currentUser?.id
        };

        if (contentType === 'planifications') {
          addPlanningDocument(docData);
        } else {
          addLearningSession(docData);
        }
        
        setShowUploadModal(false);
        setUploadData({
          gradeLevel: '',
          sections: [],
          subjectId: '',
          title: '',
          description: '',
          period: '2026',
          file: null,
          fileName: ''
        });
        alert(`${contentType === 'planifications' ? 'Planificación' : 'Sesión de Aprendizaje'} subida exitosamente`);
      } catch (err) {
        console.error('Error uploading:', err);
        alert('Error al subir el documento');
      }
    };
    reader.onerror = () => {
      alert('Error al leer el archivo');
    };
    reader.readAsDataURL(uploadData.file);
  };

  const DocIcon = useMemo(() => {
    return contentType === 'sessions' ? BookMarked : FileText;
  }, [contentType]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: '1.5rem', minHeight: 'calc(100vh - 140px)' }}>
      {/* Sidebar de navegación */}
      <div style={{
        width: '280px',
        flexShrink: 0,
        background: 'var(--bg-color-surface)',
        borderRadius: '12px',
        padding: '1.25rem',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          padding: '0.75rem',
          background: 'var(--surface-muted)',
          borderRadius: '10px',
          color: 'var(--text-primary)',
          marginBottom: '1rem'
        }}>
          <FolderOpen size={20} color="var(--text-secondary)" />
          <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>Navegador</span>
        </div>

        {/* Tipo de contenido */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            onClick={() => { setContentType('planifications'); setSelectedSection(null); }}
            style={{
              flex: 1,
              padding: '0.6rem 0.5rem',
              borderRadius: '10px',
              border: contentType === 'planifications' ? '1px solid var(--nav-active-fg)' : '1px solid transparent',
              background: contentType === 'planifications' ? 'var(--nav-active-bg)' : 'var(--surface-muted)',
              color: contentType === 'planifications' ? 'var(--nav-active-fg)' : 'var(--text-secondary)',
              fontWeight: 500,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <FileText size={16} />
            Planificaciones
          </button>
          <button
            onClick={() => { setContentType('sessions'); setSelectedSection(null); }}
            style={{
              flex: 1,
              padding: '0.6rem 0.5rem',
              borderRadius: '10px',
              border: contentType === 'sessions' ? '1px solid var(--nav-active-fg)' : '1px solid transparent',
              background: contentType === 'sessions' ? 'var(--nav-active-bg)' : 'var(--surface-muted)',
              color: contentType === 'sessions' ? 'var(--nav-active-fg)' : 'var(--text-secondary)',
              fontWeight: 500,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <BookMarked size={16} />
            Sesiones
          </button>
          <button
            onClick={() => { setContentType('reports'); setSelectedSection(null); }}
            style={{
              flex: 1,
              padding: '0.6rem 0.5rem',
              borderRadius: '10px',
              border: contentType === 'reports' ? '1px solid var(--nav-active-fg)' : '1px solid transparent',
              background: contentType === 'reports' ? 'var(--nav-active-bg)' : 'var(--surface-muted)',
              color: contentType === 'reports' ? 'var(--nav-active-fg)' : 'var(--text-secondary)',
              fontWeight: 500,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <FileText size={16} />
            Informes
          </button>
        </div>

        {/* Ver todo */}
        <button
          onClick={() => setSelectedSection(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            borderRadius: '10px',
            border: !selectedSection ? '1px solid var(--nav-active-fg)' : '1px solid var(--border-color)',
            background: !selectedSection ? 'var(--nav-active-bg)' : 'var(--bg-color-surface)',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            marginBottom: '0.75rem'
          }}
        >
          <LayoutGrid size={18} color={!selectedSection ? 'var(--nav-active-fg)' : 'var(--text-secondary)'} />
          <span style={{ fontWeight: !selectedSection ? 600 : 500, color: !selectedSection ? 'var(--nav-active-fg)' : 'var(--text-primary)', fontSize: '0.9rem' }}>
            Ver Todo
          </span>
        </button>

        {/* Lista de grados y secciones o Docentes según el tipo */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {contentType === 'reports' ? (
            isAdmin ? (
              <>
                <button
                  onClick={() => setSelectedTeacherId(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: !selectedTeacherId ? '1px solid var(--nav-active-fg)' : '1px solid var(--border-color)',
                    background: !selectedTeacherId ? 'var(--nav-active-bg)' : 'var(--bg-color-surface)',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    marginBottom: '0.5rem'
                  }}
                >
                  <Users size={18} color={!selectedTeacherId ? 'var(--nav-active-fg)' : 'var(--text-secondary)'} />
                  <span style={{ fontWeight: !selectedTeacherId ? 600 : 500, color: !selectedTeacherId ? 'var(--nav-active-fg)' : 'var(--text-primary)', fontSize: '0.9rem' }}>
                    Todos los Docentes
                  </span>
                  <span style={{ marginLeft: 'auto', background: 'var(--surface-muted)', padding: '0.2rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                    {reportFiles.length}
                  </span>
                </button>
                {teachers.map(teacher => (
                  <button
                    key={teacher.id}
                    onClick={() => setSelectedTeacherId(teacher.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '10px',
                      border: selectedTeacherId === teacher.id ? '1px solid var(--nav-active-fg)' : '1px solid var(--border-color)',
                      background: selectedTeacherId === teacher.id ? 'var(--nav-active-bg)' : 'var(--bg-color-surface)',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      marginBottom: '0.25rem'
                    }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserCheck size={16} color="var(--text-secondary)" />
                    </div>
                    <span style={{ fontWeight: selectedTeacherId === teacher.id ? 600 : 400, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                      {teacher.name}
                    </span>
                    <span style={{ marginLeft: 'auto', background: 'var(--surface-muted)', padding: '0.2rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                      {teacher.count}
                    </span>
                  </button>
                ))}
              </>
            ) : (
              <button
                onClick={() => setSelectedTeacherId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: !selectedTeacherId ? '1px solid var(--nav-active-fg)' : '1px solid var(--border-color)',
                  background: !selectedTeacherId ? 'var(--nav-active-bg)' : 'var(--bg-color-surface)',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  marginBottom: '0.5rem'
                }}
              >
                <FileText size={18} color={!selectedTeacherId ? 'var(--nav-active-fg)' : 'var(--text-secondary)'} />
                <span style={{ fontWeight: !selectedTeacherId ? 600 : 500, color: !selectedTeacherId ? 'var(--nav-active-fg)' : 'var(--text-primary)', fontSize: '0.9rem' }}>
                  Mis Informes
                </span>
                <span style={{ marginLeft: 'auto', background: 'var(--surface-muted)', padding: '0.2rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                  {myReports.length}
                </span>
              </button>
            )
          ) : (
            grades.map((grade, idx) => {
              const isGradeExpanded = selectedGrade === grade.name;
              const hasSelectedChild = grade.sections.some(s => s.id === selectedSection);
              
              return (
                <div key={grade.name} style={{ marginBottom: '0.5rem' }}>
                  <button
                    onClick={() => setSelectedGrade(isGradeExpanded ? null : grade.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: hasSelectedChild || isGradeExpanded ? 'var(--surface-muted)' : 'transparent',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left'
                    }}
                  >
                    {isGradeExpanded ? (
                      <ChevronDown size={16} color="var(--text-secondary)" />
                    ) : (
                      <ChevronRight size={16} color="var(--text-secondary)" />
                    )}
                    <Folder size={18} color="var(--text-secondary)" />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                      {grade.name}
                    </span>
                    <span style={{ 
                      marginLeft: 'auto', 
                      background: 'var(--bg-color-surface)', 
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)', 
                      fontSize: '0.7rem', 
                      padding: '0.15rem 0.4rem', 
                      borderRadius: '8px',
                      fontWeight: 600
                    }}>
                      {getDocCountForGrade(grade.name)}
                    </span>
                  </button>
                  
                  {isGradeExpanded && (
                    <div style={{ paddingLeft: '1.5rem', marginTop: '0.25rem' }}>
                      {grade.sections.map(section => (
                        <button
                          key={section.id}
                          onClick={() => setSelectedSection(section.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.6rem',
                            borderRadius: '8px',
                            border: selectedSection === section.id ? `2px solid ${section.color}` : '1px solid transparent',
                            background: selectedSection === section.id ? `${section.color}15` : 'transparent',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                            marginBottom: '0.25rem'
                          }}
                        >
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: section.color
                          }} />
                          <span style={{ 
                            fontWeight: selectedSection === section.id ? 600 : 400, 
                            color: 'var(--text-secondary)',
                            fontSize: '0.8rem'
                          }}>
                            {section.name.split(' - ')[1] || section.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Botón agregar */}
        {currentUser && (
          <button 
            onClick={() => {
              if (contentType === 'reports') {
                setShowReportsModal(true);
              } else {
                setShowUploadModal(true);
              }
            }}
            className="btn-primary"
            style={{
              marginTop: 'auto',
              padding: '0.7rem',
              borderRadius: '20px',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus size={18} /> Subir {contentType === 'planifications' ? 'Planificación' : contentType === 'sessions' ? 'Sesión' : 'Informe'}
          </button>
        )}
      </div>

      {/* Contenido principal */}
      <div style={{ flex: 1, width: contentType === 'reports' ? '100%' : 'auto' }}>
        {/* Barra de herramientas */}
        <div style={{
          background: 'var(--bg-color-surface)',
          borderRadius: '12px',
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 400, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {contentType === 'planifications' ? 'Planificaciones' : contentType === 'sessions' ? 'Sesiones de Aprendizaje' : 'Informes'}
            </h2>
            <p style={{ fontSize: '0.85rem', margin: '0.15rem 0 0 0', color: 'var(--text-secondary)' }}>
              {selectedSection 
                ? `Ver documentos de ${getSectionName(selectedSection)}` 
                : 'Gestiona los documentos de planificación y sesiones'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.55rem 1rem 0.55rem 2.5rem',
                  borderRadius: '20px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface-muted)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  width: '180px',
                  outline: 'none'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', background: 'var(--surface-muted)', borderRadius: '20px', padding: '0.25rem', border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '16px',
                  border: 'none',
                  background: viewMode === 'grid' ? 'var(--bg-color-surface)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '16px',
                  border: 'none',
                  background: viewMode === 'list' ? 'var(--bg-color-surface)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        <AIPlanningGenerator />

        {/* Contenido */}
        {filteredDocuments.length === 0 ? (
          <div style={{
            background: 'var(--surface-muted)',
            borderRadius: '12px',
            padding: '4rem 2rem',
            textAlign: 'center',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'var(--bg-color-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <DocIcon size={40} color="var(--text-secondary)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {searchTerm ? 'No se encontraron resultados' : `Aún no hay ${contentType === 'planifications' ? 'planificaciones' : 'sesiones de aprendizaje'}`}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>
              {isAdmin 
                ? `Sube la primera ${contentType === 'planifications' ? 'planificación' : 'sesión de aprendizaje'} para este grado.`
                : `No hay documentos cargados aún.`}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {filteredDocuments.map((doc, idx) => {
              const sectionId = doc.sections?.[0];
              const section = classes.find(c => c.id === sectionId);
              
              return (
                <div key={doc.id} style={{
                  background: 'var(--bg-color-surface)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid var(--border-color)',
                  transition: 'box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: 'var(--nav-active-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <DocIcon size={22} color="var(--nav-active-fg)" />
                    </div>
                    {(isAdmin || doc.uploadedById === currentUser?.id || doc.uploadedBy === currentUser?.name || doc.uploaded_by === currentUser?.name || (!doc.uploadedById && !doc.uploadedBy && !doc.uploaded_by)) && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        style={{
                          background: 'var(--danger-tint-bg)',
                          border: '1px solid transparent',
                          borderRadius: '8px',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          color: 'var(--danger-tint-fg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <h3 style={{ fontWeight: 500, fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    {doc.title}
                  </h3>
                  
                  {doc.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                      {doc.description}
                    </p>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <GraduationCap size={14} />
                      <span>{getGradeDisplay(doc)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <BookOpen size={14} />
                      <span>{getSubjectName(doc.subjectId)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <Calendar size={14} />
                      <span>{doc.period}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => openDoc(doc)}
                      className="btn-primary"
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.55rem',
                        borderRadius: '20px',
                        fontSize: '0.85rem'
                      }}
                    >
                      <Eye size={16} /> Ver
                    </button>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); downloadDoc(doc); }}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.55rem',
                        background: 'var(--bg-color-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '20px',
                        color: 'var(--accent-primary)',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        textDecoration: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Download size={16} /> Descargar
                    </a>
                  </div>
                  
                  <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                    {formatDate(doc.uploadedAt)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredDocuments.map((doc, idx) => {
              const sectionId = doc.sections?.[0];
              const section = classes.find(c => c.id === sectionId);
              
              return (
                <div key={doc.id} style={{
                  background: 'var(--bg-color-surface)',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'var(--nav-active-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <DocIcon size={20} color="var(--nav-active-fg)" />
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: 500, fontSize: '0.95rem', margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {doc.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      <span>{getGradeDisplay(doc)}</span>
                      <span>{getSubjectName(doc.subjectId)}</span>
                      <span>{doc.period}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      onClick={() => openDoc(doc)}
                      style={{
                        padding: '0.5rem',
                        background: 'var(--nav-active-bg)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: 'var(--nav-active-fg)'
                      }}
                      title="Ver"
                    >
                      <Eye size={16} />
                    </button>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); downloadDoc(doc); }}
                      style={{
                        padding: '0.5rem',
                        background: 'var(--bg-color-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none'
                      }}
                      title="Descargar"
                    >
                      <Download size={16} />
                    </a>
                    {(isAdmin || doc.uploadedById === currentUser?.id || doc.uploadedBy === currentUser?.name || doc.uploaded_by === currentUser?.name || (!doc.uploadedById && !doc.uploadedBy && !doc.uploaded_by)) && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        style={{
                          padding: '0.5rem',
                          background: 'var(--danger-tint-bg)',
                          border: '1px solid transparent',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: 'var(--danger-tint-fg)'
                        }}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
)}
      </div>

      {/* Modal de informes */}
      {showReportsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          padding: '4rem 1rem', zIndex: 1000, overflowY: 'auto'
        }}>
          <div style={{
            maxWidth: '500px', width: '100%',
            background: 'var(--bg-color-surface)', borderRadius: '16px', padding: '2rem',
            border: '1px solid var(--border-color)',
            position: 'relative'
          }}>


            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'var(--nav-active-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Briefcase size={20} color="var(--nav-active-fg)" />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
                  Subir Informe
                </h3>
              </div>
              <button onClick={() => setShowReportsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                <X size={24} color="var(--text-secondary)" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Título del Informe</label>
                <input 
                  type="text" 
                  className="input-field"
                  placeholder="Ej: Informe de Gestión - Abril 2026"
                  onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Descripción</label>
                <textarea 
                  className="input-field"
                  rows={3}
                  placeholder="Breve descripción del informe..."
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Adjuntar Archivo</label>
                <input 
                  type="file" 
                  id="reportFileInput"
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const newReport = {
                          id: Date.now().toString(),
                          title: uploadData.title || 'Sin título',
                          description: uploadData.description || '',
                          fileName: file.name,
                          fileData: event.target?.result,
                          teacherId: currentUser?.id || currentUser?.username || 'admin',
                          teacherName: currentUser?.name || currentUser?.username || 'Admin',
                          uploadedAt: new Date().toISOString()
                        };
                        setReportFiles([...reportFiles, newReport]);
                        setShowReportsModal(false);
                        setUploadData({...uploadData, title: '', description: ''});
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <div 
                  onClick={() => document.getElementById('reportFileInput')?.click()}
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: '12px',
                    padding: '2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <Upload size={32} color="var(--text-secondary)" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Haz clic para seleccionar archivo</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>PDF, Word, Excel (máx. 10MB)</p>
                </div>
              </div>

              <button 
                className="btn-primary"
                style={{
                  padding: '0.7rem',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  marginTop: '1rem'
                }}
              >
                Subir Informe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
              );
            })}
          </div>
        )}
      </div>

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
            background: 'var(--bg-color-surface)', borderRadius: '16px', padding: '2rem',
            border: '1px solid var(--border-color)',
            position: 'relative'
          }} className="animate-fade-in">

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'var(--nav-active-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Upload size={20} color="var(--nav-active-fg)" />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
                  Subir {contentType === 'planifications' ? 'Planificación' : 'Sesión'}
                </h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                <X size={24} color="var(--text-secondary)" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Título *</label>
                <input 
                  type="text"
                  className="input-field"
                  placeholder={contentType === 'planifications' ? "Ej. Planificación Mensual - Marzo 2026" : "Ej. Sesión 1: Introducción a..."}
                  value={uploadData.title}
                  onChange={e => setUploadData({ ...uploadData, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Selecciona las secciones * (clic para seleccionar varias)
                </label>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '0.4rem',
                  marginBottom: '0.5rem',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  background: 'var(--surface-muted)'
                }}>
                  {classes.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map(cls => {
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
                          padding: '0.35rem 0.6rem',
                          borderRadius: '20px',
                          border: isSelected ? 'none' : '1px solid var(--border-color)',
                          background: isSelected ? cls.color : 'var(--bg-color-surface)',
                          color: isSelected ? 'white' : 'var(--text-primary)',
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          outline: isSelected ? `2px solid ${cls.color}80` : 'none'
                        }}
                      >
                        {cls.name}
                      </button>
                    );
                  })}
                </div>
                {uploadData.sections.length === 0 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--danger-color)', marginTop: '0.25rem' }}>
                    ⚠️ Selecciona al menos una sección
                  </p>
                )}
                {uploadData.sections.length > 0 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--success-color)', marginTop: '0.25rem' }}>
                    ✓ {uploadData.sections.length} sección(es) seleccionada(s)
                  </p>
                )}
              </div>

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
                    border: '1px dashed var(--border-color)', 
                    borderRadius: '8px',
                    width: '100%'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Descripción (opcional)</label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Descripción breve del contenido..."
                  value={uploadData.description}
                  onChange={e => setUploadData({ ...uploadData, description: e.target.value })}
                />
              </div>

              {uploadData.fileName && (
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem',
                  background: 'var(--surface-muted)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  color: 'var(--success-color)'
                }}>
                  <FileText size={18} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{uploadData.fileName}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  style={{ 
                    flex: 1, padding: '0.6rem', borderRadius: '20px',
                    background: 'var(--bg-color-surface)', color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem'
                  }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleUpload}
                  className="btn-primary"
                  style={{ 
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    borderRadius: '20px', padding: '0.6rem', fontSize: '0.875rem'
                  }}
                >
                  <Upload size={18} /> Subir
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
            background: 'var(--bg-color-surface)', borderRadius: '24px',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden'
          }} className="animate-fade-in">
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{viewingDoc.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                  {getSectionName(viewingDoc.sections?.[0])} - {getSubjectName(viewingDoc.subjectId)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); downloadDoc(viewingDoc); }}
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    textDecoration: 'none'
                  }}
                >
                  <Download size={16} /> Descargar
                </a>
                <button 
                  onClick={() => setViewingDoc(null)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--bg-color-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '20px',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-muted)' }}>
              {(viewingDoc.fileData && (viewingDoc.fileName?.toLowerCase().endsWith('.pdf'))) ? (
                <iframe
                  src={viewingDoc.fileData}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title={viewingDoc.title}
                />
              ) : viewingDoc.fileData ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  <FileText size={64} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.95rem', marginBottom: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {viewingDoc.fileName || 'Documento'}
                  </p>
                  <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Este tipo de archivo no puede previsualizarse en el navegador. Descárgalo para verlo en Word o Excel.
                  </p>
                  <button
                    onClick={() => downloadDoc(viewingDoc)}
                    className="btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.4rem', borderRadius: '20px', fontSize: '0.9rem', cursor: 'pointer' }}
                  >
                    <Download size={16} /> Descargar {viewingDoc.fileName || ''}
                  </button>
                </div>
              ) : docFileLoading ? (
                <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Cargando archivo...</p>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>El archivo no está disponible. Intenta descargarlo.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
  } catch (err) {
    console.error('PlanningDocuments error:', err);
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Error al cargar planificación: {err.message}</p>
      </div>
    );
  }
}