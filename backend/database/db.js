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

function inferSubjectIcon(name = '') {
  const value = String(name || '').toLowerCase();
  if (value.includes('matem') || value.includes('álgebra') || value.includes('algebra') || value.includes('estad')) return '📐';
  if (value.includes('fís') || value.includes('fis') || value.includes('mecán') || value.includes('mecan') || value.includes('electr')) return '⚛️';
  if (value.includes('quím') || value.includes('quim') || value.includes('biolog')) return '🧪';
  if (value.includes('hist') || value.includes('geograf') || value.includes('cívica') || value.includes('civica') || value.includes('filos') || value.includes('psic') || value.includes('econom') || value.includes('derecho')) return '📚';
  if (value.includes('program') || value.includes('algorit') || value.includes('base de datos') || value.includes('desarrollo web') || value.includes('ciber')) return '💻';
  if (value.includes('inglés') || value.includes('ingles') || value.includes('franc') || value.includes('alem') || value.includes('ital') || value.includes('portugu') || value.includes('japon') || value.includes('chino')) return '🗣️';
  if (value.includes('dibujo') || value.includes('pintura') || value.includes('música') || value.includes('musica')) return '🎨';
  if (value.includes('marketing') || value.includes('admin')) return '📈';
  return '📘';
}

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

            // Migración: ampliar límite classSize a <= 40 si la tabla vieja usa < 30
            try {
              const tableInfo = await dbGet("SELECT sql FROM sqlite_master WHERE type='table' AND name='teachers'");
              const tableSql = String(tableInfo && tableInfo.sql ? tableInfo.sql : '').toLowerCase();
              if (tableSql.includes('classsize < 30')) {
                await dbRun('BEGIN TRANSACTION');
                await dbRun(`CREATE TABLE IF NOT EXISTS teachers_new (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  firstName TEXT NOT NULL,
                  lastName TEXT NOT NULL,
                  age INTEGER NOT NULL CHECK(age > 0 AND age < 150),
                  email TEXT NOT NULL UNIQUE,
                  phone TEXT,
                  description TEXT NOT NULL,
                  curriculum TEXT NOT NULL,
                  photo TEXT,
                  classSize INTEGER NOT NULL CHECK(classSize > 0 AND classSize <= 40),
                  subjects TEXT NOT NULL,
                  modality TEXT NOT NULL CHECK(modality IN ('virtual', 'presencial')),
                  modalities TEXT,
                  schedules TEXT NOT NULL,
                  location TEXT,
                  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                  views INTEGER DEFAULT 0
                )`);
                await dbRun(`INSERT INTO teachers_new (
                  id, firstName, lastName, age, email, phone, description, curriculum, photo, classSize,
                  subjects, modality, modalities, schedules, location, createdAt, updatedAt, views
                ) SELECT
                  id, firstName, lastName, age, email, phone, description, curriculum, photo, classSize,
                  subjects, modality, modalities, schedules, location, createdAt, updatedAt, views
                FROM teachers`);
                await dbRun('DROP TABLE teachers');
                await dbRun('ALTER TABLE teachers_new RENAME TO teachers');
                await dbRun('CREATE INDEX IF NOT EXISTS idx_email ON teachers(email)');
                await dbRun('CREATE INDEX IF NOT EXISTS idx_subjects ON teachers(subjects)');
                await dbRun('CREATE INDEX IF NOT EXISTS idx_modality ON teachers(modality)');
                await dbRun('CREATE INDEX IF NOT EXISTS idx_views ON teachers(views)');
                await dbRun('COMMIT');
                console.log('[OK] Migración aplicada: classSize <= 40');
              }
            } catch (err) {
              try { await dbRun('ROLLBACK'); } catch (e) { /* ignore */ }
              console.error('Error migrando classSize a <= 40:', err.message || err);
            }

            // Crear tablas para características (categorías + items) y sembrar valores por defecto
            try {
              await dbRun(`CREATE TABLE IF NOT EXISTS feature_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                name TEXT NOT NULL,
                slug TEXT,
                icon TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
              )`);

              await dbRun(`CREATE TABLE IF NOT EXISTS feature_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                categoryId INTEGER NOT NULL,
                name TEXT NOT NULL,
                slug TEXT,
                icon TEXT,
                position INTEGER DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (categoryId) REFERENCES feature_categories(id) ON DELETE CASCADE
              )`);

              const categoryCols = await dbAll('PRAGMA table_info(feature_categories)');
              const hasCategoryIcon = Array.isArray(categoryCols) && categoryCols.some(c => c.name === 'icon');
              if (!hasCategoryIcon) {
                await dbRun('ALTER TABLE feature_categories ADD COLUMN icon TEXT');
              }

              const itemCols = await dbAll('PRAGMA table_info(feature_items)');
              const hasItemIcon = Array.isArray(itemCols) && itemCols.some(c => c.name === 'icon');
              if (!hasItemIcon) {
                await dbRun('ALTER TABLE feature_items ADD COLUMN icon TEXT');
              }

              const cnt = await dbGet('SELECT COUNT(*) as cnt FROM feature_categories', []);
              if (!cnt || !cnt.cnt) {
                const subjectsSeed = {
                  'Materias escolares clásicas': { icon: '🏫', items: ['Matemática','Lengua','Historia','Geografía','Biología','Física','Química','Educación Cívica','Filosofía','Psicología','Economía'] },
                  'Materias de nivel universitario': { icon: '🎓', items: ['Análisis Matemático','Álgebra Lineal','Estadística y probabilidad','Mecánica','Electrónica','Química Orgánica','Química Inorgánica','Marketing','Derecho','Administración'] },
                  'Materias Informáticas': { icon: '💻', items: ['Programación','Desarrollo Web','Bases de Datos','Algoritmos','Ciberseguridad'] },
                  'Idiomas': { icon: '🌍', items: ['Inglés','Portugués','Francés','Italiano','Alemán','Chino','Japonés'] },
                  'Materias Artísticas': { icon: '🎨', items: ['Dibujo','Música','Pintura'] }
                };

                const slugify = s => String(s || '').toLowerCase().replace(/[^a-z0-9áéíóúñ\s-]/g,'').trim().replace(/\s+/g,'-');

                for (const [catName, data] of Object.entries(subjectsSeed)) {
                  const r = await dbRun('INSERT INTO feature_categories (type, name, slug, icon) VALUES (?, ?, ?, ?)', ['subject', catName, slugify(catName), data.icon]);
                  const catId = r.id;
                  for (const it of data.items) {
                    await dbRun('INSERT INTO feature_items (categoryId, name, slug, icon) VALUES (?, ?, ?, ?)', [catId, it, slugify(it), '📘']);
                  }
                }
                console.log('[OK] Características sembradas (materias)');
              }

              // Eliminar modalidad como característica configurable
              await dbRun("DELETE FROM feature_categories WHERE type = 'modality'");
              // Backfill de íconos para materias existentes (emoji representativo)
              const subjectItems = await dbAll(`
                SELECT fi.id, fi.name, fi.icon
                FROM feature_items fi
                INNER JOIN feature_categories fc ON fc.id = fi.categoryId
                WHERE fc.type = 'subject'
              `);
              for (const item of subjectItems || []) {
                const currentIcon = String(item.icon || '').trim();
                if (!currentIcon || currentIcon === '📘') {
                  await dbRun('UPDATE feature_items SET icon = ? WHERE id = ?', [inferSubjectIcon(item.name), item.id]);
                }
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
