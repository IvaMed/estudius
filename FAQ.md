# ❓ PREGUNTAS FRECUENTES - ESTUDIUS

## General

### ¿Por qué SQLite y no MySQL/PostgreSQL?
**R:** SQLite es ideal para desarrollo local porque:
- No requiere servidor externo
- Es robusto y confiable
- Es fácil de instalar (incluido en npm)
- No hay limitaciones para este caso de uso

Para producción, seria recomendable migrar a PostgreSQL.

### ¿Por qué JavaScript vanilla y no React/Vue?
**R:** Javascript vanilla es mejor para:
- Aprender sin dependencias
- Proyectos pequeños/medianos
- Carga rápida
- Menos complejidad
- Ideal para desafíos escolares

En producción, React sería una better choice para escalabilidad.

### ¿Puedo modificar los colores?
**R:** Sí! Están definidos en CSS variables:
```css
:root {
  --color-primary: #587D71;      /* Cambiar aquí */
  --color-secondary: #8EA8C3;
  /* etc */
}
```

### ¿Cómo cambio el puerto?
**R:** Ejecuta con variable de entorno:
```bash
# Windows
set PORT=3001 && npm start

# Linux/Mac
PORT=3001 npm start
```

---

## Base de Datos

### ¿Dónde se guardan los datos?
**R:** En `database/estudius.db` - archivo SQLite local

### ¿Cómo borro todos los profesores?
**R:** Elimina el archivo `database/estudius.db` y reinicia el servidor

### ¿Puedo ver los datos directamente?
**R:** Sí, con herramientas SQLite:
- DB Browser for SQLite (GUI)
- `sqlite3 database/estudius.db` (CLI)

### ¿Qué pasa si cargo un correo duplicado?
**R:** El servidor rechaza con error 400:
```json
{
  "success": false,
  "message": "El email ya está registrado"
}
```

### ¿Cuántos profesores manejo?
**R:** SQLite soporta:
- Miles de registros sin problema
- Para millones, migrar a PostgreSQL

---

## Backend / API

### ¿Cómo agrego un nuevo endpoint?
**R:** 5 pasos:
1. Agregar ruta en `routes/teacherRoutes.js`
2. Crear método en `controllers/teacherController.js`
3. Crear lógica en `services/teacherService.js`
4. Usar repository si es necesario en `data/teacherRepository.js`
5. Reiniciar servidor

### ¿Qué significa "respuesta 201"?
**R:** HTTP 201 = Creado exitosamente (success)

### ¿Qué significa "respuesta 400"?
**R:** HTTP 400 = Bad Request (datos inválidos)

### ¿Qué significa "respuesta 404"?
**R:** HTTP 404 = No encontrado (profesor ID no existe)

### ¿Qué significa "respuesta 500"?
**R:** HTTP 500 = Error del servidor (bug)

### ¿Cómo desactivo CORS?
**R:** Modifica en `server.js`:
```javascript
// Línea actual:
app.use(cors({ origin: '*' }));

// Cambiar a específico:
app.use(cors({ origin: ['http://localhost:3000'] }));
```

---

## Frontend

### ¿Cómo cambio el logo?
**R:** El logo se configura desde `frontend/js/config.js` mediante la variable `SITE_LOGO_PATH` (por defecto `assets/uploads/logo.svg`). Opciones:

1. Reemplazar el archivo en `frontend/assets/uploads/logo.svg` (o añadir `logo.png`) y, si cambias el nombre, actualizar `SITE_LOGO_PATH` en `frontend/js/config.js`.
2. Editar `index.html` y usar tu propio `<img src="ruta/a/logo.png">` (menos recomendable si querés cambiarlo dinámicamente).

### ¿Cómo cambio los textos del sitio?
**R:** Buscar y reemplazar en `app.js` - método `renderPage()`

### ¿Cómo agrego más materias?
**R:** 1) Actualizá la lista en `backend/models/teacherModel.js` (lista de materias del servidor).  
2) Reflejála en `frontend/js/api.js` para que aparezca en los selectores del frontend.  

Si necesitás limpiar perfiles que contengan materias específicas (por ejemplo `Python` o `JavaScript` que fueron removidas del set por defecto), ejecutá `node backend/remove-subjects.js`.

Ejemplo (backend):
```javascript
// backend/models/teacherModel.js
SUBJECTS.computerScience.push('Nueva Materia');
```

### ¿Por qué algunos campos se validan dos veces?
**R:** Una vez en frontend (UX rápida) y otra en backend (seguridad)

### ¿Cómo personalizo los estilos?
**R:** Editar `css/styles.css`:
- CSS variables en `:root {}`
- O editar directamente las clases

### ¿Cómo cambio el tamaño del header?
**R:** Editá `frontend/css/styles.css` y ajustá la altura del `header`. En esta versión el header usa `height: 140px`.

Ejemplo:
```css
header {
  height: 140px;
}
```

