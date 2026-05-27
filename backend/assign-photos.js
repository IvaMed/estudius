// Script para asignar fotos desde frontend/assets/uploads a todos los profesores
// Ejecutar desde /backend con: node assign-photos.js

const fs = require('fs');
const path = require('path');
const TeacherRepository = require('./data/teacherRepository');

(async function main() {
  try {
    const uploadsDir = path.join(__dirname, '../Frontend/Assets/uploads');
    const genders = ['hombres', 'mujeres'];
    let images = [];

    genders.forEach(g => {
      const dir = path.join(uploadsDir, g);
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|webp|svg)$/i.test(f));
        files.forEach(f => images.push({ path: `/assets/uploads/${g}/${f}`, file: f }));
      }
    });

    if (images.length === 0) {
      console.log('No se encontraron imágenes en assets/uploads to assign.');
      process.exit(0);
    }

    console.log(`Se encontraron ${images.length} imágenes. Buscando profesores...`);

    const teachers = await TeacherRepository.getAll();

    console.log(`Hay ${teachers.length} profesores en la base.`);

    // Asignar imagen a cada profesor — mapeo determinista por índice
    for (let i = 0; i < teachers.length; i++) {
      const t = teachers[i];
      // Si el profesor ya tiene foto, la mantendremos
      if (t.photo) {
        // asegurarnos que la ruta exista en assets (si no, sobrescribimos)
        const fullPath = path.join(uploadsDir, t.photo.replace('/assets/uploads/', ''));
        if (fs.existsSync(fullPath)) {
          console.log(`Profesor ${t.id} ya tiene foto: ${t.photo}`);
          continue;
        }
      }

      const img = images[i % images.length];
      const photoPath = img.path;

      // Actualizar en BD
      try {
        await TeacherRepository.update(t.id, { photo: photoPath });
        console.log(`-> Asignada foto ${photoPath} a profesor ${t.id} (${t.firstName} ${t.lastName})`);
      } catch (err) {
        console.error(`ERROR actualizando profesor ${t.id}:`, err.message || err);
      }
    }

    console.log('Asignación completada.');
    process.exit(0);
  } catch (err) {
    console.error('Error en script assign-photos:', err);
    process.exit(1);
  }
})();
