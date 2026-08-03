import { readBlockConfig } from '../../scripts/aem.js';

const DEFAULT_LIMIT = 12;

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function renderCard({ title, publishDate, body }) {
  const article = document.createElement('article');
  article.className = 'article-list-card';

  const heading = document.createElement('h3');
  heading.className = 'article-list-title';
  heading.textContent = title ?? '';
  article.append(heading);

  const date = formatDate(publishDate);
  if (date) {
    const dateEl = document.createElement('p');
    dateEl.className = 'article-list-date';
    dateEl.textContent = date;
    article.append(dateEl);
  }

  const excerpt = body?.plaintext ?? '';
  if (excerpt) {
    const p = document.createElement('p');
    p.className = 'article-list-excerpt';
    p.textContent = excerpt;
    article.append(p);
  }

  return article;
}

/**
 * Resolve the persisted-query path to a fetchable URL. Persisted GraphQL
 * queries are served by the AEM instance, not the EDS delivery origin, so a
 * relative path must be prefixed with the AEM host when one is configured.
 * @param {string} queryPath persisted query path or absolute URL
 * @param {string} host optional AEM host, e.g. https://publish-xxx.adobeaemcloud.com
 * @returns {string} absolute or origin-relative URL to fetch
 */
function resolveQueryUrl(queryPath, host) {
  if (/^https?:\/\//i.test(queryPath)) return queryPath;
  if (host) return new URL(queryPath, host).href;
  return queryPath;
}

// Read the href or text from the first cell of a block row.
// Used as a positional fallback when the block uses a single-column layout
// (no key names in column 0) which readBlockConfig skips entirely.
function cellValue(row) {
  const cell = row?.children?.[0];
  if (!cell) return '';
  return cell.textContent.trim();
}

async function fetchArticles(queryUrl) {
  try {
    // GET request — no body, so Content-Type is omitted to avoid a CORS preflight.
    // credentials:'include' sends the AEM session cookie cross-origin (requires
    // Access-Control-Allow-Credentials:true on the AEM CORS policy).
    const resp = await fetch(queryUrl, { credentials: 'include' });
    if (!resp.ok) return [];
    const json = await resp.json();
    // AEM headless persisted queries wrap results under data.<model>.items.
    const data = json?.data ?? {};
    const list = data.articleList?.items
      ?? Object.values(data).find((v) => Array.isArray(v?.items))?.items
      ?? [];
    return list;
  } catch {
    return [];
  }
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const rows = [...block.children];

  // readBlockConfig requires two-column rows (key | value). For single-column
  // blocks — where each row contains only the value with no key — fall back to
  // reading values positionally: row 0 = query, row 1 = host, row 2 = limit.
  const singleCol = rows.length > 0 && rows[0].children.length === 1;
  const queryPath = config.query || config['query-url'] || (singleCol ? cellValue(rows[0]) : '');
  const host = config.host || config.endpoint || (singleCol ? cellValue(rows[1]) : '');
  const positionalLimit = singleCol ? parseInt(cellValue(rows[2]), 10) : 0;
  const limit = parseInt(config.limit, 10) || positionalLimit || DEFAULT_LIMIT;

  block.textContent = '';

  if (!queryPath) {
    const warn = document.createElement('p');
    warn.className = 'article-list-empty';
    warn.textContent = 'No query configured for this article list.';
    block.append(warn);
    return;
  }

  const items = await fetchArticles(resolveQueryUrl(queryPath, host));
  const visible = items.slice(0, limit);

  if (!visible.length) {
    const empty = document.createElement('p');
    empty.className = 'article-list-empty';
    empty.textContent = 'No articles found.';
    block.append(empty);
    return;
  }

  const list = document.createElement('div');
  list.className = 'article-list-grid';
  visible.forEach((item) => list.append(renderCard(item)));
  block.append(list);
}
