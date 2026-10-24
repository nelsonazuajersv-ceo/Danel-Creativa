'use strict';
window.DANEL_OPTIONS = (() => {
  const mugs = [
    { id: '11oz', title: 'Taza de 11 oz', image: 'taza-11oz.webp' },
    { id: '6oz', title: 'Taza de 6 oz', image: 'taza-6oz.webp' },
    { id: 'negra', title: 'Taza negra · 11 oz', image: 'taza-negra.webp' },
    { id: 'magica', title: 'Taza mágica', image: 'taza-magica.webp' }
  ];
  const garments = [
    { id: 'normal', title: 'Corte clásico', image: 'franela-normal.webp' },
    { id: 'oversize', title: 'Franela oversize', image: 'franela-oversize.webp' },
    { id: 'sueter', title: 'Suéter', image: 'sueter.webp' }
  ];
  const techniques = [{ id: 'vinil', title: 'Vinil' }, { id: 'dtf-textil', title: 'DTF textil' }];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Otra'];
  function read(query, moduleHint) {
    const module = ['tazas', 'franelas'].includes(moduleHint) ? moduleHint : query.get('modulo') === 'franelas' ? 'franelas' : 'tazas';
    return {
      module,
      mug: mugs.some(item => item.id === query.get('taza')) ? query.get('taza') : '11oz',
      garment: garments.some(item => item.id === query.get('modelo')) ? query.get('modelo') : 'normal',
      technique: techniques.some(item => item.id === query.get('tecnica')) ? query.get('tecnica') : '',
      size: sizes.includes(query.get('talla')) ? query.get('talla') : ''
    };
  }
  function hasModel(state) {
    return state.module === 'tazas' ? mugs.some(item => item.id === state.mug) : state.module === 'franelas' && garments.some(item => item.id === state.garment);
  }
  function readCollection(query) {
    const state = read(query);
    state.module = ['tazas', 'franelas'].includes(query.get('modulo')) ? query.get('modulo') : '';
    state.mug = state.module === 'tazas' && mugs.some(item => item.id === query.get('taza')) ? query.get('taza') : '';
    state.garment = state.module === 'franelas' && garments.some(item => item.id === query.get('modelo')) ? query.get('modelo') : '';
    if (state.module !== 'franelas' || !hasModel(state)) { state.technique = ''; state.size = ''; }
    return state;
  }
  function chooseModule(state, module) {
    if (!['tazas', 'franelas'].includes(module) || state.module === module) return;
    Object.assign(state, { module, mug: '', garment: '', technique: '', size: '' });
  }
  function query(state, module = state.module) {
    if (!['tazas', 'franelas'].includes(module)) return {};
    const result = { modulo: module };
    if (module === 'tazas') { if (state.mug) result.taza = state.mug; return result; }
    if (state.garment) result.modelo = state.garment;
    if (state.technique) result.tecnica = state.technique;
    if (state.size) result.talla = state.size;
    return result;
  }
  function label(state, module = state.module) {
    if (module === 'tazas') return mugs.find(item => item.id === state.mug)?.title || '';
    if (module !== 'franelas') return '';
    return [garments.find(item => item.id === state.garment)?.title,
      techniques.find(item => item.id === state.technique)?.title,
      state.size ? 'Talla ' + state.size : null].filter(Boolean).join(' · ');
  }
  function message(state, type) {
    const expected = state.module === 'tazas' ? 'Una taza' : 'Una franela';
    return type === expected ? 'Producto elegido: ' + label(state) + '.\n' : '';
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function optionButton(title, key, value, className) {
    const node = element('button', className, title);
    node.type = 'button'; node.dataset.optionKey = key; node.dataset.optionValue = value;
    node.setAttribute('aria-pressed', 'false');
    return node;
  }
  function mountPicker(root, state, onChange) {
    let renderedModule;
    root.addEventListener('click', event => {
      const button = event.target.closest('button[data-option-key]');
      if (!button || !root.contains(button)) return;
      const key = button.dataset.optionKey;
      const value = button.dataset.optionValue;
      if (!['mug', 'garment', 'technique'].includes(key)) return;
      state[key] = value;
      onChange();
    });
    root.addEventListener('change', event => {
      if (event.target.matches('[data-size-select]')) { state.size = event.target.value; onChange(false); }
    });
    function update() {
      if (!['tazas', 'franelas'].includes(state.module)) { root.replaceChildren(); renderedModule = undefined; return; }
      if (renderedModule !== state.module) {
        renderedModule = state.module;
        root.replaceChildren();
        const railHead = element('div', 'picker-rail-heading');
        railHead.append(element('h2', '', state.module === 'tazas' ? 'Elige tu taza.' : 'Elige el modelo de franela.'));
        const arrows = element('div', 'picker-arrows');
        const prev = element('button', '', '←'), next = element('button', '', '→');
        prev.type = next.type = 'button'; prev.setAttribute('aria-label', 'Modelos anteriores'); next.setAttribute('aria-label', 'Más modelos');
        arrows.append(prev, next); railHead.append(arrows); root.append(railHead);
        const rail = element('div', 'picker-rail'); rail.setAttribute('role', 'group'); rail.setAttribute('aria-label', state.module === 'tazas' ? 'Tipos de tazas' : 'Modelos de prendas');
        (state.module === 'tazas' ? mugs : garments).forEach(item => {
          const card = optionButton('', state.module === 'tazas' ? 'mug' : 'garment', item.id, 'product-option');
          const frame = element('span', 'option-picture');
          const image = element('img'); image.src = 'assets/opciones/' + item.image; image.alt = ''; image.width = image.height = 640;
          const check = element('span', 'option-check', '✓'); check.setAttribute('aria-hidden', 'true'); frame.append(image, check);
          card.append(frame, element('span', 'option-name', item.title));
          rail.append(card);
        });
        prev.addEventListener('click', () => rail.scrollBy({ left: -320, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
        next.addEventListener('click', () => rail.scrollBy({ left: 320, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
        root.append(rail);
        if (state.module === 'franelas') {
          const techniqueRow = element('div', 'picker-technique-row');
          techniqueRow.append(element('span', 'picker-field-title', 'Técnica'));
          const group = element('div', 'picker-techniques'); group.setAttribute('role', 'group'); group.setAttribute('aria-label', 'Técnica de estampado');
          techniques.forEach(item => group.append(optionButton(item.title, 'technique', item.id, 'technique-choice')));
          techniqueRow.append(group); root.append(techniqueRow);
        }
        const bottom = element('div', 'picker-bottom');
        if (state.module === 'franelas') {
          const sizeLabel = element('label', 'picker-size'); sizeLabel.htmlFor = 'collection-size';
          sizeLabel.append(element('span', '', 'Talla'));
          const select = element('select'); select.id = 'collection-size'; select.dataset.sizeSelect = '';
          const empty = element('option', '', 'Por confirmar'); empty.value = ''; select.append(empty);
          sizes.forEach(size => { const option = element('option', '', size); option.value = size; select.append(option); });
          sizeLabel.append(select); bottom.append(sizeLabel);
        }
        const selection = element('p', 'picker-selection'); selection.setAttribute('aria-live', 'polite'); bottom.append(selection); root.append(bottom);
        root.append(element('p', 'picker-footnote', 'Imágenes ilustrativas. Confirmamos contigo el modelo, las tallas y la técnica antes de producir.'));
      }
      root.querySelectorAll('[data-option-key]').forEach(button => {
        const active = state[button.dataset.optionKey] === button.dataset.optionValue;
        button.setAttribute('aria-pressed', String(active));
      });
      const size = root.querySelector('[data-size-select]'); if (size) size.value = state.size;
      const selected = hasModel(state);
      root.querySelector('.picker-bottom').hidden = !selected;
      const techniqueRow = root.querySelector('.picker-technique-row'); if (techniqueRow) techniqueRow.hidden = !selected;
      root.querySelector('.picker-selection').textContent = selected ? 'Tu selección: ' + label(state) : '';
    }
    return { update };
  }
  function mountForm(root, state, onChange) {
    let renderedModule;
    root.addEventListener('change', event => {
      const key = event.target.dataset.orderOption;
      if (!['mug', 'garment', 'technique', 'size'].includes(key)) return;
      state[key] = event.target.value; onChange();
    });
    function update(visible = true) {
      root.hidden = !visible;
      if (!visible) return;
      if (renderedModule !== state.module) {
        renderedModule = state.module; root.replaceChildren(element('legend', '', 'Tu producto'));
        const choices = state.module === 'tazas' ? [{ key: 'mug', title: 'Tipo de taza', items: mugs }] : [
          { key: 'garment', title: 'Modelo', items: garments },
          { key: 'technique', title: 'Técnica', items: techniques, empty: 'Por confirmar' },
          { key: 'size', title: 'Talla', items: sizes.map(size => ({ id: size, title: size })), empty: 'Por confirmar' }
        ];
        const fields = element('div', 'order-options-grid');
        choices.forEach(choice => {
          const label = element('label', '', choice.title); const select = element('select');
          select.dataset.orderOption = choice.key; select.name = choice.key;
          if (choice.empty) { const option = element('option', '', choice.empty); option.value = ''; select.append(option); }
          choice.items.forEach(item => { const option = element('option', '', item.title); option.value = item.id; select.append(option); });
          label.append(select); fields.append(label);
        });
        root.append(fields, element('p', 'order-selection'));
      }
      root.querySelectorAll('[data-order-option]').forEach(select => { select.value = state[select.dataset.orderOption]; });
      root.querySelector('.order-selection').textContent = label(state);
    }
    return { update };
  }
  return { mugs, garments, techniques, sizes, read, readCollection, chooseModule, hasModel, query, label, message, mountPicker, mountForm };
})();
