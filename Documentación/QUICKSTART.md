# Inicio rápido técnico

## 1. Instalar dependencias

```bash
cd Backend
npm install
```

Solo hace falta instalar en `Backend/` (ahí está `package.json` y `node_modules`).

## 2. Iniciar el servidor

**Desarrollo en PC:**

```bash
cd Backend
npm start
```

**PC + celular en la misma red:**

Desde la raíz del proyecto:

```text
iniciar-estudius-red.bat
```

El script libera puertos 3000/3443 si estaban ocupados, instala dependencias la primera vez y abre el navegador con la IP local.

| Puerto | Protocolo | Uso |
|--------|-----------|-----|
| 3000 | HTTP | Uso normal (celular y PC) |
| 3443 | HTTPS | Opcional; certificado autofirmado (aceptar advertencia) |

## 3. Abrir la aplicación

- PC: [http://localhost:3000](http://localhost:3000)
- Celular: `http://<IP-de-la-PC>:3000` (misma Wi‑Fi)
- Prueba API: [http://localhost:3000/api/health](http://localhost:3000/api/health)

## 4. Base de datos

- Archivo: `Database/estudius.db` (se crea al primer arranque si no existe).
- Esquema: `Database/schema.sql`.
- Conexión y migraciones: `Database/db.js`.

Cuenta admin por defecto: `admin@gmail.com` / `contraseña`.

## 5. Datos de ejemplo (opcional)

Desde `Backend/`:

```bash
node seed-teachers.js
node assign-photos.js
```

- `seed-teachers.js` — genera profesores aleatorios en SQLite.
- `assign-photos.js` — vincula imágenes de `Frontend/Assets/uploads/{hombres,mujeres,others}/`.
- `remove-subjects.js` — quita materias concretas de los perfiles (mantenimiento).
- `scripts/seed-historial-user.js` — crea `historial@gmail.com` / `Historial123!` con reservas pasadas de ejemplo.

## 6. Script de arranque alternativo

`Backend/start-root.js` (antes `start.js` en la raíz) verifica Node, carpetas y puerto antes de lanzar el servidor. Uso:

```bash
node Backend/start-root.js
```

(desde la raíz del proyecto)

## 7. Variables de entorno (opcionales)

| Variable | Default | Efecto |
|----------|---------|--------|
| `PORT` | 3000 | Puerto HTTP |
| `HTTPS_PORT` | 3443 | Puerto HTTPS LAN |
| `JWT_SECRET` | valor de desarrollo | Firmar tokens JWT |

En producción definí siempre `JWT_SECRET` distinto al de desarrollo.
