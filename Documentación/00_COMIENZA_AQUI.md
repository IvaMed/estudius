# Empezá acá — Estudius

## Qué es Estudius

Estudius es una **web de directorio y reservas de clases particulares**. No es una videollamada integrada ni un pago en línea: centraliza **quién enseña qué**, **cuándo está disponible** y **cómo contactar / reservar** un turno.

Pensado para un contexto educativo local: estudiantes encuentran tutores; el equipo administra el listado de profesores desde la misma aplicación.

## Cómo funciona (en la práctica)

1. **Entrás** a la página (PC o celular en la red de tu casa).
2. En el **Home** ves profesores recomendados y podés buscar por nombre o materia.
3. Abrís la **ficha** de un profesor: materias, modalidad, horarios, descripción y temario.
4. Si querés **reservar**, te registrás o iniciás sesión, elegís fecha/hora disponible y confirmás.
5. Tus reservas quedan en **Mis clases**; los profesores que te interesan podés guardarlos en **Favoritos**.

Los **administradores** (rol `admin`) además pueden:

- **Agregar / editar / eliminar** profesores desde *Agregar Profesor*.
- Configurar **categorías y ítems** del sitio en *Administrar características* (materias destacadas en la home, etc.).

La cuenta **super-admin** (`admin@gmail.com`) también gestiona **usuarios** (roles, contraseñas, bajas).

## Arranque en 2 minutos

1. Instalá Node.js si no lo tenés.
2. Doble clic en `iniciar-estudius-red.bat` (raíz del proyecto) **o** `cd Backend` → `npm install` → `npm start`.
3. Abrí la URL que indica la consola (en celular: misma Wi‑Fi, usar `http://IP:3000`, no solo la IP).
4. Super-admin (única cuenta): `admin@gmail.com` / `contraseña`.
5. Opcional — usuario con historial de clases: `historial@gmail.com` / `Historial123!` (crear con `node scripts/seed-historial-user.js` en `Backend/`).

Si el celular muestra error SSL, leé la ayuda en `/conectar-celular` o [FAQ.md](FAQ.md).

## Siguiente lectura

| Si querés… | Abrí |
|------------|------|
| Instalar y poblar datos de prueba | [QUICKSTART.md](QUICKSTART.md) |
| Entender carpetas y capas | [STACK_Y_ESTRUCTURA.md](STACK_Y_ESTRUCTURA.md) |
| Encontrar código de una pantalla | [PROJECT_MAP.md](PROJECT_MAP.md) |
| Comprobar que todo anda | [VERIFICACION.md](VERIFICACION.md) |
