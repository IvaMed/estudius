// =====================================================
// MODELO DE DATOS - Teacher
// =====================================================

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
    'Algoritmos',
    'Ciberseguridad'
  ],
  languages: [
    'Inglés',
    'Portugués',
    'Francés',
    'Italiano',
    'Alemán',
    'Chino',
    'Japonés'
  ],
  arts: [
    'Dibujo',
    'Pintura',
    'Música',
    'Danza',
    'Teatro',
    'Fotografía'
  ]
};

// Todas las materias disponibles
const ALL_SUBJECTS = [
  ...SUBJECTS.schoolSubjects,
  ...SUBJECTS.universitySubjects,
  ...SUBJECTS.computerScience,
  ...SUBJECTS.languages,
  ...SUBJECTS.arts
];

// Estructura de un Profesor
const TeacherModel = {
  // Información personal
  firstName: String,           // Obligatorio
  lastName: String,            // Obligatorio
  age: Number,                 // Obligatorio, validar 0 < age < 150
  email: String,               // Obligatorio, email válido, único
  phone: String,               // Opcional, validar formato
  
  // Información académica
  description: String,         // Obligatorio, descripción del profesor
  curriculum: String,          // Obligatorio, temario/currículo
  photo: String,               // URL de la/s foto/s (JSON array)
  
  // Información de clases
  classSize: Number,           // Obligatorio, 0 < classSize <= 40
  subjects: Array,             // Obligatorio, array de materias
  modality: String,            // Obligatorio (deprecated): 'virtual' | 'presencial'
  modalities: Array,          // Nueva: puede contener ['virtual','presencial']
  schedules: Object,           // Obligatorio: { version, slots[{dow,start,end}], notes? } — mínimo una franja
  location: String,            // Obligatorio si presencial, NULL si virtual
  
  // Metadata
  createdAt: String,           // Timestamp automático
  updatedAt: String,           // Timestamp automático
  views: Number               // Para algoritmo de recomendación
};

const { validateScheduleShape } = require('../lib/scheduleUtils');

// Validación de campos
const ValidateTeacher = {
  firstName: (value) => {
    return typeof value === 'string' && value.trim().length > 0;
  },
  
  lastName: (value) => {
    return typeof value === 'string' && value.trim().length > 0;
  },
  
  age: (value) => {
    return Number.isInteger(value) && value > 0 && value < 150;
  },
  
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  
  phone: (value) => {
    // Puede ser vacío (opcional)
    if (!value) return true;
    // Validar formato: al menos 7 dígitos
    const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
    return phoneRegex.test(value);
  },
  
  description: (value) => {
    return typeof value === 'string' && value.trim().length > 0;
  },
  
  curriculum: (value) => {
    return typeof value === 'string' && value.trim().length > 0;
  },
  
  classSize: (value) => {
    return Number.isInteger(value) && value > 0 && value <= 40;
  },
  
  subjects: (value) => {
    if (!Array.isArray(value) || value.length === 0) return false;
    return value.every(subject => ALL_SUBJECTS.includes(subject));
  },
  
  modality: (value) => {
    // backward compatible: single modality allowed
    return value === 'virtual' || value === 'presencial';
  },

  modalities: (value) => {
    // Accept either a single string or an array of allowed modalities
    const allowed = ['virtual', 'presencial'];
    if (!value) return false;
    if (Array.isArray(value)) {
      if (value.length === 0) return false;
      return value.every(m => allowed.includes(m));
    }
    if (typeof value === 'string') {
      return allowed.includes(value);
    }
    return false;
  },
  
  schedules: (value) => {
    return validateScheduleShape(value).ok;
  },
  
  location: (value, modalityOrModalities) => {
    // Accept either a single modality string or array of modalities
    let requiresLocation = false;
    if (Array.isArray(modalityOrModalities)) {
      requiresLocation = modalityOrModalities.includes('presencial');
    } else {
      requiresLocation = modalityOrModalities === 'presencial';
    }

    if (requiresLocation) {
      return typeof value === 'string' && value.trim().length > 0;
    }
    return true; // Opcional si no requiere presencial
  }
};

module.exports = {
  SUBJECTS,
  ALL_SUBJECTS,
  TeacherModel,
  ValidateTeacher
};
