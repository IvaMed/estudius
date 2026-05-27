const fs = require('fs');
const path = require('path');
const { dbAll, dbGet, dbRun } = require('../../Database/db');
const { ALL_SUBJECTS } = require('../models/teacherModel');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function generatePhone() {
  // Formato argentino aproximado: +54 9 11 1234 5678
  const area = randomElement(['11','221','351','341','297']);
  const part1 = String(randomInt(1000, 9999));
  const part2 = String(randomInt(1000, 9999));
  return `+54 9 ${area} ${part1} ${part2}`;
}

async function ensureModalitiesColumn() {
  const cols = await dbAll("PRAGMA table_info(teachers)");
  const has = cols.some(c => c.name === 'modalities');
  if (!has) {
    console.log('Añadiendo columna `modalities` a la tabla teachers...');
    await dbRun('ALTER TABLE teachers ADD COLUMN modalities TEXT');
    console.log('Columna `modalities` creada');
  } else {
    console.log('Columna `modalities` ya existe');
  }
}

async function run() {
  try {
    await ensureModalitiesColumn();

    const uploadsRoot = path.join(__dirname, '../../Frontend/Assets/uploads');

    // Definir listas de nombres por género para evitar mezclar nombres/sexo
    const genders = [
      {
        dir: 'hombres',
        firstNames: ['Juan', 'Carlos', 'Diego', 'Miguel', 'Jorge', 'Luis', 'Antonio', 'Marco', 'Ricardo', 'Javier', 'Samuel', 'Alejandro', 'Andrés', 'Guillermo', 'Felipe', 'Matías']
      },
      {
        dir: 'mujeres',
        firstNames: ['María', 'Ana', 'Laura', 'Isabel', 'Patricia', 'Sofía', 'Elena', 'Gabriela', 'Rosa', 'Lucia', 'Martina', 'Valeria', 'Carolina', 'Cristina', 'Adriana', 'Camila']
      }
    ];

    const lastNames = ['García','Pérez','Rodríguez','Gómez','López','Martínez','Santos','Silva','Rojas','Fernández','Vargas','Reyes','Fuentes','Cortés','Medina','Rojas'];

    // Small curriculum and schedules pools
    const curriculums = [
      'Programa estructurado de teoría y práctica',
      'Clases personalizadas con ejercicios y seguimiento',
      'Temario orientado a resolución de problemas y exámenes',
      'Enfoque práctico con proyectos y evaluación continua'
    ];

    const schedules = [
      'Lun/Mié/Vie 18:00-20:00',
      'Mar/Jue 10:00-12:00',
      'Sábados 09:00-12:00',
      'Horario flexible'
    ];

    const locations = ['CABA - Centro','CABA - Norte','Gran Buenos Aires','La Plata'];

    // Limpiar tabla teachers para crear perfiles desde las fotos (asegurar único set)
    console.log('Eliminando profesores existentes (si los hay)...');
    await dbRun('DELETE FROM teachers');
    // Resetear AUTOINCREMENT (si existe sqlite_sequence)
    try {
      await dbRun('DELETE FROM sqlite_sequence WHERE name = ?', ['teachers']);
    } catch (err) {
      // ignora si sqlite_sequence no existe
    }

    for (const g of genders) {
      const gender = g.dir;
      const dir = path.join(uploadsRoot, gender);
      if (!fs.existsSync(dir)) continue;

      const files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png)$/i.test(f));
      for (const file of files) {
        const originalPath = path.join(dir, file);

        // Compose teacher data
        const firstName = randomElement(g.firstNames);
        const lastName = randomElement(lastNames);
        const age = randomInt(25, 60);
        const email = `teacher_${gender}_${Date.now()}_${randomInt(1000,9999)}@example.com`;
        const phone = generatePhone();
        const subjectsCount = randomInt(2,4);
        const subjects = [...ALL_SUBJECTS].sort(() => 0.5 - Math.random()).slice(0, subjectsCount);

        // Modalities: 20% both, else single
        let modalities = [];
        if (Math.random() < 0.2) {
          modalities = ['virtual','presencial'];
        } else {
          modalities = [randomElement(['virtual','presencial'])];
        }

        const modality = modalities[0];

        const curriculum = randomElement(curriculums);
        const schedule = randomElement(schedules);
        const location = modalities.includes('presencial') ? randomElement(locations) : null;
        // No incluir información de contacto en la descripción
        const description = `Profesor/a con experiencia en ${subjects.join(', ')}.`;

        // Insert into DB
        const sql = `INSERT INTO teachers (
          firstName, lastName, age, email, phone, description, curriculum,
          photo, classSize, subjects, modality, modalities, schedules, location, views
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const photoRelPath = `/assets/uploads/${gender}/${file}`; // se actualizará tras renombrar
        const params = [
          firstName, lastName, age, email, phone, description, curriculum,
          photoRelPath, randomInt(1,5), JSON.stringify(subjects), modality, JSON.stringify(modalities), schedule, location, randomInt(0,50)
        ];

        const res = await dbRun(sql, params);
        const id = res.id;

        // Rename file to use ID
        const ext = path.extname(file).toLowerCase();
        const newFilename = `${id}${ext}`;
        const newPath = path.join(dir, newFilename);
        try {
          if (originalPath !== newPath) fs.renameSync(originalPath, newPath);
        } catch (err) {
          console.warn('No se pudo renombrar', originalPath, err.message);
        }

        const newPhotoRel = `/assets/uploads/${gender}/${newFilename}`;
        await dbRun('UPDATE teachers SET photo = ? WHERE id = ?', [newPhotoRel, id]);

        console.log(`Creado profesor ID=${id} (${firstName} ${lastName}) -> ${newPhotoRel}`);
      }
    }

    console.log('\nTodos los perfiles creados/actualizados a partir de las fotos.');
  } catch (err) {
    console.error('Error creando perfiles:', err);
  } finally {
    process.exit(0);
  }
}

run();
