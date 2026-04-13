# 🚀 INSTRUCCIONES DE GITHUB - PASOS FINALES

## ¿Qué es .gitignore?

`.gitignore` es un archivo que le dice a Git **qué archivos o carpetas NO debe sincronizar** con GitHub. 

### Ejemplo de lo que ignoramos:
```
node_modules/          ← 500MB de dependencias (se instalan con npm install)
database/estudius.db   ← BD local con datos de desarrollo
.vscode/               ← Configuración personal del editor
.env                   ← Credenciales sensibles
package-lock.json      ← Se regenera automáticamente
```

### ✅ Lo que SÍ subiremos:
```
frontend/   ← HTML, CSS, JS (tu código)
backend/    ← Node.js, rutas, controladores
docs/       ← Documentación
README.md   ← Este archivo
package.json ← Lista de dependencias necesarias
.gitignore  ← Archivo que creamos
```

**Ventaja:** Cuando alguien clone tu repositorio con `git clone`, descargará 100KB en vez de 500MB. Luego ejecuta `npm install` y se descargan automáticamente.

---

## 🧹 PASO 1: LIMPIAR EL REPOSITORIO EXISTENTE

El repositorio `https://github.com/ivamed/estudius` probablemente tenga contenido viejo. Vamos a vaciarlo:

### Opción A: Desde la línea de comandos (RECOMENDADO)

```bash
# 1. Ir a la carpeta del proyecto
cd "c:\Users\Medina\Documents\IA Challenge\estudius"

# 2. Inicializar git (si no está inicializado)
git init

# 3. Agregar el repositorio remoto (reemplaza con tu URL)
git remote remove origin
git remote add origin https://github.com/ivamed/estudius.git

# 4. (OPCIONAL) Limpiar el historial local completamente
git status  # Ver estado actual

# Si quieres empezar completamente de cero:
# Borra .git
Remove-Item -Recurse -Force .git
git init

git add .
git commit -m "Limpieza inicial: preparando para nuevo push"
git branch -M main
git push --force origin main
```

### Opción B: Desde GitHub Web (RÁPIDA)

1. Ve a https://github.com/ivamed/estudius/settings
2. Baja hasta "Danger Zone"
3. Haz clic en **"Delete this repository"**
4. Crea un nuevo repositorio vacío
5. Luego sigue los pasos de Opción A

---

## 📤 PASO 2: PREPARAR Y SUBIR EL PROYECTO

### Comando completo (copia y pega):

```bash
# Posicionarse en el proyecto
cd "c:\Users\Medina\Documents\IA Challenge\estudius"

# Ver estado (debe mostrar archivos listos para subir)
git status

# Agregar TODOS los archivos (respeta .gitignore)
git add .

# Ver qué va a subir
git status

# Crear commit (versión)
git commit -m "Initial commit: Estudius v1.0 - Plataforma de búsqueda de tutores"

# Cambiar branch a main (GitHub usa main por defecto)
git branch -M main

# Subir al repositorio remoto
git push -u origin main
```

### Si pide autenticación:

**GitHub Personal Access Token (Recomendado):**

1. Ve a https://github.com/settings/tokens
2. Genera nuevo token (Classic)
3. Dale permisos: `repo`, `admin:repo_hook`
4. Copia el token
5. Cuando pida contraseña, pega el token

**O usa credential helper:**
```bash
git config --global credential.helper wincred
```

---

## ✅ PASO 3: VERIFICAR QUE SUBIÓ CORRECTAMENTE

Después de `git push`, verifica en GitHub:

1. Ve a https://github.com/ivamed/estudius
2. Deberías ver:
   - ✅ Carpeta `frontend/`
   - ✅ Carpeta `backend/`
   - ✅ Archivo `README.md`
   - ✅ Archivo `.gitignore`
   - ❌ No debe existir `node_modules/`
   - ❌ No debe existir `estudius.db`

---

## 🔧 PASO 4: PROBAR QUE ALGUIEN PUEDA CLONAR Y EJECUTAR

**Para verificar que funciona, prueba en otra carpeta:**

