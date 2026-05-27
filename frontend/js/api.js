// ========================================
// API CLIENT - Comunicación con Backend
// ========================================

/** Misma máquina que sirve la página (PC o celular en la red local). */
const API_BASE_URL =
  (typeof window !== 'undefined' && window.__ESTUDIUS_API_BASE) ||
  (typeof window !== 'undefined' && window.location && window.location.origin
    ? `${window.location.origin}/api`
    : 'http://localhost:3000/api');

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

  /** Disponibilidad por día (público) */
  static async getTeacherAvailability(id, fromYmd, toYmd) {
    try {
      const q = new URLSearchParams({ from: fromYmd, to: toYmd });
      return await httpRequest('GET', `${API_BASE_URL}/teachers/${id}/availability?${q}`);
    } catch (error) {
      console.error('Error al obtener disponibilidad:', error);
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
      console.error('Error al obtener recomendaciones desde API, intentando fallback local:', error);
      try {
        const fallback = await fetch('./data/teachers.json');
        const json = await fallback.json();
        const list = json.data || json || [];
        // Sanitizar descripciones del fallback local por seguridad
        const sanitized = list.map(t => ({ ...t, description: typeof sanitizeDescription === 'function' ? sanitizeDescription(t.description) : (t.description || '') }));
        return { data: sanitized.slice(0, limit) };
      } catch (err) {
        console.error('Error cargando fallback local:', err);
        throw error;
      }
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
      console.error('Error al obtener profesores aleatorios desde API, intentando fallback local:', error);
      try {
        const fallback = await fetch('./data/teachers.json');
        const json = await fallback.json();
        const list = json.data || json || [];
        const sanitized = list.map(t => ({ ...t, description: typeof sanitizeDescription === 'function' ? sanitizeDescription(t.description) : (t.description || '') }));
        return { data: sanitized.slice(0, limit) };
      } catch (err) {
        console.error('Error cargando fallback local:', err);
        throw error;
      }
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
   * Obtener materias agrupadas por categorías
   */
  static async getGroupedSubjects() {
    try {
      return await httpRequest('GET', `${API_BASE_URL}/subjects/grouped`);
    } catch (error) {
      console.error('Error al obtener materias agrupadas:', error);
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
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.timeStart) params.append('timeStart', filters.timeStart);
      if (filters.timeEnd) params.append('timeEnd', filters.timeEnd);
      if (filters.dow !== undefined && filters.dow !== null && String(filters.dow).trim() !== '') {
        params.append('dow', String(filters.dow));
      }

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

class AuthAPI {
  static async register(data) {
    try {
      return await httpRequest('POST', `${API_BASE_URL}/auth/register`, data);
    } catch (error) {
      console.error('Error en AuthAPI.register:', error);
      throw error;
    }
  }

  static async login(data) {
    try {
      return await httpRequest('POST', `${API_BASE_URL}/auth/login`, data);
    } catch (error) {
      console.error('Error en AuthAPI.login:', error);
      throw error;
    }
  }

  static async me(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error en AuthAPI.me:', error);
      throw error;
    }
  }

  static async changePassword(token, data) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const text = await response.text();
      let json;
      try { json = text ? JSON.parse(text) : {}; } catch (e) { json = null; }
      if (!response.ok) {
        const message = (json && json.message) ? json.message : (text || 'Error cambiando contraseña');
        const err = new Error(message);
        err.details = json || { raw: text };
        throw err;
      }
      return json || { success: true };
    } catch (error) {
      console.error('Error en AuthAPI.changePassword:', error);
      throw error;
    }
  }
}

