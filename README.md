# SkillVibe Frontend

Interfaz web de **SkillVibe**, el marketplace de tutorías 1 a 1 de programación. Consume la API de [`Skill_vibe_backend`](https://github.com/benavidesandres/Skill_vibe_backend). Construida con **Bootstrap 5**, JavaScript modular (sin framework) y **Vite**.

## Qué puede hacer

| Rol | Funciones |
|---|---|
| Visitante | Explorar el catálogo (búsqueda, filtros, orden, paginación), ver una tutoría con sus reseñas y el perfil público del tutor |
| Estudiante | Reservar una tutoría, ver y cancelar reservas, entrar a la videollamada, reseñar sesiones completadas |
| Tutor | Publicar, pausar y eliminar sus tutorías; confirmar, rechazar y completar reservas; entrar a la videollamada |

## Ejecutar

Requisitos: Node.js 20+ y el backend corriendo en `http://localhost:3000`.

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

En el backend, deja `VIDEO_BASE_URL=http://localhost:5173` en su `.env` para que los links de videollamada apunten a este proyecto.

```bash
npm run build        # genera dist/ (HTML, CSS y JS estáticos)
npm run preview      # sirve dist/ para probarlo
```

## Configuración

| Variable | Por defecto | Uso |
|---|---|---|
| `VITE_API_URL` | `/api/v1` | Base de la API. En desarrollo, Vite reenvía `/api` al backend (sin CORS). En producción pon la URL completa, ej. `https://api.midominio.com/api/v1` |
| `BACKEND_URL` | `http://localhost:3000` | Solo desarrollo: destino del proxy de Vite |

## Estructura

```
index.html            # Aplicación (SPA con router por hash)
sala.html             # Sala de videollamada simulada (/sala.html?room=...)
src/
├── main.js           # Rutas, barra de navegación y arranque
├── api/              # Cliente HTTP y un módulo por recurso de la API
├── lib/              # router, sesión, plantillas seguras, formato, componentes, toasts
├── pages/            # Una función por pantalla (catálogo, detalle, perfil, auth, reservas, mis tutorías)
├── room/             # Lógica de la sala de videollamada
└── styles/           # Solo el CSS que Bootstrap no cubre
```

## Decisiones y buenas prácticas

- **Separado del backend**: proyecto y repositorio propios; se comunican solo por HTTP.
- **Bootstrap por npm** (no por CDN); diseño responsive (mobile first).
- **Sin XSS**: todo dato de la API se escapa con la plantilla `html` (`src/lib/html.js`); los mensajes dinámicos usan `textContent`.
- **Accesibilidad**: enlace "saltar al contenido", `aria-live` en avisos y resultados, etiquetas en todos los campos, texto oculto para lectores de pantalla.
- **Formularios**: validación nativa de Bootstrap en el cliente y mensajes del backend (`class-validator`) mostrados en la interfaz; botones deshabilitados mientras se envía.
- **Rutas protegidas** por sesión y rol, con regreso a la página pedida tras iniciar sesión (`?next=`).
- **Sesión**: el backend entrega un JWT en el cuerpo, así que se guarda en `localStorage`. Si el token vence (401) se cierra la sesión sola.
- **La sala es simulada**: muestra tu cámara y micrófono y un participante falso; no transmite video entre personas. Para video real, reemplaza el bloque simulado de `src/room/room.js` por WebRTC o Jitsi (y cambia `VideoRoomProvider` en el backend).
