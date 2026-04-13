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
    const virtual = teachers.filter(t => t.modality === 'virtual');
    const presencial = teachers.filter(t => t.modality === 'presencial');

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

    // Validar modality
    if (!ValidateTeacher.modality(data.modality)) {
      errors.modality = 'Modalidad debe ser "virtual" o "presencial"';
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
   * Buscar profesores por filtros
   */
  static async searchTeachers(filters) {
    let teachers = await TeacherRepository.getAll();

    // Filtrar por modalidad
    if (filters.modality) {
      teachers = teachers.filter(t => t.modality === filters.modality);
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
