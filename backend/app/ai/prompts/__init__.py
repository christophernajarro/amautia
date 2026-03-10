EXTRACTION_PROMPT = """Analiza el siguiente examen de referencia y extrae las preguntas.
El examen tiene un total de {total_points} puntos.

Devuelve un JSON con el siguiente formato:
{{
  "questions": [
    {{
      "number": 1,
      "text": "Texto de la pregunta",
      "type": "open|multiple_choice|true_false|problem",
      "answer": "Respuesta correcta",
      "points": 4
    }}
  ]
}}

Asegúrate de que los puntos sumen {total_points} en total.
Responde SOLO con el JSON, sin texto adicional."""


CORRECTION_PROMPT = """Eres un corrector de exámenes experto. Corrige el examen del alumno basándote en las preguntas y respuestas correctas.

Preguntas del examen:
{questions}

Puntaje total: {total_points}
Archivo del alumno: {student_file}

Corrige cada pregunta comparando con la respuesta correcta. Sé justo pero exigente.

Devuelve un JSON con el formato:
{{
  "score": <puntaje_obtenido>,
  "total": {total_points},
  "percentage": <porcentaje>,
  "feedback": "Retroalimentación general",
  "answers": [
    {{
      "question": 1,
      "score": <puntaje>,
      "max": <puntaje_maximo>,
      "correct": true/false,
      "feedback": "Retroalimentación específica"
    }}
  ]
}}

Responde SOLO con el JSON."""


GENERATION_PROMPT = """Genera un examen educativo con las siguientes características:

Título: {title}
Dificultad: {difficulty} (easy/medium/hard)
Número de preguntas: {num_questions}
Nivel educativo: {education_level}
Tema/Fuente: {source_text}

Devuelve un JSON con el formato:
{{
  "title": "Título del examen",
  "questions": [
    {{
      "number": 1,
      "text": "Texto de la pregunta",
      "type": "open|multiple_choice|true_false|problem",
      "answer": "Respuesta correcta completa",
      "explanation": "Explicación de por qué es correcta",
      "points": 4
    }}
  ]
}}

Las preguntas deben ser variadas en tipo y cubrir diferentes aspectos del tema.
Cada pregunta debe tener una respuesta correcta detallada.
Responde SOLO con el JSON."""


TUTOR_SYSTEM = """Eres un tutor educativo amigable y paciente llamado Amautia.
Tu objetivo es ayudar al alumno a aprender, no darle las respuestas directamente.

Guías al alumno paso a paso, haciendo preguntas que lo lleven a descubrir la respuesta.
Usas ejemplos simples y analogías para explicar conceptos complejos.
Celebras los avances y motivas al alumno cuando se equivoca.
Respondes siempre en español.

Si el alumno te pide que le hagas la tarea, explícale que es mejor que aprenda el proceso.
Si detectas un error conceptual, corrígelo amablemente con una explicación clara."""


STUDY_PLAN_PROMPT = """Basándote en los resultados del alumno en sus exámenes, genera un plan de estudio personalizado.

Resultados del alumno:
{student_results}

Genera un JSON con:
{{
  "title": "Plan de estudio personalizado",
  "topics": [
    {{
      "name": "Nombre del tema",
      "priority": "high|medium|low",
      "description": "Qué necesita reforzar",
      "exercises": 5,
      "resources": ["Recurso 1", "Recurso 2"]
    }}
  ]
}}

Enfócate en las áreas donde el alumno tuvo más errores.
Responde SOLO con el JSON."""
