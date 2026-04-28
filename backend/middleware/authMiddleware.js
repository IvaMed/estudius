const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'estudius_dev_secret_please_change';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Token faltante' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ success: false, message: 'Formato de token inválido' });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Acceso denegado: se requiere rol admin' });
}

function requireUserRole(req, res, next) {
  if (req.user && req.user.role === 'user') return next();
  return res.status(403).json({ success: false, message: 'Acceso denegado: se requiere cuenta de usuario' });
}

module.exports = {
  authenticate,
  requireAdmin,
  requireUserRole,
};
