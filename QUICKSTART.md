# ⚡ INICIO RÁPIDO - ESTUDIUS

## 3 Pasos para empezar

### 1️⃣ Instalar dependencias
```bash
cd backend
npm install
```

### 2️⃣ Iniciar servidor
```bash
npm start
```

Debería ver:
```
╔════════════════════════════════╗
║  ESTUDIUS - Servidor iniciado   ║
╠════════════════════════════════╣
║ URL: http://localhost:3000      ║
║ Presiona Ctrl+C para detener   ║
╚════════════════════════════════╝
```

### 3️⃣ Abrir navegador
```
http://localhost:3000
```

---

## 🎯 Primeros pasos

1. **Home** → Verás profesores recomendados
2. **Agregar Profesor** → Crea un profesor de prueba
3. **Listado** → Verás tu profesor en la lista
4. **Ver Detalle** → Haz clic en un profesor

---

## 📝 Datos de ejemplo

Si quieres probar con datos reales, abre la consola del navegador (F12) y copia cualquier dato del archivo `EJEMPLOS_DATOS.js`

---

## 🆘 Problemas comunes

### Ese puerto ya está en uso
```bash
# Ejecutar en otro puerto
PORT=3001 npm start
```

### npm install no funciona
```bash
# Verificar Node.js
node --version

# Limpiar caché
npm cache clean --force

# Intentar de nuevo
npm install
```

### Base de datos no se crea
- Se crea automáticamente al iniciar el servidor
- Ubicación: `database/estudius.db`
- Si hay un error, verifica permisos de carpeta

---

## 📚 Documentación completa

Leer `README.md` para:
- Stack tecnológico explicado
- Estructura de carpetas
- API endpoints
- Validaciones
- Troubleshooting avanzado

---

## 🚀 ¡Listo!

Ya puedes crear, listar y ver profesores. ¡Disfruta! 🎉
