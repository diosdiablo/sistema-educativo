const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Eres un experto en planificación educativa para el currículo peruano. Genera planes de clase detallados siguiendo el formato del MINEDU.

Responde ÚNICAMENTE con JSON válido en este formato exacto, sin texto adicional:
{
  "titulo": "Título de la sesión",
  "area": "Nombre del área curricular",
  "grado": "Grado y sección",
  "duracion": "90 minutos",
  "fecha": "Fecha sugerida",
  "competencia": "Competencia del CNEB",
  "enfoque": "Enfoque transversal relevante",
  "capacidades": ["Capacidad 1", "Capacidad 2"],
  "instrumentos": ["Rúbrica", "Lista de cotejo"],
  "objetivos": ["Objetivo de aprendizaje"],
  "recursos": ["Material concreto", "TIC"],
  "secuencia": {
    "inicio": {
      "tiempo": "15 min",
      "actividades": ["Actividad 1", "Actividad 2"],
      "descripcion": "Descripción breve del momento de inicio"
    },
    "desarrollo": {
      "tiempo": "60 min",
      "actividades": ["Actividad 1", "Actividad 2", "Actividad 3"],
      "descripcion": "Descripción detallada del proceso de enseñanza"
    },
    "cierre": {
      "tiempo": "15 min",
      "actividades": ["Actividad 1", "Actividad 2"],
      "descripcion": "Actividades de metacognición y evaluación"
    }
  },
  "evaluacion": {
    "criterios": ["Criterio 1", "Criterio 2"],
    "tecnicas": ["Técnica de evaluación"],
    "instrumentos": ["Instrumento de evaluación"]
  },
  "reflexion": {
    "antes": ["Pregunta de reflexión antes"],
    "durante": ["Pregunta de reflexión durante"],
    "despues": ["Pregunta de reflexión después"]
  },
  "tarea": "Actividad de extensión para casa"
}`;

export async function generateLessonPlan({ subject, grade, topic, duration = 90, period = '2026' }) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('API key de Groq no configurada. Agrega VITE_GROQ_API_KEY en tu archivo .env');
  }

  const userPrompt = `Genera un plan de clase para:
- Área: ${subject}
- Grado: ${grade}
- Tema: ${topic}
- Duración: ${duration} minutos
- Periodo: ${period}

Responde solo con JSON válido.`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Error API: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

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
  let text = `📚 ${plan.titulo}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `📋 DATOS GENERALES\n`;
  text += `Área: ${plan.area}\n`;
  text += `Grado: ${plan.grado}\n`;
  text += `Duración: ${plan.duracion}\n`;
  text += `Fecha: ${plan.fecha}\n\n`;
  
  text += `🎯 COMPETENCIA\n${plan.competencia}\n`;
  text += `Enfoque: ${plan.enfoque}\n\n`;
  
  text += `📚 CAPACIDADES\n${plan.capacidades.join(', ')}\n\n`;
  
  text += `🎯 OBJETIVOS\n${plan.objetivos.map(o => `• ${o}`).join('\n')}\n\n`;
  
  text += `📦 RECURSOS\n${plan.recursos.join(', ')}\n\n`;
  
  text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🔄 SECUENCIA DIDÁCTICA\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  text += `🚀 INICIO (${plan.secuencia.inicio.tiempo})\n`;
  text += `${plan.secuencia.inicio.descripcion}\n`;
  text += `${plan.secuencia.inicio.actividades.map(a => `• ${a}`).join('\n')}\n\n`;
  
  text += `📖 DESARROLLO (${plan.secuencia.desarrollo.tiempo})\n`;
  text += `${plan.secuencia.desarrollo.descripcion}\n`;
  text += `${plan.secuencia.desarrollo.actividades.map(a => `• ${a}`).join('\n')}\n\n`;
  
  text += `🔚 CIERRE (${plan.secuencia.cierre.tiempo})\n`;
  text += `${plan.secuencia.cierre.descripcion}\n`;
  text += `${plan.secuencia.cierre.actividades.map(a => `• ${a}`).join('\n')}\n\n`;
  
  text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📝 EVALUACIÓN\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `Técnicas: ${plan.evaluacion.tecnicas.join(', ')}\n`;
  text += `Instrumentos: ${plan.evaluacion.instrumentos.join(', ')}\n`;
  text += `Criterios:\n${plan.evaluacion.criterios.map(c => `• ${c}`).join('\n')}\n\n`;
  
  text += `💭 REFLEXIÓN METACOGNITIVA\n`;
  text += `Antes: ${plan.reflexion.antes.join(', ')}\n`;
  text += `Durante: ${plan.reflexion.durante.join(', ')}\n`;
  text += `Después: ${plan.reflexion.despues.join(', ')}\n\n`;
  
  text += `📋 TAREA PARA CASA\n${plan.tarea}\n`;
  
  return text;
}
