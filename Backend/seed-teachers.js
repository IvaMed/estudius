// =====================================================
// SCRIPT DE POBLACIÓN DE BASE DE DATOS CON DATOS ALEATORIOS
// =====================================================

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { migrateLegacyScheduleText, serializeScheduleForDb } = require('./lib/scheduleUtils');
const dbPath = path.join(__dirname, '..', 'Database', 'estudius.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err.message);
    process.exit(1);
  }
  console.log('Conectado a la base de datos SQLite');
});

// Lista completa de materias
const SUBJECTS = {
  schoolSubjects: [
    'Matemática',
    'Lengua',
    'Historia',
    'Geografía',
    'Biología',
    'Física',
    'Química',
    'Educación Cívica',
    'Filosofía',
    'Psicología',
    'Economía'
  ],
  universitySubjects: [
    'Análisis Matemático',
    'Algebra Lineal',
    'Estadística y probabilidad',
    'Mecánica',
    'Electrónica',
    'Química Orgánica',
    'Química Inorgánica',
    'Marketing',
    'Derecho',
    'Administración'
  ],
  computerScience: [
    'Programación',
    'Desarrollo Web',
    'Bases de Datos',
    'Algoritmos'
  ],
  languages: [
    'Inglés',
    'Portugués',
    'Francés',
    'Italiano',
    'Alemán'
  ],
  arts: [
    'Dibujo',
    'Pintura',
    'Música'
  ]
};

const ALL_SUBJECTS = [
  ...SUBJECTS.schoolSubjects,
  ...SUBJECTS.universitySubjects,
  ...SUBJECTS.computerScience,
  ...SUBJECTS.languages,
  ...SUBJECTS.arts
];

// Nombres aleatorios separados por género para asegurar inclusión de mujeres
const maleNames = [
  'Juan', 'Carlos', 'Diego', 'Miguel', 'Jorge', 'Luis', 'Antonio', 'Marco',
  'Ricardo', 'Javier', 'Samuel', 'Alejandro', 'Andrés', 'Guillermo', 'Felipe'
];

const femaleNames = [
  'María', 'Ana', 'Laura', 'Isabel', 'Patricia', 'Sofía', 'Elena', 'Gabriela',
  'Rosa', 'Lucia', 'Martina', 'Valeria', 'Carolina', 'Cristina', 'Adriana'
];

const lastNames = [
  'García', 'Martínez', 'López', 'González', 'Rodríguez', 'Pérez', 'Flores', 'Silva',
  'Santos', 'Moreno', 'Gómez', 'Hernández', 'Domínguez', 'Vázquez', 'Romero', 'Castillo',
  'Vargas', 'Reyes', 'Fuentes', 'Cortés', 'Medina', 'Rojas', 'Soto', 'Mendoza',
  'Araya', 'Bravo', 'Castro', 'Díaz', 'Espinoza', 'Fernández'
];

const descriptions = [
  'Profesor apasionado con 10+ años de experiencia. Metodología didáctica y enfoque personalizado para cada estudiante.',
  'Docente dedicado con formación universitaria completa. Excelente dominio del tema y capacidad para explicar conceptos complejos de forma clara.',
  'Profesional con experiencia en enseñanza presencial y virtual. Utilizo recursos multimedia y ejercicios prácticos para mejor aprendizaje.',
  'Tutor responsable y comprometido. Adapto el ritmo de enseñanza a las necesidades individuales de cada alumno.',
  'Educador con especialización. Ofrezco clases dinámicas e interactivas.',
  'Docente con certificaciones internacionales. Creo en el aprendizaje significativo y el trabajo colaborativo.',
  'Profesor entusiasta y accesible. Excelentes referencias de estudiantes anteriores.',
  'Tutor con experiencia en preparación para exámenes y oposiciones. Metodología probada con altos índices de éxito.',
  'Profesional bilingüe/multilingüe. Experiencia internacional. Metodología comunicativa y práctica.',
  'Educador innovador que utiliza las últimas herramientas tecnológicas para maximizar el aprendizaje de sus alumnos.'
];

const curriculums = [
  'Nivel introductorio a avanzado. Enfoque teórico-práctico. Ejercicios de consolidación y evaluación continua.',
  'Temas fundamentales hasta especialización. Trabajamos desde lo básico hasta conceptos avanzados según el nivel del estudiante.',
  'Temario diseñado según objetivos educativos. Incluye actividades prácticas, ejercicios y evaluaciones formativas.',
  'Programa flexible adaptable a necesidades. Puedo acelerar o desacelerar según el progreso del alumno.',
  'Metodología basada en competencias. Desarrollo de habilidades prácticas además de conocimientos teóricos.',
  'Lecciones estructuradas con progresión lógica. Cada tema se consolida antes de avanzar al siguiente.',
  'Currículo actualizado según estándares internacionales. Incluye casos reales y aplicaciones prácticas.',
  'Enfoque comunicativo y participativo. Los estudiantes son protagonistas activos de su aprendizaje.',
  'Programa personalizado según objetivos. Puedo preparar material específico según necesidades.',
  'Temario integral con énfasis en comprensión profunda. Fomentamos el pensamiento crítico y el análisis.'
];

