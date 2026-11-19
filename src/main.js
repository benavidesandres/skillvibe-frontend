import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/main.css';
import 'bootstrap'; // JS de Bootstrap (navbar colapsable, modales, toasts)
import { Collapse } from 'bootstrap';

import { createRouter } from './lib/router.js';
import { session } from './lib/session.js';
import { html, render } from './lib/html.js';
import { catalogPage } from './pages/catalog.js';
import { loginPage, registerPage } from './pages/auth.js';
import { skillDetailPage } from './pages/skill-detail.js';
import { tutorProfilePage } from './pages/tutor-profile.js';
import { bookingsPage } from './pages/bookings.js';
import { mySkillsPage } from './pages/my-skills.js';

const routes = [
  { path: '/', page: catalogPage },
  { path: '/skills/:id', page: skillDetailPage },
  { path: '/tutors/:id', page: tutorProfilePage },
  { path: '/login', page: loginPage },
  { path: '/register', page: registerPage },
  { path: '/bookings', page: bookingsPage, auth: true },
  { path: '/my-skills', page: mySkillsPage, role: 'tutor' },
];

const nav = document.getElementById('nav-links');

function renderNav() {
  const here = location.hash.slice(1).split('?')[0] || '/';
  const item = (href, label) =>
    html`<li class="nav-item"><a class="nav-link ${here === href ? 'active' : ''}" aria-current="${here === href ? 'page' : 'false'}" href="#${href}">${label}</a></li>`;

  render(
    nav,
    html`
      <ul class="navbar-nav me-auto">
        ${item('/', 'Tutorías')}
        ${session.isLoggedIn ? item('/bookings', 'Reservas') : ''}
        ${session.is('tutor') ? item('/my-skills', 'Mis tutorías') : ''}
      </ul>
      <ul class="navbar-nav align-items-lg-center gap-lg-2">
        ${session.isLoggedIn
          ? html`<li class="navbar-text me-lg-2">${session.user.fullName}</li>
              <li class="nav-item"><button id="logout" class="btn btn-outline-light btn-sm" type="button">Salir</button></li>`
          : html`${item('/login', 'Entrar')}<li class="nav-item"><a class="btn btn-primary btn-sm" href="#/register">Registrarme</a></li>`}
      </ul>`,
  );
  nav.querySelector('#logout')?.addEventListener('click', () => {
    session.clear();
    location.hash = '#/';
  });
}

renderNav();
window.addEventListener('session:change', renderNav);
window.addEventListener('hashchange', () => {
  renderNav();
  const collapse = document.querySelector('.navbar-collapse.show');
  if (collapse) Collapse.getOrCreateInstance(collapse).hide(); // cierra el menú móvil al navegar
});

createRouter(routes, document.getElementById('app')).start();
