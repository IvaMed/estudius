// Script para limpiar profesores de prueba (dejar solo los 10 originales)
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'Database', 'estudius.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err.message);
    process.exit(1);
  }
  console.log('Conectado a la base de datos SQLite');
});

// Eliminar todos los profesores excepto los primeros 10
db.run('DELETE FROM teachers WHERE id > 10', function(err) {
  if (err) {
    console.error('Error al eliminar profesores:', err.message);
  } else {
    console.log(`✓ Se eliminaron ${this.changes} profesores de prueba`);
    console.log('✓ Quedan solo los 10 profesores originales (IDs 1-10)');
  }
  
  db.close((err) => {
    if (err) {
      console.error('Error cerrando BD:', err.message);
    }
    process.exit(0);
  });
});
