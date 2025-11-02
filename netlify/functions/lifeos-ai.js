const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: 'Method Not Allowed',
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    };
  }

  try {
    const { goals, tasks, coachingStyle } = JSON.parse(event.body);
    
    console.log('Procesando metas:', goals);
    
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      {
        inputs: `
        Como coach de vida experto, analiza estas metas del usuario: ${goals.join(', ')}.
        Tareas del usuario: ${tasks && tasks.length > 0 ? tasks.join(', ') : 'El usuario no especificó tareas, sugiere algunas basadas en sus metas'}.
        Estilo de coaching: ${coachingStyle}.
        
        Responde SOLO en formato JSON:
        {
          "daily_plan": ["tarea 1", "tarea 2", "tarea 3", "tarea 4", "tarea 5"],
          "weekly_strategy": "Plan semanal personalizado",
          "motivation": {
            "today": "Mensaje motivacional para hoy",
            "week": "Mensaje para la semana", 
            "goals": "Mensaje sobre progreso de metas"
          },
          "progress_insight": "25"
        }`
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 25000
      }
    );

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        data: response.data 
      })
    };
  } catch (error) {
    console.error('Error:', error);
    
    const { goals, tasks, coachingStyle } = JSON.parse(event.body);
    const fallbackResponse = {
      daily_plan: [
        'Revisar y priorizar metas del día',
        'Dedicar 15 minutos a aprendizaje',
        'Ejercicio físico o meditación',
        'Avanzar en proyecto principal',
        'Reflexionar sobre progreso'
      ],
      weekly_strategy: "Enfoque en consistencia y progreso incremental",
      motivation: {
        today: "Cada pequeño paso te acerca a tus metas grandes",
        week: "La consistencia es más poderosa que la intensidad ocasional",
        goals: "Estás construyendo el futuro que deseas, paso a paso"
      },
      progress_insight: "30"
    };
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        data: [{ generated_text: JSON.stringify(fallbackResponse) }],
        fallback: true
      })
    };
  }
};