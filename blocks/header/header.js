import { getMetadata } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';
import { loadFragment } from '../fragment/fragment.js';
import buildGnavSearch from './gnav-search.js';
import { getLangRoot } from '../../scripts/scripts.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');
const langRoot = getLangRoot();

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector(
      '[aria-expanded="true"]',
    );
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector(
      '[aria-expanded="true"]',
    );
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections
    .querySelectorAll('.nav-sections .default-content-wrapper > ul > li')
    .forEach((section) => {
      section.setAttribute('aria-expanded', expanded);
    });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = expanded || isDesktop.matches ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  // Sub-menus always start collapsed; they open on tap (accordion) / click
  // (desktop dropdown). This matches the Adobe Blog behavior where opening the
  // mobile drawer does NOT auto-expand every section.
  toggleAllNavSections(navSections, 'false');
  button.setAttribute(
    'aria-label',
    expanded ? 'Open navigation' : 'Close navigation',
  );
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

function getDirectTextContent(menuItem) {
  const menuLink = menuItem.querySelector(':scope > :where(a,p)');
  if (menuLink) {
    return menuLink.textContent.trim();
  }
  return Array.from(menuItem.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent)
    .join(' ');
}

async function buildBreadcrumbsFromNavTree(nav, currentUrl) {
  const crumbs = [];

  const homeUrl = document.querySelector('.nav-brand a[href]').href;

  let menuItem = Array.from(nav.querySelectorAll('a')).find(
    (a) => a.href === currentUrl,
  );
  if (menuItem) {
    do {
      const link = menuItem.querySelector(':scope > a');
      crumbs.unshift({
        title: getDirectTextContent(menuItem),
        url: link ? link.href : null,
      });
      menuItem = menuItem.closest('ul')?.closest('li');
    } while (menuItem);
  } else if (currentUrl !== homeUrl) {
    crumbs.unshift({ title: getMetadata('og:title'), url: currentUrl });
  }

  const placeholders = await fetchPlaceholders(langRoot || 'default');
  const homePlaceholder = placeholders.breadcrumbsHomeLabel || 'Home';

  crumbs.unshift({ title: homePlaceholder, url: homeUrl });

  // last link is current page and should not be linked
  if (crumbs.length > 1) {
    crumbs[crumbs.length - 1].url = null;
  }
  crumbs[crumbs.length - 1]['aria-current'] = 'page';
  return crumbs;
}

async function buildBreadcrumbs() {
  const breadcrumbs = document.createElement('nav');
  breadcrumbs.className = 'breadcrumbs';

  const crumbs = await buildBreadcrumbsFromNavTree(
    document.querySelector('.nav-sections'),
    document.location.href,
  );

  const ol = document.createElement('ol');
  ol.append(
    ...crumbs.map((item) => {
      const li = document.createElement('li');
      if (item['aria-current']) li.setAttribute('aria-current', item['aria-current']);
      if (item.url) {
        const a = document.createElement('a');
        a.href = item.url;
        a.textContent = item.title;
        li.append(a);
      } else {
        li.textContent = item.title;
      }
      return li;
    }),
  );

  breadcrumbs.append(ol);
  return breadcrumbs;
}

/**
 * Wrap a nav section's dropdown content (the sub-menu <ul> plus any
 * promotional block authored after it) into a single `.nav-drop-panel`
 * container, so each open dropdown is one structural panel — matching the
 * source. The copy, links, and images come from nav.plain.html; this only
 * wraps and classifies the DOM the author provided.
 * @param {Element} navSection the top-level nav <li>
 */
function decoratePanel(navSection) {
  const submenu = navSection.querySelector(':scope > ul');
  if (!submenu) return;

  // Collect nodes that appear after the sub-menu list — these form the promo.
  const promoNodes = [];
  let sibling = submenu.nextElementSibling;
  while (sibling) {
    promoNodes.push(sibling);
    sibling = sibling.nextElementSibling;
  }

  const panel = document.createElement('div');
  panel.className = 'nav-drop-panel';
  submenu.before(panel);
  panel.append(submenu);

  const hasImage = promoNodes.some((n) => n.querySelector('img'));
  if (promoNodes.length && hasImage) {
    const promo = document.createElement('div');
    promo.className = 'nav-promo';
    promoNodes.forEach((n) => promo.append(n));
    // Style the last link in the promo as a button-like CTA.
    const cta = promo.querySelector('p:last-of-type a');
    if (cta) cta.classList.add('nav-promo-cta');
    panel.append(promo);
    navSection.classList.add('nav-drop-has-promo');
  }
}

// Pages that should never appear as menu items when auto-generating the nav.
const AUTO_NAV_EXCLUDE = /(^|\/)(nav|footer|draft|drafts|fragment|fragments|metadata|search|401|404|500)(\/|$)/i;

