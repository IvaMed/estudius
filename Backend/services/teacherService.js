// =====================================================
// CAPA DE APLICACIÓN - Service (Lógica de Negocio)
// =====================================================

const TeacherRepository = require('../data/teacherRepository');
const { ValidateTeacher, ALL_SUBJECTS } = require('../models/teacherModel');
const { normalizeLocationPayload, locationMatchesSearch } = require('../lib/locationUtils');
const { dbAll } = require('../../Database/db');
const {
  validateScheduleShape,
  serializeScheduleForDb,
  uniqueDowsInDateRangeInclusive,
  teacherMatchesAvailability,
  teacherMatchesDowWindow,
  timeToMinutes
} = require('../lib/scheduleUtils');

function isPositiveIntegerString(value) {
  if (value == null) return false;
  const t = String(value).trim();
  return /^[1-9]\d*$/.test(t);
}

function isApartmentValueValid(value) {
  if (value == null) return true;
  const t = String(value).trim();
  if (!t) return true;
  return /^[A-Za-z0-9\s]+$/.test(t);
}

async function loadCustomSubjectsFromDatabase() {
  try {
    const rows = await dbAll(
      `SELECT fi.name
       FROM feature_items fi
       INNER JOIN feature_categories fc ON fc.id = fi.categoryId
       WHERE fc.type = ?
       ORDER BY fc.name ASC, fi.position ASC, fi.name ASC`,
      ['subject']
    );

    return (rows || [])
      .map((row) => String(row.name || '').trim())
      .filter(Boolean);
  } catch (error) {
    console.warn('No se pudieron cargar materias custom desde la base de datos:', error.message || error);
    return [];
  }
}

class TeacherService {
  /**
   * Crear un nuevo profesor con validaciones completas
   */
  static async createTeacher(teacherData) {
    // Validar todos los campos
    const validation = await this.validateTeacherData(teacherData);
    
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

    const sch = validateScheduleShape(teacherData.schedules);
    const loc = normalizeLocationPayload(teacherData);
    const payload = {
      ...teacherData,
      ...loc,
      schedules: serializeScheduleForDb(sch.data)
    };

    const teacherId = await TeacherRepository.create(payload);
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
  static async validateTeacherData(data) {
    const errors = {};
    const allowedSubjects = await this.getAvailableSubjects();

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
      errors.classSize = 'Cantidad de alumnos debe ser un número entre 1 y 40';
    }

    // Validar subjects
    if (!ValidateTeacher.subjects(data.subjects, allowedSubjects)) {
      errors.subjects = 'Debe seleccionar al menos una materia válida';
    }

    // Validar modalities (acepta string o array)
    if (!ValidateTeacher.modalities(data.modalities || data.modality)) {
      errors.modalities = 'Modalidad debe ser "virtual" o "presencial" (puede ser múltiple)';
    }

    const schVal = validateScheduleShape(data.schedules);
    if (!schVal.ok) {
      errors.schedules = schVal.message;
    }

    // Validar location (obligatorio si presencial)
    if (!ValidateTeacher.location(data, data.modalities || data.modality)) {
      errors.location = 'Calle y número son obligatorios para clases presenciales';
    }

    const loc = normalizeLocationPayload(data);
    if (loc.locationNumber && !isPositiveIntegerString(loc.locationNumber)) {
      errors.locationNumber = 'El numero de calle debe ser un entero positivo';
    }
    if (loc.locationApartment && !isApartmentValueValid(loc.locationApartment)) {
      errors.locationApartment = 'El depto/piso debe ser alfanumerico, sin signos ni decimales';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Obtener lista de todas las materias disponibles
   */
  static async getAvailableSubjects() {
    const customSubjects = await loadCustomSubjectsFromDatabase();
    return [...new Set([...ALL_SUBJECTS, ...customSubjects])];
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
    const validation = await this.validateTeacherData(teacherData);
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

    const sch = validateScheduleShape(teacherData.schedules);
    const loc = normalizeLocationPayload(teacherData);
    const payload = {
      ...teacherData,
      ...loc,
      schedules: serializeScheduleForDb(sch.data)
    };

    await TeacherRepository.update(id, payload);
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

    // Filtrar por búsqueda de texto (nombre, descripción o ubicación)
    if (filters.search) {
      const search = String(filters.search)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      teachers = teachers.filter((t) => {
        const name = `${t.firstName} ${t.lastName}`.toLowerCase();
        return (
          name.includes(search) ||
          String(t.description || '')
            .toLowerCase()
            .includes(search) ||
          locationMatchesSearch(t, search)
        );
      });
    }

    // Filtro por rango de fechas + franja horaria (días que aparecen entre dateFrom y dateTo)
    const { dateFrom, dateTo, timeStart, timeEnd, dow } = filters;
    if (dateFrom && dateTo && timeStart && timeEnd) {
      const dows = uniqueDowsInDateRangeInclusive(String(dateFrom), String(dateTo));
      const fs = timeToMinutes(String(timeStart));
      const fe = timeToMinutes(String(timeEnd));
      if (dows && dows.length > 0 && fs != null && fe != null) {
        teachers = teachers.filter((t) =>
          teacherMatchesAvailability(t.schedules, dows, fs, fe)
        );
      }
    }

    // Filtro por día de semana (0–6) + franja horaria
    if (dow !== undefined && dow !== null && String(dow).trim() !== '' && timeStart && timeEnd) {
      const dowNum = parseInt(String(dow), 10);
      const fs = timeToMinutes(String(timeStart));
      const fe = timeToMinutes(String(timeEnd));
      if (!Number.isNaN(dowNum) && dowNum >= 0 && dowNum <= 6 && fs != null && fe != null) {
        teachers = teachers.filter((t) =>
          teacherMatchesDowWindow(t.schedules, dowNum, fs, fe)
        );
      }
    }

    return teachers;
  }
}

module.exports = TeacherService;
