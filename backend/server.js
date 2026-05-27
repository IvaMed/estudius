// =====================================================
// SERVIDOR PRINCIPAL - Express
// =====================================================

require('./register-modules');

const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const http = require('http');
const https = require('https');
const { createLanTlsCredentials } = require('./lib/lanTls');
const teacherRoutes = require('../Apis/routes/teacherRoutes');
const authRoutes = require('../Apis/routes/authRoutes');
const bookingRoutes = require('../Apis/routes/bookingRoutes');
const adminRoutes = require('../Apis/routes/adminRoutes');
const FavoriteController = require('../Apis/controllers/favoriteController');
const TeacherController = require('../Apis/controllers/teacherController');
const { authenticate } = require('./middleware/authMiddleware');

const FRONTEND_DIR = path.join(__dirname, '../Frontend');

const app = express();
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// =====================================================
// MIDDLEWARE
// =====================================================

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check (útil para probar desde el celular)
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'estudius',
    time: new Date().toISOString(),
    protocol: req.protocol,
    hint: 'Si ves ERR_SSL_PROTOCOL_ERROR, usá http:// en puerto 3000 o https:// en puerto 3443'
  });
});

app.get('/conectar-celular', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'conectar-celular.html'));
});

// /assets/* → Frontend/Assets (mantiene URLs existentes /assets/uploads/...)
app.use(
  '/assets',
  express.static(path.join(FRONTEND_DIR, 'Assets'), {
    etag: true,
    maxAge: 0
  })
);

// Servir archivos estáticos del frontend (sin caché agresivo en desarrollo)
app.use(
  express.static(FRONTEND_DIR, {
    etag: true,
    maxAge: 0,
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  })
);

// =====================================================
// LOGGING MIDDLEWARE
// =====================================================

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

// =====================================================
// RUTAS
// =====================================================

// Favoritos: rutas registradas en la app principal (evita 404 si el orden de routers submontados falla)
app.get('/api/favorites/ids', authenticate, FavoriteController.listIds);
app.get('/api/favorites', authenticate, FavoriteController.listTeachers);
app.post('/api/favorites/toggle', authenticate, FavoriteController.toggleFromBody);
app.delete('/api/favorites', authenticate, FavoriteController.removeByQuery);

/** Disponibilidad pública (misma ruta que en teacherRoutes, registrada aquí por si el router falla) */
app.get('/api/teachers/:id/availability', TeacherController.getTeacherAvailability);

// Rutas de autenticación y bookings
app.use('/api', authRoutes);
app.use('/api', bookingRoutes);
// Rutas de profesores
app.use('/api', teacherRoutes);
const featuresRoutes = require('../Apis/routes/featuresRoutes');

// Rutas de administración
app.use('/api', adminRoutes);
// Montar rutas de características bajo /api/admin para mantener consistencia con frontend
app.use('/api/admin', featuresRoutes);

// Servir index.html en la raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// Rutas SPA - Servir index.html para todas las rutas no-API
app.get('/*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
  } else {
    res.status(404).json({
      success: false,
      message: 'Endpoint no encontrado'
    });
  }
});

// Manejo de endpoints /api/* no definidos (todas las methods) - devolver JSON en lugar de HTML
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint API no encontrado', path: req.path, method: req.method });
});

// =====================================================
// MANEJO DE ERRORES
// =====================================================

app.use((err, req, res, next) => {
  console.error('ERROR:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: err.message
  });
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================

function isVirtualInterface(name) {
  const n = String(name || '').toLowerCase();
  return (
    n.includes('vethernet') ||
    n.includes('vmware') ||
    n.includes('virtual') ||
    n.includes('hyper-v') ||
    n.includes('loopback')
  );
}

function getLanIPv4Addresses() {
  const scored = [];
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    if (isVirtualInterface(name)) continue;
    for (const net of nets[name] || []) {
      if (net.family !== 'IPv4' || net.internal) continue;
      const ip = net.address;
      if (ip.startsWith('169.254.') || ip.startsWith('192.168.56.')) continue;
      let score = 3;
      const nl = name.toLowerCase();
      if (nl.includes('wi-fi') || nl.includes('wifi') || nl.includes('wlan')) score = 0;
      else if (nl.includes('ethernet') || nl.includes('eth')) score = 1;
      if (ip.startsWith('192.168.')) score -= 0.5;
      scored.push({ ip, score });
    }
  }
  const byIp = new Map();
  scored.forEach(({ ip, score }) => {
    if (!byIp.has(ip) || byIp.get(ip) > score) byIp.set(ip, score);
  });
  return [...byIp.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([ip]) => ip);
}

function printStartupUrls(lanIps) {
  console.log('');
  console.log('[OK] ESTUDIUS - Servidor iniciado');
  console.log(`[OK] PC (HTTP):      http://localhost:${PORT}`);
  console.log(`[OK] PC (HTTPS):     https://localhost:${HTTPS_PORT}`);
  if (lanIps.length) {
    lanIps.forEach((ip) => {
      console.log(`[OK] Celular (HTTP):  http://${ip}:${PORT}`);
      console.log(`[OK] Celular (HTTPS): https://${ip}:${HTTPS_PORT}  <- si Chrome fuerza HTTPS`);
    });
  } else {
    console.log(`[OK] Celular: http(s)://<IP-WiFi-PC>:${PORT} o :${HTTPS_PORT}`);
  }
  console.log('');
  console.log('[!!] ERR_SSL_PROTOCOL_ERROR en el celular = abriste https:// en el puerto', PORT);
  console.log('[!!] Usá http://IP:' + PORT + '  o  https://IP:' + HTTPS_PORT + ' (aceptá la advertencia)');
  console.log('[OK] Presiona Ctrl+C para detener');
  console.log('');
}

const lanIps = getLanIPv4Addresses();

http.createServer(app).listen(PORT, '0.0.0.0', () => {
  printStartupUrls(lanIps);
});

try {
  const tls = createLanTlsCredentials(lanIps);
  https.createServer(tls, app).listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`[OK] HTTPS LAN activo en puerto ${HTTPS_PORT}`);
  });
} catch (err) {
  console.warn('[WARN] No se pudo iniciar HTTPS (npm install en Backend):', err.message);
}

module.exports = app;
