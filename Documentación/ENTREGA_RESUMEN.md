# Resumen del producto — Estudius

Documento orientado a **entrega académica o presentación del proyecto**: qué se construyó, para quién y cómo se valida.

## Propuesta

**Estudius** es una aplicación web que funciona como **marketplace educativo local** de clases particulares: un catálogo curado de profesores con búsqueda, filtros, fichas detalladas y sistema de reservas para usuarios registrados.

**Slogan:** *Si querés estudiar, Estudius es el lugar.*

## Problema y solución

| Problema | Solución en Estudius |
|----------|----------------------|
| Difícil encontrar tutores por materia o modalidad | Home con materias, búsqueda y filtros virtual/presencial |
| Información dispersa (horarios, precios implícitos, contacto) | Ficha unificada: temario, cupo, horarios JSON, ubicación |
| Sin registro de intención de clase | Reservas con fecha/hora y listado *Mis clases* |
| Gestión manual del listado | Panel admin para ABM de profesores y configuración del sitio |

## Alcance funcional entregado

### Público general

- Navegación SPA por hash (`#home`, `#list-teachers`, `#teacher/id`).
- Recomendados por popularidad (`views`).
- Búsqueda y filtrado por materia, modalidad y ventana horaria (listado).

### Usuario registrado

- Registro e inicio de sesión (JWT).
- Reserva de clases contra disponibilidad del docente.
- Favoritos ilimitados por usuario.

### Administración

- CRUD de profesores (validación de campos, fotos en disco).
- Gestión de características/categorías del sitio (materias destacadas, etc.).
- Super-admin (única cuenta): `admin@gmail.com` / `contraseña` — gestión de usuarios.
- Usuario ejemplo Historial: `historial@gmail.com` / `Historial123!` — reservas pasadas (`seed-historial-user.js`).

### Infraestructura local

- Servidor único Express sirve API + frontend.
- SQLite sin instalación extra.
- Acceso LAN para pruebas en móvil (`iniciar-estudius-red.bat`).

## Arquitectura (resumen)

Tres capas desacopladas en carpetas:

1. **Frontend** — presentación.
2. **Apis** — contrato HTTP.
3. **Backend + Database** — reglas y persistencia.

Detalle: [STACK_Y_ESTRUCTURA.md](STACK_Y_ESTRUCTURA.md).

## Stack

- Frontend: HTML5, CSS3, JavaScript ES6+.
- Backend: Node.js, Express, sqlite3, bcryptjs, jsonwebtoken.
- Base de datos: SQLite (`Database/estudius.db`).

## Cómo demostrar el proyecto

1. Ejecutar `iniciar-estudius-red.bat` o `npm start` en `Backend/`.
2. Mostrar home, búsqueda y ficha de profesor.
3. Registrar un usuario, reservar una clase, mostrar *Mis clases* y *Favoritos*.
4. Ingresar como admin: cargar o editar un profesor.
5. (Opcional) Abrir la misma URL desde un celular en la red local.

Checklist completo: [VERIFICACION.md](VERIFICACION.md).

## Limitaciones conocidas (honestas)

- No incluye pasarela de pago ni aula virtual integrada.
- Recomendaciones basadas en visitas, no en ML.
- HTTPS en LAN usa certificado autofirmado (solo para demo).
- Cuenta super-admin fija por email (`admin@gmail.com`) para gestión de usuarios.

## Documentación relacionada

| Archivo | Contenido |
|---------|-----------|
| [00_COMIENZA_AQUI.md](00_COMIENZA_AQUI.md) | Guía de inicio |
| [QUICKSTART.md](QUICKSTART.md) | Instalación |
| [PROJECT_MAP.md](PROJECT_MAP.md) | Código fuente |
| [FAQ.md](FAQ.md) | Dudas comunes |

Capturas de pantalla: carpeta `Documentación/Capturas de pantalla/` (material visual de la entrega).
