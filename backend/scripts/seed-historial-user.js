/**
 * Crea usuario Historial (historial@gmail.com) con reservas en el pasado.
 * Uso: node scripts/seed-historial-user.js
 */
const bcrypt = require('bcryptjs');
const { dbGet, dbRun, dbAll } = require('../../Database/db');

const EMAIL = 'historial@gmail.com';
const PASSWORD = 'Historial123!';
const FIRST = 'Historial';
const LAST = '';

const PAST_BOOKINGS = [
  { offsetMonths: -14, day: 8, time: '17:00', modality: 'virtual', message: 'Repaso antes del parcial', subjects: ['Matemática'] },
  { offsetMonths: -9, day: 12, time: '18:30', modality: 'presencial', message: 'Clase de recuperatorio', subjects: ['Física'] },
  { offsetMonths: -6, day: 3, time: '10:00', modality: 'virtual', message: 'Consulta de trabajos prácticos', subjects: ['Programación'] },
  { offsetMonths: -3, day: 20, time: '19:00', modality: 'virtual', message: 'Última clase del cuatrimestre', subjects: ['Inglés'] },
  { offsetMonths: -18, day: 5, time: '16:00', modality: 'presencial', message: 'Clase año pasado', subjects: ['Historia'] },
  { offsetMonths: -24, day: 15, time: '11:00', modality: 'virtual', message: 'Reserva antigua de prueba', subjects: ['Química'] }
];

function addMonths(base, months) {
  const d = new Date(base.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

function ymdFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  await sleep(800);

  const teachers = await dbAll('SELECT id, subjects FROM teachers ORDER BY id ASC LIMIT 12');
  if (!teachers.length) {
    console.error('[ERROR] No hay profesores en la base. Cargá profesores primero.');
    process.exit(1);
  }

  let user = await dbGet('SELECT id FROM users WHERE email = ?', [EMAIL]);
  const hash = bcrypt.hashSync(PASSWORD, 10);

  if (user) {
    await dbRun('DELETE FROM bookings WHERE userId = ?', [user.id]);
    await dbRun('DELETE FROM user_favorites WHERE userId = ?', [user.id]);
    console.log(`[OK] Usuario existente id=${user.id}, reservas anteriores borradas`);
  } else {
    const color = '#587D71';
    const res = await dbRun(
      'INSERT INTO users (firstName, lastName, email, passwordHash, role, color) VALUES (?, ?, ?, ?, ?, ?)',
      [FIRST, LAST, EMAIL, hash, 'user', color]
    );
    user = { id: res.id };
    console.log(`[OK] Usuario creado id=${user.id}`);
  }

  const now = new Date();
  let n = 0;
  for (let i = 0; i < PAST_BOOKINGS.length; i++) {
    const spec = PAST_BOOKINGS[i];
    const when = addMonths(now, spec.offsetMonths);
    when.setDate(spec.day);
    const datetime = `${ymdFromDate(when)}T${spec.time}`;
    const teacher = teachers[i % teachers.length];
    let subj = spec.subjects;
    try {
      const ts = JSON.parse(teacher.subjects || '[]');
      if (Array.isArray(ts) && ts.length && !subj.every((s) => ts.includes(s))) {
        subj = [ts[0]];
      }
    } catch (_) {
      /* keep spec subjects */
    }
    await dbRun(
      `INSERT INTO bookings (userId, teacherId, datetime, message, sessionModality, bookingSubjects)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.id, teacher.id, datetime, spec.message, spec.modality, JSON.stringify(subj)]
    );
    n++;
    console.log(`  · ${datetime} — profe #${teacher.id} (${spec.modality})`);
  }

  console.log('');
  console.log('[OK] Listo. Iniciá sesión con:');
  console.log(`     Email:    ${EMAIL}`);
  console.log(`     Password: ${PASSWORD}`);
  console.log(`     Reservas pasadas: ${n}`);
  console.log('     Menú → Mis clases reservadas');
  process.exit(0);
}

main().catch((e) => {
  console.error('[ERROR]', e);
  process.exit(1);
});
