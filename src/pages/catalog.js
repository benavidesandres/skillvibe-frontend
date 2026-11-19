import { skillsApi } from '../api/index.js';
import { html, render } from '../lib/html.js';
import { CATEGORIES, LEVELS, SORTS } from '../lib/format.js';
import { skillCard, emptyState } from '../lib/components.js';

const FILTERS = ['search', 'category', 'level', 'minPrice', 'maxPrice', 'sort'];
const LIMIT = 9;

const options = (map, selected, placeholder) => html`
  ${placeholder ? html`<option value="">${placeholder}</option>` : ''}
  ${Object.entries(map).map(([value, label]) => html`<option value="${value}" ${value === selected ? 'selected' : ''}>${label}</option>`)}`;

export async function catalogPage(root, { query, isCurrent }) {
  const page = Math.max(1, Number(query.page) || 1);
  const result = await skillsApi.catalog({ ...query, page, limit: LIMIT });
  if (!isCurrent()) return;

  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));
  const link = (p) => {
    const params = new URLSearchParams(query);
    params.set('page', p);
    return `#/?${params}`;
  };

  render(
    root,
    html`
      <section class="py-4 text-center">
        <h1 class="display-6 fw-bold">Aprende programación con un tutor, en vivo</h1>
        <p class="lead text-body-secondary mb-0">Elige una tutoría, reserva un horario y conéctate por videollamada.</p>
      </section>

      <form id="filters" class="card card-body shadow-sm mb-4" role="search">
        <div class="row g-2 align-items-end">
          <div class="col-12 col-lg-4">
            <label class="form-label" for="f-search">Buscar</label>
            <input id="f-search" name="search" type="search" class="form-control" placeholder="React, NestJS, SQL…" value="${query.search ?? ''}" maxlength="100">
          </div>
          <div class="col-6 col-lg-2">
            <label class="form-label" for="f-category">Categoría</label>
            <select id="f-category" name="category" class="form-select">${options(CATEGORIES, query.category, 'Todas')}</select>
          </div>
          <div class="col-6 col-lg-2">
            <label class="form-label" for="f-level">Nivel</label>
            <select id="f-level" name="level" class="form-select">${options(LEVELS, query.level, 'Todos')}</select>
          </div>
          <div class="col-6 col-lg-1">
            <label class="form-label" for="f-min">Mín. $</label>
            <input id="f-min" name="minPrice" type="number" min="0" class="form-control" value="${query.minPrice ?? ''}">
          </div>
          <div class="col-6 col-lg-1">
            <label class="form-label" for="f-max">Máx. $</label>
            <input id="f-max" name="maxPrice" type="number" min="0" class="form-control" value="${query.maxPrice ?? ''}">
          </div>
          <div class="col-12 col-lg-2">
            <label class="form-label" for="f-sort">Ordenar</label>
            <select id="f-sort" name="sort" class="form-select">${options(SORTS, query.sort ?? 'recent')}</select>
          </div>
        </div>
        <div class="d-flex gap-2 mt-3">
          <button class="btn btn-primary" type="submit">Buscar</button>
          <a class="btn btn-outline-secondary" href="#/">Limpiar</a>
        </div>
      </form>

      <p class="text-body-secondary" aria-live="polite">${result.total} ${result.total === 1 ? 'tutoría encontrada' : 'tutorías encontradas'}</p>

      ${result.data.length
        ? html`<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">${result.data.map(skillCard)}</div>`
        : emptyState('No hay tutorías con esos filtros', 'Prueba con otra búsqueda.')}

      ${totalPages > 1
        ? html`<nav class="mt-4" aria-label="Paginación">
            <ul class="pagination justify-content-center">
              <li class="page-item ${page <= 1 ? 'disabled' : ''}"><a class="page-link" href="${link(page - 1)}">Anterior</a></li>
              <li class="page-item disabled"><span class="page-link">Página ${page} de ${totalPages}</span></li>
              <li class="page-item ${page >= totalPages ? 'disabled' : ''}"><a class="page-link" href="${link(page + 1)}">Siguiente</a></li>
            </ul>
          </nav>`
        : ''}`,
  );

  root.querySelector('#filters').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const key of FILTERS) {
      const value = String(data.get(key) ?? '').trim();
      if (value) params.set(key, value);
    }
    location.hash = `#/${params.size ? `?${params}` : ''}`;
  });
}
