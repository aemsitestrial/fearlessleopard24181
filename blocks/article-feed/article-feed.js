import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';
import { getLangRoot } from '../../scripts/scripts.js';

const DEFAULT_PAGE_SIZE = 12;

const LOCALE_INDEX = { fr: '/fr/query-index.json' };

/**
 * Resolve the locale-scoped query-index feed for the current page.
 * English content is served at the site root and indexed at /en/query-index.json.
 * @returns {string} pathname of the query-index feed for the active locale
 */
function getLocaleIndex() {
  const locale = window.location.pathname.split('/').filter(Boolean)[0];
  return LOCALE_INDEX[locale] || '/en/query-index.json';
}

/**
 * Fetch all rows from the query-index feed, following pagination.
 * @param {string} source URL of the query-index.json feed
 * @returns {Promise<Array>} all index records
 */
async function fetchFeed(source) {
  const results = [];
  const limit = 500;
  let offset = 0;
  let total = Infinity;
  try {
    while (offset < total) {
      // eslint-disable-next-line no-await-in-loop
      const resp = await fetch(`${source}?limit=${limit}&offset=${offset}`);
      if (!resp.ok) break;
      // eslint-disable-next-line no-await-in-loop
      const json = await resp.json();
      results.push(...(json.data || []));
      total = json.total ?? results.length;
      if (!json.data || !json.data.length) break;
      offset += limit;
    }
  } catch (e) {
    // network failure — return whatever we have
  }
  return results;
}

/**
 * Normalize a record's tags into a lowercase array.
 */
function getTags(record) {
  const { tags } = record;
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => String(t).toLowerCase().trim());
  try {
    const parsed = JSON.parse(tags);
    if (Array.isArray(parsed)) return parsed.map((t) => String(t).toLowerCase().trim());
  } catch (e) {
    // not JSON — fall through to comma split
  }
  return String(tags).split(',').map((t) => t.toLowerCase().trim()).filter(Boolean);
}

/**
 * Return the original-cased tags of a record (for display labels).
 */
function getTagsRaw(record) {
  const { tags } = record;
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim());
  try {
    const parsed = JSON.parse(tags);
    if (Array.isArray(parsed)) return parsed.map((t) => String(t).trim());
  } catch (e) {
    // not JSON — fall through to comma split
  }
  return String(tags).split(',').map((t) => t.trim()).filter(Boolean);
}

/**
 * Filter records to those matching any of the configured tags, excluding
 * non-article paths and records flagged noindex.
 */
function filterFeed(data, tags) {
  const wanted = tags.map((t) => t.toLowerCase().trim()).filter(Boolean);
  return data.filter((record) => {
    if (!record.path || !record.title) return false;
    if ((record.robots || '').toLowerCase().includes('noindex')) return false;
    if (!wanted.length) return true;
    const recordTags = getTags(record);
    return wanted.some((t) => recordTags.includes(t));
  });
}

/**
 * Sort records by date, newest first. Handles both spreadsheet-epoch day
 * values and unix-second timestamps.
 */
function toTime(value) {
  const num = Number(value);
  if (Number.isNaN(num) || !num) return 0;
  return num < 100000 ? (num - 25569) * 86400000 : num * 1000;
}

