import { readBlockConfig } from '../../scripts/aem.js';

const DEFAULT_LIMIT = 12;

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
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

async function fetchArticles(queryPath) {
  try {
    const resp = await fetch(queryPath, { headers: { 'Content-Type': 'application/json' } });
    if (!resp.ok) return [];
    const json = await resp.json();
    return json?.data?.articleList?.items ?? [];
  } catch {
    return [];
  }
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const queryPath = config.query || config['query-url'] || '';
  const limit = parseInt(config.limit, 10) || DEFAULT_LIMIT;

  block.textContent = '';

  if (!queryPath) {
    const warn = document.createElement('p');
    warn.className = 'article-list-empty';
    warn.textContent = 'No query configured for this article list.';
    block.append(warn);
    return;
  }

  const items = await fetchArticles(queryPath);
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
