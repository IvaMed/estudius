Carpeta para fotos de profesores

Rutas (workspace):
- Frontend/Assets/uploads
- Frontend/Assets/uploads/hombres
- Frontend/Assets/uploads/mujeres

Formato aceptado: `.jpg` o `.jpeg` (recomendado `.jpg`).
Tamaño sugerido: 800×800 px (cuadrado) para mejores resultados.

Nomenclatura recomendada:
- Usar el `id` del profesor como nombre de archivo: `12.jpg` o `teacher_12.jpg`.
- Así puedo asociarlas automáticamente al campo `photo` de cada perfil.

Cómo obtener los `id` de profesores:
- Hacer `GET /api/teachers` (devuelve la lista con el campo `id`).

Qué haré cuando subas las fotos:
- Avisame cuando subas las imágenes a las carpetas.
- Ejecutaré un script que recorra `frontend/assets/uploads/*`, detecte archivos y actualice el campo `photo` de cada profesor en la base de datos con la ruta relativa, por ejemplo `/assets/uploads/hombres/12.jpg`.

Si preferís otra convención (por ejemplo por email o nombre), decímelo y adapto el script.

Se ha añadido un `.gitkeep` en cada carpeta para que Git las mantenga en el repositorio si no tienen aún imágenes.