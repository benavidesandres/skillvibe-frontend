// Plantillas HTML seguras: todo valor interpolado se escapa salvo que sea
// resultado de otra plantilla `html` o se marque con raw(). Evita XSS con
// datos que vienen de la API (títulos, bios, comentarios...).
const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

class SafeHtml {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

const escape = (v) => {
  if (v instanceof SafeHtml) return v.value;
  if (Array.isArray(v)) return v.map(escape).join('');
  if (v === null || v === undefined || v === false) return '';
  return String(v).replace(/[&<>"']/g, (c) => ENTITIES[c]);
};

export const raw = (value) => new SafeHtml(value);

export const html = (strings, ...values) =>
  new SafeHtml(strings.reduce((out, s, i) => out + s + (i < values.length ? escape(values[i]) : ''), ''));

export const render = (el, content) => {
  el.innerHTML = String(content);
};
