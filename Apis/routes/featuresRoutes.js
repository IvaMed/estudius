const express = require('express');
const router = express.Router();
const FeaturesController = require('../controllers/featuresController');
const { authenticate, requireAdmin } = require('../../Backend/middleware/authMiddleware');

// List categories and items
router.get('/features', authenticate, requireAdmin, FeaturesController.list);

// Categories
router.post('/features/categories', authenticate, requireAdmin, FeaturesController.createCategory);
router.patch('/features/categories/:id', authenticate, requireAdmin, FeaturesController.updateCategory);
router.delete('/features/categories/:id', authenticate, requireAdmin, FeaturesController.deleteCategory);

// Items
router.post('/features/items', authenticate, requireAdmin, FeaturesController.createItem);
router.patch('/features/items/:id', authenticate, requireAdmin, FeaturesController.updateItem);
router.delete('/features/items/:id', authenticate, requireAdmin, FeaturesController.deleteItem);

module.exports = router;
