// Sesión del usuario. El backend devuelve un JWT en el cuerpo (no usa cookies),
// así que se guarda en localStorage. Todo acceso va protegido con try/catch.
const KEY = 'skillvibe.session';

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
}

let current = read();

function emit() {
  window.dispatchEvent(new CustomEvent('session:change'));
}

export const session = {
  get token() {
    return current?.accessToken ?? null;
  },
  get user() {
    return current?.user ?? null;
  },
  get isLoggedIn() {
    return Boolean(current?.accessToken);
  },
  is(role) {
    return current?.user?.role === role;
  },
  save(authResponse) {
    current = { accessToken: authResponse.accessToken, user: authResponse.user };
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch {
      /* almacenamiento bloqueado: la sesión dura mientras no se recargue */
    }
    emit();
  },
  clear() {
    current = null;
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* nada que limpiar */
    }
    emit();
  },
};
