'use strict';
const catalog = window.DANEL_CATALOG;
const params = new URLSearchParams(location.search);
const productOptions = window.DANEL_OPTIONS;
const selectedDesign = catalog.products.find(item => item.id === params.get('id') || item.id === params.get('referencia'));
const optionState = document.body.dataset.page === 'colecciones' ? productOptions.readCollection(params) : productOptions.read(params, selectedDesign?.module);
const moduleNames = { tazas: 'Tazas', franelas: 'Franelas' };
const formTypes = { tazas: 'Una taza', franelas: 'Una franela' };
const catalogState = {
  module: optionState.module,
  category: catalog.categories.some(item => item.id === params.get('categoria')) ? params.get('categoria') : catalog.categories[0].id
};
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menú');
  mobileNav.hidden = true;
}
menuButton.addEventListener('click', () => {
  const opening = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(opening));
  menuButton.setAttribute('aria-label', opening ? 'Cerrar menú' : 'Abrir menú');
  mobileNav.hidden = !opening;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.querySelector('#year').textContent = new Date().getFullYear();

// Conserva los enlaces compartidos de la versión anterior.
if (document.body.dataset.page === 'inicio') {
  const legacy = { '#colecciones': 'colecciones.html', '#proceso': 'proceso.html', '#estudio': 'estudio.html', '#contacto': 'contacto.html' };
  if (legacy[location.hash]) location.replace(legacy[location.hash]);
}
function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function setPreview(button, visible) {
  const show = visible && !!button.querySelector('.product-image') && !button.disabled;
  button.classList.toggle('show-product', show);
  button.setAttribute('aria-pressed', String(show));
  const title = button.dataset.title || 'Gingerbread Kawaii';
  const type = button.dataset.module === 'franelas' ? 'la franela' : 'la taza';
  button.setAttribute('aria-label', show ? `Ver de nuevo el diseño plano ${title}` : `Ver ${title} sobre ${type}`);
}
function installPreview(button) {
  if (!button || button.disabled) return;
  button.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') setPreview(button, true); });
  button.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') setPreview(button, false); });
  button.addEventListener('click', event => { if (event.pointerType !== 'mouse') setPreview(button, button.getAttribute('aria-pressed') !== 'true'); });
  button.addEventListener('blur', () => setPreview(button, false));
  const mockup = button.querySelector('.product-image');
  if (mockup) mockup.addEventListener('error', () => {
    setPreview(button, false);
    button.disabled = true;
    button.setAttribute('aria-label', 'Vista del producto no disponible');
    button.querySelectorAll('.hint-design, .hint-product').forEach(label => { label.textContent = 'Vista del producto no disponible'; });
  });
}
installPreview(document.querySelector('.hero-preview'));
function collectionUrl(module, category) {
  return 'colecciones.html?' + new URLSearchParams({ ...productOptions.query(optionState, module), categoria: category });
}
function createCard(project) {
  const card = makeElement('article', 'project'); card.dataset.project = project.id;
  const preview = makeElement('button', `preview-toggle catalog-preview${project.providedPair ? ' provided-pair' : ''}${project.splitPair ? ' split-pair' : ''}`);
  preview.type = 'button'; preview.dataset.title = project.title; preview.dataset.module = project.module;
  preview.setAttribute('aria-pressed', 'false');
  const design = makeElement('img', 'preview-image design-image');
  design.src = project.design; design.alt = project.designAlt; design.loading = 'lazy'; preview.appendChild(design);
  if (project.product) {
    const product = makeElement('img', `preview-image product-image${project.productCrop ? ' cropped' : ''}`);
    product.src = project.product; product.alt = project.productAlt; product.loading = 'lazy'; product.setAttribute('aria-hidden', 'true'); preview.appendChild(product);
  } else {
    preview.disabled = true; preview.setAttribute('aria-label', `Diseño plano ${project.title}. Vista del producto próximamente.`);
  }
  const hint = makeElement('span', 'preview-hint');
  hint.appendChild(makeElement('span', 'hint-design', project.product ? 'Pasa el puntero o toca · ver producto ↗' : 'Diseño plano · vista del producto próximamente'));
  hint.appendChild(makeElement('span', 'hint-product', 'Vista del producto · toca para volver ↶'));
  preview.appendChild(hint);
  if (project.product) setPreview(preview, false);
  installPreview(preview);
  const details = makeElement('a', 'project-open');
  details.href = 'producto.html?' + new URLSearchParams({ ...productOptions.query(optionState, project.module), id: project.id, categoria: catalogState.category });
  details.setAttribute('aria-label', `Ver detalles de ${project.title}`);
  const info = makeElement('span', 'project-info');
  info.appendChild(makeElement('span', 'project-title', project.title)); info.appendChild(makeElement('span', 'project-subtitle', project.subtitle));
  details.append(info, makeElement('span', 'project-detail-link', 'Ver detalles ↗'));
  const meta = makeElement('span', 'project-meta', moduleNames[project.module].toUpperCase()); meta.appendChild(makeElement('span', '', project.id.toUpperCase()));
  card.append(preview, details, meta); return card;
}
function renderCatalog() {
  const selected = productOptions.hasModel(optionState);
  document.querySelector('#catalog-panel').hidden = !selected;
  document.querySelector('#selection-status').textContent = selected ? 'Has elegido ' + productOptions.label(optionState) + '. Ya puedes explorar los diseños.' : '';
  if (!selected) { document.querySelector('#catalog-grid').replaceChildren(); return; }
  const category = catalog.categories.find(item => item.id === catalogState.category);
  const items = catalog.products.filter(item => item.module === catalogState.module && (item.category === category.id || item.categories?.includes(category.id))).slice(0, 5);
  document.querySelector('#catalog-grid').replaceChildren(...items.map(createCard));
  document.querySelector('.catalog-empty').hidden = items.length > 0;
  document.querySelector('.filter-count').textContent = `${items.length} ${items.length === 1 ? 'diseño' : 'diseños'} · ${moduleNames[catalogState.module]}`;
  document.querySelector('#category-title').textContent = category.title; document.querySelector('#category-description').textContent = category.description;
  document.querySelector('.catalog-empty .text-link').href = 'contacto.html?' + new URLSearchParams({ ...productOptions.query(optionState), categoria: category.id });
  document.querySelector('#gallery-selection').textContent = productOptions.label(optionState) + ' · Ahora elige tu diseño';
  document.querySelectorAll('.category-filters .filter').forEach(button => {
    const selected = button.dataset.category === category.id; button.classList.toggle('active', selected); button.setAttribute('aria-pressed', String(selected));
  });
}
if (document.querySelector('#catalog-grid')) {
  const categoriesElement = document.querySelector('.category-filters');
  function rememberCollection() {
    if (location.protocol !== 'file:') history.replaceState(null, '', collectionUrl(catalogState.module, catalogState.category));
  }
  catalog.categories.forEach(category => {
    const button = makeElement('button', 'filter', category.title); button.type = 'button'; button.dataset.category = category.id; button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => { catalogState.category = category.id; renderCatalog(); rememberCollection(); }); categoriesElement.appendChild(button);
  });
  const moduleTabs = [...document.querySelectorAll('.module-tab')];
  function selectModule(module, focus = false) {
    productOptions.chooseModule(optionState, module);
    catalogState.module = optionState.module;
    document.querySelector('#product-panel').hidden = !Object.hasOwn(moduleNames, module);
    moduleTabs.forEach(tab => {
      const selected = tab.dataset.module === module; tab.classList.toggle('active', selected); tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected || (!module && tab === moduleTabs[0]) ? 0 : -1;
      if (selected) { document.querySelector('#product-panel').setAttribute('aria-labelledby', tab.id); if (focus) tab.focus(); }
    }); optionPicker.update(); renderCatalog();
  }
  const optionPicker = productOptions.mountPicker(document.querySelector('#product-picker'), optionState, () => {
    optionPicker.update(); renderCatalog(); rememberCollection();
  });
  moduleTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => { selectModule(tab.dataset.module); rememberCollection(); });
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') next = moduleTabs[(index + 1) % moduleTabs.length];
      if (event.key === 'Home') next = moduleTabs[0]; if (event.key === 'End') next = moduleTabs[moduleTabs.length - 1];
      if (next) { event.preventDefault(); selectModule(next.dataset.module, true); rememberCollection(); }
    });
  }); selectModule(catalogState.module);
}

