// =====================================================
// DEFINICIÓN DE RUTAS - API
// =====================================================

const express = require('express');
const TeacherController = require('../controllers/teacherController');
const { authenticate, requireAdmin } = require('../../Backend/middleware/authMiddleware');

const router = express.Router();

// Rutas de Profesores
// Lecturas públicas
router.get('/teachers', TeacherController.getAllTeachers);
router.get('/teachers/recommendations', TeacherController.getRecommendedTeachers);
router.get('/teachers/random', TeacherController.getRandomTeachers);
router.get('/teachers/search', TeacherController.searchTeachers);
router.get('/teachers/:id/availability', TeacherController.getTeacherAvailability);
router.get('/teachers/:id', TeacherController.getTeacherById);

// Operaciones administrativas: requieren autenticación y rol admin
router.post('/teachers', authenticate, requireAdmin, TeacherController.createTeacher);
router.put('/teachers/:id', authenticate, requireAdmin, TeacherController.updateTeacher);
router.delete('/teachers/:id', authenticate, requireAdmin, TeacherController.deleteTeacher);

// Rutas de Utilidad
router.get('/subjects', TeacherController.getAvailableSubjects);
router.get('/subjects/grouped', TeacherController.getSubjectCategories);
router.post('/upload', TeacherController.uploadPhoto);

// Ruta de health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

module.exports = router;
