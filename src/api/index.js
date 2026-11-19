import { request } from './http.js';

export const authApi = {
  login: (body) => request('/auth/login', { method: 'POST', body, auth: false }),
  register: (body) => request('/auth/register', { method: 'POST', body, auth: false }),
};

export const skillsApi = {
  catalog: (query) => request('/skills', { query, auth: false }),
  get: (id) => request(`/skills/${id}`, { auth: false }),
  reviews: (id) => request(`/skills/${id}/reviews`, { auth: false }),
  mine: () => request('/skills/mine'),
  create: (body) => request('/skills', { method: 'POST', body }),
  update: (id, body) => request(`/skills/${id}`, { method: 'PATCH', body }),
  remove: (id) => request(`/skills/${id}`, { method: 'DELETE' }),
};

export const tutorsApi = {
  get: (id) => request(`/tutors/${id}`, { auth: false }),
};

export const bookingsApi = {
  create: (body) => request('/bookings', { method: 'POST', body }),
  mine: () => request('/bookings/mine'),
  setStatus: (id, status) => request(`/bookings/${id}/status`, { method: 'PATCH', body: { status } }),
};

export const reviewsApi = {
  create: (body) => request('/reviews', { method: 'POST', body }),
};