/**
 * Resolve which query-index feed to read for the current locale.
 * @returns {string} path to the locale's query-index.json
 */
function localeQueryIndex() {
  const [locale] = window.location.pathname.split('/').filter(Boolean);
  return locale === 'fr' ? '/fr/query-index.json' : '/en/query-index.json';
}

/**
 * Normalize a base path for auto-nav generation and align it to the CURRENT
 * page's locale. Accepts delivery paths (e.g. "/", "/blog") and AEM
 * content-authoring paths (e.g. "/content/2026/31/site/en" or ".../en/blog").
 *
 * Delivery paths are locale-prefixed differently per locale (English maps to
 * the root — "/about-us" — while French keeps its prefix — "/fr/about-us").
 * So we reduce the input to the locale-agnostic sub-path (below its locale
 * segment) and re-apply the current page's `langRoot`, so the base matches the
 * delivery paths in that locale's query-index.
 * @param {string} base the authored base path
 * @returns {string} a delivery-relative base path for the current locale
 */
function normalizeBase(base) {
  let b = (base || '/').trim();
  if (b.startsWith('/content/')) {
    // AEM content path: keep only the part below its /en|/fr|/es segment.
    const m = b.match(/\/(?:en|fr|es)(\/.*)?$/);
    b = m && m[1] ? m[1] : '/';
  } else {
    // Delivery path: strip any leading known locale prefix to get the sub-path.
    const m = b.match(/^\/(?:en|fr|es)(\/.*)?$/);
    if (m) b = m[1] || '/';
  }
  if (!b.startsWith('/')) b = `/${b}`;
  if (b.length > 1 && b.endsWith('/')) b = b.slice(0, -1);
  // Re-apply the current page's locale root so the base lines up with the
  // locale-specific delivery paths (en pages are unprefixed; fr pages keep /fr).
  if (langRoot) b = b === '/' ? langRoot : `${langRoot}${b}`;
  return b;
}

/**
 * Build a nested nav tree from the query-index, limited to descendants of the
 * base path and to `maxDepth` levels below it. Items are ordered by their
 * `nav-order` metadata (ascending; pages without it fall to the end), then
 * alphabetically by title as a tiebreak, at every level.
 * @param {Array} rows query-index data rows ({ path, title, navOrder })
 * @param {string} base delivery-relative base path
 * @param {number} maxDepth maximum menu depth below the base
 * @returns {Array} top-level nodes ({ path, title, order, children })
 */
function buildAutoTree(rows, base, maxDepth) {
  const baseSegs = base === '/' ? [] : base.split('/').filter(Boolean);
  const nodes = new Map();
  const ensure = (segs) => {
    const path = `/${segs.join('/')}`;
    if (!nodes.has(path)) {
      nodes.set(path, {
        path, title: decodeURIComponent(segs[segs.length - 1]), order: Infinity, children: [],
      });
    }
    return nodes.get(path);
  };

  rows.forEach((row) => {
    const segs = (row.path || '').split('/').filter(Boolean);
    // must sit under the base path
    if (baseSegs.some((s, i) => segs[i] !== s)) return;
    const relSegs = segs.slice(baseSegs.length);
    if (relSegs.length < 1 || relSegs.length > maxDepth) return;
    if (relSegs.some((s) => AUTO_NAV_EXCLUDE.test(s))) return;
    // ensure a node for this page and each of its ancestors within the base
    for (let i = baseSegs.length + 1; i <= segs.length; i += 1) {
      const node = ensure(segs.slice(0, i));
      if (i === segs.length) {
        if (row.title) node.title = row.title;
        const order = parseFloat(row.navOrder);
        if (Number.isFinite(order)) node.order = order;
      }
    }
  });

  const topLevel = [];
  nodes.forEach((node) => {
    const segs = node.path.split('/').filter(Boolean);
    if (segs.length === baseSegs.length + 1) {
      topLevel.push(node);
    } else {
      const parent = nodes.get(`/${segs.slice(0, -1).join('/')}`);
      if (parent) parent.children.push(node);
      else topLevel.push(node);
    }
  });

  const sortRec = (arr) => {
    // nav-order ascending; equal/absent order falls back to alphabetical title.
    arr.sort((a, b) => (a.order - b.order) || a.title.localeCompare(b.title));
    arr.forEach((n) => sortRec(n.children));
  };
  sortRec(topLevel);
  return topLevel;
}

/**
 * Render a nav tree into a `.default-content-wrapper > ul` structure that
 * matches the authored nav markup (so the existing dropdown/accordion
 * decoration applies unchanged).
 * @param {Array} topLevel top-level nodes from buildAutoTree
 * @returns {Element} the default-content-wrapper element
 */
