import { Toast } from 'bootstrap';

// Avisos breves (éxito / error) en la esquina; el contenedor está en index.html
export function notify(message, type = 'success') {
  const container = document.getElementById('toasts');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast align-items-center text-bg-${type} border-0`;
  el.setAttribute('role', type === 'danger' ? 'alert' : 'status');
  const body = document.createElement('div');
  body.className = 'd-flex';
  const text = document.createElement('div');
  text.className = 'toast-body';
  text.textContent = message; // textContent: nunca interpreta HTML
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'btn-close btn-close-white me-2 m-auto';
  close.setAttribute('data-bs-dismiss', 'toast');
  close.setAttribute('aria-label', 'Cerrar');
  body.append(text, close);
  el.append(body);
  container.append(el);
  el.addEventListener('hidden.bs.toast', () => el.remove());
  new Toast(el, { delay: 4500 }).show();
}
