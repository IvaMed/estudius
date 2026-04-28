const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../data/userRepository');

const SECRET = process.env.JWT_SECRET || 'estudius_dev_secret_please_change';

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function checkPasswordStrength(password) {
  // Reglas: mínimo 8 caracteres, al menos una minúscula, una mayúscula, un número y un símbolo
  const errors = [];
  if (typeof password !== 'string' || password.length < 8) errors.push('La contraseña debe tener al menos 8 caracteres');
  if (!/[A-Za-z]/.test(password)) errors.push('La contraseña debe incluir al menos una letra');
  if (!/[0-9]/.test(password)) errors.push('La contraseña debe incluir al menos un número');
  return errors;
}

class AuthController {
  static async register(req, res) {
    try {
      const { firstName, lastName, email, password } = req.body || {};
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({ success: false, message: 'Email inválido' });
      }

      const pwErrors = checkPasswordStrength(password);
      if (pwErrors.length > 0) {
        return res.status(400).json({ success: false, message: 'Contraseña insegura', errors: pwErrors });
      }

      const exists = await UserRepository.getByEmail(email.toLowerCase());
      if (exists) {
        return res.status(400).json({ success: false, message: 'Ya existe una cuenta con ese email', emailExists: true });
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      const userId = await UserRepository.create({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.toLowerCase().trim(), passwordHash, role: 'user' });

      const user = await UserRepository.getById(userId);
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName }, SECRET, { expiresIn: '7d' });

      return res.json({ success: true, message: 'Registro exitoso', token, user });
    } catch (error) {
      console.error('Error en register:', error);
      return res.status(500).json({ success: false, message: 'Error interno al registrar' });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
      }

      const user = await UserRepository.getByEmail(email.toLowerCase());
      if (!user) {
        return res.status(401).json({ success: false, message: 'Email o contraseña incorrectos', notRegistered: true });
      }

      const match = bcrypt.compareSync(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Email o contraseña incorrectos' });
      }

      const safeUser = await UserRepository.getById(user.id);
      const token = jwt.sign({ id: safeUser.id, email: safeUser.email, role: safeUser.role, firstName: safeUser.firstName, lastName: safeUser.lastName }, SECRET, { expiresIn: '7d' });

      return res.json({ success: true, message: 'Login exitoso', token, user: safeUser });
    } catch (error) {
      console.error('Error en login:', error);
      return res.status(500).json({ success: false, message: 'Error interno al iniciar sesión' });
    }
  }

  static async me(req, res) {
    try {
      // El middleware `authenticate` coloca req.user
      const payload = req.user;
      if (!payload || !payload.id) return res.status(401).json({ success: false, message: 'No autenticado' });
      const user = await UserRepository.getById(payload.id);
      if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return res.json({ success: true, user });
    } catch (error) {
      console.error('Error en me:', error);
      return res.status(500).json({ success: false, message: 'Error interno' });
    }
  }

  static async changePassword(req, res) {
    try {
      const payload = req.user;
      console.log('[AUTH] changePassword called for user', payload && payload.id);
      console.log('[AUTH] raw body keys:', Object.keys(req.body || {}));
      if (!payload || !payload.id) return res.status(401).json({ success: false, message: 'No autenticado' });

      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Ambas contraseñas son requeridas' });

      // Validar seguridad de nueva contraseña
      const pwErrors = checkPasswordStrength(newPassword);
      if (pwErrors.length > 0) return res.status(400).json({ success: false, message: 'Contraseña insegura', errors: pwErrors });

      // Obtener usuario con hash y verificar contraseña actual
      const user = await UserRepository.getByIdWithHash(payload.id);
      console.log('[AUTH] user fetched id:', user && user.id);
      // Avoid logging raw passwords; only log lengths for debugging
      console.log('[AUTH] currentPassword length:', (currentPassword || '').length, ' newPassword length:', (newPassword || '').length);
      if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

      const match = bcrypt.compareSync(currentPassword, user.passwordHash);
      if (!match) return res.status(401).json({ success: false, message: 'Contraseña actual incorrecta' });

      const newHash = bcrypt.hashSync(newPassword, 10);
      const updated = await UserRepository.updatePassword(payload.id, newHash);
      if (!updated) return res.status(500).json({ success: false, message: 'No se pudo actualizar la contraseña' });

      return res.json({ success: true, message: 'Contraseña actualizada correctamente' });
    } catch (error) {
      console.error('Error en changePassword:', error);
      return res.status(500).json({ success: false, message: 'Error interno al actualizar contraseña' });
    }
  }
}

module.exports = AuthController;
