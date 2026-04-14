// =====================================================
// SERVIDOR PRINCIPAL - Express
// =====================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const teacherRoutes = require('./routes/teacherRoutes');

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
  console.log('╔════════════════════════════════════╗');
  console.log('║     ESTUDIUS - Servidor iniciado    ║');
  console.log('╠════════════════════════════════════╣');
  console.log(`║ URL: http://localhost:${PORT}`.padEnd(36) + '║');
  console.log('║ Presiona Ctrl+C para detener       ║');
  console.log('╚════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
