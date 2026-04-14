// =====================================================
// DEFINICIÓN DE RUTAS - API
// =====================================================

const express = require('express');
const TeacherController = require('../controllers/teacherController');

const router = express.Router();

// Rutas de Profesores
router.post('/teachers', TeacherController.createTeacher);
router.get('/teachers', TeacherController.getAllTeachers);
router.get('/teachers/recommendations', TeacherController.getRecommendedTeachers);
router.get('/teachers/random', TeacherController.getRandomTeachers);
router.get('/teachers/search', TeacherController.searchTeachers);
router.get('/teachers/:id', TeacherController.getTeacherById);
router.put('/teachers/:id', TeacherController.updateTeacher);
router.delete('/teachers/:id', TeacherController.deleteTeacher);

// Rutas de Utilidad
router.get('/subjects', TeacherController.getAvailableSubjects);
router.post('/upload', TeacherController.uploadPhoto);

// Ruta de health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

module.exports = router;
