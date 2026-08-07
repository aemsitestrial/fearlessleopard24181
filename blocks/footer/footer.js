import { getMetadata, loadCSS } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { getLangRoot, getState } from '../../scripts/scripts.js';
import { STATES, STORAGE_KEY } from '../../scripts/constants.js';

function getSavedStateName() {
  try {
    const code = localStorage.getItem(STORAGE_KEY);
    return code ? (STATES.find((s) => s.code === code)?.name ?? null) : null;
  } catch {
    return null;
  }
}

/**
 * Build the state-selector href for the footer "change service area" link,
 * carrying a `return` param so the user comes back to the CURRENT page (under
 * the newly chosen state) instead of the state home. Mirrors the return path
 * that scripts/state-guard.js builds: drop the leading state segment so the
 * selector can re-prefix it with the picked state. Any locale prefix, query
 * string and hash are preserved.
 * @returns {string} the /state-selector URL, with a return param when relevant
 */
function stateSelectorHref() {
  const { pathname, search, hash } = window.location;
  // Already on the selector: keep whatever return it already carries.
  if (pathname.startsWith('/state-selector')) return `/state-selector${search}`;
  const segs = pathname.split('/').filter(Boolean);
  // Drop the leading state code (if present) — the selector re-adds the chosen one.
  const rest = getState() ? segs.slice(1) : segs;
  const returnPath = `/${rest.join('/')}${search}${hash}`;
  return `/state-selector?return=${encodeURIComponent(returnPath)}`;
}

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
</svg>`;

const ARROW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
</svg>`;

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const langRoot = getLangRoot();
  // const locale = getLocale() || 'en';

  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const basePath = footerMeta
    ? new URL(footerMeta, window.location).pathname
    : '/footer';
  const footerPath = langRoot && !basePath.startsWith(`${langRoot}/`)
    ? `${langRoot}${basePath}`
    : basePath;
  // Prefer the state/locale-scoped footer, then fall back to the root-level
  // footer for state-agnostic pages (e.g. the state-selector landing page)
  // that have no /{state}/{locale} prefix.
  const fragment = (await loadFragment(footerPath))
    || (footerPath !== basePath && await loadFragment(basePath));

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  // A missing footer fragment must not abort the block: the state and language
  // selectors below still need to render (they are the only controls on the
  // state-selector page).
  if (fragment) {
    while (fragment.firstElementChild) footer.append(fragment.firstElementChild);
  }

  // state selector link
  const stateName = getSavedStateName() || 'Select your state';
  const stateLink = document.createElement('a');
  stateLink.href = stateSelectorHref();
  stateLink.className = 'footer-state-selector';
  stateLink.setAttribute('aria-label', `Service area: ${stateName}. Change service area.`);
  stateLink.innerHTML = `
    <span class="footer-state-selector-pin">${PIN_SVG}</span>
    <span class="footer-state-selector-label">${stateName}</span>
    <span class="footer-state-selector-arrow">${ARROW_SVG}</span>
  `;
  footer.append(stateLink);

  // append language selector
  const langSel = document.createElement('div');
  langSel.className = 'block lang-selector';
  langSel.setAttribute('data-block-name', 'lang-selector');
  footer.append(langSel);
  await loadCSS(`${window.hlx.codeBasePath}/blocks/lang-selector/lang-selector.css`);
  const { default: decorateLangSelector } = await import('../lang-selector/lang-selector.js');
  decorateLangSelector(langSel);

  block.append(footer);
}
