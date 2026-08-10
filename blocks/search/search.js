import {
  createOptimizedPicture,
  decorateIcons,
} from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';
import { getLocaleRoot, getQueryIndexPath } from '../../scripts/scripts.js';

const searchParams = new URLSearchParams(window.location.search);

function getLocaleIndex() {
  return getQueryIndexPath();
}

function findNextHeading(el) {
  let preceedingEl = el.parentElement.previousElement || el.parentElement.parentElement;
  let h = 'H2';
  while (preceedingEl) {
    const lastHeading = [...preceedingEl.querySelectorAll('h1, h2, h3, h4, h5, h6')].pop();
    if (lastHeading) {
      const level = parseInt(lastHeading.nodeName[1], 10);
      h = level < 6 ? `H${level + 1}` : 'H6';
      preceedingEl = false;
    } else {
      preceedingEl = preceedingEl.previousElement || preceedingEl.parentElement;
    }
  }
  return h;
}

function highlightTextElements(terms, elements) {
  elements.forEach((element) => {
    if (!element || !element.textContent) return;

    const matches = [];
    const { textContent } = element;
    terms.forEach((term) => {
      let start = 0;
      let offset = textContent.toLowerCase().indexOf(term.toLowerCase(), start);
      while (offset >= 0) {
        matches.push({ offset, term: textContent.substring(offset, offset + term.length) });
        start = offset + term.length;
        offset = textContent.toLowerCase().indexOf(term.toLowerCase(), start);
      }
    });

    if (!matches.length) {
      return;
    }

    matches.sort((a, b) => a.offset - b.offset);
    let currentIndex = 0;
    const fragment = matches.reduce((acc, { offset, term }) => {
      if (offset < currentIndex) return acc;
      const textBefore = textContent.substring(currentIndex, offset);
      if (textBefore) {
        acc.appendChild(document.createTextNode(textBefore));
      }
      const markedTerm = document.createElement('mark');
      markedTerm.textContent = term;
      acc.appendChild(markedTerm);
      currentIndex = offset + term.length;
      return acc;
    }, document.createDocumentFragment());
    const textAfter = textContent.substring(currentIndex);
    if (textAfter) {
      fragment.appendChild(document.createTextNode(textAfter));
    }
    element.innerHTML = '';
    element.appendChild(fragment);
  });
}

// Per-URL cache; lives for the page lifetime.
const indexCache = new Map();

/**
 * Fetch and cache one query-index feed. Returns [] on any error so a failing
 * source never blocks results from other sources.
 * @param {string} url
 * @returns {Promise<Array>}
 */
export async function fetchData(url) {
  if (indexCache.has(url)) return indexCache.get(url);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    const data = json.data || [];
    indexCache.set(url, data);
    return data;
  } catch {
    indexCache.set(url, []);
    return [];
  }
}

/**
 * Fetch all sources in parallel.
 * @param {Array<{url: string, label: string|null, baseUrl: string|null}>} sources
 * @returns {Promise<Array<{label: string|null, baseUrl: string|null, data: Array}>>}
 */
async function fetchAllSources(sources) {
  return Promise.all(
    sources.map(async ({ url, label, baseUrl }) => ({
      label,
      baseUrl,
      data: await fetchData(url),
    })),
  );
}

/**
 * Read all rows from the block DOM and return a sources array.
 * Each row: first cell = URL (link or plain text), second cell (optional) = label.
 * @param {HTMLElement} block
 * @returns {Array<{url: string, label: string|null, baseUrl: string|null}>}
 */
function parseSources(block) {
  const sources = [];
  block.querySelectorAll(':scope > div').forEach((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    if (!cells.length) return;
    const link = cells[0].querySelector('a[href]');
    const rawUrl = link ? link.getAttribute('href') : cells[0].textContent.trim();
    if (!rawUrl) return;
    let resolved;
    try {
      resolved = new URL(rawUrl, window.location);
    } catch {
      return;
    }
    const baseUrl = resolved.origin !== window.location.origin ? resolved.origin : null;
    const label = cells.length > 1 ? cells[1].textContent.trim() || null : null;
    sources.push({ url: resolved.href, label, baseUrl });
  });
  return sources;
}

/**
 * Build a single result list item.
 * @param {string|null} baseUrl origin of external source; null for same-origin
 */
function renderResult(result, searchTerms, titleTag, baseUrl) {
  const href = baseUrl ? new URL(result.path, baseUrl).href : result.path;
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = href;
  if (result.image) {
    const wrapper = document.createElement('div');
    wrapper.className = 'search-result-image';
    const pic = createOptimizedPicture(result.image, '', false, [{ width: '375' }]);
    wrapper.append(pic);
    a.append(wrapper);
  }
  if (result.title) {
    const title = document.createElement(titleTag);
    title.className = 'search-result-title';
    const innerLink = document.createElement('a');
    innerLink.href = href;
    innerLink.textContent = result.title;
    highlightTextElements(searchTerms, [innerLink]);
    title.append(innerLink);
    a.append(title);
  }
  if (result.description) {
    const description = document.createElement('p');
    description.textContent = result.description;
    highlightTextElements(searchTerms, [description]);
    a.append(description);
  }
  li.append(a);
  return li;
}

