import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Trash2, Upload, FileText, X, Download, Eye, Search, FolderOpen, Calendar, BookOpen, GraduationCap, ChevronRight, ChevronDown, Folder, File, LayoutGrid, List, Tag, Clipboard, BookMarked, AlertCircle, Briefcase, Users, UserCheck } from 'lucide-react';
import AIPlanningGenerator from '../components/AIPlanningGenerator';

export default function PlanningDocuments() {
  try {
    const { classes = [], subjects = [], planningDocuments = [], learningSessions = [], addPlanningDocument, addLearningSession, deletePlanningDocument, deleteLearningSession, isAdmin, currentUser } = useStore();
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
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

  const gradientColors = [
    ['#3b82f6', '#2563eb'],
    ['#10b981', '#059669'],
    ['#f59e0b', '#d97706'],
    ['#ef4444', '#dc2626'],
    ['#8b5cf6', '#7c3aed'],
    ['#ec4899', '#db2777']
  ];

  const DocIcon = useMemo(() => {
    return contentType === 'sessions' ? BookMarked : FileText;
  }, [contentType]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: '1.5rem', minHeight: 'calc(100vh - 140px)' }}>
      {/* Sidebar de navegación - oculto para informes */}
      {!isAdmin && contentType === 'reports' ? null : (
      <div style={{
        width: '280px',
        flexShrink: 0,
        background: 'white',
        borderRadius: '20px',
        padding: '1.25rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          padding: '0.75rem',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: '14px',
          color: 'white',
          marginBottom: '1rem'
        }}>
          <FolderOpen size={22} />
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Navegador</span>
        </div>

        {/* Tipo de contenido */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            onClick={() => { setContentType('planifications'); setSelectedSection(null); }}
            style={{
              flex: 1,
              padding: '0.6rem 0.5rem',
              borderRadius: '10px',
              border: 'none',
              background: contentType === 'planifications' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#f1f5f9',
              color: contentType === 'planifications' ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
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
              border: 'none',
              background: contentType === 'sessions' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#f1f5f9',
              color: contentType === 'sessions' ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
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
              border: 'none',
              background: contentType === 'reports' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#f1f5f9',
              color: contentType === 'reports' ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
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
            borderRadius: '12px',
            border: !selectedSection ? '2px solid #f59e0b' : '1px solid #e2e8f0',
            background: !selectedSection ? '#fef3c7' : 'white',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            marginBottom: '0.75rem'
          }}
        >
          <LayoutGrid size={18} color={!selectedSection ? '#d97706' : '#64748b'} />
          <span style={{ fontWeight: !selectedSection ? 700 : 500, color: !selectedSection ? '#d97706' : 'var(--text-primary)', fontSize: '0.9rem' }}>
            Ver Todo
          </span>
        </button>

        {/* Lista de grados y secciones */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {grades.map((grade, idx) => {
            const gradeColor = gradientColors[idx % gradientColors.length];
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
                    background: hasSelectedChild || isGradeExpanded ? `${gradeColor[0]}15` : 'transparent',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  {isGradeExpanded ? (
                    <ChevronDown size={16} color={gradeColor[0]} />
                  ) : (
                    <ChevronRight size={16} color={gradeColor[0]} />
                  )}
                  <Folder size={18} color={gradeColor[0]} />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                    {grade.name}
                  </span>
                  <span style={{ 
                    marginLeft: 'auto', 
                    background: gradeColor[0], 
                    color: 'white', 
                    fontSize: '0.7rem', 
                    padding: '0.15rem 0.4rem', 
                    borderRadius: '6px',
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
          })}
        </div>

        {/* Lista de docentes para informes */}
        {contentType === 'reports' && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              DOCENTES
            </p>
            <button
              onClick={() => setSelectedTeacherId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: '12px',
                border: !selectedTeacherId ? '2px solid #ef4444' : '1px solid #e2e8f0',
                background: !selectedTeacherId ? '#fef2f2' : 'white',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                marginBottom: '0.5rem'
              }}
            >
              <Users size={18} color={!selectedTeacherId ? '#ef4444' : '#64748b'} />
              <span style={{ fontWeight: !selectedTeacherId ? 700 : 500, color: !selectedTeacherId ? '#ef4444' : 'var(--text-primary)', fontSize: '0.9rem' }}>
                Todos los Docentes
              </span>
              <span style={{ marginLeft: 'auto', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem' }}>
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
                  border: selectedTeacherId === teacher.id ? '2px solid #ef4444' : '1px solid #e2e8f0',
                  background: selectedTeacherId === teacher.id ? '#fef2f2' : 'white',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  marginBottom: '0.25rem'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ef444420', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={16} color="#ef4444" />
                </div>
                <span style={{ fontWeight: selectedTeacherId === teacher.id ? 600 : 400, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                  {teacher.name}
                </span>
                <span style={{ marginLeft: 'auto', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                  {teacher.count}
                </span>
              </button>
            ))}
          </div>
        )}

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
            style={{
              marginTop: 'auto',
              background: contentType === 'reports' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              border: 'none',
              padding: '0.9rem',
              borderRadius: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
            }}
          >
            <Plus size={18} /> Subir {contentType === 'planifications' ? 'Planificación' : contentType === 'sessions' ? 'Sesión' : 'Informe'}
</button>
        )}
      </div>
      )}

      {/* Contenido principal */}
      <div style={{ flex: 1, width: contentType === 'reports' ? '100%' : 'auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #fbbf24 100%)',
          borderRadius: '20px',
          padding: '1.5rem 2rem',
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
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                {contentType === 'planifications' ? <FileText size={24} /> : <BookMarked size={24} />}
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                  {contentType === 'planifications' ? 'Planificaciones' : 'Sesiones de Aprendizaje'}
                </h2>
                <p style={{ opacity: 0.9, fontSize: '0.85rem', margin: 0 }}>
                  {selectedSection 
                    ? `Ver documentos de ${getSectionName(selectedSection)}` 
                    : 'Gestiona los documentos de planificación y sesiones'}
                </p>
              </div>
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
                    padding: '0.6rem 1rem 0.6rem 2.5rem',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.9rem',
                    width: '180px',
                    outline: 'none'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '0.25rem' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: viewMode === 'grid' ? 'white' : 'transparent',
                    color: viewMode === 'grid' ? '#d97706' : 'rgba(255,255,255,0.8)',
                    cursor: 'pointer'
                  }}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: viewMode === 'list' ? 'white' : 'transparent',
                    color: viewMode === 'list' ? '#d97706' : 'rgba(255,255,255,0.8)',
                    cursor: 'pointer'
                  }}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <AIPlanningGenerator />

        {/* Contenido */}
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
              <DocIcon size={40} color="white" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {searchTerm ? 'No se encontraron resultados' : `No hay ${contentType === 'planifications' ? 'planificaciones' : 'sesiones de aprendizaje'} yet`}
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
              const [color1, color2] = gradientColors[idx % gradientColors.length];
              const sectionId = doc.sections?.[0];
              const section = classes.find(c => c.id === sectionId);
              
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
                      <DocIcon size={24} color="white" />
                    </div>
                    {(isAdmin || doc.uploadedById === currentUser?.id || doc.uploadedBy === currentUser?.name || doc.uploaded_by === currentUser?.name || (!doc.uploadedById && !doc.uploadedBy && !doc.uploaded_by)) && (
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
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
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
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                        cursor: 'pointer'
                      }}
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
              const [color1, color2] = gradientColors[idx % gradientColors.length];
              const sectionId = doc.sections?.[0];
              const section = classes.find(c => c.id === sectionId);
              
              return (
                <div key={doc.id} style={{
                  background: 'white',
                  borderRadius: '14px',
                  padding: '1rem 1.25rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                  border: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = color1; e.currentTarget.style.boxShadow = `0 4px 15px ${color1}20`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)'; }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${color1}, ${color2})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <DocIcon size={20} color="white" />
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                      onClick={() => setViewingDoc(doc)}
                      style={{
                        padding: '0.5rem',
                        background: `${color1}15`,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: color1
                      }}
                    >
                      <Eye size={16} />
                    </button>
                    <a
                      href={doc.fileData}
                      download={doc.fileName || 'documento.pdf'}
                      style={{
                        padding: '0.5rem',
                        background: 'white',
                        border: `1px solid ${color1}`,
                        borderRadius: '8px',
                        color: color1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none'
                      }}
                    >
                      <Download size={16} />
                    </a>
                    {(isAdmin || doc.uploadedById === currentUser?.id || doc.uploadedBy === currentUser?.name || doc.uploaded_by === currentUser?.name || (!doc.uploadedById && !doc.uploadedBy && !doc.uploaded_by)) && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: '#ef4444'
                        }}
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
            background: 'white', borderRadius: '24px', padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative'
          }}>
            <div style={{ 
              position: 'absolute', top: '-30%', right: '-10%',
              width: '150px', height: '150px',
              background: 'linear-gradient(135deg, #ef444420, #dc262620)',
              borderRadius: '50%'
            }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Briefcase size={24} color="white" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
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
                    border: '2px dashed #e2e8f0',
                    borderRadius: '12px',
                    padding: '2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <Upload size={32} color="var(--text-secondary)" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Haz clic para seleccionar archivo</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>PDF, Word, Excel (máx. 10MB)</p>
                </div>
              </div>

              <button 
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  border: 'none',
                  padding: '1rem',
                  borderRadius: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
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
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
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
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  background: '#f8fafc'
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
                          border: isSelected ? 'none' : '1px solid #cbd5e1',
                          background: isSelected ? cls.color : 'white',
                          color: isSelected ? 'white' : 'var(--text-primary)',
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? `0 2px 6px ${cls.color}40` : 'none',
                          outline: isSelected ? `2px solid ${cls.color}80` : 'none'
                        }}
                      >
                        {cls.name}
                      </button>
                    );
                  })}
                </div>
                {uploadData.sections.length === 0 && (
                  <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>
                    ⚠️ Selecciona al menos una sección
                  </p>
                )}
                {uploadData.sections.length > 0 && (
                  <p style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>
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
                  {getSectionName(viewingDoc.sections?.[0])} - {getSubjectName(viewingDoc.subjectId)}
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
  } catch (err) {
    console.error('PlanningDocuments error:', err);
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Error al cargar planificación: {err.message}</p>
      </div>
    );
  }
}