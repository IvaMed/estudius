// =====================================================
// CAPA DE DATOS - Repository (Acceso a BD)
// =====================================================

const { dbAll, dbGet, dbRun } = require('../database/db');

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
      schedules,
      location
    } = teacherData;

    const sql = `
      INSERT INTO teachers (
        firstName, lastName, age, email, phone, description, curriculum,
        photo, classSize, subjects, modality, schedules, location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    
    // Parsear JSON fields
    return teachers.map(teacher => ({
      ...teacher,
      subjects: JSON.parse(teacher.subjects)
    }));
  }

  /**
   * Obtener profesor por ID
   */
  static async getById(id) {
    const sql = 'SELECT * FROM teachers WHERE id = ?';
    const teacher = await dbGet(sql, [id]);
    
    if (teacher) {
      teacher.subjects = JSON.parse(teacher.subjects);
      // Incrementar vistas para recomendación
      await this.incrementViews(id);
    }
    
    return teacher;
  }

  /**
   * Obtener profesor por email
   */
  static async getByEmail(email) {
    const sql = 'SELECT * FROM teachers WHERE email = ?';
    const teacher = await dbGet(sql, [email]);
    
    if (teacher) {
      teacher.subjects = JSON.parse(teacher.subjects);
    }
    
    return teacher;
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
    
    return teachers.map(teacher => ({
      ...teacher,
      subjects: JSON.parse(teacher.subjects)
    }));
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
    
    return teachers.map(teacher => ({
      ...teacher,
      subjects: JSON.parse(teacher.subjects)
    }));
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
      .map(teacher => ({
        ...teacher,
        subjects: JSON.parse(teacher.subjects)
      }));
  }

  /**
   * Buscar profesores por modalidad
   */
  static async getByModality(modality) {
    const sql = 'SELECT * FROM teachers WHERE modality = ? ORDER BY createdAt DESC';
    const teachers = await dbAll(sql, [modality]);
    
    return teachers.map(teacher => ({
      ...teacher,
      subjects: JSON.parse(teacher.subjects)
    }));
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
    const { subjects, ...others } = teacherData;
    
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
