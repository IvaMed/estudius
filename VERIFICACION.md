# ✅ LISTA DE VERIFICACIÓN - ANTES DE EJECUTAR

Antes de ejecutar la aplicación, verifica que tengas todo lo necesario.

## 🖥️ Requisitos del Sistema

- [ ] Node.js >= 14.0.0 instalado
- [ ] npm >= 6.0.0 instalado
- [ ] Navegador moderno (Chrome, Firefox, Safari, Edge)
- [ ] Puerto 3000 disponible (o poder usar otro)

**Verificar:**
```bash
node --version    # Debería mostrar v14.0.0 o mayor
npm --version     # Debería mostrar 6.0.0 o mayor
```

---

## 📁 Estructura de Carpetas

Verifica que tengas estas carpetas en `estudius/`:

- [ ] `frontend/` — Aplicación web
- [ ] `backend/` — API REST
- [ ] `database/` — Esquema SQL

**Verificar:**
```bash
ls -la              # En Linux/Mac
dir                 # En Windows PowerShell
```

---

## 📄 Archivos Principales

### Documentación
- [ ] `README.md` (2500+ palabras)
- [ ] `QUICKSTART.md` (Inicio rápido)
- [ ] `STACK_Y_ESTRUCTURA.md` (Stack explicado)
- [ ] `ENTREGA_RESUMEN.md` (Resumen)
- [ ] `FAQ.md` (Preguntas frecuentes)
- [ ] `INDICE.md` (Este índice)

### Frontend
- [ ] `frontend/index.html` (Página principal)
- [ ] `frontend/css/styles.css` (Estilos - 1200+ líneas)
- [ ] `frontend/js/app.js` (Lógica - 500+ líneas)
- [ ] `frontend/js/api.js` (Cliente HTTP)
- [ ] `frontend/js/utils.js` (Utilidades)

### Backend
- [ ] `backend/package.json` (Dependencias)
- [ ] `backend/server.js` (Servidor Express)
- [ ] `backend/routes/teacherRoutes.js` (Rutas)
- [ ] `backend/controllers/teacherController.js` (Controladores)
- [ ] `backend/services/teacherService.js` (Lógica)
- [ ] `backend/data/teacherRepository.js` (CRUD)
- [ ] `backend/models/teacherModel.js` (Esquema)
- [ ] `backend/database/db.js` (Conexión BD)

### Base de Datos
- [ ] `database/schema.sql` (Esquema SQLite)

### Otros
- [ ] `EJEMPLOS_DATOS.js` (Datos de prueba)
- [ ] `start.js` (Script de inicio automático)

---

## 📦 Dependencias

Verifica que se instalarán correctamente:

- [ ] `express` (servidor web)
- [ ] `cors` (CORS para desarrollo)
- [ ] `sqlite3` (base de datos)

**Nota:** Instalaste con `npm install` dentro de `backend/`

---

## 🔧 Configuración Necesaria

- [ ] Puerto 3000 está disponible (o puedes cambiar con `PORT=3001`)
- [ ] Permisos de lectura/escritura en carpeta `backend/`
- [ ] Permisos de lectura/escritura en carpeta `database/`

**Si tienes problemas:**
```bash
# Dar permisos (Linux/Mac)
chmod -R 755 backend/
chmod -R 755 database/

# O cambiar puerto
PORT=3001 npm start
```

---

## 🧪 Pre-ejecución

### Test 1: Conectar a NodeJS
```bash
cd backend
npm start
```
Debería Ver:
```
✓ Conectado a SQLite
✓ Base de datos inicializada
╔═══════════════════════════╗
║ ESTUDIUS - Servidor iniciado ║
║ URL: http://localhost:3000 ║
╚═══════════════════════════╝
```

Presiona **Ctrl+C** para detener.

### Test 2: Abrir en navegador
1. Inicia el servidor: `npm start`
2. Abre: http://localhost:3000
3. Deberías Ver home page con:
   - Header con logo
   - Buscador
   - Categorías
   - Sección de profesores (vacío inicialmente)
   - Footer

### Test 3: Crear un profesor
1. Click en "Agregar Profesor"
2. Completa forma (ve archivo EJEMPLOS_DATOS.js)
3. Click "Crear Profesor"
4. Debería aparecer confirmación

### Test 4: Ver listado
1. Click en "Listado de Profesores"
2. Debería verse el profesor creado

