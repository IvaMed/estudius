// =====================================================
// CAPA DE APLICACIÓN - Service (Lógica de Negocio)
// =====================================================

const TeacherRepository = require('../data/teacherRepository');
const { ValidateTeacher, ALL_SUBJECTS } = require('../models/teacherModel');

class TeacherService {
  /**
   * Crear un nuevo profesor con validaciones completas
   */
  static async createTeacher(teacherData) {
    // Validar todos los campos
    const validation = this.validateTeacherData(teacherData);
    
    if (!validation.isValid) {
      const error = new Error('Datos inválidos');
      error.details = validation.errors;
      throw error;
    }

    // Verificar que el email no exista
    const existingTeacher = await TeacherRepository.getByEmail(teacherData.email);
    if (existingTeacher) {
      const error = new Error('El email ya está registrado');
      error.code = 'EMAIL_EXISTS';
      throw error;
    }

    // Verificar que no exista otro profesor con mismo nombre y apellido
    const existingByName = await TeacherRepository.getByFullName(teacherData.firstName, teacherData.lastName);
    if (existingByName) {
      const error = new Error('Ya existe un profesor con el mismo nombre y apellido');
      error.code = 'NAME_EXISTS';
      throw error;
    }

    // Crear el profesor
    const teacherId = await TeacherRepository.create(teacherData);
    return teacherId;
  }

  /**
   * Obtener todos los profesores
   */
  static async getAllTeachers() {
    return await TeacherRepository.getAll();
  }

  /**
   * Obtener profesor por ID
   */
  static async getTeacherById(id) {
    const teacher = await TeacherRepository.getById(id);
    
    if (!teacher) {
      const error = new Error('Profesor no encontrado');
      error.code = 'NOT_FOUND';
      throw error;
    }
    
    return teacher;
  }

  /**
   * Obtener profesores recomendados (algoritmo de recomendación)
   * 
   * Algoritmo:
   * 1. Ordenar por cantidad de vistas (más visto = más confiado)
   * 2. Como desempate, usar fecha de creación (más recientes primero)
   * 3. Llevar un balance alternando entre diferentes modalidades y materias
   */
  static async getRecommendedTeachers(limit = 10) {
    let teachers = await TeacherRepository.getRecommended(limit);

    // Si hay pocos profesores, usar recomendación aleatoria
    if (teachers.length < limit / 2) {
      teachers = await TeacherRepository.getRandom(limit);
    }

    // Algoritmo de balanceo: distribuir por modalidad
    return this.balanceRecommendations(teachers);
  }

  /**
   * Obtener profesores aleatorios (para home)
   */
  static async getRandomTeachers(limit = 10) {
    return await TeacherRepository.getRandom(limit);
  }

  /**
   * Algoritmo de balanceo para recomendaciones
   * Intenta distribuir entre virtual/presencial y diferentes materias
   */
  static balanceRecommendations(teachers) {
    if (teachers.length <= 1) {
      return teachers;
    }

    // Separar por modalidad
    const virtual = teachers.filter(t => {
      const modalities = t.modalities || (t.modality ? [t.modality] : []);
      return Array.isArray(modalities) && modalities.includes('virtual');
    });
    const presencial = teachers.filter(t => {
      const modalities = t.modalities || (t.modality ? [t.modality] : []);
      return Array.isArray(modalities) && modalities.includes('presencial');
    });

    // Intercalar para tener balance
    const balanced = [];
    let vIndex = 0, pIndex = 0;

    while (vIndex < virtual.length || pIndex < presencial.length) {
      if (vIndex < virtual.length) {
        balanced.push(virtual[vIndex++]);
      }
      if (pIndex < presencial.length) {
        balanced.push(presencial[pIndex++]);
      }
    }

    return balanced;
  }

