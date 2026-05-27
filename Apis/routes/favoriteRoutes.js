const express = require('express');
const FavoriteController = require('../controllers/favoriteController');
const { authenticate } = require('../../Backend/middleware/authMiddleware');

const router = express.Router();

router.get('/favorites/ids', authenticate, FavoriteController.listIds);
router.get('/favorites', authenticate, FavoriteController.listTeachers);
/** Preferir cuerpo JSON (evita 404 en algunos despliegues con rutas anidadas) */
router.post('/favorites/toggle', authenticate, FavoriteController.toggleFromBody);
router.delete('/favorites', authenticate, FavoriteController.removeByQuery);
/** Compatibilidad */
router.post('/favorites/:teacherId/toggle', authenticate, FavoriteController.toggle);
router.delete('/favorites/:teacherId', authenticate, FavoriteController.remove);

module.exports = router;
