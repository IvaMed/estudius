-- =====================================================
-- ESTUDIUS - Base de Datos
-- =====================================================

-- Tabla de Profesores
CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    age INTEGER NOT NULL CHECK(age > 0 AND age < 150),
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    description TEXT NOT NULL,
    curriculum TEXT NOT NULL,
    photo TEXT,
    classSize INTEGER NOT NULL CHECK(classSize > 0 AND classSize < 30),
    subjects TEXT NOT NULL,           -- JSON array de materias
    modality TEXT NOT NULL CHECK(modality IN ('virtual', 'presencial')),
    modalities TEXT,                   -- JSON array de modalidades (p.ej. ["virtual","presencial"]) - nuevo
    schedules TEXT NOT NULL,           -- Texto con horarios
    location TEXT,                     -- Puede ser NULL si es virtual
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    views INTEGER DEFAULT 0            -- Para algoritmo de recomendación
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_subjects ON teachers(subjects);
CREATE INDEX IF NOT EXISTS idx_modality ON teachers(modality);
CREATE INDEX IF NOT EXISTS idx_views ON teachers(views);

-- =====================================================
-- TABLA DE USUARIOS (Autenticación)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT,
    email TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user', -- 'user' | 'admin'
    color TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- TABLA DE RESERVAS / BOOKINGS (Agendar clases)
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    teacherId INTEGER NOT NULL,
    datetime TEXT NOT NULL,
    message TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (teacherId) REFERENCES teachers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(userId);
CREATE INDEX IF NOT EXISTS idx_bookings_teacher ON bookings(teacherId);

-- Tabla de auditoría (opcional para futuro)
CREATE TABLE IF NOT EXISTS teacher_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacherId INTEGER NOT NULL,
    action TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacherId) REFERENCES teachers(id) ON DELETE CASCADE
);

-- =====================================================
-- MATERIAS POR CATEGORÍA (Referencia)
-- =====================================================

-- Materias Escolares Clásicas:
-- Matemática, Lengua, Historia, Geografía, Biología, Física, Química, 
-- Educación Cívica, Filosofía, Psicología, Economía

-- Materias de Nivel Universitario:
-- Análisis Matemático, Algebra Lineal, Estadística y probabilidad, Mecánica, 
-- Electrónica, Química Orgánica, Química Inorgánica, Marketing, Derecho, 
-- Administración

-- Materias Informáticas:
-- Programación, Desarrollo Web, Bases de Datos, Algoritmos

-- Idiomas:
-- Inglés, Portugués, Francés, Italiano, Alemán

-- Materias Artísticas:
-- Dibujo, Pintura, Música
