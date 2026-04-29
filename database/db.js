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
    console.log('[OK] Conectado a SQLite:', dbPath);
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
    db.exec(schema, async (err) => {
      if (err) {
        console.error('ERROR al crear tablas:', err.message);
      } else {
        console.log('[OK] Base de datos inicializada correctamente');

        // Palette de colores (evitar blanco/negro)
        const palette = [
          '#587D71','#8EA8C3','#F9FFE9','#274580','#1C2E57','#FFDB43','#4CAF50','#FFC107','#F44336','#2196F3','#9C27B0','#00BCD4'
        ];

        const simpleHash = (s) => {
          let h = 0;
          for (let i = 0; i < s.length; i++) {
            h = (h << 5) - h + s.charCodeAt(i);
            h |= 0;
          }
          return Math.abs(h);
        };

        const pickColorFromString = (str) => {
          const h = simpleHash(str || '');
          return palette[h % palette.length];
        };

        try {
          // Asegurar que la columna 'color' exista (migration simple)
          const cols = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(users)", [], (e, rows) => e ? reject(e) : resolve(rows));
          });
          const hasColor = Array.isArray(cols) && cols.some(c => c.name === 'color');
          if (!hasColor) {
            await dbRun('ALTER TABLE users ADD COLUMN color TEXT');
            console.log('[OK] Columna "color" añadida a users');
          }
        } catch (err) {
          console.error('Error comprobando/creando columna color:', err.message || err);
        }

        // Sembrar cuenta admin por defecto si no existe y asegurar color
        try {
          const adminEmail = 'admin@gmail.com';
          const existing = await dbGet('SELECT id, color FROM users WHERE email = ?', [adminEmail]);
          // Helper to pick a color for a given initial, avoiding used colors when possible
          const pickColorForInitial = async (initial, extraUsed = []) => {
            const usedRows = await dbAll('SELECT color FROM users WHERE UPPER(SUBSTR(firstName,1,1)) = ? AND color IS NOT NULL', [String(initial).toUpperCase()]);
            const used = new Set((usedRows || []).map(r => String(r.color || '').toLowerCase()));
            (extraUsed || []).forEach(c => used.add(String(c || '').toLowerCase()));
            const available = palette.filter(c => !used.has(String(c).toLowerCase()));
            if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
            for (let i = 0; i < 30; i++) {
              const rand = '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
              if (!used.has(rand.toLowerCase())) return rand;
            }
            return palette[Math.floor(Math.random() * palette.length)];
          };

          if (!existing) {
            const bcrypt = require('bcryptjs');
            const hash = bcrypt.hashSync('contraseña', 10);
            const adminInitial = 'A';
            const color = await pickColorForInitial(adminInitial);
            await dbRun('INSERT INTO users (firstName, lastName, email, passwordHash, role, color) VALUES (?, ?, ?, ?, ?, ?)', ['admin', 'admin', adminEmail, hash, 'admin', color]);
            console.log('[OK] Cuenta admin creada: admin@gmail.com / contraseña');
          } else if (!existing.color) {
            const adminInitial = 'A';
            const color = await pickColorForInitial(adminInitial);
            await dbRun('UPDATE users SET color = ? WHERE id = ?', [color, existing.id]);
            console.log('[OK] Color asignado a admin existente');
          }

          // Asignar colores a usuarios existentes sin color, intentando evitar duplicados por inicial
          try {
            const missing = await dbAll("SELECT id, firstName FROM users WHERE color IS NULL OR TRIM(color) = ''");
            if (Array.isArray(missing) && missing.length > 0) {
              // Agrupar por inicial
              const groups = {};
              missing.forEach(u => {
                const init = (u.firstName || 'U').trim().charAt(0).toUpperCase() || 'U';
                if (!groups[init]) groups[init] = [];
                groups[init].push(u);
              });
              for (const init of Object.keys(groups)) {
                const assignedThisRound = [];
                for (const userRow of groups[init]) {
                  const color = await pickColorForInitial(init, assignedThisRound);
                  assignedThisRound.push(color);
                  await dbRun('UPDATE users SET color = ? WHERE id = ?', [color, userRow.id]);
                  console.log('[OK] Color asignado a usuario id=', userRow.id, ' color=', color);
                }
              }
            }
          } catch (err) {
            console.error('Error asignando colores a usuarios existentes:', err.message || err);
          }
            } catch (err) {
              console.error('Error sembrando admin:', err.message || err);
            }

            // Crear tablas para características (categorías + items) y sembrar valores por defecto
            try {
              await dbRun(`CREATE TABLE IF NOT EXISTS feature_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                name TEXT NOT NULL,
                slug TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
              )`);

              await dbRun(`CREATE TABLE IF NOT EXISTS feature_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                categoryId INTEGER NOT NULL,
                name TEXT NOT NULL,
                slug TEXT,
                position INTEGER DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (categoryId) REFERENCES feature_categories(id) ON DELETE CASCADE
              )`);

              const cnt = await dbGet('SELECT COUNT(*) as cnt FROM feature_categories', []);
              if (!cnt || !cnt.cnt) {
                const subjectsSeed = {
                  'Materias escolares clásicas': ['Matemática','Lengua','Historia','Geografía','Biología','Física','Química','Educación Cívica','Filosofía','Psicología','Economía'],
                  'Materias de nivel universitario': ['Análisis Matemático','Álgebra Lineal','Estadística y probabilidad','Mecánica','Electrónica','Química Orgánica','Química Inorgánica','Marketing','Derecho','Administración'],
                  'Materias Informáticas': ['Programación','Desarrollo Web','Bases de Datos','Algoritmos','Ciberseguridad'],
                  'Idiomas': ['Inglés','Portugués','Francés','Italiano','Alemán','Chino','Japonés'],
                  'Materias Artísticas': ['Dibujo','Música','Pintura']
                };

                const slugify = s => String(s || '').toLowerCase().replace(/[^a-z0-9áéíóúñ\s-]/g,'').trim().replace(/\s+/g,'-');

                for (const [catName, items] of Object.entries(subjectsSeed)) {
                  const r = await dbRun('INSERT INTO feature_categories (type, name, slug) VALUES (?, ?, ?)', ['subject', catName, slugify(catName)]);
                  const catId = r.id;
                  for (const it of items) {
                    await dbRun('INSERT INTO feature_items (categoryId, name, slug) VALUES (?, ?, ?)', [catId, it, slugify(it)]);
                  }
                }

                // Modalidades: crear categorías 'virtual' y 'presencial'
                const m1 = await dbRun('INSERT INTO feature_categories (type, name, slug) VALUES (?, ?, ?)', ['modality', 'virtual', 'virtual']);
                const m2 = await dbRun('INSERT INTO feature_categories (type, name, slug) VALUES (?, ?, ?)', ['modality', 'presencial', 'presencial']);
                console.log('[OK] Características sembradas (materias y modalidades)');
              }
            } catch (err) {
              console.error('Error creando/sembrando características:', err.message || err);
            }
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
