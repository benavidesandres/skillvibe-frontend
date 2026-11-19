import { skillsApi, bookingsApi } from '../api/index.js';
import { html, render } from '../lib/html.js';
import { CATEGORIES, LEVELS, formatMoney, formatDate } from '../lib/format.js';
import { rating, alertBox, emptyState, withBusy } from '../lib/components.js';
import { session } from '../lib/session.js';
import { notify } from '../lib/toast.js';

// Valor mínimo para <input type="datetime-local"> (hora local, redondeada a la hora siguiente)
const minDateTime = () => {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const bookingBox = (skill) => {
  if (!skill.isActive) return alertBox('Esta tutoría está pausada y no admite reservas.', 'warning');
  if (!session.isLoggedIn) {
    const next = encodeURIComponent(`/skills/${skill.id}`);
    return html`<p class="mb-0"><a class="btn btn-primary w-100" href="#/login?next=${next}">Inicia sesión para reservar</a></p>`;
  }
  if (!session.is('student')) return html`<p class="text-body-secondary mb-0">Solo las cuentas de estudiante pueden reservar.</p>`;
  return html`
    <form id="booking" novalidate>
      <div id="feedback" aria-live="polite"></div>
      <div class="mb-3">
        <label class="form-label" for="scheduledAt">Fecha y hora</label>
        <input id="scheduledAt" name="scheduledAt" type="datetime-local" class="form-control" min="${minDateTime()}" required>
        <div class="invalid-feedback">Elige una fecha futura.</div>
      </div>
      <div class="mb-3">
        <label class="form-label" for="hours">Duración</label>
        <select id="hours" name="hours" class="form-select">
          ${[1, 2, 3, 4].map((h) => html`<option value="${h}">${h} ${h === 1 ? 'hora' : 'horas'}</option>`)}
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label" for="message">Mensaje al tutor <span class="text-body-secondary">(opcional)</span></label>
        <textarea id="message" name="message" class="form-control" rows="3" maxlength="500"></textarea>
      </div>
      <p class="d-flex justify-content-between"><span>Total</span><strong id="total">${formatMoney(skill.pricePerHour)}</strong></p>
      <button class="btn btn-primary w-100" type="submit">Reservar</button>
    </form>`;
};

export async function skillDetailPage(root, { params, isCurrent }) {
  const [skill, reviews] = await Promise.all([skillsApi.get(params.id), skillsApi.reviews(params.id)]);
  if (!isCurrent()) return;

  render(
    root,
    html`
      <nav aria-label="breadcrumb" class="mt-3"><ol class="breadcrumb"><li class="breadcrumb-item"><a href="#/">Tutorías</a></li><li class="breadcrumb-item active" aria-current="page">${skill.title}</li></ol></nav>
      <div class="row g-4">
        <div class="col-lg-8">
          <div class="mb-2">
            <span class="badge text-bg-primary">${CATEGORIES[skill.category] ?? skill.category}</span>
            <span class="badge text-bg-light border">${LEVELS[skill.level] ?? skill.level}</span>
            <span class="badge text-bg-light border">${skill.technology}</span>
          </div>
          <h1 class="h2">${skill.title}</h1>
          <p class="mb-2">${rating(skill.averageRating, skill.reviewsCount)}</p>
          ${skill.tutor ? html`<p>Tutor: <a href="#/tutors/${skill.tutor.id}">${skill.tutor.fullName}</a></p>` : ''}
          <p class="text-pre-wrap">${skill.description}</p>

          <h2 class="h4 mt-5">Reseñas</h2>
          ${reviews.length
            ? html`<ul class="list-unstyled">${reviews.map(
                (r) => html`<li class="border-bottom py-3">
                  <div><span class="text-warning" aria-hidden="true">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span><span class="visually-hidden">${r.rating} de 5</span>
                  <small class="text-body-secondary ms-2">${formatDate(r.createdAt)}</small></div>
                  ${r.comment ? html`<p class="mb-0 text-pre-wrap">${r.comment}</p>` : ''}
                </li>`,
              )}</ul>`
            : emptyState('Aún no hay reseñas')}
        </div>

        <aside class="col-lg-4">
          <div class="card shadow-sm sticky-lg-top booking-card"><div class="card-body">
            <p class="fs-3 fw-semibold mb-3">${formatMoney(skill.pricePerHour)}<small class="fs-6 text-body-secondary fw-normal"> por hora</small></p>
            ${bookingBox(skill)}
          </div></div>
        </aside>
      </div>`,
  );

  const form = root.querySelector('#booking');
  if (!form) return;
  const hours = form.elements.hours;
  hours.addEventListener('change', () => {
    form.querySelector('#total').textContent = formatMoney(skill.pricePerHour * Number(hours.value));
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const when = new Date(form.elements.scheduledAt.value);
    if (!form.checkValidity() || Number.isNaN(when.getTime()) || when <= new Date()) {
      form.classList.add('was-validated');
      form.elements.scheduledAt.setCustomValidity('Elige una fecha futura.');
      return;
    }
    form.elements.scheduledAt.setCustomValidity('');
    const feedback = form.querySelector('#feedback');
    render(feedback, '');
    try {
      await withBusy(form.querySelector('button[type=submit]'), () =>
        bookingsApi.create({
          skillId: skill.id,
          scheduledAt: when.toISOString(),
          hours: Number(hours.value),
          message: form.elements.message.value.trim() || undefined,
        }),
      );
      notify('Reserva enviada. El tutor debe confirmarla.');
      location.hash = '#/bookings';
    } catch (err) {
      render(feedback, alertBox(err.message));
    }
  });
}
