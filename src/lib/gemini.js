const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `Eres un experto en planificación educativa para el currículo nacional de la Educación Básica del Perú (CNEB). Genera sesiones de aprendizaje detalladas siguiendo el formato oficial del MINEDU.

Responde ÚNICAMENTE con JSON válido en este formato exacto, sin texto adicional:

{
  "titulo": "Título de la sesión de aprendizaje",
  "numeroSesion": "N° XX",
  
  "datosInformativos": {
    "area": "Área curricular (ej: CIENCIA Y TECNOLOGÍA, MATEMÁTICA, COMUNICACIÓN, etc.)",
    "gradoSeccion": "Grado y sección (ej: 1° A-B, 2° A, 5° A-B-C)",
    "enfoqueArea": "Enfoque del área (ej: ALFABETIZACIÓN CIENTÍFICA Y TECNOLÓGICA, COMUNICACIÓN, etc.)",
    "fecha": "Fechas de ejecución (ej: 15/04/2026 - 16/04/2026)",
    "unidadAprendizaje": "Nombre de la unidad de aprendizaje",
    "docente": "Nombre del docente",
    "docentePracticante": "Nombre del docente practicante (si aplica)"
  },
  
  "propositos": {
    "competencias": [
      {
        "competencia": "Nombre de la competencia del CNEB",
        "capacidades": ["Capacidad 1", "Capacidad 2"],
        "desempenos": "Descripción del desempeño esperado"
      }
    ],
    "propositoAprendizaje": "Descripción del propósito de aprendizaje",
    "enfoquesTransversales": [
      {
        "enfoque": "Nombre del enfoque",
        "valor": "Valor asociado",
        "actitud": "Actitud observable"
      }
    ]
  },
  
  "secuenciaDidactica": {
    "inicio": {
      "duracion": "15 minutos",
      "momentos": {
        "motivacion": "Actividades de motivación",
        "saberesPrevios": "Activación de saberes previos",
        "problematizacion": "Situación problematizadora",
        "proposito": "Comunicación del propósito y criterios"
      },
      "descripcion": "Descripción detallada de las actividades de inicio"
    },
    "desarrollo": {
      "duracion": "70 minutos",
      "momentos": {
        "construccionSaberes": "Estrategias para construcción del conocimiento",
        "aplicacion": "Actividades de aplicación práctica"
      },
      "actividades": [
        "Planteamiento del problema",
        "Planteamiento de hipótesis", 
        "Elaboración del plan de acción",
        "Recojo de datos y análisis de resultados",
        "Estructuración del saber construido",
        "Evaluación y comunicación"
      ],
      "descripcion": "Descripción detallada del proceso de desarrollo"
    },
    "cierre": {
      "duracion": "5 minutos",
      "momentos": {
        "conclusiones": "Elaboración de conclusiones",
        "metacognicion": "Reflexión sobre el aprendizaje"
      },
      "preguntasMetacognitivas": [
        "¿Qué aprendiste?",
        "¿Cómo te sentiste?",
        "¿Para qué te sirve lo aprendido?",
        "¿Qué dificultades tuviste y cómo las superaste?",
        "¿Cómo lo aplicarás en tu vida cotidiana?"
      ],
      "descripcion": "Descripción del cierre y metacognición"
    }
  },
  
  "evaluacion": {
    "competencias": [
      {
        "competencia": "Competencia evaluada",
        "desempeno": "Desempeño específico",
        "evidencia": "Evidencia de aprendizaje (ej: Ficha de ejercicios, mapa conceptual, etc.)",
        "instrumento": "Instrumento (ej: Lista de cotejo, Rúbrica, etc.)"
      }
    ]
  },
  
  "recursosMateriales": {
    "recursos": ["Libro, texto escolar, etc."],
    "materiales": ["Hojas impresas, lápices, plumones, etc."]
  },
  
  "fechaElaboracion": "Fecha de elaboración de la sesión"
}`;