class BookingAPI {
  static async createBooking(token, bookingData) {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      const json = await response.json();
      if (!response.ok) {
        const error = new Error(json.message || 'Error creando reserva');
        error.details = json;
        throw error;
      }
      return json;
    } catch (error) {
      console.error('Error en BookingAPI.createBooking:', error);
      throw error;
    }
  }

  static async getMyBookings(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/my`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('Error en BookingAPI.getMyBookings:', error);
      throw error;
    }
  }

  static async getBooking(token, id) {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await response.json();
      if (!response.ok) {
        const err = new Error(json.message || 'Error al obtener la reserva');
        err.details = json;
        throw err;
      }
      return json;
    } catch (error) {
      console.error('Error en BookingAPI.getBooking:', error);
      throw error;
    }
  }

  static async deleteBooking(token, id) {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await response.json();
      if (!response.ok) {
        const err = new Error(json.message || 'Error al eliminar');
        err.details = json;
        throw err;
      }
      return json;
    } catch (error) {
      console.error('Error en BookingAPI.deleteBooking:', error);
      throw error;
    }
  }
}

class FavoriteAPI {
  static async listIds(token) {
    const response = await fetch(`${API_BASE_URL}/favorites/ids`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }

  static async listTeachers(token) {
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }

  static async toggle(token, teacherId) {
    const id = parseInt(String(teacherId).trim(), 10);
    if (!Number.isFinite(id) || id < 1) {
      throw new Error('Profesor no válido para favoritos');
    }
    const response = await fetch(`${API_BASE_URL}/favorites/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ teacherId: id })
    });
    const json = await response.json();
    if (!response.ok) {
      const err = new Error(json.message || 'Error al actualizar favorito');
      err.details = json;
      throw err;
    }
    return json;
  }

  static async remove(token, teacherId) {
    const response = await fetch(`${API_BASE_URL}/favorites?teacherId=${encodeURIComponent(teacherId)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }
}

// Constantes de materias
const SUBJECTS = {
  'Materias escolares clásicas': [
    'Biología',
    'Educación Cívica',
    'Economía',
    'Filosofía',
    'Física',
    'Geografía',
    'Historia',
    'Lengua',
    'Matemática',
    'Psicología',
    'Química'
  ],
  'Materias de nivel universitario': [
    'Administración',
    'Algebra Lineal',
    'Análisis Matemático',
    'Derecho',
    'Electrónica',
    'Estadística y probabilidad',
    'Marketing',
    'Mecánica',
    'Química Inorgánica',
    'Química Orgánica'
  ],
  'Materias Informáticas': [
    'Algoritmos',
    'Bases de Datos',
    'Ciberseguridad',
    'Desarrollo Web',
    'Programación'
  ],
  'Idiomas': [
    'Alemán',
    'Chino',
    'Francés',
    'Inglés',
    'Italiano',
    'Japonés',
    'Portugués'
  ],
  'Materias Artísticas': [
    'Dibujo',
    'Música',
    'Pintura'
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

class AdminAPI {
  static async listUsers(token, page = 1, pageSize = 10, search = '') {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('pageSize', String(pageSize));
    if (search) params.append('search', search);
    const response = await fetch(`${API_BASE_URL}/admin/users?${params.toString()}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }

  static async updateUserRole(token, id, role) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ role })
    });
    return await response.json();
  }

  static async setUserPassword(token, id, newPassword) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}/set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ newPassword })
    });
    return await response.json();
  }

  static async deleteUser(token, id) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }

  // Features (categories/items)
  static async listFeatures(token, type = 'subject') {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    const response = await fetch(`${API_BASE_URL}/admin/features?${params.toString()}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }

  static async createFeatureCategory(token, type, name, icon) {
    const response = await fetch(`${API_BASE_URL}/admin/features/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ type, name, icon })
    });
    return await response.json();
  }

  static async updateFeatureCategory(token, id, name, icon) {
    const response = await fetch(`${API_BASE_URL}/admin/features/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name, icon })
    });
    return await response.json();
  }

  static async deleteFeatureCategory(token, id) {
    const response = await fetch(`${API_BASE_URL}/admin/features/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }

  static async createFeatureItem(token, categoryId, name, icon) {
    const response = await fetch(`${API_BASE_URL}/admin/features/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ categoryId, name, icon })
    });
    return await response.json();
  }

  static async updateFeatureItem(token, id, data) {
    const response = await fetch(`${API_BASE_URL}/admin/features/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  static async deleteFeatureItem(token, id) {
    const response = await fetch(`${API_BASE_URL}/admin/features/items/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }
}