### ¿Cómo poblo la base de datos con datos de ejemplo?
**R:** Desde la carpeta `backend/` ejecutar:
```bash
# Generar 40 profesores de ejemplo
node seed-teachers.js

# Asignar fotos desde frontend/assets/uploads a los perfiles
node assign-photos.js

# (Opcional) Quitar materias específicas de los perfiles
node remove-subjects.js
```

---

## Validaciones

### ¿Por qué rechaza mi email?
**R:** El formato de email no es válido:
- Debe tener `@` y un `.`
- Ejemplo: `juan@email.com` ✅
- Mal: `juanemail.com` ❌

### ¿Por qué rechaza mi teléfono?
**R:** Debe tener al menos 7 dígitos:
- Ejemplo: `+54 911 2234567` ✅
- Mal: `123456` ❌

### ¿Por qué rechaza mi edad?
**R:** Debe estar entre 1 y 149 años

### ¿Por qué rechaza cantidad de alumnos?
**R:** Debe estar entre 1 y 29

---

## Algoritmo de Recomendación

### ¿Cómo funciona?
**R:** Ordena por:
1. **Vistas** (más visto = más popular)
2. **Fecha** (recientes primero)
3. **Modalidad** (alterna virtual/presencial)

### ¿Puedo cambiar el algoritmo?
**R:** Sí, editar en `backend/services/teacherService.js`:
```javascript
static async getRecommendedTeachers(limit = 10) {
  // Aquí está la lógica
}
```

### ¿Se incrementan las vistas al visitarlo?
**R:** Sí, cada vez que ves el detalle se suma 1 vista

---

## Seguridad

### ¿Es seguro guardar contraseñas?
**R:** Actualmente no hay autenticación. Es un TODO futuro.

### ¿Pueden ver mis datos?
**R:** Sí, es API pública. En producción agregar autenticación.

### ¿Se valida en servidor?
**R:** Sí, SIEMPRE vagas datos en backend aunque pasen frontend

---

## Estructura

### ¿Por qué 3 capas?
**R:** Separación de responsabilidades:
- **Frontend**: UI
- **Backend**: Lógica
- **Base Datos**: Persistencia

Hace el código más mantenible.

### ¿Puedo tener el frontend en otro servidor?
**R:** Sí, cambiar en `api.js`:
```javascript
const API_BASE_URL = 'http://otro-servidor:3000/api';
```

---

## Depuración

### ¿Cómo veo los errores?
**R:** 
1. **Frontend**: Abrir consola con F12
2. **Backend**: Ver output en terminal

### ¿Cómo agrego logs?
**R:** Agregar `console.log()` en backend donde necesites

### ¿Cómo debugging del código?
**R:** Usar: `node --inspect server.js` en el VS Code

---

## Futuro

### ¿Qué debería agregar primero?
**R:** Prioridad:
1. Autenticación de usuarios
2. Edición de profesores
3. Eliminación de profesores
4. Reviews/Ratings
5. Chat/Mensajería

### ¿Cómo migraría a PostgreSQL?
**R:** Cambiar driver SQL pero lógica es similar

### ¿Puedo agregar autenticación?
**R:** Sí, agregar:
1. Tabla users en BD
2. JWT tokens
3. Password hashing con bcrypt
4. Middleware de autenticación

---

## Solución de problemas

### El servidor se apaga solo
**R:** Presionaste Ctrl+C por accidente o hay error. Ver logs.

### La BD se corrupto
**R:** Elimina `database/estudius.db` y reinicia

### Los estilos no cargan
**R:** Verificar:
1. Path correcto en HTML: `css/styles.css`
2. Servidor corriendo correctamente
3. Limpiar cache del navegador (Ctrl+Shift+Del)

### No puedo crear profesor
**R:** Verificar:
1. Backend corriendo (npm start)
2. Todos los campos completados
3. Email único (no ya existe)
4. Ver error en consola (F12)

### El listado está vacío
**R:** 
1. Aún no has creado profesores
2. Crea uno primero desde "Agregar Profesor"

---

## Performance

### ¿Puedo cargar 1000 profesores?
**R:** Sí, pero lentito. Agregar paginación en BD.

### ¿Cómo optimizo?
**R:** Índices en BD, caché, lazy loading en frontend

---

## Licencia y Uso

### ¿Puedo usar en producción?
**R:** Sí, pero:
1. Agregar autenticación
2. Validar seguridad
3. Usar HTTPS
4. Base de datos robusta (PostgreSQL)

### ¿Puedo modificar y redistribuir?
**R:** Sí, está bajo MIT License

---

## Contacto / Ayuda

Si tienes más preguntas:
1. Revisar README.md
2. Ver comentarios en código
3. Revisar STACK_Y_ESTRUCTURA.md
4. Ejecutar EJEMPLOS_DATOS.js

---

**Última actualización:** Abril 2026
