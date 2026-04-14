/**
 * ========================================
 * EJEMPLOS DE DATOS INICIALES
 * ========================================
 * 
 * Copia estos ejemplos en la consola del navegador
 * o en una herramienta como Postman para probar la API
 * 
 * Acceso: http://localhost:3000
 */

// ========================================
// EJEMPLO 1: Crear un Profesor Virtual
// ========================================

const profesor1 = {
  "firstName": "Carlos",
  "lastName": "Méndez",
  "age": 28,
  "email": "carlos.mendez@email.com",
  "phone": "+54911223344",
  "description": "Soy ingeniero en sistemas con 5 años de experiencia enseñando programación. Me especializo en hacer código accesible para principiantes. Mis clases son dinámicas y con ejemplos prácticos.",
  "curriculum": "Variables y tipos de datos, Control de flujo, Funciones, POO, Bases de datos SQL, APIs REST, Desarrollo web con JavaScript, React.js",
  "photo": null,
  "classSize": 12,
  "subjects": ["Programación", "Desarrollo Web"],
  "modality": "virtual",
  "schedules": "Lunes a viernes 18:00-19:30, Sábados 14:00-16:00",
  "location": null
};

// Ejecutar en JavaScript:
// fetch('http://localhost:3000/api/teachers', {
//   method: 'POST',
//   headers: {'Content-Type': 'application/json'},
//   body: JSON.stringify(profesor1)
// }).then(r => r.json()).then(console.log);

// ========================================
// EJEMPLO 2: Crear un Profesor Presencial
// ========================================

const profesor2 = {
  "firstName": "María",
  "lastName": "González",
  "age": 35,
  "email": "maria.gonzalez@email.com",
  "phone": "+54912345678",
  "description": "Licenciada en Química con especialización en química orgánica. He trabajado en laboratorio durante años y amo compartir mi pasión por la ciencia. Las clases son teórico-prácticas con demostraciones.",
  "curriculum": "Química básica, Química general, Química orgánica, Reacciones químicas, Estequiometría, Análisis químico, Química de laboratorio",
  "photo": null,
  "classSize": 8,
  "subjects": ["Química", "Química Orgánica"],
  "modality": "presencial",
  "schedules": "Martes y jueves 17:00-18:30, Sábados 10:00-12:00",
  "location": "San Isidro, Provincia de Buenos Aires"
};

// ========================================
// EJEMPLO 3: Crear un Profesor de Idiomas
// ========================================

const profesor3 = {
  "firstName": "John",
  "lastName": "Smith",
  "age": 42,
  "email": "john.smith@email.com",
  "phone": "+5491198765432",
  "description": "Profesor de inglés nativo de Los Angeles, USA. 15 años de experiencia enseñando inglés como segundo idioma. Especialista en pronunciación y conversación. Ambiente relajado y divertido.",
  "curriculum": "English basics, Grammar, Vocabulary, Conversation, Writing, Reading comprehension, Business English, TOEFL preparation",
  "photo": null,
  "classSize": 10,
  "subjects": ["Inglés"],
  "modality": "virtual",
  "schedules": "Lunes a viernes 19:00-20:00 (hora Argentina), Domingos 14:00-15:00",
  "location": null
};

// ========================================
// EJEMPLO 4: Crear un Profesor de Matemática
// ========================================

const profesor4 = {
  "firstName": "Roberto",
  "lastName": "Sánchez",
  "age": 38,
  "email": "roberto.sanchez@email.com",
  "phone": "+5491187654321",
  "description": "Profesor de matemática con 12 años de experiencia. Especialista en resolver bloqueos mentales con las matemáticas. Uso de ejemplos cotidianos y visualizaciones.",
  "curriculum": "Aritmética, Álgebra, Geometría, Trigonometría, Cálculo, Análisis Matemático, Estadística, Probabilidad",
  "photo": null,
  "classSize": 6,
  "subjects": ["Matemática", "Algebra Lineal", "Estadística y probabilidad"],
  "modality": "presencial",
  "schedules": "Lunes, miércoles y viernes 16:00-17:00, Sábados 10:00-12:00",
  "location": "Centro de Buenos Aires - Flores"
};

// ========================================
// EJEMPLO 5: Crear un Profesor de Historia
// ========================================

const profesor5 = {
  "firstName": "Patricia",
  "lastName": "Rodríguez",
  "age": 40,
  "email": "patricia.rodriguez@email.com",
  "phone": null,
  "description": "Historiadora y educadora con pasión por hacer la historia viva e interesante. Utilizo documentales, mapas interactivos y análisis de fuentes primarias.",
  "curriculum": "Historia antigua, Edad Media, Historia moderna, Historia contemporánea, Historia de América Latina, Historia Argentina, Conflictos mundiales",
  "photo": null,
  "classSize": 15,
  "subjects": ["Historia"],
  "modality": "virtual",
  "schedules": "Martes y jueves 18:00-19:30, Viernes 19:00-20:00",
  "location": null
};

// ========================================
// EJEMPLO 6: Crear un Profesor de Dibujo
// ========================================