const productPage = document.querySelector('#product-detail');
if (productPage) {
  const project = catalog.products.find(item => item.id === params.get('id'));
  if (!project) {
    document.querySelector('#product-missing').hidden = false; document.title = 'Propuesta no encontrada · DANEL';
    document.querySelector('.product-page').removeAttribute('aria-labelledby');
  } else {
    productPage.hidden = false;
    const category = catalog.categories.find(item => item.id === params.get('categoria') && (project.category === item.id || project.categories?.includes(item.id))) || catalog.categories.find(item => item.id === project.category);
    document.title = `${project.title} · DANEL`;
    document.querySelector('#product-title').textContent = project.title;
    document.querySelector('#product-category').textContent = `${moduleNames[project.module]} · ${category.title}`;
    document.querySelector('#product-reference').textContent = 'Referencia ' + project.id;
    document.querySelector('#product-description').textContent = project.description;
    document.querySelector('#product-back').href = collectionUrl(project.module, category.id);
    document.querySelector('#choose-project').href = 'contacto.html?' + new URLSearchParams({ ...productOptions.query(optionState, project.module), referencia: project.id, categoria: category.id });
    document.querySelector('#chosen-product-label').textContent = productOptions.label(optionState, project.module);
    document.querySelector('#change-product').href = collectionUrl(project.module, category.id);
    const image = document.querySelector('#product-image'), frame = document.querySelector('#product-art');
    let view = 'design';
    function setProductView(next) {
      view = next === 'product' && project.product ? 'product' : 'design'; image.src = project[view]; image.alt = project[view + 'Alt'];
      frame.classList.toggle('split-pair', !!project.splitPair); frame.classList.toggle('product-view', view === 'product'); image.classList.toggle('cropped', view === 'product' && !!project.productCrop);
      document.querySelectorAll('button.product-view').forEach(button => {
        const selected = button.dataset.view === view; button.classList.toggle('active', selected); button.setAttribute('aria-pressed', String(selected)); button.disabled = button.dataset.view === 'product' && !project.product;
      });
    }
    image.addEventListener('error', () => { if (view === 'product') setProductView('design'); });
    document.querySelectorAll('button.product-view').forEach(button => button.addEventListener('click', () => setProductView(button.dataset.view))); setProductView('design');
  }
}
const form = document.querySelector('#idea-form');
if (form) {
  const referenced = catalog.products.find(item => item.id === params.get('referencia'));
  let selectedModule = selectedDesign?.module || optionState.module;
  if (referenced) {
    selectedModule = referenced.module;
    document.querySelector('#idea').value = `Me gustaría partir del diseño «${referenced.title}» (referencia: ${referenced.id}).\n\nMi idea: `;
  } else if (Object.hasOwn(moduleNames, selectedModule) && catalog.categories.some(item => item.id === params.get('categoria'))) {
    const category = catalog.categories.find(item => item.id === params.get('categoria'));
    document.querySelector('#idea').value = `Me gustaría consultar un diseño para ${moduleNames[selectedModule].toLowerCase()} de la categoría ${category.title}.\n\nMi idea: `;
  }
  if (Object.hasOwn(formTypes, selectedModule)) form.querySelectorAll('input[name="type"]').forEach(input => { input.checked = input.value === formTypes[selectedModule]; });
  const orderFields = productOptions.mountForm(document.querySelector('#order-options'), optionState, () => { orderFields.update(); document.querySelector('#email-result').hidden = true; });
  function syncOrderType() {
    const type = form.querySelector('input[name="type"]:checked').value;
    if (type === formTypes.tazas) optionState.module = 'tazas';
    if (type === formTypes.franelas) optionState.module = 'franelas';
    orderFields.update(type === formTypes.tazas || type === formTypes.franelas);
  }
  form.querySelectorAll('input[name="type"]').forEach(input => input.addEventListener('change', syncOrderType));
  syncOrderType();
  let emailMessage = '';
  form.addEventListener('submit', event => {
    event.preventDefault(); if (!form.reportValidity()) return;
    const name = document.querySelector('#name').value.trim(), idea = document.querySelector('#idea').value.trim(); if (!name || !idea) return;
    const type = form.querySelector('input[name="type"]:checked').value;
    const subject = `Mi idea para DANEL · ${type}`;
    emailMessage = `Hola, equipo DANEL:\n\nSoy ${name} y me gustaría consultar un proyecto de DANEL.\n\nQué me gustaría crear: ${type}.\n${productOptions.message(optionState, type)}\nMi idea:\n${idea}\n\nMe gustaría conocer las opciones y el presupuesto.\n\n¡Gracias!\n${name}`;
    const emailLink = document.querySelector('#open-email'); emailLink.href = `mailto:jsbastidas14@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailMessage)}`;
    document.querySelector('#email-result').hidden = false; document.querySelector('#copy-status').textContent = ''; emailLink.click();
  });
  form.addEventListener('input', () => { document.querySelector('#email-result').hidden = true; });
  document.querySelector('#copy-message').addEventListener('click', async () => {
    const status = document.querySelector('#copy-status');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText(emailMessage);
      status.textContent = 'Mensaje copiado. Pégalo en tu correo y envíalo a jsbastidas14@gmail.com.';
    } catch {
      let fallback = document.querySelector('#message-fallback');
      if (!fallback) { fallback = document.createElement('textarea'); fallback.id = 'message-fallback'; fallback.readOnly = true; fallback.rows = 8; fallback.setAttribute('aria-label', 'Mensaje preparado para copiar'); document.querySelector('#email-result').appendChild(fallback); }
      fallback.value = emailMessage; fallback.focus(); fallback.select(); status.textContent = 'Selecciona y copia este mensaje para enviarlo a jsbastidas14@gmail.com.';
    }
  });
}
const video = document.querySelector('#brand-animation');
if (video) {
  const control = document.querySelector('.animation-toggle'), motion = matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = motion.matches, inView = true;
  function updateControl() {
    const paused = video.paused; control.replaceChildren(document.createTextNode(paused ? 'Reproducir animación ' : 'Pausar animación '));
    const icon = makeElement('span', '', paused ? '▷' : 'Ⅱ'); icon.setAttribute('aria-hidden', 'true'); control.append(icon); control.setAttribute('aria-label', paused ? 'Reproducir animación' : 'Pausar animación');
  }
  function syncVideo() {
    if (userPaused || document.hidden || !inView) video.pause(); else video.play().catch(updateControl); updateControl();
  }
  video.muted = true; if (motion.matches) video.autoplay = false;
  control.addEventListener('click', () => { userPaused = !video.paused; syncVideo(); });
  video.addEventListener('play', updateControl); video.addEventListener('pause', updateControl); video.addEventListener('error', () => { control.hidden = true; });
  motion.addEventListener('change', event => { userPaused = event.matches; syncVideo(); });
  document.addEventListener('visibilitychange', syncVideo);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { inView = entries[0].isIntersecting; syncVideo(); }, { threshold: .1 }).observe(video);
  syncVideo();
}
