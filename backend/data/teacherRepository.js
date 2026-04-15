// =====================================================
// CAPA DE DATOS - Repository (Acceso a BD)
// =====================================================

const { dbAll, dbGet, dbRun } = require('../database/db');
const fs = require('fs');
const path = require('path');

// Directorio de uploads del frontend (para fotos de ejemplo)
const uploadsDir = path.join(__dirname, '../../frontend/assets/uploads');

function findPhotoForId(id) {
  const exts = ['jpeg', 'jpg', 'png', 'webp'];
  const genders = ['hombres', 'mujeres'];

  for (const g of genders) {
    for (const ext of exts) {
      const p = path.join(uploadsDir, g, `${id}.${ext}`);
      if (fs.existsSync(p)) {
        return `/assets/uploads/${g}/${id}.${ext}`;
      }
    }
  }

  return null;
}

function normalizeTeacherRow(row) {
  const subjects = row.subjects ? JSON.parse(row.subjects) : [];
  const modalities = row.modalities ? JSON.parse(row.modalities) : (row.modality ? [row.modality] : []);
  let photo = row.photo || null;

  // Si hay una foto con el id en el filesystem, preferirla (útil si las fotos fueron restauradas)
  const foundById = findPhotoForId(row.id);
  if (foundById) {
    photo = foundById;
  } else if (photo) {
    // Si row.photo apunta a algo distinto, verificar que exista en disco
    try {
      const relPath = String(photo).replace(/^\/assets\/uploads\//, '');
      const fullPath = path.join(uploadsDir, relPath);
      if (!fs.existsSync(fullPath)) {
        photo = '/assets/uploads/default-avatar.svg';
      }
    } catch (err) {
      photo = '/assets/uploads/default-avatar.svg';
    }
  } else {
    photo = '/assets/uploads/default-avatar.svg';
  }

  // Sanitizar descripción: eliminar emails, números de teléfono y etiquetas de contacto
  const sanitizeDescription = (text) => {
    if (!text) return '';
    let s = String(text);
    // Eliminar emails
    s = s.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/ig, '');
    // Eliminar secuencias largas de números (teléfonos) con signos comunes + espacios paréntesis guiones
    s = s.replace(/(\+?\d[\d\-\s\(\)]{6,}\d)/g, '');
    // Eliminar palabras clave de contacto (Contacto:, Teléfono:, Celular:)
    s = s.replace(/\b(contacto|tel[eé]fono|telefono|celular)\b:?\s*/ig, '');
    // Colapsar espacios múltiples
    s = s.replace(/\s{2,}/g, ' ').trim();
    return s;
  };

  const description = sanitizeDescription(row.description);

  return {
    ...row,
    subjects,
    modalities,
    photo,
    description
  };
}

