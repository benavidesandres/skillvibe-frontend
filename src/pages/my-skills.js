import { skillsApi } from '../api/index.js';
import { html, render } from '../lib/html.js';
import { CATEGORIES, LEVELS, formatMoney } from '../lib/format.js';
import { alertBox, emptyState, withBusy } from '../lib/components.js';
import { notify } from '../lib/toast.js';
import { Modal } from 'bootstrap';

const options = (map) => Object.entries(map).map(([v, l]) => html`<option value="${v}">${l}</option>`);

const skillRow = (s) => html`
  <tr data-id="${s.id}">
    <td><a href="#/skills/${s.id}" class="text-decoration-none">${s.title}</a><div class="small text-body-secondary">${s.technology} · ${CATEGORIES[s.category]} · ${LEVELS[s.level]}</div></td>
    <td class="text-nowrap">${formatMoney(s.pricePerHour)}/h</td>
    <td>${s.isActive ? html`<span class="badge text-bg-success">Activa</span>` : html`<span class="badge text-bg-secondary">Pausada</span>`}</td>
    <td class="text-end text-nowrap">
      <button class="btn btn-sm btn-outline-secondary" data-action="toggle" data-active="${s.isActive}">${s.isActive ? 'Pausar' : 'Activar'}</button>
      <button class="btn btn-sm btn-outline-danger" data-action="delete">Eliminar</button>
    </td>
  </tr>`;

const formModal = html`
  <div class="modal fade" id="skill-modal" tabindex="-1" aria-labelledby="skill-title" aria-hidden="true">
    <div class="modal-dialog modal-lg"><form class="modal-content" novalidate>
      <div class="modal-header"><h2 class="modal-title fs-5" id="skill-title">Publicar tutoría</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>
      <div class="modal-body">
        <div id="skill-feedback" aria-live="polite"></div>
        <div class="row g-3">
          <div class="col-12"><label class="form-label" for="s-title">Título</label><input id="s-title" name="title" class="form-control" required maxlength="120"><div class="invalid-feedback">Obligatorio.</div></div>
          <div class="col-12"><label class="form-label" for="s-desc">Descripción</label><textarea id="s-desc" name="description" class="form-control" rows="4" required maxlength="2000"></textarea><div class="invalid-feedback">Obligatoria.</div></div>
          <div class="col-md-6"><label class="form-label" for="s-cat">Categoría</label><select id="s-cat" name="category" class="form-select">${options(CATEGORIES)}</select></div>
          <div class="col-md-6"><label class="form-label" for="s-level">Nivel</label><select id="s-level" name="level" class="form-select">${options(LEVELS)}</select></div>
          <div class="col-md-6"><label class="form-label" for="s-tech">Tecnología</label><input id="s-tech" name="technology" class="form-control" required maxlength="60" placeholder="React, NestJS…"><div class="invalid-feedback">Obligatoria.</div></div>
          <div class="col-md-6"><label class="form-label" for="s-price">Precio por hora (USD)</label><input id="s-price" name="pricePerHour" type="number" class="form-control" required min="0" step="0.01"><div class="invalid-feedback">Escribe un precio válido.</div></div>
        </div>
      </div>
      <div class="modal-footer"><button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button><button type="submit" class="btn btn-primary">Publicar</button></div>
    </form></div>
  </div>`;

export async function mySkillsPage(root, { isCurrent }) {
  const skills = await skillsApi.mine();
  if (!isCurrent()) return;

  render(
    root,
    html`
      <div id="my-skills">
        <div class="d-flex justify-content-between align-items-center my-4">
          <h1 class="h3 mb-0">Mis tutorías</h1>
          <button class="btn btn-primary" data-action="new">Publicar tutoría</button>
        </div>
        <div id="feedback" aria-live="polite"></div>
        ${skills.length
          ? html`<div class="table-responsive card shadow-sm"><table class="table align-middle mb-0">
              <thead><tr><th scope="col">Tutoría</th><th scope="col">Precio</th><th scope="col">Estado</th><th scope="col"><span class="visually-hidden">Acciones</span></th></tr></thead>
              <tbody>${skills.map(skillRow)}</tbody></table></div>`
          : emptyState('Aún no has publicado tutorías', 'Publica la primera para aparecer en el catálogo.')}
        ${formModal}
      </div>`,
  );

  const feedback = root.querySelector('#feedback');
  const modalEl = root.querySelector('#skill-modal');
  const modal = new Modal(modalEl);
  const form = modalEl.querySelector('form');
  const reload = () => mySkillsPage(root, { isCurrent });

  root.querySelector('#my-skills').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'new') return modal.show();

    const id = btn.closest('[data-id]').dataset.id;
    render(feedback, '');
    try {
      if (btn.dataset.action === 'toggle') {
        const makeActive = btn.dataset.active !== 'true';
        await withBusy(btn, () => skillsApi.update(id, { isActive: makeActive }));
        notify(makeActive ? 'Tutoría activada' : 'Tutoría pausada');
      } else {
        if (!confirm('¿Eliminar esta tutoría? No se puede deshacer.')) return;
        await withBusy(btn, () => skillsApi.remove(id));
        notify('Tutoría eliminada');
      }
      await reload();
    } catch (err) {
      // 409: tiene reservas y solo se puede pausar
      render(feedback, alertBox(err.message));
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }
    const box = form.querySelector('#skill-feedback');
    render(box, '');
    const data = Object.fromEntries(new FormData(form));
    data.pricePerHour = Number(data.pricePerHour);
    try {
      await withBusy(form.querySelector('button[type=submit]'), () => skillsApi.create(data));
      modal.hide();
      notify('Tutoría publicada');
      modalEl.addEventListener('hidden.bs.modal', reload, { once: true });
    } catch (err) {
      render(box, alertBox(err.message));
    }
  });
}
