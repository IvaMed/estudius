// =====================================================
// CAPA DE DATOS - Conexión y Inicialización de BD
// =====================================================

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ruta de la base de datos
const dbPath = path.join(__dirname, '../../database/estudius.db');
const schemaPath = path.join(__dirname, '../../database/schema.sql');

// Crear conexión
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('ERROR al conectar con la base de datos:', err.message);
  } else {
    console.log('✓ Conectado a SQLite:', dbPath);
    initializeDatabase();
  }
});

// Habilitar foreign keys
db.run('PRAGMA foreign_keys = ON');

// Función para inicializar la base de datos
async function initializeDatabase() {
  try {
    // Leer el script SQL
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Ejecutar el script
    db.exec(schema, (err) => {
      if (err) {
        console.error('ERROR al crear tablas:', err.message);
      } else {
        console.log('✓ Base de datos inicializada correctamente');
      }
    });
  } catch (error) {
    console.error('ERROR al leer schema.sql:', error.message);
  }
}

// Funciones auxiliares para ejecutar queries con promesas
const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

module.exports = {
  db,
  dbAll,
  dbGet,
  dbRun
};