const locations = [
  'CABA - Zona Centro',
  'CABA - Zona Norte',
  'CABA - Zona Sur',
  'CABA - Zona Este',
  'CABA - Zona Oeste',
  'Gran Buenos Aires',
  'Provincia de Buenos Aires',
];

const schedules = [
  'Lunes a Viernes: 15:00 a 20:00',
  'Lunes a Viernes: 09:00 a 13:00',
  'Martes y Jueves: 10:00 a 18:00',
  'Miércoles y Viernes: 14:00 a 20:00',
  'Horario flexible',
  'Mañanas y tardes',
  'Fines de semana',
  'Horarios flexibles',
];

// Función para generar número aleatorio
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Función para seleccionar elemento aleatorio de array
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Función para generar email único
// Normalizar texto removiendo tildes y caracteres no alfabéticos
function normalizeForEmail(s) {
  if (!s) return '';
  return String(s)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '')
    .toLowerCase();
}

// Función para generar email con formato nombre.apellido.fakeprof@gmail.com
function generateEmail(firstName, lastName, index) {
  const f = normalizeForEmail(firstName || 'user');
  const l = normalizeForEmail(lastName || 'prof');
  return `${f}.${l}.fakeprof@gmail.com`;
}

// Función para generar teléfono argentino
function generatePhone() {
  return `+54 9 ${randomInt(100, 999)} ${randomInt(1000000, 9999999)}`;
}

// Función para seleccionar 2-4 materias aleatorias
function generateSubjects() {
  const subjectCount = randomInt(2, 4);
  const selected = [];
  const shuffled = [...ALL_SUBJECTS].sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < subjectCount; i++) {
    selected.push(shuffled[i]);
  }
  return JSON.stringify(selected);
}

// Función para generar profesor aleatorio
function generateTeacher(index) {
  // Elegir género aleatorio y nombre correspondiente (garantizar mezcla)
  const isFemale = Math.random() < 0.5;
  const firstName = isFemale ? randomElement(femaleNames) : randomElement(maleNames);
  const lastName = randomElement(lastNames);
  const modality = randomInt(0, 1) === 0 ? 'virtual' : 'presencial';
  
  const modalitiesJson = JSON.stringify(
    modality === 'virtual' ? ['virtual'] : ['presencial']
  );
  const schedulesJson = serializeScheduleForDb(migrateLegacyScheduleText(randomElement(schedules)));

  return {
    firstName: firstName,
    lastName: lastName,
    age: randomInt(25, 65),
    email: generateEmail(firstName, lastName, index),
    phone: generatePhone(),
    description: randomElement(descriptions),
    curriculum: randomElement(curriculums),
    photo: null,
    classSize: randomInt(1, 5),
    subjects: generateSubjects(),
    modality: modality,
    modalities: modalitiesJson,
    schedules: schedulesJson,
    location: modality === 'virtual' ? null : randomElement(locations),
    views: randomInt(0, 50)
  };
}

// Función para insertar profesor en la base de datos
function insertTeacher(teacher) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO teachers (
        firstName, lastName, age, email, phone, description,
        curriculum, photo, classSize, subjects, modality, modalities,
        schedules, location, views
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(
      sql,
      [
        teacher.firstName,
        teacher.lastName,
        teacher.age,
        teacher.email,
        teacher.phone,
        teacher.description,
        teacher.curriculum,
        teacher.photo,
        teacher.classSize,
        teacher.subjects,
        teacher.modality,
        teacher.modalities,
        teacher.schedules,
        teacher.location,
        teacher.views
      ],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

// Función principal
async function seedDatabase() {
  console.log('Iniciando población de base de datos...\n');
  
  try {
    // Generar 40 profesores aleatorios (más variedad)
    const teacherCount = 40;
    console.log(`Generando ${teacherCount} profesores aleatorios...\n`);
    
    for (let i = 1; i <= teacherCount; i++) {
      const teacher = generateTeacher(i);
      const id = await insertTeacher(teacher);
      
      console.log(`✓ Profesor ${i}/${teacherCount} insertado:`);
      console.log(`  - ${teacher.firstName} ${teacher.lastName}`);
      console.log(`  - Email: ${teacher.email}`);
      console.log(`  - Modalidad: ${teacher.modality}`);
      const subjects = JSON.parse(teacher.subjects);
      console.log(`  - Materias: ${subjects.join(', ')}`);
      console.log(`  - ID: ${id}\n`);
    }
    
    console.log('✓ Población de base de datos completada exitosamente');
    console.log('Ahora puedes ejecutar: npm start');
    
  } catch (error) {
    console.error('❌ Error durante la población:', error.message);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error cerrando la base de datos:', err.message);
      } else {
        console.log('\nConexión a la base de datos cerrada');
      }
      process.exit(0);
    });
  }
}

// Ejecutar
seedDatabase();
