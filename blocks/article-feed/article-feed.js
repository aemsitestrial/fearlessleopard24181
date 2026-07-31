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

  const tags = getTags(record);
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

  const list = document.createElement('ul');
  list.className = 'article-cards';
  block.append(list);

  const data = await fetchFeed(source);
  const filtered = filterFeed(data, tags)
    .sort((a, b) => toTime(b.date || b.lastModified) - toTime(a.date || a.lastModified));

  let shown = 0;
  const renderPage = () => {
    const next = filtered.slice(shown, shown + pageSize);
    next.forEach((record) => list.append(renderCard(record)));
    shown += next.length;
  };

  if (!filtered.length) {
    const empty = document.createElement('p');
    empty.className = 'article-feed-empty';
    empty.textContent = placeholders.articleFeedEmpty || 'No articles found.';
    block.append(empty);
    return;
  }

  renderPage();

  if (shown < filtered.length) {
    const loadMore = document.createElement('button');
    loadMore.className = 'article-feed-load-more';
    loadMore.type = 'button';
    loadMore.textContent = placeholders.loadMoreArticles || 'Load more articles';
    loadMore.addEventListener('click', () => {
      renderPage();
      if (shown >= filtered.length) loadMore.remove();
    });
    block.append(loadMore);
  }
}