function formatDate(value) {
  const ms = toTime(value);
  if (!ms) return '';
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}-${dd}-${d.getFullYear()}`;
}

/**
 * Build a single article card from a feed record.
 */
function renderCard(record) {
  const a = document.createElement('a');
  a.className = 'article-card';
  a.href = record.path;

  if (record.image) {
    const imageWrap = document.createElement('div');
    imageWrap.className = 'article-card-image';
    imageWrap.append(createOptimizedPicture(record.image, record.imageAlt || record.title || '', false, [{ width: '750' }]));
    a.append(imageWrap);
  }

  const body = document.createElement('div');
  body.className = 'article-card-body';

  const tags = getTagsRaw(record);
  if (tags.length) {
    const [firstTag] = tags;
    const cat = document.createElement('p');
    cat.className = 'article-card-category';
    cat.textContent = firstTag;
    body.append(cat);
  }

  const h3 = document.createElement('h3');
  h3.textContent = record.title;
  body.append(h3);

  if (record.description) {
    const desc = document.createElement('p');
    desc.className = 'article-card-description';
    desc.textContent = record.description;
    body.append(desc);
  }

  const date = formatDate(record.date || record.publicationDate || record.lastModified);
  if (date) {
    const dateEl = document.createElement('p');
    dateEl.className = 'article-card-date';
    dateEl.textContent = date;
    body.append(dateEl);
  }

  a.append(body);
  const li = document.createElement('li');
  li.append(a);
  return li;
}

/**
 * Build the set of filter categories for the tab bar.
 * Uses the author-configured tags when provided, otherwise derives the list
 * from the tags present across the filtered article set (sorted, capped).
 * @returns {Array<{label:string, value:string}>} category descriptors
 */
function buildCategories(records, configuredTags) {
  const map = new Map();
  if (configuredTags.length) {
    configuredTags.forEach((t) => {
      const value = t.toLowerCase().trim();
      if (value && !map.has(value)) map.set(value, t.trim());
    });
  } else {
    records.forEach((record) => {
      getTagsRaw(record).forEach((raw) => {
        const value = raw.toLowerCase().trim();
        if (value && !map.has(value)) map.set(value, raw);
      });
    });
  }
  return [...map.entries()].map(([value, label]) => ({ value, label }));
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const placeholders = await fetchPlaceholders(getLangRoot() || 'default');

  const source = config.feed || config.source
    ? new URL(config.feed || config.source, window.location).pathname
    : `${window.hlx.codeBasePath}${getLocaleIndex()}`;

  const tags = (() => {
    const raw = config.tags || config.tag || '';
    if (Array.isArray(raw)) return raw;
    return String(raw).split(',').map((t) => t.trim()).filter(Boolean);
  })();

  const pageSize = parseInt(config.limit || config.pageSize, 10) || DEFAULT_PAGE_SIZE;

  block.textContent = '';

  const data = await fetchFeed(source);
  // Base set: everything matching the block's tag scope (empty = all articles).
  const baseSet = filterFeed(data, tags)
    .sort((a, b) => toTime(b.date || b.lastModified) - toTime(a.date || a.lastModified));

  const categories = buildCategories(baseSet, tags);

  const list = document.createElement('ul');
  list.className = 'article-cards';

  // Filter tab bar — only rendered when there is more than one category to
  // switch between (mirrors the source "Filter articles:" pill bar).
  let filterBar;
  let activeFilter = '';
  if (categories.length > 1) {
    filterBar = document.createElement('div');
    filterBar.className = 'article-feed-filter';

    const label = document.createElement('span');
    label.className = 'article-feed-filter-label';
    label.textContent = placeholders.filterArticles || 'Filter articles:';
    filterBar.append(label);

    const tablist = document.createElement('div');
    tablist.className = 'article-feed-filter-list';
    tablist.setAttribute('role', 'group');
    tablist.setAttribute('aria-label', placeholders.filterOptions || 'Filter options');

    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'article-feed-filter-button is-selected';
    allBtn.dataset.filter = '';
    allBtn.setAttribute('aria-pressed', 'true');
    allBtn.textContent = placeholders.allArticles || 'All';
    tablist.append(allBtn);

    categories.forEach(({ value, label: catLabel }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'article-feed-filter-button';
      btn.dataset.filter = value;
      btn.setAttribute('aria-pressed', 'false');
      btn.textContent = catLabel;
      tablist.append(btn);
    });

    filterBar.append(tablist);
    block.append(filterBar);
  }

  block.append(list);

  if (!baseSet.length) {
    const empty = document.createElement('p');
    empty.className = 'article-feed-empty';
    empty.textContent = placeholders.articleFeedEmpty || 'No articles found.';
    block.append(empty);
    return;
  }

  let loadMore;
  let shown = 0;
  let current = baseSet;

  const renderPage = () => {
    const next = current.slice(shown, shown + pageSize);
    next.forEach((record) => list.append(renderCard(record)));
    shown += next.length;
    if (loadMore) {
      loadMore.hidden = shown >= current.length;
    }
  };

  const applyFilter = (value) => {
    activeFilter = value;
    current = value
      ? baseSet.filter((record) => getTags(record).includes(value))
      : baseSet;
    shown = 0;
    list.textContent = '';
    renderPage();
  };

  renderPage();

  loadMore = document.createElement('button');
  loadMore.className = 'article-feed-load-more';
  loadMore.type = 'button';
  loadMore.textContent = placeholders.loadMoreArticles || 'Load more';
  loadMore.hidden = shown >= current.length;
  loadMore.addEventListener('click', () => renderPage());
  block.append(loadMore);

  if (filterBar) {
    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.article-feed-filter-button');
      if (!btn || btn.dataset.filter === activeFilter) return;
      filterBar.querySelectorAll('.article-feed-filter-button').forEach((b) => {
        const selected = b === btn;
        b.classList.toggle('is-selected', selected);
        b.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
      applyFilter(btn.dataset.filter);
    });
  }
}
