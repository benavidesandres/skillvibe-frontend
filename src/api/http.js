import { session } from '../lib/session.js';

const BASE_URL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// NestJS devuelve { message: string | string[] } (las validaciones llegan como lista)
const messageFrom = (data, status) => {
  const m = data?.message;
  if (Array.isArray(m)) return m.join('. ');
  if (typeof m === 'string' && m) return m;
  return status >= 500 ? 'El servidor tuvo un problema. Intenta más tarde.' : 'No se pudo completar la solicitud.';
};

export async function request(path, { method = 'GET', body, query, auth = true } = {}) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== '' && v !== null && v !== undefined) url.searchParams.set(k, v);
  }

  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && session.token) headers.Authorization = `Bearer ${session.token}`;

  let response;
  try {
    response = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor. Revisa que la API esté encendida.');
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    // Token vencido o inválido en una ruta protegida: se cierra la sesión
    if (response.status === 401 && auth && session.isLoggedIn) {
      session.clear();
      window.location.hash = '#/login';
    }
    throw new ApiError(response.status, messageFrom(data, response.status));
  }
  return data;
}
