# Mapa del proyecto (desarrollo)

Referencia rápida para ubicar código. La interfaz se genera casi toda en JavaScript (no hay un HTML por pantalla).

## Frontend

| Qué | Archivo |
|-----|---------|
| Entrada HTML | `Frontend/index.html` |
| Lógica de pantallas y eventos | `Frontend/js/app.js` |
| Llamadas a la API | `Frontend/js/api.js` |
| Utilidades (alertas, tarjetas, debounce) | `Frontend/js/utils.js` |
| Logo y recursos | `Frontend/js/config.js` |
| Horarios (filtros, formato y validación de solapes) | `Frontend/js/scheduleUtils.js` |
| Estilos | `Frontend/css/styles.css` |
| Ayuda celular / SSL | `Frontend/conectar-celular.html` |

### Pantallas → función en `app.js`

| Pantalla | Método aproximado |
|----------|-------------------|
| Home | `renderHomePage` |
| Listado | `renderListTeachersPage` |
| Detalle profesor | `showTeacherDetail` |
| Reserva | flujo `#book/` + modales de calendario |
| Mis clases | `renderMyBookingsPage` |
| Favoritos | `renderFavoritesPage` |
| Agregar profesor | `renderAddTeacherPage` |
| Admin usuarios | `renderAdminPage` |
| Admin características | `renderAdminFeaturesPage` |

Router: `showPage`, `handleHashChange` (escucha `hashchange`).

## Apis (HTTP)

| Área | Rutas | Controlador |
|------|-------|-------------|
| Profesores | `Apis/routes/teacherRoutes.js` | `Apis/controllers/teacherController.js` |
| Auth | `Apis/routes/authRoutes.js` | `Apis/controllers/authController.js` |
| Reservas | `Apis/routes/bookingRoutes.js` | `Apis/controllers/bookingController.js` |
| Favoritos | rutas en `Backend/server.js` + `favoriteRoutes` | `favoriteController.js` |
| Admin usuarios | `Apis/routes/adminRoutes.js` | `Apis/controllers/adminController.js` |
| Características | `Apis/routes/featuresRoutes.js` | `Apis/controllers/featuresController.js` |

## Backend (negocio y datos)

| Qué | Archivo |
|-----|---------|
| Arranque Express | `Backend/server.js` |
| Resolución de `node_modules` para Apis/Database | `Backend/register-modules.js` |
| Reglas de profesores | `Backend/services/teacherService.js` |
| Reglas de reservas | `Backend/services/bookingService.js` |
| SQL profesores | `Backend/data/teacherRepository.js` |
| SQL usuarios / reservas / favoritos | `Backend/data/userRepository.js`, `bookingRepository.js`, `favoriteRepository.js` |
| Validación de campos de profesor | `Backend/models/teacherModel.js` |
| JWT y roles | `Backend/middleware/authMiddleware.js` |
| Horarios y direcciones (incluye validación de solapes) | `Backend/lib/scheduleUtils.js`, `locationUtils.js` |
| HTTPS en LAN | `Backend/lib/lanTls.js` |

## Database

| Qué | Archivo |
|-----|---------|
| Esquema SQL | `Database/schema.sql` |
| Conexión, seed admin, migraciones | `Database/db.js` |
| Datos vivos | `Database/estudius.db` (gitignored) |

## Endpoints útiles

| Método | Ruta | Auth | Notas |
|--------|------|------|-------|
| GET | `/api/teachers` | No | Listado |
| GET | `/api/teachers/recommendations` | No | Por `views` |
| GET | `/api/teachers/search` | No | Query: `search`, `subject`, `modality`, fechas… |
| GET | `/api/teachers/:id` | No | Detalle (+ incrementa vistas) |
| POST | `/api/teachers` | Admin | Alta |
| POST | `/api/auth/register` | No | Registro alumno |
| POST | `/api/auth/login` | No | Token JWT |
| POST | `/api/bookings` | Usuario/admin | Reserva |
| GET | `/api/bookings/my` | Usuario/admin | Mis reservas |
| GET | `/api/favorites` | Usuario | Lista favoritos |

Prefijo real: `/api` (definido en rutas montadas en `server.js`).

## Scripts de mantenimiento (`Backend/`)

| Script | Uso |
|--------|-----|
| `seed-teachers.js` | Poblar profesores de prueba |
| `assign-photos.js` | Asignar fotos por ID |
| `scripts/create_profiles_from_uploads.js` | Crear perfiles desde carpetas de imágenes |
| `scripts/seed-historial-user.js` | Usuario de prueba con historial |
| `clean-ivan.js`, `clean-extra-teachers.js` | Limpieza puntual de datos |

## Cambios habituales

| Querés cambiar… | Editá |
|-----------------|-------|
| Materias disponibles | `Backend/models/teacherModel.js` (+ refrescar chips en home si vienen de API) |
| Estilos globales | `Frontend/css/styles.css` |
| Texto del header / logo | `Frontend/index.html`, `config.js` |
| Reglas de recomendación | `TeacherRepository.getRecommended` |
| Puerto o CORS | `Backend/server.js` |

Tras cambios en backend: reiniciar `npm start`. En frontend bastan recargar el navegador (F5 o Ctrl+F5).
