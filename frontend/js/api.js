// ========================================
// API CLIENT - Comunicación con Backend
// ========================================

const API_BASE_URL = 'http://localhost:3000/api';

class TeacherAPI {
  /**
   * Crear un nuevo profesor
   */
  static async createTeacher(teacherData) {
    try {
      return await httpRequest('POST', `${API_BASE_URL}/teachers`, teacherData);
    } catch (error) {
      console.error('Error al crear profesor:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los profesores
   */
  static async getAllTeachers() {
    try {
      return await httpRequest('GET', `${API_BASE_URL}/teachers`);
    } catch (error) {
      console.error('Error al obtener profesores:', error);
      throw error;
    }
  }

  /**
   * Obtener profesor por ID
   */
  static async getTeacherById(id) {
    try {
      return await httpRequest('GET', `${API_BASE_URL}/teachers/${id}`);
    } catch (error) {
      console.error('Error al obtener profesor:', error);
      throw error;
    }
  }

  /**
   * Obtener profesores recomendados
   */
  static async getRecommendedTeachers(limit = 10) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/teachers/recommendations?limit=${limit}`
      );
      return await response.json();
    } catch (error) {
      console.error('Error al obtener recomendaciones:', error);
      throw error;
    }
  }

  /**
   * Obtener profesores aleatorios
   */
  static async getRandomTeachers(limit = 10) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/teachers/random?limit=${limit}`
      );
      return await response.json();
    } catch (error) {
      console.error('Error al obtener profesores aleatorios:', error);
      throw error;
    }
  }

  /**
   * Obtener materias disponibles
   */
  static async getAvailableSubjects() {
    try {
      return await httpRequest('GET', `${API_BASE_URL}/subjects`);
    } catch (error) {
      console.error('Error al obtener materias:', error);
      throw error;
    }
  }

  /**
   * Buscar profesores
   */
  static async searchTeachers(filters) {
    try {
      const params = new URLSearchParams();
      if (filters.modality) params.append('modality', filters.modality);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`${API_BASE_URL}/teachers/search?${params}`);
      return await response.json();
    } catch (error) {
      console.error('Error al buscar profesores:', error);
      throw error;
    }
  }

  /**
   * Subir foto
   */
  static async uploadPhoto(photoFile) {
    try {
      const formData = new FormData();
      formData.append('file', photoFile);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      return await response.json();
    } catch (error) {
      console.error('Error al cargar foto:', error);
      throw error;
    }
  }

  /**
   * Actualizar profesor
   */
  static async updateTeacher(id, teacherData) {
    try {
      return await httpRequest('PUT', `${API_BASE_URL}/teachers/${id}`, teacherData);
    } catch (error) {
      console.error('Error al actualizar profesor:', error);
      throw error;
    }
  }

  /**
   * Eliminar profesor
   */
  static async deleteTeacher(id) {
    try {
      return await httpRequest('DELETE', `${API_BASE_URL}/teachers/${id}`);
    } catch (error) {
      console.error('Error al eliminar profesor:', error);
      throw error;
    }
  }
}

// Constantes de materias
const SUBJECTS = {
  'Materias Escolares': [
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
  'Nivel Universitario': [
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
  'Informática': [
    'Programación',
    'Desarrollo Web',
    'Bases de Datos',
    'Algoritmos',
    'JavaScript',
    'Python',
    'Ciberseguridad'
  ],
  'Idiomas': [
    'Inglés',
    'Portugués',
    'Francés',
    'Italiano',
    'Alemán',
    'Chino',
    'Japonés'
  ],
  'Artes': [
    'Dibujo',
    'Pintura',
    'Música',
    'Danza',
    'Teatro',
    'Fotografía'
  ]
};

// Lista plana de todas las materias para usar en formularios
const SUBJECTS_FLAT = (() => {
  const allSubjects = [];
  for (const category in SUBJECTS) {
    allSubjects.push(...SUBJECTS[category]);
  }
  return [...new Set(allSubjects)].sort();
})();