### Test 5: Ver detalle
1. Click en un profesor
2. Debería ver página de detalle

---

## 🎯 Orden de Ejecución

### 1. Primero: Leer documentación
```bash
# Abre cualquier editor y lee:
1. QUICKSTART.md          (5 min)
2. este archivo           (10 min)
```

### 2. Segundo: Instalar
```bash
cd backend
npm install
```

### 3. Tercero: Ejecutar
```bash
npm start
```

### 4. Cuarto: Probar
- Abre http://localhost:3000
- Crea un profesor
- Ve listado
- Haz clic en detalle

---

## 🚨 Problemas Comunes

### ❌ "npm: comando no encontrado"
**Solución:** Node.js no está instalado
```bash
# Instala desde: https://nodejs.org/
# Luego reinicia la terminal
```

### ❌ "EADDRINUSE: Puerto 3000 en uso"
**Solución:** Otro programa usa ese puerto
```bash
# Opción 1: Usa otro puerto
PORT=3001 npm start

# Opción 2: Mata el proceso (Linux/Mac)
lsof -ti:3000 | xargs kill -9

# Opción 2: Mata el proceso (Windows)
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

### ❌ "ENOENT: No such file or directory, open '...schema.sql'"
**Solución:** Archivo schema.sql no existe
- Verifica que `database/schema.sql` exista
- Comprueba rutas exactas
- Reinicia servidor

### ❌ "No se ve el logo/estilos"
**Solución:** Caché del navegador
```bash
# Limpia caché (todos navegadores):
Ctrl+Shift+Delete  (Windows)
Cmd+Shift+Delete   (Mac)
```

### ❌ "Formulario no valida"
**Solución:** Abre consola (F12) para ver errores
- Lee los mensajes de error
- Verifica que los datos sean válidos
- Ve archivo FAQ.md para validaciones exactas

---

## 📊 Checklist Final

Antes de decir "¡Listo!", verifica:

### Funcionalidad
- [ ] Home page carga correctamente
- [ ] Puede crear un profesor
- [ ] El profesor aparece en listado
- [ ] Puede ver detalle del profesor
- [ ] Botones de navegación funcionan
- [ ] Paginación funciona

### Contenido
- [ ] Header con logo y lema visible
- [ ] Footer con copyright visible
- [ ] 35+ materias disponibles
- [ ] Validaciones funcionan

### Base de Datos
- [ ] Se creó `database/estudius.db`
- [ ] Los datos se guardan
- [ ] Se pueden consultar desde BD

### Performance
- [ ] Carga rápido (~2 segundos)
- [ ] Responde bien a clicks
- [ ] No tiene errores en console (F12)

### Documentación
- [ ] Leíste el README.md
- [ ] Entiende la arquitectura
- [ ] Sabe dónde encontrar código

---

## 🎓 Próximos Pasos

Una vez que todo funciona:

1. **Explorar código**
   - Abre `backend/services/teacherService.js`
   - Mira cómo funciona validación
   - Estudia el algoritmo de recomendación

2. **Probar API directamente**
   - JSON Postman o curl
   - Usa ejemplos en `EJEMPLOS_DATOS.js`
   - Experimenta con filtros

3. **Personalizar**
   - Cambia colores en `styles.css`
   - Agrega más materias en `teacherModel.js`
   - Modifica algoritmo en `teacherService.js`

4. **Ampliar funcionalidad**
   - Agrega edición/eliminación
   - Implementa reviews
   - Agrega autenticación

---

## 🎉 ¡Todos listos!

Si completaste este checklist:

✅ Tienes todo instalado
✅ Entiendes la estructura
✅ Sabes cómo ejecutar
✅ Puedes probar funcionalidad
✅ Puedes hacer cambios

**ADELANTE:**

```bash
cd backend
npm start
# Luego abre: http://localhost:3000
```

---

## 📞 Si algo no funciona

1. **Lee FAQ.md** - Respuestas a problemas comunes
2. **Lee README.md Troubleshooting** - Soluciones detalladas
3. **Abre consola (F12)** - Ve errores específicos
4. **Revisa terminal** - Logs del servidor
5. **Busca en código** - Comentarios explican lógica

---

**¡Buena suerte!** 🚀

Disfruta construyendo con Estudius.

---

Creado: Abril 2026
Estudius Team
"Si querés estudiar, Estudius es el lugar"
