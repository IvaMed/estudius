// =====================================================
// SERVIDOR PRINCIPAL - Express
// =====================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const teacherRoutes = require('./routes/teacherRoutes');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

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

// Rutas de autenticación y bookings
app.use('/api', authRoutes);
app.use('/api', bookingRoutes);
// Rutas de profesores
app.use('/api', teacherRoutes);

// Servir index.html en la raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Rutas SPA - Servir index.html para todas las rutas no-API
app.get('/*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
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

app.listen(PORT, () => {
  console.log('');
  console.log('[OK] ESTUDIUS - Servidor iniciado');
  console.log(`[OK] URL: http://localhost:${PORT}`);
  console.log('[OK] Presiona Ctrl+C para detener');
  console.log('');
});

module.exports = app;
