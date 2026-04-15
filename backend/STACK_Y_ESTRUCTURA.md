# Estudius - Stack Tecnológico y Arquitectura

## 1. PROPUESTA DE STACK TECNOLÓGICO

### Frontend
- **HTML5**: Estructura semántica
- **CSS3**: Estilos y diseño responsivo
- **JavaScript Vanilla**: Interactividad sin dependencias externas (fácil de mantener)
- **Fetch API**: Comunicación con el backend

### Backend
- **Node.js + Express.js**: Framework web ligero y robusto
- **Validaciones**: express-validator para validaciones en servidor
- **CORS**: Para comunicación segura entre frontend y backend

### Base de Datos
- **SQLite3**: 
  - ✅ Sin requerimientos de servidor separado
  - ✅ Perfecto para desarrollo local
  - ✅ Fácil de configurar
  - ✅ Robusto y confiable
  - ✅ Soporte en Node.js mediante el paquete `sqlite3`

## 2. ESTRUCTURA DEL PROYECTO

```
estudius/
├── frontend/
│   ├── index.html                 (Home page)
│   ├── add-teacher.html           (Formulario agregar profesor)
│   ├── teacher-list.html          (Listado de profesores)
│   ├── teacher-detail.html        (Detalle de un profesor)
│   ├── css/
│   │   └── styles.css             (Estilos generales)
│   ├── js/
│   │   ├── app.js                 (Lógica principal)
│   │   ├── api.js                 (Cliente HTTP)
│   │   ├── utils.js               (Funciones auxiliares)
│   │   └── validators.js          (Validaciones frontend)
│   └── assets/
│       └── uploads/               (Fotos de profesores)
│
├── backend/
│   ├── package.json
│   ├── server.js                  (Punto de entrada)
│   ├── config.js                  (Configuración)
│   │
│   ├── routes/
│   │   └── teacherRoutes.js       (Rutas de profesores)
│   │
│   ├── controllers/
│   │   └── teacherController.js   (Lógica de solicitudes HTTP)
│   │
│   ├── services/
│   │   └── teacherService.js      (Lógica de negocios)
│   │
│   ├── data/
│   │   └── teacherRepository.js   (Acceso a datos)
│   │
│   ├── models/
│   │   └── teacherModel.js        (Esquema de datos)
│   │
│   ├── middleware/
│   │   ├── validation.js          (Validaciones)
│   │   └── errorHandler.js        (Manejo de errores)
│   │
│   └── database/
│       └── db.js                  (Conexión a BD)
│
├── database/
│   └── schema.sql                 (Script creación BD)
│
└── README.md                       (Instrucciones de ejecución)
```

## 3. SEPARACIÓN DE CAPAS

### Capa de Presentación (Frontend)
- Responsabilidad: Interfaz de usuario
- HTML + CSS + JavaScript
- Comunicación vía HTTP/JSON

### Capa de Aplicación (API - Backend)
- Responsabilidad: Lógica de solicitudes, validaciones, coordinación
- Controllers: Manejan solicitudes HTTP
- Services: Lógica de negocio
- Routes: Definición de endpoints

### Capa de Datos
- Responsabilidad: Acceso a base de datos
- Repository: CRUD operations
- Models: Esquema de datos

## 4. FLUJO DE DATOS

```
Usuario (Frontend)
    ↓
HTTP Request (JSON)
    ↓
Router (Backend)
    ↓
Controller (Validación inicial)
    ↓
Service (Lógica de negocio)
    ↓
Repository (Acceso a BD)
    ↓
SQLite Database
    ↓
Response (JSON)
    ↓
Frontend (actualiza interfaz)
```

## 5. ENDPOINTS DE LA API

```
POST   /api/teachers              - Crear un nuevo profesor
GET    /api/teachers              - Obtener todos los profesores
GET    /api/teachers/:id          - Obtener detalles de un profesor
GET    /api/teachers/recommendation - Obtener profesores recomendados
PUT    /api/teachers/:id          - Actualizar profesor (futuro)
DELETE /api/teachers/:id          - Eliminar profesor (futuro)
```

## 6. VALIDACIONES

### Frontend
- Validación en tiempo real (feedback visual)
- Prevención de envíos inválidos

### Backend
- Validación completa de datos
- Verificación de integridad
- Seguridad

### Base de Datos
- Constraints a nivel BD
- Tipos de datos específicos