const profesor6 = {
  "firstName": "Diego",
  "lastName": "Fernández",
  "age": 32,
  "email": "diego.fernandez@email.com",
  "phone": "+5491112223333",
  "description": "Artista plástico y profesor con experiencia en instituciones de arte. Enseño técnicas básicas y avanzadas de dibujo. Trabajo con diferentes materiales: lápiz, carbón, pastel.",
  "curriculum": "Técnicas de representación, Proporción y anatomía, Perspectiva, Luz y sombra, Dibujo de modelos, Composición, Dibujo artístico avanzado",
  "photo": null,
  "classSize": 5,
  "subjects": ["Dibujo"],
  "modality": "presencial",
  "schedules": "Sábados y domingos 10:00-12:00, Miércoles 19:00-20:30",
  "location": "La Boca, Buenos Aires"
};

// ========================================
// CÓMO CREAR TODOS LOS PROFESORES A LA VEZ
// ========================================

const profesores = [profesor1, profesor2, profesor3, profesor4, profesor5, profesor6];

// En la consola del navegador, ejecuta:
/*
profesores.forEach((prof, index) => {
  setTimeout(() => {
    fetch('http://localhost:3000/api/teachers', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(prof)
    })
    .then(r => r.json())
    .then(data => console.log(`Profesor ${index + 1}:`, data))
    .catch(err => console.error(`Error en profesor ${index + 1}:`, err));
  }, index * 500); // Espaciar 500ms entre requests
});
*/

// ========================================
// EJEMPLOS DE CONSULTAS (GET)
// ========================================

// Obtener todos los profesores:
// fetch('http://localhost:3000/api/teachers')
//   .then(r => r.json())
//   .then(console.log);

// Obtener profesor específico (ID):
// fetch('http://localhost:3000/api/teachers/1')
//   .then(r => r.json())
//   .then(console.log);

// Obtener profesores recomendados:
// fetch('http://localhost:3000/api/teachers/recommendations?limit=5')
//   .then(r => r.json())
//   .then(console.log);

// Obtener profesores aleatorios:
// fetch('http://localhost:3000/api/teachers/random?limit=10')
//   .then(r => r.json())
//   .then(console.log);

// Obtener materias disponibles:
// fetch('http://localhost:3000/api/subjects')
//   .then(r => r.json())
//   .then(console.log);

// ========================================
// EJEMPLOS DE BÚSQUEDA
// ========================================

// Buscar profesores de programación:
// fetch('http://localhost:3000/api/teachers/search?subject=Programación')
//   .then(r => r.json())
//   .then(console.log);

// Buscar profesores virtuales:
// fetch('http://localhost:3000/api/teachers/search?modality=virtual')
//   .then(r => r.json())
//   .then(console.log);

// Buscar profesores presenciales:
// fetch('http://localhost:3000/api/teachers/search?modality=presencial')
//   .then(r => r.json())
//   .then(console.log);

// Buscar por nombre:
// fetch('http://localhost:3000/api/teachers/search?search=Carlos')
//   .then(r => r.json())
//   .then(console.log);

// Buscar con múltiples filtros:
// fetch('http://localhost:3000/api/teachers/search?modality=virtual&subject=Inglés')
//   .then(r => r.json())
//   .then(console.log);

// ========================================
// ERRORES POSIBLES Y SOLUCIONES
// ========================================

// Error: "Email ya registrado"
// Solución: Usar un email diferente

// Error: "Modalidad debe ser 'virtual' o 'presencial'"
// Solución: Asegurar que modality tenga uno de esos valores

// Error: "Cantidad de alumnos debe estar entre 1 y 29"
// Solución: classSize debe ser número entre 1-29

// Error: "Ubicación requerida para clases presenciales"
// Solución: Si modality es "presencial", location es obligatoria

// Error: "Edad debe estar entre 1 y 149"
// Solución: age debe ser número en ese rango

// ========================================
// DATOS DE PRUEBA ADICIONALES
// ========================================

const profesorPrueba = {
  "firstName": "Ana",
  "lastName": "López",
  "age": 29,
  "email": "ana.lopez@email.com",
  "phone": "+5491134567890",
  "description": "Educadora especializada en educación inicial. Creo ambientes seguros y estimulantes para el aprendizaje.",
  "curriculum": "Lectura, escritura, numeración, pensamiento lógico, expresión artística, coordinación motriz",
  "photo": null,
  "classSize": 8,
  "subjects": ["Educación Cívica"],
  "modality": "presencial",
  "schedules": "Lunes a viernes 15:00-16:30",
  "location": "Microcentro, CABA"
};

// ========================================
// RESUMEN DE ENDPOINTS
// ========================================

/*
ENDPOINT                              MÉTODO  DESCRIPCIÓN
/api/teachers                         POST    Crear profesor
/api/teachers                         GET     Obtener todos
/api/teachers/:id                     GET     Obtener por ID
/api/teachers/recommendations         GET     Profesores recomendados
/api/teachers/random                  GET     Profesores aleatorios
/api/teachers/search                  GET     Buscar con filtros
/api/subjects                         GET     Listar materias
/api/upload                           POST    Cargar foto

PARÁMETROS GET:
- limit=10          (recomendations, random)
- modality=virtual  (search)
- subject=Programación (search)
- search=Juan       (search)
*/

// ========================================
// DATOS ESPERADOS EN BD DESPUÉS DE UN DÍA
// ========================================

/*
- 6+ profesores registrados
- Representa todas las categorías de materias
- Mezcla de modalidades (virtual/presencial)
- Diferentes niveles de edad (28-42 años)
- Diversos horarios y ubicaciones
- Descripciones y temarios completos
*/

console.log('✅ Ejemplos de datos listos para copiar y pegar');
console.log('📋 Total de ejemplos: 6 profesores base');
console.log('🔗 Endpoint: http://localhost:3000/api/teachers');
