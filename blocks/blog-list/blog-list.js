import { createOptimizedPicture } from '../../scripts/aem.js';
import { getQueryIndexPath } from '../../scripts/scripts.js';

export default async function decorate(block) {
  // Preserve the optional authored heading (first cell) before clearing.
  const heading = block.querySelector(':scope > div')?.textContent.trim();
  block.textContent = '';

  // Fetch the query-index scoped to this page's state/locale (e.g.
  // /tx/en/query-index.json). This site does not publish a sitemap.json.
  let index;
  try {
    const resp = await fetch(getQueryIndexPath());
    if (!resp.ok) throw new Error(resp.statusText);
    index = await resp.json();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('blog-list: failed to load query-index:', e.message);
    return;
  }

  // The listing lives on the blog landing page; its child pages are the posts.
  // Match by path prefix — the index has no "category" property.
  const base = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  const posts = (index.data || [])
    .filter((post) => post.path !== base && post.path.startsWith(`${base}/`))
    // Newest first when a published date is available.
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  if (heading) {
    const h = document.createElement('h2');
    h.className = 'blog-list-heading';
    h.textContent = heading;
    block.append(h);
  }

  const container = document.createElement('ul');
  posts.forEach((post) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = post.path;

    if (post.image) {
      link.append(createOptimizedPicture(post.image, post.title || '', false, [{ width: '300' }]));
    }

    const title = document.createElement('h5');
    title.textContent = post.title || '';
    link.append(title);

    li.append(link);
    container.append(li);
  });

  block.append(container);
}
