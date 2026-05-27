# Preguntas frecuentes

## Sobre el servicio

### ¿Estudius cobra o conecta videollamadas?

No. La plataforma **lista profesores**, muestra su información y permite **reservar un turno**. El contacto concreto (Zoom, WhatsApp, encuentro presencial) queda entre alumno y docente según lo que figure en la ficha.

### ¿Quién puede publicar un profesor?

Solo usuarios con rol **admin**. El alta está en el menú *Agregar Profesor* (visible si iniciaste sesión como admin).

### ¿Qué es un “profesor recomendado”?

Son docentes ordenados principalmente por **cantidad de visitas** (`views`) a su ficha; al abrir un perfil se incrementa ese contador. Sirve para destacar perfiles más consultados en el Home.

### ¿Puedo usar la app sin registrarme?

Sí para **buscar y ver** profesores. Para **reservar**, **favoritos** y **mis clases** necesitás cuenta (`user` o `admin`).

---

## Uso en celular y red local

### El celular no abre la página

1. PC y celular en la **misma Wi‑Fi**.
2. Usá **`http://IP:3000`** con `http://` explícito (no solo la IP).
3. Ejecutá `iniciar-estudius-red.bat` en la PC y usá la IP que imprime la consola.
4. Si aparece **ERR_SSL_PROTOCOL_ERROR**, no uses `https://` en el puerto 3000. Ver `http://IP:3000` o `https://IP:3443` aceptando la advertencia del certificado local.
5. Página de ayuda: `http://IP:3000/conectar-celular`.

### ¿Por qué hay puerto 3000 y 3443?

- **3000** — HTTP normal (recomendado en LAN).
- **3443** — HTTPS con certificado autofirmado por si el navegador del celular insiste en conexión segura.

---

## Cuentas y permisos

### Super-admin (única cuenta)

| Email | Contraseña |
|-------|------------|
| `admin@gmail.com` | `contraseña` |

Se crea al primer arranque si no existía. **Es la única cuenta con super-admin** (panel de usuarios). Cambiá la contraseña en producción.

### Usuario “Historial” (ejemplo de reservas pasadas)

| Email | Contraseña |
|-------|------------|
| `historial@gmail.com` | `Historial123!` |

No se crea solo: ejecutá `node scripts/seed-historial-user.js` desde `Backend/` (con profesores ya cargados). Sirve para ver **Mis clases** con turnos en el pasado.

### Diferencia entre admin y super-admin

| | Admin (`role: admin`) | Super-admin (`admin@gmail.com` únicamente) |
|--|----------------------|----------------------------------|
| Gestionar profesores | Sí | Sí |
| Características del sitio | Sí | Sí |
| Gestionar cuentas de usuarios | No | Sí |

### No puedo reservar una clase

- Tenés que **iniciar sesión** (no alcanza con ser visitante).
- Elegí un horario **disponible** en el calendario del profesor.
- Si el turno ya fue tomado o está fuera de su franja, el servidor rechazará la reserva.

---

## Técnica

### `npm start` falla o puerto en uso

Cerrá otras ventanas de Node/Estudius. En Windows el `.bat` intenta liberar 3000 y 3443. También podés cambiar puerto: `set PORT=3001` antes de `npm start`.

### No existe `Database/estudius.db`

Es normal la primera vez: al arrancar el servidor, `Database/db.js` aplica `schema.sql` y crea el archivo.

### Las fotos no se ven

- Deben estar en `Frontend/Assets/uploads/...`.
- En la BD la ruta es tipo `/assets/uploads/hombres/12.jpg`.
- Ejecutá `node assign-photos.js` desde `Backend/` si cargaste datos sin fotos.

### ¿Dónde cambio las materias del formulario?

`Backend/models/teacherModel.js` (`ALL_SUBJECTS`). Reiniciá el servidor después.

### Error al crear profesor por API

`POST /api/teachers` exige **token de admin** (`Authorization: Bearer ...`). Los horarios deben ir en **formato JSON estructurado** (no texto libre). Ver migración en `scheduleUtils.js` y ejemplos actualizados en `EJEMPLOS_DATOS.js`.

---

## Más ayuda

- Instalación: [QUICKSTART.md](QUICKSTART.md)
- Checklist de pruebas: [VERIFICACION.md](VERIFICACION.md)
- Mapa de código: [PROJECT_MAP.md](PROJECT_MAP.md)
