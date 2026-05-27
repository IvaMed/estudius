# Publicar Estudius en GitHub

Guía para subir el código sin exponer datos locales ni dependencias pesadas.

## Qué subir y qué no

| Subir | No subir (ya en `.gitignore`) |
|-------|-------------------------------|
| `Frontend/`, `Backend/`, `Apis/`, `Database/schema.sql`, `Database/db.js` | `Backend/node_modules/` |
| `Documentación/` (texto y guías) | `Database/estudius.db` |
| `README.md`, `iniciar-estudius-red.bat`, `.gitignore` | `.env`, logs, `package-lock.json` (según tu `.gitignore`) |

La base SQLite con datos de prueba **no** debe ir al repositorio: cada quien la genera al ejecutar el proyecto.

## Pasos básicos

```bash
git init
git add .
git status
git commit -m "Estudius: plataforma de profesores particulares"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/estudius.git
git push -u origin main
```

Revisá `git status` antes del commit: no debe aparecer `estudius.db` ni `node_modules`.

## Clonar en otra máquina

```bash
git clone https://github.com/TU_USUARIO/estudius.git
cd estudius
cd Backend
npm install
npm start
```

Opcional: `node seed-teachers.js` para datos de demo.

## Seguridad antes de hacer público

1. Cambiar contraseña del admin por defecto (`admin@gmail.com`).
2. Definir `JWT_SECRET` en el entorno (no usar el valor de desarrollo).
3. No commitear fotos personales reales en `Frontend/Assets/uploads` si no corresponde.
4. Revisar que no haya API keys en el código.

## Estructura que verá quien clone el repo

Igual que en [README.md](../README.md): raíz con README + `.bat`; resto en `Frontend`, `Backend`, `Apis`, `Database`, `Documentación`.

La carpeta `.git` es normal: guarda el historial de Git en tu máquina; quien clone obtendrá la suya al clonar.
