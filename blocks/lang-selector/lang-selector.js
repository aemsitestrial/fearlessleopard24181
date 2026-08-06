import { getLangRoot, getLocale, getState } from '../../scripts/scripts.js';

// Content lives under /{state}/{locale}/..., so every locale is an explicit
// path segment. Add locales here to extend the list.
const LOCALES = [
  { code: 'en', label: 'English', lang: 'en' },
  { code: 'fr', label: 'Français', lang: 'fr' },
];

// Build the URL for the current page in a different locale, preserving the
// leading state segment (e.g. /tx) and the sub-path below the state/locale root.
function buildLocaleHref(targetCode) {
  const langRoot = getLangRoot(); // e.g. "/tx/en", "/fr", or ""
  const rest = window.location.pathname.slice(langRoot.length) || '/';
  const state = getState(); // e.g. "tx" or ""
  const statePrefix = state ? `/${state}` : '';
  return `${statePrefix}/${targetCode}${rest === '/' ? '/' : rest}`;
}

export default function decorate(block) {
  const currentCode = getLocale();

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Language selector');
  nav.className = 'lang-selector-nav';

  const list = document.createElement('ul');

  LOCALES.forEach(({ code, label, lang }) => {
    const li = document.createElement('li');
    const isActive = code === currentCode;

    if (isActive) {
      const span = document.createElement('span');
      span.lang = lang;
      span.textContent = label;
      span.setAttribute('aria-current', 'true');
      span.className = 'lang-selector-current';
      li.append(span);
    } else {
      const a = document.createElement('a');
      a.href = buildLocaleHref(code);
      a.lang = lang;
      a.textContent = label;
      li.append(a);
    }

    list.append(li);
  });

  nav.append(list);
  block.textContent = '';
  block.append(nav);
}
