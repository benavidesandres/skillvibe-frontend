import { html } from './html.js';
import { CATEGORIES, LEVELS, formatMoney } from './format.js';

export const rating = (avg, count) =>
  count > 0
    ? html`<span class="text-warning" aria-hidden="true">★</span>
        <strong>${Number(avg).toFixed(1)}</strong>
        <span class="text-body-secondary">(${count})</span>
        <span class="visually-hidden">${Number(avg).toFixed(1)} de 5, ${count} reseñas</span>`
    : html`<span class="text-body-secondary small">Sin reseñas</span>`;

export const skillCard = (s) => html`
  <div class="col">
    <article class="card h-100 shadow-sm">
      <div class="card-body d-flex flex-column">
        <div class="mb-2">
          <span class="badge text-bg-primary">${CATEGORIES[s.category] ?? s.category}</span>
          <span class="badge text-bg-light border">${LEVELS[s.level] ?? s.level}</span>
          <span class="badge text-bg-light border">${s.technology}</span>
        </div>
        <h2 class="h5 card-title"><a class="stretched-link text-decoration-none" href="#/skills/${s.id}">${s.title}</a></h2>
        <p class="card-text text-body-secondary small flex-grow-1 line-clamp-3">${s.description}</p>
        <div class="d-flex justify-content-between align-items-end mt-2">
          <div class="small">
            <div>${s.tutor ? s.tutor.fullName : ''}</div>
            <div>${rating(s.averageRating, s.reviewsCount)}</div>
          </div>
          <div class="fs-5 fw-semibold">${formatMoney(s.pricePerHour)}<small class="text-body-secondary fw-normal">/h</small></div>
        </div>
      </div>
    </article>
  </div>`;

export const alertBox = (message, type = 'danger') =>
  html`<div class="alert alert-${type}" role="alert">${message}</div>`;

export const emptyState = (title, text = '') => html`
  <div class="text-center text-body-secondary py-5">
    <p class="h5">${title}</p>
    <p>${text}</p>
  </div>`;

// Deshabilita un botón y muestra un spinner mientras corre la acción (evita doble envío)
export async function withBusy(button, action) {
  const label = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>Un momento…';
  try {
    return await action();
  } finally {
    button.disabled = false;
    button.innerHTML = label;
  }
}
