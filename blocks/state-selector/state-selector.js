import { getLocale } from '../../scripts/scripts.js';
import { STATES, STORAGE_KEY } from '../../scripts/constants.js';

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
  // English is delivered locale-less (/{state}/...); other locales keep their
  // prefix (/{state}/fr/...). Mirrors getLangRoot()/getLocaleRoot() and paths.json.
  const localePath = locale === 'en' ? '' : `/${locale}`;
  const saved = getSavedState();

  // The site root has no home page and is 301-redirected to this selector with
  // ?from=home. A server redirect can't read the saved state, so restore the
  // state-aware behaviour here: a returning visitor with a saved state is sent
  // straight to their state home instead of being made to pick again. Gated on
  // from=home so the footer "change service area" link (no from=home) always
  // shows the selector. No saved state -> fall through and render the grid.
  if (saved && new URLSearchParams(window.location.search).get('from') === 'home') {
    window.location.replace(`/${saved.code}${localePath}/`);
    return;
  }

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
      link.href = `/${state.code}${localePath}/`;
      link.className = 'state-selector-link';
      link.setAttribute('aria-label', state.name);

      link.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.setItem(STORAGE_KEY, state.code);
        const raw = new URLSearchParams(window.location.search).get('return');
        if (raw && raw.startsWith('/') && !raw.startsWith('//')) {
          window.location.href = `/${state.code}${raw}`;
        } else {
          window.location.href = `/${state.code}${localePath}/`;
        }
      });

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
