const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const publicRoot = path.join(__dirname, '../public');

// Ejecuta el formulario real; el enlace mailto se captura sin abrir ni enviar correo.
function prepare(query, modify = () => {}) {
  const events = {};
  const base = () => ({ hidden: false, value: '', textContent: '', addEventListener() {}, setAttribute() {}, querySelectorAll() { return []; } });
  const elements = Object.fromEntries(['.menu-toggle', '#mobile-nav', '#year', '#name', '#idea', '#order-options', '#open-email', '#email-result', '#copy-status', '#copy-message'].map(key => [key, base()]));
  const radios = ['Una taza', 'Una franela', 'Diseño plano', 'Otro proyecto'].map(value => ({ value, checked: value === 'Una taza', change: null, addEventListener(event, fn) { this.change = fn; } }));
  elements['#idea-form'] = { reportValidity: () => true, querySelector: () => radios.find(radio => radio.checked), querySelectorAll: () => radios, addEventListener(event, fn) { events[event] = fn; } };
  let links = 0, state;
  elements['#open-email'].click = () => { links++; };
  const context = { window: {}, URLSearchParams, location: { search: query, protocol: 'https:', hash: '' }, document: { body: { dataset: { page: 'contacto' } }, querySelector: key => elements[key] || null, addEventListener() {} } };
  vm.createContext(context);
  for (const file of ['catalogo.js', 'opciones.js']) vm.runInContext(fs.readFileSync(path.join(publicRoot, file), 'utf8'), context);
  context.window.DANEL_OPTIONS.mountForm = (root, current) => { state = current; return { update() {} }; };
  vm.runInContext(fs.readFileSync(path.join(publicRoot, 'app.js'), 'utf8'), context);
  const chooseType = value => { radios.forEach(radio => { radio.checked = radio.value === value; }); radios.find(radio => radio.checked).change(); };
  modify(state, chooseType);
  elements['#name'].value = 'Consulta de prueba';
  elements['#idea'].value += '\nNecesito cinco unidades.';
  events.submit({ preventDefault() {} });
  return { body: new URL(elements['#open-email'].href).searchParams.get('body'), links, options: context.window.DANEL_OPTIONS };
}

test('el correo conserva el tipo de taza elegido en la galería', () => {
  const result = prepare('?modulo=tazas&taza=6oz&referencia=P1');
  assert.match(result.body, /Producto elegido: Taza de 6 oz\./);
  assert.match(result.body, /referencia: P1/);
  assert.equal(result.links, 1);
});

test('el correo usa los cambios del formulario, en vez de los valores antiguos de la URL', () => {
  const result = prepare('?modulo=franelas&modelo=oversize&tecnica=dtf-textil&talla=L&referencia=T6', state => {
    state.garment = 'sueter'; state.technique = 'vinil'; state.size = 'M';
  });
  assert.match(result.body, /Producto elegido: Suéter · Vinil · Talla M\./);
  assert.doesNotMatch(result.body, /DTF textil|oversize|Talla L/);
});

test('cambiar de prenda a taza elimina los detalles textiles del correo', () => {
  const result = prepare('?modulo=franelas&modelo=oversize&tecnica=vinil&talla=XL', (_, chooseType) => chooseType('Una taza'));
  assert.match(result.body, /Producto elegido: Taza de 11 oz\./);
  assert.doesNotMatch(result.body, /Vinil|oversize|Talla XL/);
});

test('consultar solo un diseño no incluye las opciones de una prenda', () => {
  const result = prepare('?modulo=franelas&modelo=sueter&tecnica=dtf-textil&talla=L&referencia=T6', (_, chooseType) => chooseType('Diseño plano'));
  assert.doesNotMatch(result.body, /Producto elegido:|DTF textil|Talla L/);
});

test('los parámetros desconocidos no se convierten en opciones de producto', () => {
  const { options } = prepare('?modulo=tazas&taza=11oz');
  const state = options.read(new URLSearchParams('modulo=tazas&taza=inexistente&modelo=desconocido&tecnica=script&talla=999'), 'franelas');
  assert.equal(state.module, 'franelas'); assert.equal(state.garment, 'normal');
  assert.equal(state.technique, ''); assert.equal(state.size, '');
  assert.equal(new URLSearchParams(options.query(state)).has('taza'), false);
});

function collectionOptions() {
  const context = { window: {}, URLSearchParams };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(publicRoot, 'opciones.js'), 'utf8'), context);
  return context.window.DANEL_OPTIONS;
}

test('entrar en colecciones no elige un producto ni un modelo automáticamente', () => {
  const options = collectionOptions();
  const state = options.readCollection(new URLSearchParams());
  assert.equal(state.module, '');
  assert.equal(options.hasModel(state), false);
  options.chooseModule(state, 'tazas');
  assert.equal(state.module, 'tazas');
  assert.equal(options.hasModel(state), false);
  assert.equal(new URLSearchParams(options.query(state)).has('taza'), false);
});

test('cambiar de familia vuelve a pedir el modelo y elimina las opciones anteriores', () => {
  const options = collectionOptions();
  const state = options.readCollection(new URLSearchParams('modulo=franelas&modelo=oversize&tecnica=vinil&talla=L'));
  assert.equal(options.hasModel(state), true);
  options.chooseModule(state, 'tazas');
  assert.equal(options.hasModel(state), false);
  assert.equal(state.technique, ''); assert.equal(state.size, '');
  state.mug = '6oz';
  assert.equal(options.hasModel(state), true);
  const query = new URLSearchParams(options.query(state));
  assert.equal(query.get('taza'), '6oz'); assert.equal(query.has('modelo'), false);
  assert.equal(query.has('tecnica'), false); assert.equal(query.has('talla'), false);
});

test('volver desde un diseño restaura el modelo válido sin aceptar modelos desconocidos', () => {
  const options = collectionOptions();
  const state = options.readCollection(new URLSearchParams('modulo=franelas&modelo=normal&tecnica=dtf-textil&talla=M'));
  assert.equal(options.hasModel(state), true);
  assert.equal(options.label(state), 'Corte clásico · DTF textil · Talla M');
  const invalid = options.readCollection(new URLSearchParams('modulo=franelas&modelo=inexistente&tecnica=vinil&talla=L'));
  assert.equal(options.hasModel(invalid), false);
  assert.equal(invalid.technique, ''); assert.equal(invalid.size, '');
});
