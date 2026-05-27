#!/usr/bin/env node

/**
 * ========================================
 * SCRIPT DE INICIO RÁPIDO - ESTUDIUS
 * ========================================
 * 
 * Este script configura e inicia la plataforma
 * Uso: node start.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function main() {
  log('\n╔════════════════════════════════════╗', 'bright');
  log('║        ESTUDIUS - STARTUP          ║', 'bright');
  log('╚════════════════════════════════════╝\n', 'bright');

  // Verificar Node.js
  log('1️⃣ Verificando Node.js...', 'blue');
  try {
    const nodeVersion = execSync('node --version').toString().trim();
    log(`   ✓ Node.js ${nodeVersion}`, 'green');
  } catch (error) {
    log('   ✗ Node.js no está instalado', 'red');
    log('   Descárgalo desde: https://nodejs.org/', 'yellow');
    process.exit(1);
  }

  // Verificar carpetas
  log('\n2️⃣ Verificando estructura...', 'blue');
  const paths = [
    'Frontend',
    'Backend',
    'Database',
    'Backend/package.json',
    'Database/schema.sql',
  ];

  let validStructure = true;
  paths.forEach(p => {
    if (fs.existsSync(p)) {
      log(`   ✓ ${p}`, 'green');
    } else {
      log(`   ✗ ${p} no encontrado`, 'red');
      validStructure = false;
    }
  });

  if (!validStructure) {
    log('\n⚠️ Estructura incompleta. Verifica las carpetas.', 'yellow');
    process.exit(1);
  }

  // Instalar dependencias
  log('\n3️⃣ Instalando dependencias...', 'blue');
  try {
    if (!fs.existsSync('Backend/node_modules')) {
      log('   Ejecutando: npm install', 'yellow');
      execSync('cd Backend && npm install', { stdio: 'inherit' });
      log('   ✓ Dependencias instaladas', 'green');
    } else {
      log('   ✓ Dependencias ya están instaladas', 'green');
    }
  } catch (error) {
    log('   ✗ Error al instalar dependencias', 'red');
    process.exit(1);
  }

  // Verificar Base de Datos
  log('\n4️⃣ Verificando base de datos...', 'blue');
  const dbPath = 'Database/estudius.db';
  if (fs.existsSync(dbPath)) {
    log(`   ✓ Base de datos existente: ${dbPath}`, 'green');
  } else {
    log(`   ℹ Base de datos se creará al iniciar el servidor`, 'blue');
  }

  // Verificar puerto
  log('\n5️⃣ Verificando puerto 3000...', 'blue');
  const http = require('http');
  const server = http.createServer();
  
  server.listen(3000, () => {
    server.close();
    log('   ✓ Puerto 3000 disponible', 'green');
    startServer();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      log('   ✗ Puerto 3000 ya está en uso', 'red');
      log('   Opciones:', 'yellow');
      log('   1. Cierra la aplicación que está usando el puerto', 'yellow');
      log('   2. O ejecuta: PORT=3001 npm start', 'yellow');
      process.exit(1);
    } else {
      throw err;
    }
  });
}

function startServer() {
  log('\n6️⃣ Iniciando servidor...', 'blue');
  
  try {
    log('\n╔════════════════════════════════════════╗', 'green');
    log('║     ESTUDIUS - SERVIDOR INICIADO       ║', 'green');
    log('╠════════════════════════════════════════╣', 'green');
    log('║                                        ║', 'green');
    log('║  🌐 http://localhost:3000             ║', 'green');
    log('║  API: http://localhost:3000/api        ║', 'green');
    log('║                                        ║', 'green');
    log('║  Presiona Ctrl+C para detener         ║', 'green');
    log('║                                        ║', 'green');
    log('╚════════════════════════════════════════╝\n', 'green');

    log('💡 Siguiente paso:', 'blue');
    log('   1. Abre http://localhost:3000 en tu navegador', 'yellow');
    log('   2. Haz clic en "Agregar Profesor"', 'yellow');
    log('   3. Completa el formulario', 'yellow');
    log('   4. ¡Listo! Tu profesor aparecerá en el listado\n', 'yellow');

    // Iniciar servidor
    execSync('cd Backend && npm start', { stdio: 'inherit' });
  } catch (error) {
    if (error.signal === 'SIGINT') {
      log('\n\n👋 Servidor detenido correctamente', 'blue');
      process.exit(0);
    }
    throw error;
  }
}

main();
