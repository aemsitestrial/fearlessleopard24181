import { getLocale, STATES } from '../../scripts/scripts.js';

const STORAGE_KEY = 'xcel-selected-state';

function getSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return STATES.find((s) => s.code === saved) ?? null;
  } catch {
    return null;
  }
}

async function loadSVG(code) {
  try {
    const resp = await fetch(`${window.hlx.codeBasePath}/icons/states/svg/${code}.svg`);
    if (!resp.ok) return null;
    const text = await resp.text();
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    return doc.querySelector('svg');
  } catch {
    return null;
  }
}

export default async function decorate(block) {
  const heading = block.querySelector('div')?.textContent.trim() || 'Select a Service Area to Explore';
  const locale = getLocale() || 'en';
  const saved = getSavedState();

  block.textContent = '';

  const h2 = document.createElement('h2');
  h2.textContent = heading;
  block.append(h2);

  const grid = document.createElement('ul');
  grid.className = 'state-selector-grid';

  const cards = await Promise.all(
    STATES.map(async (state) => {
      const li = document.createElement('li');
      li.className = 'state-selector-card';
      if (saved?.code === state.code) li.classList.add('state-selector-card-selected');

      const link = document.createElement('a');
      link.href = `/${state.code}/${locale}/`;
      link.className = 'state-selector-link';
      link.setAttribute('aria-label', state.name);

      const svgEl = await loadSVG(state.code);
      if (svgEl) {
        svgEl.setAttribute('aria-hidden', 'true');
        svgEl.classList.add('state-selector-svg');
        link.append(svgEl);
      }

      const label = document.createElement('span');
      label.className = 'state-selector-name';
      label.textContent = state.name;
      link.append(label);

      li.append(link);
      return li;
    }),
  );

  cards.forEach((card) => grid.append(card));
  block.append(grid);
}
