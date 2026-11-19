import { authApi } from '../api/index.js';
import { html, render } from '../lib/html.js';
import { session } from '../lib/session.js';
import { notify } from '../lib/toast.js';
import { alertBox, withBusy } from '../lib/components.js';

function wire(root, submit) {
  const form = root.querySelector('form');
  const feedback = root.querySelector('#feedback');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }
    render(feedback, '');
    try {
      await withBusy(form.querySelector('button[type=submit]'), () => submit(Object.fromEntries(new FormData(form))));
    } catch (err) {
      render(feedback, alertBox(err.message));
    }
  });
}

// Tras entrar vuelve a la página que se quería ver (?next=...)
const goNext = (query) => {
  const next = query.next && query.next.startsWith('/') ? query.next : '/';
  location.hash = `#${next}`;
};

export async function loginPage(root, { query }) {
  render(
    root,
    html`
      <div class="row justify-content-center py-4">
        <div class="col-12 col-md-7 col-lg-5">
          <div class="card shadow-sm"><div class="card-body p-4">
            <h1 class="h3 mb-3">Iniciar sesión</h1>
            <div id="feedback" aria-live="polite"></div>
            <form novalidate>
              <div class="mb-3">
                <label class="form-label" for="email">Correo</label>
                <input id="email" name="email" type="email" class="form-control" required autocomplete="email">
                <div class="invalid-feedback">Escribe un correo válido.</div>
              </div>
              <div class="mb-3">
                <label class="form-label" for="password">Contraseña</label>
                <input id="password" name="password" type="password" class="form-control" required autocomplete="current-password">
                <div class="invalid-feedback">Escribe tu contraseña.</div>
              </div>
              <button class="btn btn-primary w-100" type="submit">Entrar</button>
            </form>
            <p class="text-center mt-3 mb-0">¿No tienes cuenta? <a href="#/register">Regístrate</a></p>
          </div></div>
        </div>
      </div>`,
  );
  wire(root, async (data) => {
    session.save(await authApi.login(data));
    notify(`Hola, ${session.user.fullName}`);
    goNext(query);
  });
}

export async function registerPage(root) {
  render(
    root,
    html`
      <div class="row justify-content-center py-4">
        <div class="col-12 col-md-8 col-lg-6">
          <div class="card shadow-sm"><div class="card-body p-4">
            <h1 class="h3 mb-3">Crear cuenta</h1>
            <div id="feedback" aria-live="polite"></div>
            <form novalidate>
              <div class="mb-3">
                <label class="form-label" for="fullName">Nombre completo</label>
                <input id="fullName" name="fullName" class="form-control" required maxlength="100" autocomplete="name">
                <div class="invalid-feedback">El nombre es obligatorio.</div>
              </div>
              <div class="mb-3">
                <label class="form-label" for="email">Correo</label>
                <input id="email" name="email" type="email" class="form-control" required maxlength="150" autocomplete="email">
                <div class="invalid-feedback">Escribe un correo válido.</div>
              </div>
              <div class="mb-3">
                <label class="form-label" for="password">Contraseña</label>
                <input id="password" name="password" type="password" class="form-control" required minlength="8" maxlength="72" autocomplete="new-password" aria-describedby="pw-help">
                <div id="pw-help" class="form-text">Mínimo 8 caracteres.</div>
                <div class="invalid-feedback">Debe tener al menos 8 caracteres.</div>
              </div>
              <fieldset class="mb-3">
                <legend class="form-label fs-6">Quiero…</legend>
                <div class="form-check"><input class="form-check-input" type="radio" name="role" id="role-student" value="student" checked><label class="form-check-label" for="role-student">Aprender (estudiante)</label></div>
                <div class="form-check"><input class="form-check-input" type="radio" name="role" id="role-tutor" value="tutor"><label class="form-check-label" for="role-tutor">Enseñar (tutor)</label></div>
              </fieldset>
              <div class="mb-3">
                <label class="form-label" for="bio">Bio <span class="text-body-secondary">(opcional)</span></label>
                <textarea id="bio" name="bio" class="form-control" rows="3" maxlength="500"></textarea>
              </div>
              <button class="btn btn-primary w-100" type="submit">Registrarme</button>
            </form>
            <p class="text-center mt-3 mb-0">¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a></p>
          </div></div>
        </div>
      </div>`,
  );
  wire(root, async (data) => {
    if (!data.bio) delete data.bio;
    session.save(await authApi.register(data));
    notify('Cuenta creada. ¡Bienvenido a SkillVibe!');
    location.hash = session.is('tutor') ? '#/my-skills' : '#/';
  });
}