function renderNavTree(topLevel) {
  const wrapper = document.createElement('div');
  wrapper.className = 'default-content-wrapper';
  const renderNodes = (menuNodes, parentUl) => {
    menuNodes.forEach((node) => {
      const li = document.createElement('li');
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = node.path;
      a.title = node.title;
      a.textContent = node.title;
      p.append(a);
      li.append(p);
      if (node.children.length) {
        const childUl = document.createElement('ul');
        renderNodes(node.children, childUl);
        li.append(childUl);
      }
      parentUl.append(li);
    });
  };
  const ul = document.createElement('ul');
  renderNodes(topLevel, ul);
  wrapper.append(ul);
  return wrapper;
}

/**
 * Auto-generate the nav sections from the page tree under a base path.
 * @param {string} base an authored base path (delivery or content form)
 * @param {number} maxDepth maximum menu depth (default 3)
 * @returns {Promise<Element|null>} a default-content-wrapper, or null on failure
 */
async function buildAutoNavSections(base, maxDepth = 3) {
  let rows;
  try {
    const resp = await fetch(localeQueryIndex());
    if (!resp.ok) return null;
    rows = (await resp.json()).data || [];
  } catch (e) {
    return null;
  }
  const tree = buildAutoTree(rows, normalizeBase(base), maxDepth);
  return tree.length ? renderNavTree(tree) : null;
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  let navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  if (langRoot && !navPath.startsWith(`${langRoot}/`)) {
    navPath = `${langRoot}${navPath}`;
  }
  // Dual-fetch: local aem-up serves the fragment under /content; DA/EDS serves
  // it at the site root. Prefer the /content path, fall back to the root path.
  const fragment = (await loadFragment(`/content${navPath}`))
    || (await loadFragment(navPath));

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    // Hybrid auto-nav: when a `nav-auto` metadata (base path) is set, generate
    // the menu tree from the published page hierarchy up to level 3 and use it
    // in place of the authored menu. Brand and tools stay authored. Falls back
    // to the authored menu if generation yields nothing.
    const autoBase = getMetadata('nav-auto');
    if (autoBase) {
      const autoWrapper = await buildAutoNavSections(autoBase, 3);
      if (autoWrapper) {
        navSections.querySelector('.default-content-wrapper')?.remove();
        navSections.append(autoWrapper);
      }
    }
    navSections
      .querySelectorAll(':scope .default-content-wrapper > ul > li')
      .forEach((navSection) => {
        if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
        // Wrap the sub-menu (+ any promo) into a single dropdown panel.
        decoratePanel(navSection);
        navSection.addEventListener('click', (e) => {
          // Let clicks on real links inside the open panel navigate normally.
          if (e.target.closest('.nav-drop-panel a')) return;
          // Only dropdown items toggle; plain links navigate as usual.
          if (!navSection.classList.contains('nav-drop')) return;
          // The top-level item is a dropdown/accordion trigger on both desktop
          // (click-to-open panel) and mobile (accordion expand): toggle instead
          // of following its href.
          e.preventDefault();
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          // Single-expand: collapse siblings, then toggle this one.
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        });
      });
    navSections
      .querySelectorAll('.button-container')
      .forEach((buttonContainer) => {
        buttonContainer.classList.remove('button-container');
        buttonContainer.querySelector('.button').classList.remove('button');
      });
  }

  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    // The nav-tools area may contain an authored search block or a plain link
    // pointing at the query-index feed. Use it as the search source, then
    // replace it with the gnav-search toggle + expandable search bar.
    const authoredSearch = navTools.querySelector(
      '.search, a[href*="query-index"], a[href*="search"]',
    );
    let source;
    if (authoredSearch) {
      const link = authoredSearch.matches('a')
        ? authoredSearch
        : authoredSearch.querySelector('a[href]');
      if (link) source = new URL(link.getAttribute('href'), window.location).pathname;
      // Remove the whole authored wrapper (the <p> or button-container) so no
      // stray "Search" text link is left behind.
      (authoredSearch.closest('p, .button-container') || authoredSearch).remove();
    }
    const gnavSearch = await buildGnavSearch(source);
    // Search sits first in the tools cluster (icon), before Sign In and the logo.
    navTools.prepend(gnavSearch);

    // Strip boilerplate button decoration and tag the remaining tools links so
    // CSS can style Sign In and the Adobe logo consistently.
    navTools.querySelectorAll('.button-container').forEach((c) => c.classList.remove('button-container'));
    navTools.querySelectorAll('a[href]').forEach((a) => {
      a.classList.remove('button');
      if (a.querySelector('img')) {
        a.classList.add('nav-tools-logo');
      } else if (a.textContent.trim()) {
        a.classList.add('nav-tools-link');
      }
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  if (getMetadata('breadcrumbs').toLowerCase() === 'true') {
    navWrapper.append(await buildBreadcrumbs());
  }
}
