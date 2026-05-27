# Verificación del sistema

Checklist para confirmar que Estudius funciona después de instalar o cambiar código.

## Arranque

- [ ] `cd Backend && npm install` termina sin errores
- [ ] `npm start` muestra URLs HTTP (y opcional HTTPS en 3443)
- [ ] Consola: `[OK] Conectado a SQLite` y base inicializada
- [ ] [http://localhost:3000/api/health](http://localhost:3000/api/health) devuelve `"ok": true`

## Interfaz pública (sin login)

- [ ] Home carga y muestra sección de recomendados
- [ ] Búsqueda por nombre filtra resultados
- [ ] Chip de materia filtra por asignatura
- [ ] Filtros virtual / presencial funcionan
- [ ] `#list-teachers` muestra grilla y paginación
- [ ] Clic en profesor abre ficha con foto, materias y horarios
- [ ] Imagen por defecto si falta foto (`/assets/uploads/default-avatar.svg`)

## Usuario registrado

Registrar cuenta de prueba o usar una existente.

- [ ] Login guarda sesión (recargar página sigue logueado)
- [ ] En ficha: botón reservar pide login si no hay sesión
- [ ] Flujo `#book/{id}` permite elegir fecha/hora y confirmar
- [ ] `#my-bookings` lista la reserva creada
- [ ] Corazón en ficha agrega/quita favorito
- [ ] `#favorites` muestra profesores marcados

## Administrador

Login: `admin@gmail.com` / `contraseña`

- [ ] Menú muestra *Agregar Profesor*
- [ ] Alta de profesor completa guarda y aparece en listado
- [ ] Editar y eliminar profesor (desde ficha, como admin)
- [ ] `#admin-features` carga categorías/ítems
- [ ] Super-admin: `#admin` lista usuarios y permite cambiar rol

## Red local (opcional)

- [ ] `iniciar-estudius-red.bat` abre sin error
- [ ] Desde celular: `http://IP-PC:3000` carga la home
- [ ] API health responde desde el celular

## Base de datos

- [ ] Existe `Database/estudius.db` tras el primer arranque
- [ ] Borrar `estudius.db` y reiniciar recrea esquema y admin por defecto

## Regresión rápida tras cambios de rutas

- [ ] No hay carpetas sueltas `frontend/`, `backend/`, `database/` en minúsculas en la raíz
- [ ] Fotos en `Frontend/Assets/uploads` se sirven bajo `/assets/uploads/...`

Si algo falla, revisá la consola del navegador (F12) y la terminal del servidor; consultá [FAQ.md](FAQ.md).
