import {
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  getMetadata,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';
import enforceStateSelection from './state-guard.js';
import { STATES, SITE_STATES, SITE_LOCALES } from './constants.js';

export { STATES, SITE_STATES, SITE_LOCALES };

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

function autolinkModals(doc) {
  doc.addEventListener('click', async (e) => {
    const origin = e.target.closest('a');
    if (origin && origin.href && origin.href.includes('/modals/')) {
      e.preventDefault();
      const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
      openModal(origin.href);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Wraps a picture in an anchor when the Image component's optional link field
 * (`imageLink`) has been authored. In xwalk projects the core image component
 * renders only a <picture>; the authored link is delivered as a separate,
 * empty-text link (its href differs from its text) sitting alongside the
 * picture in the same default-content wrapper. This moves the picture into that
 * anchor so the image becomes clickable.
 * @param {Element} main The container element
 */
function decorateLinkedImages(main) {
  main.querySelectorAll('picture').forEach((picture) => {
    // Only default-content images (skip pictures already handled by blocks).
    if (picture.closest('[class][data-block-status], .block')) return;

    const wrapper = picture.closest('p, div');
    if (!wrapper) return;

    // The authored link lives as a sibling within the same wrapper (or the
    // wrapper's parent for the default-content <p> layout).
    const scope = wrapper.parentElement || wrapper;
    const candidate = [...scope.querySelectorAll('a[href]')].find(
      (a) => !a.querySelector('picture, img') && !a.textContent.trim(),
    );
    if (!candidate) return;

    // Move the picture into the anchor and drop the now-empty link paragraph.
    candidate.textContent = '';
    candidate.append(picture);
    candidate.classList.remove('button');
    const linkWrapper = candidate.closest('p, div');
    if (linkWrapper && linkWrapper !== wrapper) {
      linkWrapper.classList.remove('button-container');
      wrapper.replaceWith(candidate);
      if (!linkWrapper.textContent.trim() && !linkWrapper.querySelector('picture, img')) {
        linkWrapper.remove();
      }
    }
  });
}

function a11yLinks(main) {
  const links = main.querySelectorAll('a');
  links.forEach((link) => {
    let label = link.textContent;
    if (!label && link.querySelector('span.icon')) {
      const icon = link.querySelector('span.icon');
      label = icon ? icon.classList[1]?.split('-')[1] : label;
    }
    link.setAttribute('aria-label', label);
  });
}

// Content is organized as /{state}/{locale}/... (e.g. /tx/en/about-us), so the
// state segment now comes BEFORE the locale. STATES, SITE_STATES, and SITE_LOCALES
// are defined in ./constants.js and re-exported above for backwards compatibility.

/**
 * Resolve the localized content root for the current page under the
 * /{state}/{locale}/... structure. This is the prefix used to locate
 * per-site fragments (nav, footer), placeholders and the query-index.
 *
 * Examples: "/tx/en/about-us" -> "/tx/en"; legacy "/fr/coffee" -> "/fr";
 * anything else (unknown/root) -> "".
 * @returns {string} the content root path, or "" when none applies
 */
export function getLangRoot() {
  const segs = window.location.pathname.split('/').filter(Boolean);
  let root = '';
  if (SITE_STATES.includes(segs[0])) {
    root = `/${segs[0]}`;
    if (SITE_LOCALES.includes(segs[1])) root += `/${segs[1]}`;
  } else if (SITE_LOCALES.includes(segs[0])) {
    root = `/${segs[0]}`;
  }
  return root;
}

/**
 * The state code for the current page (e.g. "tx"), or "" when the URL is not
 * state-prefixed.
 * @returns {string}
 */
export function getState() {
  const [first] = window.location.pathname.split('/').filter(Boolean);
  return SITE_STATES.includes(first) ? first : '';
}

/**
 * The locale code for the current page (e.g. "en", "fr"), or "" when none is
 * present in the URL.
 * @returns {string}
 */
export function getLocale() {
  const segs = window.location.pathname.split('/').filter(Boolean);
  if (SITE_STATES.includes(segs[0]) && SITE_LOCALES.includes(segs[1])) return segs[1];
  if (SITE_LOCALES.includes(segs[0])) return segs[0];
  return '';
}

/**
 * Path to the query-index feed scoped to the current page's state/locale root
 * (e.g. "/tx/en/query-index.json"). Falls back to "/query-index.json" at the
 * site root. Mirrors the targets configured in helix-query.yaml.
 * @returns {string}
 */
export function getQueryIndexPath() {
  return `${getLangRoot()}/query-index.json`;
}

/**
 * Locale-scoped content root, independent of state. Used for resources that
 * vary by language only (e.g. placeholders): English lives at the site root
 * ("") while other locales keep their prefix ("/fr", "/es").
 * @returns {string}
 */
export function getLocaleRoot() {
  const locale = getLocale();
  return locale && locale !== 'en' ? `/${locale}` : '';
}

// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  // wrap images that have an authored optional link
  decorateLinkedImages(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  // add aria-label to links
  a11yLinks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  if (getMetadata('breadcrumbs').toLowerCase() === 'true') {
    doc.body.dataset.breadcrumbs = true;
  }
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  autolinkModals(doc);

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

if (!enforceStateSelection()) {
  document.documentElement.style.visibility = '';
  loadPage();
}
