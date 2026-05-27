const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'estudius_dev_secret_please_change';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  try {
    console.log(`[AUTH] ${new Date().toISOString()} ${req.method} ${req.path} from ${req.ip} Authorization=${authHeader ? authHeader.slice(0,20) : 'NONE'}`);
  } catch (e) {
    // ignore logging failures
  }
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

function requireSuperAdmin(req, res, next) {
  // Super admin is the seeded admin account (admin@gmail.com)
  if (req.user && req.user.email && req.user.email.toLowerCase() === 'admin@gmail.com') return next();
  return res.status(403).json({ success: false, message: 'Acceso denegado: se requiere super-admin' });
}

function requireUserRole(req, res, next) {
  if (req.user && req.user.role === 'user') return next();
  return res.status(403).json({ success: false, message: 'Acceso denegado: se requiere cuenta de usuario' });
}

/** Reservas y listados de alumno: usuarios registrados y administradores. */
function requireBookableRole(req, res, next) {
  if (req.user && (req.user.role === 'user' || req.user.role === 'admin')) return next();
  return res.status(403).json({
    success: false,
    message: 'Acceso denegado: iniciá sesión con una cuenta de usuario o administrador'
  });
}

module.exports = {
  authenticate,
  requireAdmin,
  requireUserRole,
  requireBookableRole,
  requireSuperAdmin,
};

