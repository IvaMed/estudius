# Stack y estructura del código

## Arquitectura en capas

```text
Navegador (Frontend)
    │  HTTP + JSON
    ▼
Apis/          ← Rutas y controladores (entrada HTTP)
    │
    ▼
Backend/       ← Reglas de negocio, repositorios, utilidades
    │
    ▼
Database/      ← SQLite (archivo + esquema + db.js)
```

El servidor Express vive en `Backend/server.js`. Sirve la interfaz desde `Frontend/` y monta `/assets` sobre `Frontend/Assets/` para que las URLs de fotos sigan siendo `/assets/uploads/...`.

## Carpetas

| Carpeta | Contenido |
|---------|-----------|
| **Frontend/** | SPA en un solo `index.html`; la lógica está en `js/app.js`. Estilos en `css/styles.css`. Datos de respaldo en `data/teachers.json`. |
| **Frontend/Assets/** | Logo, avatar por defecto, fotos de profesores (`uploads/hombres`, `mujeres`, `others`). |
| **Apis/routes/** | Definición de endpoints (`teacherRoutes`, `authRoutes`, `bookingRoutes`, etc.). |
| **Apis/controllers/** | Respuestas HTTP: validan entrada, llaman servicios, devuelven JSON. |
| **Backend/services/** | Lógica de negocio (crear profesor, búsqueda, recomendaciones). |
| **Backend/data/** | Repositorios: SQL y acceso a archivos de fotos. |
| **Backend/models/** | Validaciones y listas (p. ej. materias permitidas). |
| **Backend/middleware/** | JWT: `authenticate`, `requireAdmin`, `requireSuperAdmin`, `requireBookableRole`. |
| **Backend/lib/** | Horarios JSON, direcciones, certificado HTTPS LAN. |
| **Backend/scripts/** | Mantenimiento (seed, emails, perfiles desde fotos). |
| **Database/** | `schema.sql`, `estudius.db`, `db.js` (inicialización y migraciones ligeras). |

## Stack tecnológico

| Componente | Elección | Motivo |
|------------|----------|--------|
| UI | HTML + CSS + JS vanilla | Sin build, carga rápida, fácil de hostear en red local |
| API | Express 4 | Liviano, sirve estáticos y JSON en el mismo proceso |
| BD | SQLite | Un archivo, sin servidor aparte, ideal para desarrollo y demos |
| Auth | JWT + bcrypt | Sesión stateless en el cliente (`localStorage`) |
| Fotos | Disco en `Frontend/Assets/uploads` | Rutas guardadas en BD como `/assets/uploads/...` |

## Flujo de una petición típica

**Listar profesores recomendados**

1. `Frontend/js/api.js` → `GET /api/teachers/recommendations`
2. `Apis/routes/teacherRoutes.js` → `TeacherController.getRecommendedTeachers`
3. `Backend/services/teacherService.js` → `TeacherRepository.getRecommended`
4. SQL ordenado por `views` y fecha de alta

**Reservar una clase**

1. Usuario autenticado → `POST /api/bookings` con `teacherId`, `datetime`, etc.
2. `BookingController` → `BookingService` → insert en tabla `bookings`
3. El front redirige a `#my-bookings` para ver el historial

## Navegación en el frontend (hash)

| URL hash | Pantalla |
|----------|----------|
| `#home` o vacío | Inicio |
| `#list-teachers` | Listado completo |
| `#teacher/{id}` | Ficha del profesor |
| `#book/{id}` | Flujo de reserva |
| `#my-bookings` | Mis clases |
| `#favorites` | Favoritos |
| `#add-teacher` | Alta de profesor (admin) |
| `#admin` | Usuarios (solo super-admin) |
| `#admin-features` | Características del sitio (admin) |

La función central que elige qué dibujar es `renderPage()` en `Frontend/js/app.js`.

## Tablas principales (SQLite)

- `teachers` — perfiles de docentes
- `users` — cuentas (`user` | `admin`)
- `bookings` — reservas alumno ↔ profesor
- `user_favorites` — favoritos por usuario
- Tablas de características del admin (creadas/migradas vía `db.js` si aplica)

Detalle de columnas: `Database/schema.sql`.
