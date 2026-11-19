const money = new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' });
const dateTime = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' });
const date = new Intl.DateTimeFormat('es', { dateStyle: 'long' });

export const formatMoney = (n) => money.format(Number(n) || 0);
export const formatDateTime = (iso) => dateTime.format(new Date(iso));
export const formatDate = (iso) => date.format(new Date(iso));

export const CATEGORIES = {
  frontend: 'Frontend',
  backend: 'Backend',
  mobile: 'Móvil',
  database: 'Bases de datos',
  devops: 'DevOps',
  data: 'Datos',
  other: 'Otra',
};

export const LEVELS = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' };

export const SORTS = {
  recent: 'Más recientes',
  price_asc: 'Precio: menor a mayor',
  price_desc: 'Precio: mayor a menor',
  rating: 'Mejor valoradas',
};

export const STATUSES = {
  pending: { label: 'Pendiente', color: 'warning' },
  confirmed: { label: 'Confirmada', color: 'success' },
  rejected: { label: 'Rechazada', color: 'danger' },
  cancelled: { label: 'Cancelada', color: 'secondary' },
  completed: { label: 'Completada', color: 'primary' },
};
