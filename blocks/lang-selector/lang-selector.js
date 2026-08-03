import { getLangRoot } from '../../scripts/scripts.js';

// EN is the default (no prefix). Add locales here to extend the list.
const LOCALES = [
  { code: '', label: 'English', lang: 'en' },
  { code: 'fr', label: 'Français', lang: 'fr' },
];

function buildLocaleHref(targetCode) {
  const path = window.location.pathname;
  const parts = path.split('/').filter(Boolean);
  const localeCodes = LOCALES.map((l) => l.code).filter(Boolean);

  const localeParts = localeCodes.includes(parts[0]) ? parts.slice(1) : parts;
  const cleanPath = localeParts.length ? `/${localeParts.join('/')}` : '/';

  return targetCode ? `/${targetCode}${cleanPath === '/' ? '/' : cleanPath}` : cleanPath;
}

export default function decorate(block) {
  const currentCode = getLangRoot().replace('/', '');

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