```bash
# Crear carpeta temporal
mkdir D:\EstudiusTest
cd D:\EstudiusTest

# Clonar tu repositorio
git clone https://github.com/ivamed/estudius.git
cd estudius

# Instalar dependencias
cd backend
npm install
cd ..

# Ejecutar
cd backend
node server.js

# Debería iniciar sin errores ✓
```

---

## 📝 RESUMEN DE LA ESTRUCTURA QUE SUBIRÁ

```
estudius/
├── frontend/                    ✅ Subir
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── app.js
│       ├── api.js
│       └── utils.js
├── backend/                     ✅ Subir
│   ├── server.js
│   ├── package.json
│   ├── teachers/
│   │   ├── teacherRoutes.js
│   │   ├── teacherController.js
│   │   ├── teacherService.js
│   │   ├── teacherRepository.js
│   │   └── teacherModel.js
│   ├── middleware/
│   ├── config/db.js
│   └── database/schema.sql
├── docs/                        ✅ Subir
├── scripts/                     ✅ Subir
├── README.md                    ✅ Subir
├── .gitignore                   ✅ Subir
├── .git/                        ✅ Interno (git)
├── node_modules/                ❌ NO (ignorado)
└── database/estudius.db         ❌ NO (ignorado)
```

---

## 🚨 SI COMETISTE ERRORES

### Subiste node_modules por accidente:
```bash
git rm -r --cached node_modules
git commit -m "Remove node_modules"
git push
```

### Necesitas modificar el último commit:
```bash
# Hacer cambios en los archivos...
git add .
git commit --amend --no-edit
git push --force
```

### Resetear todo a estado anterior:
```bash
# Ver histórico
git log --oneline

# Volver a un commit anterior
git reset --hard <hash-del-commit>
git push --force
```

---

## 💡 RECOMENDACIONES POST-GITHUB

1. **Proteger la rama main:**
   - Ir a Settings → Branches
   - Habilitar "Require pull request reviews"

2. **Agregar un LICENSE:**
   - GitHub ofrece uno gratis (MIT recomendado)

3. **Habilitar SECURITY.md:**
   - Crear `SECURITY.md` con instrucciones de reportar bugs

4. **Documentación adicional:**
   - `CONTRIBUTING.md` - Cómo contribuir
   - `CHANGELOG.md` - Historia de cambios
   - `CODE_OF_CONDUCT.md` - Código de conducta

5. **Badges en README:**
   ```markdown
   [![Node.js](https://img.shields.io/badge/Node.js-v24.14.1-green)](https://nodejs.org)
   [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
   [![GitHub](https://img.shields.io/badge/GitHub-ivamed%2Festudius-blue)](https://github.com/ivamed/estudius)
   ```

---

## 🎯 COMANDO TODO JUNTO

Si quieres hacer todo de una vez, copia esto en PowerShell:

```powershell
$ProjectPath = "c:\Users\Medina\Documents\IA Challenge\estudius"
$GitHubRepo = "https://github.com/ivamed/estudius.git"

cd $ProjectPath

# Limpiar
git init
git remote remove origin 2>$null
git remote add origin $GitHubRepo

# Agregar y subir
git add .
git commit -m "Initial commit: Estudius v1.0 - Plataforma de búsqueda de tutores"
git branch -M main
git push -u origin main --force

Write-Host "✅ Proyecto subido a GitHub!" -ForegroundColor Green
Write-Host "📍 Accede a: $GitHubRepo" -ForegroundColor Cyan
```

---

## ❓ FAQ

**P: ¿Qué es node_modules y por qué no subirlo?**
R: Son 500MB de código de terceros. Se instala automáticamente con `npm install` al clonar.

**P: ¿Y la base de datos?**
R: `estudius.db` contiene solo datos de desarrollo. Lo recrea automáticamente `schema.sql` al iniciar.

**P: ¿Necesito package-lock.json?**
R: Opcional, pero recomendado. Ayuda a reproducir exactamente las mismas versiones de dependencias.

**P: ¿Cómo cambio el URL del repositorio?**
R: `git remote set-url origin <nuevo-url>`

**P: ¿Puedo subir el .env?**
R: ¡NO! Nunca. Agrega `.env` al `.gitignore` si tienes variables sensibles.

---

**Listo para hacer deploy? 🚀**