class TeacherRepository {
  /**
   * Crear un nuevo profesor
   */
  static async create(teacherData) {
    const {
      firstName,
      lastName,
      age,
      email,
      phone,
      description,
      curriculum,
      photo,
      classSize,
      subjects,
      modality,
      modalities,
      schedules,
      location
    } = teacherData;

    const sql = `
      INSERT INTO teachers (
        firstName, lastName, age, email, phone, description, curriculum,
        photo, classSize, subjects, modality, modalities, schedules, location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await dbRun(sql, [
      firstName,
      lastName,
      age,
      email,
      phone || null,
      description,
      curriculum,
      photo,
      classSize,
      JSON.stringify(subjects),
      modality,
      modalities ? JSON.stringify(modalities) : null,
      schedules,
      location || null
    ]);

    return result.id;
  }

  /**
   * Obtener todos los profesores
   */
  static async getAll() {
    const sql = 'SELECT * FROM teachers ORDER BY createdAt DESC';
    const teachers = await dbAll(sql);
    return teachers.map(t => normalizeTeacherRow(t));
  }

  /**
   * Obtener profesor por ID
   */
  static async getById(id) {
    const sql = 'SELECT * FROM teachers WHERE id = ?';
    const teacher = await dbGet(sql, [id]);
    
    if (teacher) {
      // Incrementar vistas para recomendación
      await this.incrementViews(id);
      return normalizeTeacherRow(teacher);
    }

    return null;
  }

  /**
   * Obtener profesor por email
   */
  static async getByEmail(email) {
    const sql = 'SELECT * FROM teachers WHERE email = ?';
    const teacher = await dbGet(sql, [email]);
    
    if (teacher) {
      teacher.subjects = JSON.parse(teacher.subjects);
      teacher.modalities = teacher.modalities ? JSON.parse(teacher.modalities) : (teacher.modality ? [teacher.modality] : []);
    }
    
    return teacher;
  }

  /**
   * Obtener profesor por nombre y apellido (insensible a mayúsculas)
   */
  static async getByFullName(firstName, lastName) {
    const sql = 'SELECT * FROM teachers WHERE LOWER(firstName) = ? AND LOWER(lastName) = ? LIMIT 1';
    const teacher = await dbGet(sql, [String(firstName || '').toLowerCase(), String(lastName || '').toLowerCase()]);
    if (teacher) return normalizeTeacherRow(teacher);
    return null;
  }

  /**
   * Obtener profesores para recomendación (algoritmo)
   * Usa: views, modality, subjects
   */
  static async getRecommended(limit = 10) {
    // Obtener profesores ordenados por vistas (desc) y fecha (desc)
    const sql = `
      SELECT * FROM teachers 
      ORDER BY views DESC, createdAt DESC 
      LIMIT ?
    `;
    
    const teachers = await dbAll(sql, [limit]);
    return teachers.map(t => normalizeTeacherRow(t));
  }

  /**
   * Obtener profesores aleatorios
   */
  static async getRandom(limit = 10) {
    const sql = `
      SELECT * FROM teachers 
      ORDER BY RANDOM() 
      LIMIT ?
    `;
    
    const teachers = await dbAll(sql, [limit]);
    return teachers.map(t => normalizeTeacherRow(t));
  }

  /**
   * Buscar profesores por materia
   */
  static async getBySubject(subject) {
    const sql = 'SELECT * FROM teachers';
    const all = await dbAll(sql);
    return all
      .filter(teacher => {
        const subjects = JSON.parse(teacher.subjects);
        return subjects.includes(subject);
      })
      .map(t => normalizeTeacherRow(t));
  }

  /**
   * Buscar profesores por modalidad
   */
  static async getByModality(modality) {
    // SQLite cannot easily query JSON arrays; obtener todos y filtrar en memoria
    const sql = 'SELECT * FROM teachers ORDER BY createdAt DESC';
    const teachers = await dbAll(sql);

    return teachers
      .filter(teacher => {
        const modalities = teacher.modalities ? JSON.parse(teacher.modalities) : (teacher.modality ? [teacher.modality] : []);
        return Array.isArray(modalities) && modalities.includes(modality);
      })
      .map(t => normalizeTeacherRow(t));
  }

  /**
   * Incrementar vistas (para recomendación)
   */
  static async incrementViews(id) {
    const sql = 'UPDATE teachers SET views = views + 1 WHERE id = ?';
    await dbRun(sql, [id]);
  }

  /**
   * Actualizar profesor
   */
  static async update(id, teacherData) {
    const { subjects, modalities, ...others } = teacherData;
    
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(others)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }

    if (subjects) {
      updates.push('subjects = ?');
      values.push(JSON.stringify(subjects));
    }

    if (modalities) {
      updates.push('modalities = ?');
      values.push(JSON.stringify(modalities));
    }

    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `UPDATE teachers SET ${updates.join(', ')} WHERE id = ?`;
    await dbRun(sql, values);
  }

  /**
   * Eliminar profesor
   */
  static async delete(id) {
    const sql = 'DELETE FROM teachers WHERE id = ?';
    const result = await dbRun(sql, [id]);
    return result.changes > 0;
  }

  /**
   * Contar profesores totales
   */
  static async count() {
    const sql = 'SELECT COUNT(*) as total FROM teachers';
    const result = await dbGet(sql);
    return result.total;
  }

  /**
   * Verificar si existe un profesor por email
   */
  static async existsByEmail(email) {
    const teacher = await this.getByEmail(email);
    return teacher !== undefined;
  }
}

module.exports = TeacherRepository;
