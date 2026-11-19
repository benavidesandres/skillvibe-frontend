import { session } from './session.js';

// Router por hash (#/ruta): funciona en cualquier hosting estático sin configurar el servidor.
// Cada ruta: { path: '/skills/:id', page, auth?: boolean, role?: 'tutor' | 'student' }
export function createRouter(routes, outlet) {
  const compiled = routes.map((r) => ({
    ...r,
    keys: [...r.path.matchAll(/:(\w+)/g)].map((m) => m[1]),
    regex: new RegExp(`^${r.path.replace(/:\w+/g, '([^/]+)')}$`),
  }));
  let token = 0;

  const currentPath = () => location.hash.slice(1).split('?')[0] || '/';

  async function resolve() {
    const [rawPath, search = ''] = (location.hash.slice(1) || '/').split('?');
    const path = rawPath || '/';
    const route = compiled.find((r) => r.regex.test(path));
    const mine = ++token;

    if (!route) return message(outlet, 'No encontramos esta página.');
    if ((route.auth || route.role) && !session.isLoggedIn) {
      location.hash = `#/login?next=${encodeURIComponent(path)}`;
      return;
    }
    if (route.role && !session.is(route.role)) {
      return message(outlet, 'Esta sección no está disponible para tu rol.');
    }

    const values = path.match(route.regex).slice(1);
    const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(values[i])]));
    const query = Object.fromEntries(new URLSearchParams(search));

    outlet.innerHTML =
      '<div class="d-flex justify-content-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando…</span></div></div>';
    window.scrollTo(0, 0);
    try {
      // isCurrent evita que una página lenta pise a otra a la que el usuario ya navegó
      await route.page(outlet, { params, query, isCurrent: () => mine === token });
    } catch (err) {
      if (mine === token) showError(outlet, err.message);
    }
  }

  window.addEventListener('hashchange', resolve);
  window.addEventListener('session:change', () => {
    // al cerrar sesión desde una ruta protegida, vuelve al inicio
    const route = compiled.find((r) => r.regex.test(currentPath()));
    if (!session.isLoggedIn && (route?.auth || route?.role)) location.hash = '#/';
  });
  return { start: resolve };
}

function message(outlet, text) {
  outlet.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'text-center py-5';
  const p = document.createElement('p');
  p.className = 'lead';
  p.textContent = text;
  const a = document.createElement('a');
  a.href = '#/';
  a.className = 'btn btn-primary';
  a.textContent = 'Ir al inicio';
  box.append(p, a);
  outlet.append(box);
}

function showError(outlet, text) {
  outlet.innerHTML = '';
  const alert = document.createElement('div');
  alert.className = 'alert alert-danger my-4';
  alert.setAttribute('role', 'alert');
  alert.textContent = text;
  outlet.append(alert);
}