export async function generateLessonPlan({ 
  subject, 
  grade, 
  topic, 
  duration = 90, 
  period = '2026',
  sessionNumber = '01',
  learningUnit = '',
  teacher = '',
  internTeacher = ''
}) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('API key de Gemini no configurada. Agrega VITE_GEMINI_API_KEY en tu archivo .env');
  }

  const userPrompt = `Genera una SESIÓN DE APRENDIZAJE siguiendo el formato del MINEDU para la Educación Básica del Perú.

  Datos:
  - Número de sesión: ${sessionNumber}
  - Área curricular: ${subject}
  - Grado y sección: ${grade}
  - Tema: ${topic}
  - Duración total: ${duration} minutos (distribuidos: Inicio 15 min, Desarrollo 70 min, Cierre 5 min)
  - Unidad de aprendizaje: ${learningUnit || 'Se determinará según el contexto'}
  - Docente: ${teacher || 'Por definir'}
  - Docente practicante: ${internTeacher || 'Por definir'}
  - Periodo: ${period}

  IMPORTANTE: 
  - Las competencias y capacidades deben estar basadas en el Currículo Nacional de la Educación Básica (CNEB) del Perú.
  - Los desempeños deben ser específicos y observables.
  - La secuencia didáctica debe seguir el enfoque de indagación (método científico).
  - Incluir situaciones problémicas contextualizadas al entorno peruano.
  - La evaluación debe incluir competencias, desempeños, evidencias e instrumentos.

  Responde solo con JSON válido siguiendo el formato especificado.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
          { role: 'model', parts: [{ text: 'Entendido, generaré planes de clase en el formato JSON solicitado.' }] },
          { role: 'user', parts: [{ text: userPrompt }] }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Error API: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('Respuesta vacía de la API');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo parsear la respuesta como JSON');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    if (error.message.includes('API key') || error.message.includes('fetch')) {
      throw error;
    }
    throw new Error(`Error generando plan: ${error.message}`);
  }
}

export function formatLessonPlanAsText(plan) {
  const d = plan.datosInformativos || {};
  const p = plan.propositos || {};
  const s = plan.secuenciaDidactica || {};
  const e = plan.evaluacion || {};
  const r = plan.recursosMateriales || {};

  let text = '';
  text += `SESIÓN DE APRENDIZAJE ${plan.numeroSesion || 'N° XX'}\n`;
  text += `${plan.titulo}\n`;
  text += `${'═'.repeat(60)}\n\n`;

  text += `I. DATOS INFORMATIVOS\n`;
  text += `${'─'.repeat(40)}\n`;
  text += `ÁREA\t\t${d.area || '-'}\n`;
  text += `GRADO Y SECCIÓN\t${d.gradoSeccion || '-'}\n`;
  text += `ENFOQUE DEL ÁREA\t${d.enfoqueArea || '-'}\n`;
  text += `FECHA\t\t${d.fecha || '-'}\n`;
  text += `UNIDAD DE APRENDIZAJE\t${d.unidadAprendizaje || '-'}\n`;
  text += `DOCENTE\t\t${d.docente || '-'}\n`;
  text += `DOCENTE PRACTICANTE\t${d.docentePracticante || '-'}\n\n`;

  text += `II. PROPÓSITOS DE APRENDIZAJE / APRENDIZAJES ESPERADOS\n`;
  text += `${'─'.repeat(40)}\n\n`;

  if (p.competencias && p.competencias.length > 0) {
    text += `COMPETENCIAS\t\t\t\t\tCAPACIDADES\t\t\t\tDESEMPEÑOS\n`;
    text += `${'─'.repeat(80)}\n`;
    p.competencias.forEach(comp => {
      text += `${comp.competencia || '-'}\n`;
      text += `\t\t\t\t\t${(comp.capacidades || []).join(', ')}\n`;
      text += `\t\t\t\t\t${comp.desempenos || '-'}\n\n`;
    });
  }

  text += `PROPÓSITO DE APRENDIZAJE\n${p.propositoAprendizaje || '-'}\n\n`;

  if (p.enfoquesTransversales && p.enfoquesTransversales.length > 0) {
    text += `ENFOQUES TRANSVERSALES\t\tVALORES\t\t\t\tACTITUDES\n`;
    text += `${'─'.repeat(60)}\n`;
    p.enfoquesTransversales.forEach(enf => {
      text += `${enf.enfoque || '-'}\t\t${enf.valor || '-'}\t\t${enf.actitud || '-'}\n`;
    });
    text += `\n`;
  }

  text += `III. PROCESOS PEDAGÓGICOS Y PROCESOS DIDÁCTICOS\n`;
  text += `${'─'.repeat(40)}\n\n`;

  text += `🚀 INICIO (${s.inicio?.duracion || '15 minutos'})\n`;
  text += `${'─'.repeat(30)}\n`;
  if (s.inicio?.momentos) {
    text += `MOTIVACIÓN:\n${s.inicio.momentos.motivacion || '-'}\n\n`;
    text += `SABERES PREVIOS:\n${s.inicio.momentos.saberesPrevios || '-'}\n\n`;
    text += `PROBLEMATIZACIÓN:\n${s.inicio.momentos.problematizacion || '-'}\n\n`;
    text += `PROPÓSITO:\n${s.inicio.momentos.proposito || '-'}\n\n`;
  }
  text += `${s.inicio?.descripcion || ''}\n\n`;

  text += `📖 DESARROLLO (${s.desarrollo?.duracion || '70 minutos'})\n`;
  text += `${'─'.repeat(30)}\n`;
  if (s.desarrollo?.momentos) {
    text += `CONSTRUCCIÓN DE SABERES:\n${s.desarrollo.momentos.construccionSaberes || '-'}\n\n`;
    text += `APLICACIÓN:\n${s.desarrollo.momentos.aplicacion || '-'}\n\n`;
  }
  if (s.desarrollo?.actividades && s.desarrollo.actividades.length > 0) {
    text += `ACTIVIDADES:\n`;
    s.desarrollo.actividades.forEach((act, i) => {
      text += `${i + 1}. ${act}\n`;
    });
    text += `\n`;
  }
  text += `${s.desarrollo?.descripcion || ''}\n\n`;

  text += `🔚 CIERRE (${s.cierre?.duracion || '5 minutos'})\n`;
  text += `${'─'.repeat(30)}\n`;
  if (s.cierre?.momentos) {
    text += `CONCLUSIONES:\n${s.cierre.momentos.conclusiones || '-'}\n\n`;
    text += `METACOGNICIÓN:\n${s.cierre.momentos.metacognicion || '-'}\n\n`;
  }
  if (s.cierre?.preguntasMetacognitivas && s.cierre.preguntasMetacognitivas.length > 0) {
    text += `PREGUNTAS METACOGNITIVAS:\n`;
    s.cierre.preguntasMetacognitivas.forEach(preg => {
      text += `• ${preg}\n`;
    });
    text += `\n`;
  }
  text += `${s.cierre?.descripcion || ''}\n\n`;

  text += `IV. EVALUACIÓN\n`;
  text += `${'─'.repeat(40)}\n`;
  text += `EVALUACIÓN DE LOS APRENDIZAJES\n\n`;

  if (e.competencias && e.competencias.length > 0) {
    text += `COMPETENCIA\t\t\t\tDESEMPEÑO\t\t\t\tEVIDENCIA\t\t\tINSTRUMENTO\n`;
    text += `${'─'.repeat(80)}\n`;
    e.competencias.forEach(comp => {
      text += `${comp.competencia || '-'}\n`;
      text += `\t\t\t\t${comp.desempeno || '-'}\n`;
      text += `\t\t\t\t\t\t${comp.evidencia || '-'}\n`;
      text += `\t\t\t\t\t\t\t\t\t${comp.instrumento || '-'}\n\n`;
    });
  }

  text += `V. RECURSOS Y MATERIALES\n`;
  text += `${'─'.repeat(40)}\n`;
  text += `RECURSOS:\n${(r.recursos || []).join(', ')}\n\n`;
  text += `MATERIALES:\n${(r.materiales || []).join(', ')}\n\n`;

  text += `${'═'.repeat(60)}\n`;
  text += `V° B° DIRECTIVO/COORDINADOR\t\t\tDOCENTE RESPONSABLE\n\n\n`;
  text += `\t\t\t\t\t\tDOCENTE PRACTICANTE\t\t\tFORMADORA DE PRÁCTICA\n`;

  return text;
}
