// =====================================================
// CAPA DE APLICACIÓN - Controller (Manejo HTTP)
// =====================================================

const TeacherService = require('../services/teacherService');
const path = require('path');
const fs = require('fs');

class TeacherController {
  /**
   * Crear un nuevo profesor
   * POST /api/teachers
   */
  static async createTeacher(req, res) {
    try {
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
      } = req.body;

      // Si la foto viene como data URL (base64), guardarla en disco y reemplazar por ruta
      let finalPhoto = photo;
      try {
        if (photo && typeof photo === 'string' && photo.startsWith('data:image')) {
          const uploadsDir = path.join(__dirname, '../../frontend/assets/uploads/others');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

          // Extraer tipo y data
          const matches = photo.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
          const ext = (matches && matches[1]) ? matches[1] : 'png';
          const base64Data = (matches && matches[2]) ? matches[2] : photo.split(',')[1];

          // Sanear nombre de archivo a partir de nombre y apellido
          const sanitize = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
          let baseName = `${sanitize(firstName)}_${sanitize(lastName)}` || `teacher_${Date.now()}`;
          let fileName = `${baseName}.${ext}`;
          let idx = 1;
          while (fs.existsSync(path.join(uploadsDir, fileName))) {
            fileName = `${baseName}_${idx}.${ext}`;
            idx++;
          }

          const filePath = path.join(uploadsDir, fileName);
          const buffer = Buffer.from(base64Data, 'base64');
          fs.writeFileSync(filePath, buffer);
          finalPhoto = `/assets/uploads/others/${fileName}`;
        }
      } catch (err) {
        console.error('Error guardando foto:', err);
        // no bloquear la creación si falla la subida de la foto, sólo loguear
      }
      // Normalizar modalidades y modalidad principal
      const finalModalities = Array.isArray(modalities) ? modalities : (modalities ? [modalities] : (modality ? [modality] : []));
      const finalModality = (finalModalities && finalModalities.length > 0) ? finalModalities[0] : (modality || null);

      // Llamar al servicio
      console.log('Creating teacher - modalities:', finalModalities, 'modality:', finalModality);
      const teacherId = await TeacherService.createTeacher({
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        age: parseInt(age),
        email: email?.trim().toLowerCase(),
        phone: phone?.trim() || null,
        description: description?.trim(),
        curriculum: curriculum?.trim(),
        photo: finalPhoto,
        classSize: parseInt(classSize),
        subjects: Array.isArray(subjects) ? subjects : [],
        modality: finalModality,
        modalities: finalModalities,
        schedules: schedules?.trim(),
        location: location?.trim() || null
      });

      res.status(201).json({
        success: true,
        message: 'Profesor creado exitosamente',
        teacherId
      });
    } catch (error) {
      if (error.code === 'EMAIL_EXISTS') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === 'NAME_EXISTS') {
        return res.status(400).json({ success: false, message: error.message });
      }

