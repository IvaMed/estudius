# 📚 ESTUDIUS - Profesores particulares

Una aplicación web moderna para conectar estudiantes con tutores privados. Permite buscar, filtrar y contactar profesores en diferentes disciplinas con una interfaz intuitiva y responsiva.

**Slogan:** "Si querés estudiar, Estudius es el lugar"

---

## 📋 Tabla de Contenidos

1. [Características](#características)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Requisitos](#requisitos)
4. [Instalación](#instalación)
5. [Ejecución](#ejecución)
6. [Estructura del Proyecto](#estructura-del-proyecto)
7. [API Endpoints](#api-endpoints)
8. [Validaciones](#validaciones)
9. [Algoritmo de Recomendación](#algoritmo-de-recomendación)
10. [Base de Datos](#base-de-datos)

---

## ✨ Características

### Para Estudiantes
- ✅ Visualizar profesores recomendados en el home
- ✅ Buscar profesores por nombre, materia o modalidad
- ✅ Ver detalles completos de cada profesor
- ✅ Filtrar por modalidad (virtual/presencial)
- ✅ Paginación en listados
- ✅ Interfaz intuitiva y responsiva

### Para Administradores
- ✅ Agregar nuevos profesores
- ✅ Validación completa de datos
- ✅ Gestión de materias
- ✅ Subida de fotos
- ✅ Información detallada de clases

### Sistema
- ✅ Arquitectura en 3 capas (Frontend, API, Backend)
- ✅ Base de datos SQLite local
- ✅ Algoritmo de recomendación inteligente
- ✅ Validaciones frontend y backend
- ✅ CORS habilitado para desarrollo

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | HTML5, CSS3, JavaScript Vanilla | ES6+ |
| **Backend** | Node.js + Express.js | 4.18.2 |
| **Base de Datos** | SQLite3 | 3 |
| **Runtime** | Node.js | >=24.14.1 |

### Ventajas del Stack Elegido

**Frontend:**
- Sin dependencias externas (JavaScript Vanilla)
- Carga rápida
- Fácil de mantener
- Compatible con todos los navegadores

**Backend:**
- Express.js es liviano y robusto
- Ecosistema npm maduro
- Excelente para proyectos medianos
- Fácil integración con SQLite

**Base de Datos:**
- SQLite: Sin servidor externo requerido
- Ideal para desarrollo local
- Perfiles ACID completos
- Escalable para uso personal/educativo

---

## 📦 Requisitos

- Node.js >= 14.0.0
- npm >= 6.0.0
- SQLite3 (incluido en el paquete npm)
- Navegador moderno (Chrome, Firefox, Safari, Edge)

---

## 🚀 Instalación

### 1. Clonar o descargar el proyecto

```bash
cd estudius
```

### 2. Estructura de carpetas

```
estudius/
├── README.md
├── iniciar-estudius-red.bat
├── Frontend/              # Aplicación web (HTML5, CSS3, JS)
│   └── Assets/            # Imágenes y uploads
├── Backend/               # Servidor Node.js + lógica de negocio
├── Apis/                  # Rutas y controladores HTTP
├── Database/              # Esquema y datos SQLite
└── Documentación/         # Guías y capturas de pantalla
```

---

## 🎯 Ejecución

### Paso 1: Iniciar el Servidor 

Ejecutar iniciar-estudius-red.bat


Salida esperada:
```
[OK] URLs cuando el servidor arranque:
     PC:       http://localhost:3000
     Celular:  http://192.168.11.38:3000
     (HTTPS)   https://192.168.11.38:3443
```

El servidor:
- Inicia en `http://localhost:3000`
- Sirve archivos estáticos del frontend en el directorio `Frontend/`
- Expone la API en `/api`
- Inicializa automáticamente la base de datos SQLite

### Paso 2: Acceder a la Aplicación

Abre tu navegador y ve a:
```
http://localhost:3000
```

---

## 📁 Estructura del Proyecto

### Frontend
```
Frontend/
├── index.html
├── Assets/uploads/         # Fotos de profesores
├── css/styles.css
└── js/                     # app.js, api.js, utils.js, config.js
```

### Apis
```
Apis/
├── routes/                 # Definición de endpoints REST
└── controllers/            # Manejo de solicitudes HTTP
```

### Backend
```
Backend/
├── server.js               # Punto de entrada Express
├── package.json
├── services/               # Lógica de negocio
├── data/                   # Repositorios
├── models/
├── middleware/
├── lib/
└── scripts/                # Utilidades (seed, fotos, etc.)
```

### Database
```
Database/
├── schema.sql
├── db.js                   # Conexión SQLite
└── estudius.db             # Creado automáticamente al iniciar
```

### Documentación
```
Documentación/
├── Capturas de pantalla/
└── (guías .md, bitácora, etc.)
```

---

## 🔌 API Endpoints

### Profesores

#### Crear profesor
```http
POST /api/teachers
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "age": 35,
  "email": "john@example.com",
  "phone": "+5411234567",
  "description": "Descripción del profesor...",
  "curriculum": "Temario...",
  "photo": "base64_image_string",
  "classSize": 15,
  "subjects": ["Matemática", "Física"],
  "modality": "virtual",
  "schedules": "Lunes-Viernes 18:00-19:00",
  "location": null
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Profesor creado exitosamente",
  "teacherId": 1
}
```

#### Obtener todos los profesores
```http
GET /api/teachers
```

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      ...
    }
  ]
}
```

#### Obtener profesor por ID
```http
GET /api/teachers/:id
```

#### Obtener profesores recomendados
```http
GET /api/teachers/recommendations?limit=10
```

#### Obtener profesores aleatorios
```http
GET /api/teachers/random?limit=10
```

#### Obtener materias disponibles
```http
GET /api/subjects
```

**Response:**
```json
{
  "success": true,
  "data": [
    "Matemática",
    "Lengua",
    "Inglés",
    ...
  ]
}
```

#### Buscar profesores
```http
GET /api/teachers/search?modality=virtual&subject=Programación&search=Juan
```

---

## ✅ Validaciones

### Frontend (Validación en tiempo real)
- Email: Formato válido
- Teléfono: Mínimo 7 dígitos
- Edad: Entre 1 y 149
- Cantidad de alumnos: Entre 1 y 29
- Materias: Al menos una seleccionada
- Campos obligatorios marcados con asterisco (*)

### Backend (Validación obligatoria)
```javascript
// Todos los campos se validan en el servidor
- Nombres: Texto no vacío
- Edad: Número entre 1-149
- Email: Formato válido y único en BD
- Teléfono: Formato válido (si se proporciona)
- Materias: Array válido de materias conocidas y materias custom registradas en BD
- Modalidad: "virtual" o "presencial"
- Ubicación: Obligatoria si modalidad es presencial
- Descripción: Texto no vacío
- Temario: Texto no vacío
- Cantidad alumnos: 1-29
```

---

## 🧠 Algoritmo de Recomendación

### Estrategia
El algoritmo de recomendación utiliza múltiples factores:

1. **Vistas (Popularidad)**: Profesores más vistos primero
   - Campo `views` se incrementa cada vez que se visualiza el detalle
   
2. **Fecha de Creación**: Desempate entre iguales
   - Profesores más recientes tienen prioridad
   
3. **Balanceo de Modalidad**: Distribución virtual/presencial
   - Alterna entre modalidades para ofrecer variedad
   
4. **Aleatoriedad**: Cuando hay pocos profesores
   - Utiliza orden aleatorio para evitar monotonía

### Implementación
```javascript
// En TeacherService.getRecommendedTeachers()
1. Obtener profesores ordenados por vistas DESC y fecha DESC
2. Si hay menos de 5 profesores, usar orden aleatorio
3. Balancear entre virtual y presencial
4. Retornar máximo 10 profesores
```

---

## 💾 Base de Datos

### Inicialización Automática
La base de datos se crea automáticamente al iniciar el servidor:

1. Se leen las tablas del archivo `Database/schema.sql`
2. Se crean las tablas si no existen
3. Se habilitan las foreign keys
4. Se crean índices para optimización

### Tabla: teachers

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INTEGER | PK, AUTO | Identificador único |
| firstName | TEXT | NOT NULL | Nombre |
| lastName | TEXT | NOT NULL | Apellido |
| age | INTEGER | NOT NULL, CHECK(age > 0 AND age < 150) | Edad |
| email | TEXT | NOT NULL, UNIQUE | Email |
| phone | TEXT | NULL | Teléfono (opcional) |
| description | TEXT | NOT NULL | Descripción del profesor |
| curriculum | TEXT | NOT NULL | Temario |
| photo | TEXT | NULL | URL/Path foto |
| classSize | INTEGER | NOT NULL, CHECK(classSize > 0 AND classSize < 30) | Cantidad alumnos |
| subjects | TEXT | NOT NULL (JSON) | Materias |
| modality | TEXT | NOT NULL, CHECK IN ('virtual', 'presencial') | Modalidad |
| schedules | TEXT | NOT NULL | Horarios |
| location | TEXT | NULL | Ubicación (si presencial) |
| createdAt | DATETIME | DEFAULT CURRENT_TIMESTAMP | Fecha creación |
| updatedAt | DATETIME | DEFAULT CURRENT_TIMESTAMP | Fecha actualización |
| views | INTEGER | DEFAULT 0 | Contador de vistas |

### Índices
```sql
CREATE INDEX idx_email ON teachers(email);
CREATE INDEX idx_subjects ON teachers(subjects);
CREATE INDEX idx_modality ON teachers(modality);
CREATE INDEX idx_views ON teachers(views);
```

---

## 📚 Materias Disponibles

### Materias Escolares Clásicas (11)
Matemática, Lengua, Historia, Geografía, Biología, Física, Química, Educación Cívica, Filosofía, Psicología, Economía

### Nivel Universitario (10)
Análisis Matemático, Algebra Lineal, Estadística y probabilidad, Mecánica, Electrónica, Química Orgánica, Química Inorgánica, Marketing, Derecho, Administración

### Informática (4)
Programación, Desarrollo Web, Bases de Datos, Algoritmos

### Idiomas (5)
Inglés, Portugués, Francés, Italiano, Alemán

### Artes (3)
Dibujo, Pintura, Música

**Total: 33 materias disponibles**

---

## 🎨 Identidad Visual

### Colores Primarios
- Verde Oscuro: `#587D71`
- Azul Claro: `#8EA8C3`
- Crema Claro: `#F9FFE9`

### Colores del Isotipo
- Azul Oscuro: `#274580`
- Azul Más Oscuro: `#1C2E57`
- Amarillo: `#FFDB43`

### Texto
- Color Principal: `#00082C`
- Color Secundario: `#666666`

---

## 🔒 Seguridad

### Medidas Implementadas
1. **Validación en Backend**: Todos los datos se validan en servidor
2. **CORS**: Configurado para desarrollo local
3. **SQL Injections**: Se usan prepared statements
4. **Email Único**: Constraint a nivel BD
5. **Tipos de Datos**: Validación estricta de tipos

---

## 🐛 Troubleshooting

### El servidor no inicia
```bash
# Verificar que Node.js esté instalado
node --version

# Verificar que las dependencias estén instaladas
npm install

# Verificar que el puerto 3000 esté disponible
# Si no: PORT=3001 npm start
```

### La BD no se crea
```bash
# Verificar permisos en la carpeta Database/
# Asegurarse de que schema.sql exista

# Reiniciar el servidor
npm start
```

### Errores de CORS
```javascript
// El servidor ya tiene CORS habilitado para desarrollo
// Si aún así hay problemas, verificar en server.js:
app.use(cors({
  origin: '*'
}));
```

### Conexión rechazada a localhost:3000
- Verificar que el backend esté corriendo: `npm start`
- Verificar que no haya otro proceso usando puerto 3000
- En Windows, probar: `netstat -ano | findstr :3000`

---

## 📝 Modelo de Datos

### Ejemplo de Profesor Creado
```json
{
  "id": 1,
  "firstName": "María",
  "lastName": "García López",
  "age": 32,
  "email": "maria@example.com",
  "phone": "+5491234567890",
  "description": "Soy una docente con 10 años de experiencia en enseñanza de matemáticas. Me especializo en hacer que los números sean más accesibles...",
  "curriculum": "Operaciones básicas, Fracciones, Geometría, Álgebra, Trigonometría...",
  "photo": "data:image/jpeg;base64,...",
  "classSize": 8,
  "subjects": ["Matemática", "Física"],
  "modality": "virtual",
  "schedules": "Lunes a Viernes 17:00-20:00, Sábados 10:00-13:00",
  "location": null,
  "createdAt": "2026-04-12T10:30:00Z",
  "updatedAt": "2026-04-12T10:30:00Z",
  "views": 15
}
```

---

## 🎓 Casos de Uso

### Caso 1: Estudiante buscando profesor de Programación
1. Va al home
2. Ve profesores recomendados
3. Busca "Programación"
4. Filtra por "Virtual"
5. Selecciona un profesor
6. Ve detalles completos
7. Contacta al profesor

### Caso 2: Administrador agregando profesor
1. Accede a "Agregar Profesor"
2. Completa formulario con validaciones
3. Selecciona materias
4. Sube foto del profesor
5. Guarda
6. El profesor aparece en el lista desde ese momento

---

## 📈 Escalabilidad

### Mejoras Futuras
1. **Autenticación**: Cambiar a base de datos de usuarios y cuentas
2. **Calificaciones**: Agregar sistema de ratings de profesores
3. **Mensajería**: Chat entre estudiantes y profesores
4. **Pagos**: Integración con gateway de pagos
5. **Análisis**: Dashboard de estadísticas
6. **ML**: Recomendación más sofisticada con machine learning
7. **Móvil**: App nativa iOS/Android

---

## 👨‍💻 Desarrollo

### Agregar funcionalidad nueva

**Backend:**
1. Crear modelo en `models/`
2. Crear repository en `data/`
3. Crear service en `services/`
4. Crear controller en `controllers/`
5. Agregar rutas en `routes/`

**Frontend:**
1. Crear función en `api.js`
2. Agregar lógica en `app.js`
3. Crear HTML en método render
4. Agregar estilos en `css/styles.css`

---

## 📄 Licencia

MIT License - © 2026 Estudius

---

## 👥 Equipo
**Empresa:** Estudius
**Lema:** Si querés estudiar, Estudius es el lugar

**Grupo:**
Ezequiel Mateo Gomez Paz:
Mateo Alonso Marangone
Benito Deleon 
Ivan Medina
Francisco Colombo
---

## 📞 Soporte

Para reportar errores o sugerencias:
1. Verificar la sección Troubleshooting
2. Revisar los logs del servidor
3. Verificar la consola del navegador (F12)

---

**Última actualización:** Abril 2026
**Versión:** 1.0.0