  /**
   * Validar datos de profesor
   */
  static validateTeacherData(data) {
    const errors = {};

    // Validar firstName
    if (!ValidateTeacher.firstName(data.firstName)) {
      errors.firstName = 'Nombre requerido';
    }

    // Validar lastName
    if (!ValidateTeacher.lastName(data.lastName)) {
      errors.lastName = 'Apellido requerido';
    }

    // Validar age
    if (!ValidateTeacher.age(data.age)) {
      errors.age = 'Edad debe ser un número entre 1 y 149';
    }

    // Validar email
    if (!ValidateTeacher.email(data.email)) {
      errors.email = 'Email inválido';
    }

    // Validar phone (opcional)
    if (data.phone && !ValidateTeacher.phone(data.phone)) {
      errors.phone = 'Teléfono inválido';
    }

    // Validar description
    if (!ValidateTeacher.description(data.description)) {
      errors.description = 'Descripción requerida';
    }

    // Validar curriculum
    if (!ValidateTeacher.curriculum(data.curriculum)) {
      errors.curriculum = 'Temario requerido';
    }

    // Validar classSize
    if (!ValidateTeacher.classSize(data.classSize)) {
      errors.classSize = 'Cantidad de alumnos debe ser un número entre 1 y 29';
    }

    // Validar subjects
    if (!ValidateTeacher.subjects(data.subjects)) {
      errors.subjects = 'Debe seleccionar al menos una materia válida';
    }

    // Validar modalities (acepta string o array)
    if (!ValidateTeacher.modalities(data.modalities || data.modality)) {
      errors.modalities = 'Modalidad debe ser "virtual" o "presencial" (puede ser múltiple)';
    }

    // Validar schedules
    if (!ValidateTeacher.schedules(data.schedules)) {
      errors.schedules = 'Horarios requeridos';
    }

    // Validar location (obligatorio si presencial)
    if (!ValidateTeacher.location(data.location, data.modality)) {
      errors.location = 'Ubicación requerida para clases presenciales';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Obtener lista de todas las materias disponibles
   */
  static getAvailableSubjects() {
    return ALL_SUBJECTS;
  }

  /**
   * Actualizar profesor existente
   */
  static async updateTeacher(id, teacherData) {
    // Verificar existencia
    let existing;
    try {
      existing = await TeacherRepository.getById(id);
    } catch (err) {
      existing = null;
    }

    if (!existing) {
      const error = new Error('Profesor no encontrado');
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Validar datos completos
    const validation = this.validateTeacherData(teacherData);
    if (!validation.isValid) {
      const error = new Error('Datos inválidos');
      error.details = validation.errors;
      throw error;
    }

    // Verificar email único (si cambia el email)
    if (teacherData.email) {
      const byEmail = await TeacherRepository.getByEmail(teacherData.email);
      if (byEmail && byEmail.id !== id) {
        const error = new Error('El email ya está registrado');
        error.code = 'EMAIL_EXISTS';
        throw error;
      }
    }

    // Verificar nombre y apellido únicos (si cambian)
    if (teacherData.firstName && teacherData.lastName) {
      const byName = await TeacherRepository.getByFullName(teacherData.firstName, teacherData.lastName);
      if (byName && byName.id !== id) {
        const error = new Error('Otro profesor ya tiene el mismo nombre y apellido');
        error.code = 'NAME_EXISTS';
        throw error;
      }
    }

    // Ejecutar actualización
    await TeacherRepository.update(id, teacherData);
    return true;
  }

  /**
   * Eliminar profesor por id
   */
  static async deleteTeacher(id) {
    const deleted = await TeacherRepository.delete(id);
    if (!deleted) {
      const error = new Error('Profesor no encontrado');
      error.code = 'NOT_FOUND';
      throw error;
    }
    return true;
  }

  /**
   * Buscar profesores por filtros
   */
  static async searchTeachers(filters) {
    let teachers = await TeacherRepository.getAll();

    // Filtrar por modalidad
    if (filters.modality) {
      // filters.modality puede ser 'virtual' o 'presencial' o lista separada por comas
      const requested = Array.isArray(filters.modality) ? filters.modality : String(filters.modality).split(',');
      teachers = teachers.filter(t => {
        const modalities = t.modalities || (t.modality ? [t.modality] : []);
        return modalities.some(m => requested.includes(m));
      });
    }

    // Filtrar por materia
    if (filters.subject) {
      teachers = teachers.filter(t => t.subjects.includes(filters.subject));
    }

    // Filtrar por búsqueda de texto (nombre o descripción)
    if (filters.search) {
      const search = filters.search.toLowerCase();
      teachers = teachers.filter(t =>
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search)
      );
    }

    return teachers;
  }
}

module.exports = TeacherService;