      if (error.details) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: error.details
        });
      }

      console.error('Error en createTeacher:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear profesor',
        error: error.message
      });
    }
  }

  /**
   * Obtener todos los profesores
   * GET /api/teachers
   */
  static async getAllTeachers(req, res) {
    try {
      const teachers = await TeacherService.getAllTeachers();
      res.json({
        success: true,
        count: teachers.length,
        data: teachers
      });
    } catch (error) {
      console.error('Error en getAllTeachers:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener profesores',
        error: error.message
      });
    }
  }

  /**
   * Obtener profesor por ID
   * GET /api/teachers/:id
   */
  static async getTeacherById(req, res) {
    try {
      const { id } = req.params;
      const teacher = await TeacherService.getTeacherById(id);
      
      res.json({
        success: true,
        data: teacher
      });
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error en getTeacherById:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener profesor',
        error: error.message
      });
    }
  }

  /**
   * Actualizar profesor
   * PUT /api/teachers/:id
   */
  static async updateTeacher(req, res) {
    try {
      const { id } = req.params;
      const teacherData = req.body;

      await TeacherService.updateTeacher(parseInt(id), teacherData);

      res.json({
        success: true,
        message: 'Profesor actualizado exitosamente'
      });
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return res.status(404).json({ success: false, message: error.message });
      }

      if (error.details) {
        return res.status(400).json({ success: false, message: 'Datos inválidos', errors: error.details });
      }

      console.error('Error en updateTeacher:', error);
      res.status(500).json({ success: false, message: 'Error al actualizar profesor', error: error.message });
    }
  }

  /**
   * Eliminar profesor
   * DELETE /api/teachers/:id
   */
  static async deleteTeacher(req, res) {
    try {
      const { id } = req.params;
      const deleted = await TeacherService.deleteTeacher(parseInt(id));

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Profesor no encontrado' });
      }

      res.json({ success: true, message: 'Profesor eliminado exitosamente' });
    } catch (error) {
      console.error('Error en deleteTeacher:', error);
      res.status(500).json({ success: false, message: 'Error al eliminar profesor', error: error.message });
    }
  }

  /**
   * Obtener profesores recomendados (con algoritmo)
   * GET /api/teachers/recommendations
   */
  static async getRecommendedTeachers(req, res) {
    try {
      const { limit = 10 } = req.query;
      const teachers = await TeacherService.getRecommendedTeachers(parseInt(limit));
      
      res.json({
        success: true,
        count: teachers.length,
        data: teachers
      });
    } catch (error) {
      console.error('Error en getRecommendedTeachers:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener recomendaciones',
        error: error.message
      });
    }
  }

  /**
   * Obtener profesores aleatorios
   * GET /api/teachers/random
   */
  static async getRandomTeachers(req, res) {
    try {
      const { limit = 10 } = req.query;
      const teachers = await TeacherService.getRandomTeachers(parseInt(limit));
      
      res.json({
        success: true,
        count: teachers.length,
        data: teachers
      });
    } catch (error) {
      console.error('Error en getRandomTeachers:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener profesores aleatorios',
        error: error.message
      });
    }
  }

  /**
   * Obtener materias disponibles
   * GET /api/subjects
   */
  static async getAvailableSubjects(req, res) {
    try {
      const subjects = TeacherService.getAvailableSubjects();
      res.json({
        success: true,
        data: subjects
      });
    } catch (error) {
      console.error('Error en getAvailableSubjects:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener materias',
        error: error.message
      });
    }
  }

  /**
   * Buscar profesores con filtros
   * GET /api/teachers/search
   */
  static async searchTeachers(req, res) {
    try {
      const { modality, subject, search } = req.query;
      
      const teachers = await TeacherService.searchTeachers({
        modality,
        subject,
        search
      });
      
      res.json({
        success: true,
        count: teachers.length,
        data: teachers
      });
    } catch (error) {
      console.error('Error en searchTeachers:', error);
      res.status(500).json({
        success: false,
        message: 'Error al buscar profesores',
        error: error.message
      });
    }
  }

  /**
   * Subir foto de profesor
   * POST /api/upload
   */
  static async uploadPhoto(req, res) {
    try {
      // Este endpoint es un placeholder para manejo de archivos
      // En producción se usaría multer o similar
      
      const { photoData, photoName } = req.body;
      
      // Guardar en carpeta local (ejemplo simplificado)
      const uploadsDir = path.join(__dirname, '../../frontend/assets/uploads');
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `${Date.now()}_${photoName}`;
      const filePath = path.join(uploadsDir, fileName);

      // Aquí iría la lógica de guardar archivo real
      // Por ahora, retornar la ruta del archivo

      res.json({
        success: true,
        message: 'Foto subida exitosamente',
        path: `/assets/uploads/${fileName}`
      });
    } catch (error) {
      console.error('Error en uploadPhoto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al subir foto',
        error: error.message
      });
    }
  }
}

module.exports = TeacherController;
