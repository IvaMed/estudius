const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { authenticate, requireSuperAdmin } = require('../middleware/authMiddleware');

// List users (super-admin only)
router.get('/admin/users', authenticate, requireSuperAdmin, AdminController.listUsers);

// Update role (super-admin only)
router.patch('/admin/users/:id', authenticate, requireSuperAdmin, AdminController.updateUserRole);

// Set password for a user (super-admin only)
router.post('/admin/users/:id/set-password', authenticate, requireSuperAdmin, AdminController.setUserPassword);

// Delete user (super-admin only)
router.delete('/admin/users/:id', authenticate, requireSuperAdmin, AdminController.deleteUser);

module.exports = router;
