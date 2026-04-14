// Script para eliminar materias específicas (ej. Python, JavaScript) de los profesores
// Ejecutar desde /backend con: node remove-subjects.js

const TeacherRepository = require('./data/teacherRepository');

(async function main() {
  try {
    const forbidden = ['Python', 'JavaScript'];
    console.log('Iniciando limpieza de materias:', forbidden.join(', '));

    const teachers = await TeacherRepository.getAll();
    console.log(`Encontrados ${teachers.length} profesores.`);

    let updated = 0;

    for (const t of teachers) {
      const subjects = Array.isArray(t.subjects) ? t.subjects : (t.subjects ? JSON.parse(t.subjects) : []);
      const filtered = subjects.filter(s => !forbidden.includes(s));

      // Si hay cambio, actualizar
      if (filtered.length !== subjects.length) {
        await TeacherRepository.update(t.id, { subjects: filtered });
        console.log(`-> Profesor ${t.id} (${t.firstName} ${t.lastName}) actualizado: materias ${filtered.join(', ') || '[vacío]'}`);
        updated++;
      }
    }

    console.log(`Limpieza completada. Profesores actualizados: ${updated}`);
    process.exit(0);
  } catch (err) {
    console.error('Error en remove-subjects.js:', err.message || err);
    process.exit(1);
  }
})();
