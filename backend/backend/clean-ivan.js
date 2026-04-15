// Script para eliminar el profesor Ivan Medina y otras limpiezas
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'database', 'estudius.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err.message);
    process.exit(1);
  }
  console.log('Conectado a la base de datos SQLite');
});

// Eliminar profesores con nombres específicos (creados de prueba)
db.run("DELETE FROM teachers WHERE firstName = 'Ivan' AND lastName = 'Medina'", function(err) {
  if (err) {
    console.error('Error al eliminar profesor:', err.message);
  } else {
    if (this.changes > 0) {
      console.log(`✓ Se eliminó ${this.changes} profesor (Ivan Medina)`);
    } else {
      console.log('ℹ️ No se encontró a Ivan Medina en la base de datos');
    }
  }
  
  // Verificar profesores restantes
  db.all('SELECT id, firstName, lastName FROM teachers ORDER BY id', [], (err, rows) => {
    if (err) {
      console.error('Error:', err.message);
    } else {
      console.log('\n✓ Profesores restantes en la BD:');
      rows.forEach(row => {
        console.log(`  - ID ${row.id}: ${row.firstName} ${row.lastName}`);
      });
    }
    
    db.close((err) => {
      if (err) {
        console.error('Error cerrando BD:', err.message);
      }
      process.exit(0);
    });
  });
});
