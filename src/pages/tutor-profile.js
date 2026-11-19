import { tutorsApi } from '../api/index.js';
import { html, render } from '../lib/html.js';
import { formatDate } from '../lib/format.js';
import { rating, skillCard, emptyState } from '../lib/components.js';

export async function tutorProfilePage(root, { params, isCurrent }) {
  const tutor = await tutorsApi.get(params.id);
  if (!isCurrent()) return;

  // El perfil no incluye al tutor dentro de cada oferta: se completa para reutilizar la tarjeta
  const skills = tutor.skills.map((s) => ({ ...s, tutor: { id: tutor.id, fullName: tutor.fullName } }));

  render(
    root,
    html`
      <nav aria-label="breadcrumb" class="mt-3"><ol class="breadcrumb"><li class="breadcrumb-item"><a href="#/">Tutorías</a></li><li class="breadcrumb-item active" aria-current="page">${tutor.fullName}</li></ol></nav>
      <section class="card shadow-sm mb-4"><div class="card-body d-flex gap-3 align-items-center">
        <div class="avatar-lg" aria-hidden="true">${tutor.fullName.charAt(0).toUpperCase()}</div>
        <div>
          <h1 class="h3 mb-1">${tutor.fullName}</h1>
          <p class="mb-1">${rating(tutor.averageRating, tutor.reviewsCount)}</p>
          <p class="small text-body-secondary mb-0">Miembro desde ${formatDate(tutor.memberSince)}</p>
        </div>
      </div>
      ${tutor.bio ? html`<div class="card-body border-top"><p class="mb-0 text-pre-wrap">${tutor.bio}</p></div>` : ''}
      </section>

      <h2 class="h4 mb-3">Tutorías disponibles</h2>
      ${skills.length
        ? html`<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">${skills.map(skillCard)}</div>`
        : emptyState('Este tutor no tiene tutorías activas')}`,
  );
}
