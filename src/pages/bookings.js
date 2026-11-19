import { bookingsApi, reviewsApi } from '../api/index.js';
import { html, render } from '../lib/html.js';
import { STATUSES, formatDateTime, formatMoney } from '../lib/format.js';
import { alertBox, emptyState, withBusy } from '../lib/components.js';
import { session } from '../lib/session.js';
import { notify } from '../lib/toast.js';
import { Modal } from 'bootstrap';

// Acciones que ofrece cada rol según el estado (refleja las reglas del backend)
const ACTIONS = {
  tutor: {
    pending: [['confirmed', 'Confirmar', 'success'], ['rejected', 'Rechazar', 'outline-danger']],
    confirmed: [['completed', 'Marcar completada', 'primary']],
  },
  student: {
    pending: [['cancelled', 'Cancelar', 'outline-danger']],
    confirmed: [['cancelled', 'Cancelar', 'outline-danger']],
  },
};

const roomUrl = (b) => {
  try {
    const url = new URL(b.meetingLink);
    url.searchParams.set('nombre', session.user.fullName);
    return url.toString();
  } catch {
    return null; // un link inválido nunca debe terminar en un href
  }
};

const row = (b, role) => {
  const status = STATUSES[b.status] ?? { label: b.status, color: 'secondary' };
  const other = role === 'tutor' ? b.student?.fullName : b.skill?.tutor?.fullName;
  const actions = ACTIONS[role][b.status] ?? [];
  const room = b.status === 'confirmed' && b.meetingLink ? roomUrl(b) : null;
  return html`
    <article class="card shadow-sm mb-3" data-id="${b.id}"><div class="card-body">
      <div class="d-flex flex-wrap justify-content-between gap-2">
        <div>
          <h2 class="h5 mb-1"><a href="#/skills/${b.skillId}" class="text-decoration-none">${b.skill?.title}</a></h2>
          <p class="mb-1 text-body-secondary">${role === 'tutor' ? 'Estudiante' : 'Tutor'}: ${other}</p>
        </div>
        <div><span class="badge text-bg-${status.color}">${status.label}</span></div>
      </div>
      <p class="mb-1">${formatDateTime(b.scheduledAt)} · ${b.hours} ${b.hours === 1 ? 'hora' : 'horas'} · <strong>${formatMoney(b.totalPrice)}</strong></p>
      ${b.message ? html`<p class="small text-body-secondary text-pre-wrap mb-2">“${b.message}”</p>` : ''}
      <div class="d-flex flex-wrap gap-2 mt-2">
        ${room ? html`<a class="btn btn-success btn-sm" href="${room}" target="_blank" rel="noopener">Entrar a la videollamada</a>` : ''}
        ${actions.map(([next, label, color]) => html`<button class="btn btn-${color} btn-sm" data-action="status" data-status="${next}">${label}</button>`)}
        ${role === 'student' && b.status === 'completed' ? html`<button class="btn btn-outline-primary btn-sm" data-action="review">Dejar reseña</button>` : ''}
      </div>
    </div></article>`;
};

const reviewModal = html`
  <div class="modal fade" id="review-modal" tabindex="-1" aria-labelledby="review-title" aria-hidden="true">
    <div class="modal-dialog"><form class="modal-content" novalidate>
      <div class="modal-header"><h2 class="modal-title fs-5" id="review-title">Reseñar la sesión</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>
      <div class="modal-body">
        <div id="review-feedback" aria-live="polite"></div>
        <div class="mb-3"><label class="form-label" for="r-rating">Calificación</label>
          <select id="r-rating" name="rating" class="form-select" required>
            ${[5, 4, 3, 2, 1].map((n) => html`<option value="${n}">${'★'.repeat(n)} (${n})</option>`)}
          </select></div>
        <div class="mb-3"><label class="form-label" for="r-comment">Comentario <span class="text-body-secondary">(opcional)</span></label>
          <textarea id="r-comment" name="comment" class="form-control" rows="3" maxlength="500"></textarea></div>
      </div>
      <div class="modal-footer"><button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button><button type="submit" class="btn btn-primary">Enviar reseña</button></div>
    </form></div>
  </div>`;

export async function bookingsPage(root, { isCurrent }) {
  const role = session.user.role === 'tutor' ? 'tutor' : 'student';
  const bookings = await bookingsApi.mine();
  if (!isCurrent()) return;
  const sorted = [...bookings].sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

  render(
    root,
    html`
      <div id="bookings">
      <h1 class="h3 my-4">${role === 'tutor' ? 'Reservas de mis tutorías' : 'Mis reservas'}</h1>
      <div id="feedback" aria-live="polite"></div>
      ${sorted.length
        ? sorted.map((b) => row(b, role))
        : emptyState('Todavía no tienes reservas', role === 'student' ? 'Explora el catálogo y reserva tu primera sesión.' : 'Aquí aparecerán las solicitudes de tus estudiantes.')}
      ${reviewModal}
      </div>`,
  );

  const feedback = root.querySelector('#feedback');
  const modal = new Modal(root.querySelector('#review-modal'));
  let reviewing = null;

  root.querySelector('#bookings').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.closest('[data-id]').dataset.id;

    if (btn.dataset.action === 'review') {
      reviewing = id;
      modal.show();
      return;
    }

    const next = btn.dataset.status;
    if (next === 'cancelled' && !confirm('¿Seguro que quieres cancelar esta reserva?')) return;
    render(feedback, '');
    try {
      await withBusy(btn, () => bookingsApi.setStatus(id, next));
      notify(`Reserva ${STATUSES[next].label.toLowerCase()}`);
      await bookingsPage(root, { isCurrent });
    } catch (err) {
      render(feedback, alertBox(err.message));
    }
  });

  root.querySelector('#review-modal form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const box = form.querySelector('#review-feedback');
    render(box, '');
    try {
      await withBusy(form.querySelector('button[type=submit]'), () =>
        reviewsApi.create({
          bookingId: reviewing,
          rating: Number(form.elements.rating.value),
          comment: form.elements.comment.value.trim() || undefined,
        }),
      );
      modal.hide();
      notify('¡Gracias por tu reseña!');
    } catch (err) {
      render(box, alertBox(err.message)); // ej. 409: la reserva ya tiene reseña
    }
  });
}