function clearSearchResults(block) {
  const searchResults = block.querySelector('.search-results');
  searchResults.innerHTML = '';
}

function clearSearch(block) {
  clearSearchResults(block);
  if (window.history.replaceState) {
    const url = new URL(window.location.href);
    url.search = '';
    searchParams.delete('q');
    window.history.replaceState({}, '', url.toString());
  }
}

function compareFound(hit1, hit2) {
  return hit1.minIdx - hit2.minIdx;
}

function filterData(searchTerms, data) {
  const foundInHeader = [];
  const foundInMeta = [];

  data.forEach((result) => {
    let minIdx = -1;

    searchTerms.forEach((term) => {
      const idx = (result.header || result.title).toLowerCase().indexOf(term);
      if (idx < 0) return;
      if (minIdx < idx) minIdx = idx;
    });

    if (minIdx >= 0) {
      foundInHeader.push({ minIdx, result });
      return;
    }

    const metaContents = `${result.title} ${result.description} ${result.path.split('/').pop()}`.toLowerCase();
    searchTerms.forEach((term) => {
      const idx = metaContents.indexOf(term);
      if (idx < 0) return;
      if (minIdx < idx) minIdx = idx;
    });

    if (minIdx >= 0) {
      foundInMeta.push({ minIdx, result });
    }
  });

  return [
    ...foundInHeader.sort(compareFound),
    ...foundInMeta.sort(compareFound),
  ].map((item) => item.result);
}

/**
 * Render fetched groups into the results list.
 * Each group gets a labelled header when multiple sources are active.
 */
async function renderResults(block, config, groups, terms) {
  clearSearchResults(block);
  const searchResults = block.querySelector('.search-results');
  const headingTag = searchResults.dataset.h;
  const multiSource = groups.length > 1;
  let hasAnyResults = false;

  groups.forEach(({ label, baseUrl, data }) => {
    const filtered = filterData(terms, data);
    if (!filtered.length) return;
    hasAnyResults = true;

    if (multiSource && label) {
      const groupHeader = document.createElement('li');
      groupHeader.className = 'search-group-header';
      groupHeader.textContent = label;
      searchResults.append(groupHeader);
    }

    filtered.forEach((result) => {
      searchResults.append(renderResult(result, terms, headingTag, baseUrl));
    });
  });

  if (!hasAnyResults) {
    const noResultsMessage = document.createElement('li');
    searchResults.classList.add('no-results');
    noResultsMessage.textContent = config.placeholders.searchNoResults || 'No results found.';
    searchResults.append(noResultsMessage);
  } else {
    searchResults.classList.remove('no-results');
  }
}

async function handleSearch(e, block, config) {
  const searchValue = e.target.value;
  searchParams.set('q', searchValue);
  if (window.history.replaceState) {
    const url = new URL(window.location.href);
    url.search = searchParams.toString();
    window.history.replaceState({}, '', url.toString());
  }

  if (searchValue.length < 3) {
    clearSearch(block);
    return;
  }
  const terms = searchValue.toLowerCase().split(/\s+/).filter((term) => !!term);
  const groups = await fetchAllSources(config.sources);
  await renderResults(block, config, groups, terms);
}

function searchResultsContainer(block) {
  const results = document.createElement('ul');
  results.className = 'search-results';
  results.dataset.h = findNextHeading(block);
  return results;
}

function searchInput(block, config) {
  const input = document.createElement('input');
  input.setAttribute('type', 'search');
  input.className = 'search-input';

  const searchPlaceholder = config.placeholders.searchPlaceholder || 'Search...';
  input.placeholder = searchPlaceholder;
  input.setAttribute('aria-label', searchPlaceholder);

  input.addEventListener('input', (e) => {
    handleSearch(e, block, config);
  });

  input.addEventListener('keyup', (e) => { if (e.code === 'Escape') { clearSearch(block); } });

  return input;
}

function searchIcon() {
  const icon = document.createElement('span');
  icon.classList.add('icon', 'icon-search');
  return icon;
}

function searchBox(block, config) {
  const box = document.createElement('div');
  box.classList.add('search-box');
  box.append(
    searchIcon(),
    searchInput(block, config),
  );

  return box;
}

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders(getLocaleRoot() || 'default');

  // Read all source rows before clearing the block DOM.
  const sources = parseSources(block);
  if (!sources.length) {
    // Fall back to the locale query-index when no sources are authored.
    sources.push({
      url: `${window.hlx.codeBasePath}${getLocaleIndex()}`,
      label: null,
      baseUrl: null,
    });
  }

  block.innerHTML = '';
  block.append(
    searchBox(block, { sources, placeholders }),
    searchResultsContainer(block),
  );

  if (searchParams.get('q')) {
    const input = block.querySelector('input');
    input.value = searchParams.get('q');
    input.dispatchEvent(new Event('input'));
  }

  decorateIcons(block);
}
