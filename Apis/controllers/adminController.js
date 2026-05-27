const bcrypt = require('bcryptjs');
const UserRepository = require('../../Backend/data/userRepository');

function checkPasswordStrength(password) {
  const errors = [];
  if (typeof password !== 'string' || password.length < 8) errors.push('La contraseña debe tener al menos 8 caracteres');
  if (!/[A-Za-z]/.test(password)) errors.push('La contraseña debe incluir al menos una letra');
  if (!/[0-9]/.test(password)) errors.push('La contraseña debe incluir al menos un número');
  return errors;
}

class AdminController {
  static async listUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const search = req.query.search ? String(req.query.search).trim() : null;
      const excludeId = req.user && req.user.id ? req.user.id : null;

      const offset = (page - 1) * pageSize;
      const users = await UserRepository.findUsers({ search, offset, limit: pageSize, excludeId });
      const totalCount = await UserRepository.countUsers({ search, excludeId });

      return res.json({ success: true, users, totalCount, page, pageSize });
    } catch (err) {
      console.error('Admin.listUsers error:', err);
      return res.status(500).json({ success: false, message: 'Error interno al listar usuarios' });
    }
  }

  static async deleteUser(req, res) {
    try {
      const targetId = req.params.id;
      // Nunca permitir borrar la cuenta super-admin
      const target = await UserRepository.getByIdWithHash(targetId);
      if (!target) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      if (target.email && target.email.toLowerCase() === 'admin@gmail.com') {
        return res.status(403).json({ success: false, message: 'No permitido borrar la cuenta super-admin' });
      }

      const deleted = await UserRepository.deleteUser(targetId);
      if (!deleted) return res.status(404).json({ success: false, message: 'Usuario no encontrado o no eliminado' });
      return res.json({ success: true, message: 'Usuario eliminado' });
    } catch (err) {
      console.error('Admin.deleteUser error:', err);
      return res.status(500).json({ success: false, message: 'Error interno al eliminar usuario' });
    }
  }

  static async updateUserRole(req, res) {
    try {
      const targetId = req.params.id;
      const { role } = req.body || {};
      if (!['user', 'admin'].includes(role)) return res.status(400).json({ success: false, message: 'Rol inválido' });
      const updated = await UserRepository.updateRole(targetId, role);
      if (!updated) return res.status(404).json({ success: false, message: 'Usuario no encontrado o no actualizado' });
      return res.json({ success: true, message: 'Rol actualizado' });
    } catch (err) {
      console.error('Admin.updateUserRole error:', err);
      return res.status(500).json({ success: false, message: 'Error interno al actualizar rol' });
    }
  }

  static async setUserPassword(req, res) {
    try {
      const targetId = req.params.id;
      const { newPassword } = req.body || {};
      if (!newPassword) return res.status(400).json({ success: false, message: 'Se requiere nueva contraseña' });
      const pwErrors = checkPasswordStrength(newPassword);
      if (pwErrors.length > 0) return res.status(400).json({ success: false, message: 'Contraseña insegura', errors: pwErrors });
      const hash = bcrypt.hashSync(newPassword, 10);
      const updated = await UserRepository.updatePassword(targetId, hash);
      if (!updated) return res.status(404).json({ success: false, message: 'Usuario no encontrado o no actualizado' });
      return res.json({ success: true, message: 'Contraseña actualizada por admin' });
    } catch (err) {
      console.error('Admin.setUserPassword error:', err);
      return res.status(500).json({ success: false, message: 'Error interno al actualizar contraseña' });
    }
  }
}

module.exports = AdminController;
