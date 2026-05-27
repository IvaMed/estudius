/**
 * =============================================================================
 * EJEMPLOS DE DATOS — Estudius API
 * =============================================================================
 *
 * Uso: consola del navegador en http://localhost:3000 o herramientas como Postman.
 *
 * IMPORTANTE:
 * - POST /api/teachers exige sesión ADMIN (Bearer token).
 * - Los horarios van en JSON estructurado (no texto libre).
 * - dow: 0 = domingo … 6 = sábado (mismo criterio que Date.getDay()).
 *
 * Ver también: Documentación/PROJECT_MAP.md
 */

const API = 'http://localhost:3000/api';

/** Horario de ejemplo: lun–vie 18:00–19:30 */
const horarioVirtual = {
  version: 1,
  slots: [
    { dow: 1, start: '18:00', end: '19:30' },
    { dow: 2, start: '18:00', end: '19:30' },
    { dow: 3, start: '18:00', end: '19:30' },
    { dow: 4, start: '18:00', end: '19:30' },
    { dow: 5, start: '18:00', end: '19:30' }
  ],
  notes: 'Zona horaria Argentina'
};

/** Horario presencial: mar/jue tarde + sábado mañana */
const horarioPresencial = {
  version: 1,
  slots: [
    { dow: 2, start: '17:00', end: '18:30' },
    { dow: 4, start: '17:00', end: '18:30' },
    { dow: 6, start: '10:00', end: '12:00' }
  ],
  notes: ''
};

// =============================================================================
// 1) Login admin (obtener token)
// =============================================================================

async function loginAdmin() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@gmail.com',
      password: 'contraseña'
    })
  });
  const json = await res.json();
  if (!json.token) throw new Error(json.message || 'Login fallido');
  console.log('Token:', json.token);
  return json.token;
}

// =============================================================================
// 2) Crear profesor virtual
// =============================================================================

const profesorVirtual = {
  firstName: 'Carlos',
  lastName: 'Méndez',
  age: 28,
  email: 'carlos.mendez.demo@email.com',
  phone: '+54911223344',
  description:
    'Ingeniero en sistemas con experiencia enseñando programación. Clases dinámicas con ejemplos prácticos.',
  curriculum:
    'Variables, Control de flujo, Funciones, POO, SQL básico, APIs REST, JavaScript',
  photo: null,
  classSize: 12,
  subjects: ['Programación', 'Desarrollo Web'],
  modality: 'virtual',
  modalities: ['virtual'],
  schedules: horarioVirtual,
  location: null,
  locationStreet: null,
  locationNumber: null,
  locationApartment: null
};

// =============================================================================
// 3) Crear profesor presencial
// =============================================================================

const profesorPresencial = {
  firstName: 'María',
  lastName: 'González',
  age: 35,
  email: 'maria.gonzalez.demo@email.com',
  phone: '+54912345678',
  description:
    'Licenciada en Química. Clases teórico-prácticas con demostraciones.',
  curriculum:
    'Química general, Química orgánica, Estequiometría, Laboratorio',
  photo: null,
  classSize: 8,
  subjects: ['Química', 'Química Orgánica'],
  modality: 'presencial',
  modalities: ['presencial'],
  schedules: horarioPresencial,
  location: 'San Isidro, Buenos Aires',
  locationStreet: 'Av. del Libertador',
  locationNumber: '1234',
  locationApartment: null
};

// =============================================================================
// 4) Crear profesor (con token)
// =============================================================================

async function crearProfesor(payload, token) {
  const res = await fetch(`${API}/teachers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  console.log(json);
  return json;
}

// Uso en consola:
// const token = await loginAdmin();
// await crearProfesor(profesorVirtual, token);
// await crearProfesor(profesorPresencial, token);

// =============================================================================
// 5) Consultas públicas (sin token)
// =============================================================================

// fetch(`${API}/teachers/recommendations?limit=5`).then(r => r.json()).then(console.log);
// fetch(`${API}/teachers/search?search=matem`).then(r => r.json()).then(console.log);
// fetch(`${API}/teachers/1`).then(r => r.json()).then(console.log);

// =============================================================================
// 6) Registro y reserva (usuario alumno)
// =============================================================================

async function registrarAlumno() {
  return fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Ana',
      lastName: 'Pérez',
      email: 'ana.perez.demo@email.com',
      password: 'miClave123'
    })
  }).then((r) => r.json());
}

async function reservarClase(token, teacherId, datetimeIso) {
  return fetch(`${API}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      teacherId,
      datetime: datetimeIso,
      sessionModality: 'virtual',
      message: 'Primera clase de prueba'
    })
  }).then((r) => r.json());
}

// const reg = await registrarAlumno();
// const tokenAlumno = reg.token;
// await reservarClase(tokenAlumno, 1, '2026-06-15T18:00:00.000Z');

// =============================================================================
// Alternativa recomendada para muchos datos de prueba
// =============================================================================
// Desde la carpeta Backend/:
//   node seed-teachers.js
//   node assign-photos.js
