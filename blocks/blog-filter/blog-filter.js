import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const FILTER_LABEL_DEFAULT = 'Filter articles:';
const ALL_LABEL_DEFAULT = 'All';
const EMPTY_TEXT = 'No articles found for this category.';

/** Normalise a category string to a stable filter key. */
function toFilterKey(str) {
  return str ? str.toLowerCase().trim() : '';
}

/**
 * Build the `<nav>` chip bar element.
 * @param {string} filterLabel - visible label above the chips
 * @param {string} allLabel - label for the "show all" chip
 * @param {Array<{key: string, label: string}>} categories - ordered category list
 * @returns {{ nav: HTMLElement, chipList: HTMLElement }}
 */
function buildFilterBar(filterLabel, allLabel, categories) {
  const nav = document.createElement('nav');
  nav.className = 'blog-filter-bar';
  nav.setAttribute('aria-labelledby', 'blog-filter-bar-label');

  const labelSpan = document.createElement('span');
  labelSpan.className = 'blog-filter-bar-label';
  labelSpan.id = 'blog-filter-bar-label';
  labelSpan.textContent = filterLabel;
  nav.append(labelSpan);

  const chipList = document.createElement('ul');
  chipList.className = 'blog-filter-chips';
  chipList.setAttribute('role', 'list');

  const allLi = document.createElement('li');
  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = 'blog-filter-chip is-active';
  allBtn.setAttribute('aria-pressed', 'true');
  allBtn.dataset.filter = '';
  allBtn.textContent = allLabel;
  allLi.append(allBtn);
  chipList.append(allLi);

  categories.forEach(({ key, label }) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'blog-filter-chip';
    btn.setAttribute('aria-pressed', 'false');
    btn.dataset.filter = key;
    btn.textContent = label;
    li.append(btn);
    chipList.append(li);
  });

  nav.append(chipList);
  return { nav, chipList };
}

/**
 * Build a single `<li>` card element from parsed card data.
 * @param {object} cardData
 * @returns {HTMLElement}
 */
function buildCard(cardData) {
  const {
    row,
    imageSrc,
    imageAlt,
    originalImg,
    title,
    descCell,
    category,
    date,
    link,
  } = cardData;

  const li = document.createElement('li');
  li.className = 'blog-filter-card';
  if (category) li.dataset.category = toFilterKey(category);

  // Transfer UE instrumentation from the raw authored row to the <li>,
  // then stamp the item-level model and type.
  moveInstrumentation(row, li);
  li.setAttribute('data-aue-model', 'blog-filter-item');
  li.setAttribute('data-aue-type', 'component');

  const article = document.createElement('article');

  // --- Image ---
  if (imageSrc) {
    const imageDiv = document.createElement('div');
    imageDiv.className = 'blog-filter-card-image';

    const pic = createOptimizedPicture(imageSrc, imageAlt || title, false, [{ width: '750' }]);
    const newImg = pic.querySelector('img');
    if (originalImg) {
      moveInstrumentation(originalImg, newImg);
    }
    newImg.setAttribute('data-aue-prop', 'image');
    newImg.setAttribute('data-aue-type', 'media');

    if (link) {
      const imgLink = document.createElement('a');
      imgLink.href = link;
      imgLink.setAttribute('tabindex', '-1');
      imgLink.setAttribute('aria-hidden', 'true');
      imgLink.append(pic);
      imageDiv.append(imgLink);
    } else {
      imageDiv.append(pic);
    }

    article.append(imageDiv);
  }

  // --- Body ---
  const body = document.createElement('div');
  body.className = 'blog-filter-card-body';

  if (category) {
    const catEl = document.createElement('p');
    catEl.className = 'blog-filter-card-category';
    catEl.setAttribute('data-aue-prop', 'category');
    catEl.setAttribute('data-aue-type', 'text');
    catEl.textContent = category;
    body.append(catEl);
  }

  const h3 = document.createElement('h3');
  h3.className = 'blog-filter-card-title';
  h3.setAttribute('data-aue-prop', 'title');
  h3.setAttribute('data-aue-type', 'text');
  if (link) {
    const titleLink = document.createElement('a');
    titleLink.href = link;
    titleLink.setAttribute('data-aue-prop', 'link');
    titleLink.setAttribute('data-aue-type', 'content');
    titleLink.textContent = title;
    h3.append(titleLink);
  } else {
    h3.textContent = title;
  }
  body.append(h3);

  if (descCell && descCell.textContent.trim()) {
    const descDiv = document.createElement('div');
    descDiv.className = 'blog-filter-card-description';
    descDiv.setAttribute('data-aue-prop', 'description');
    descDiv.setAttribute('data-aue-type', 'richtext');
    while (descCell.firstChild) {
      descDiv.append(descCell.firstChild);
    }
    body.append(descDiv);
  }

  if (date) {
    const dateEl = document.createElement('p');
    dateEl.className = 'blog-filter-card-date';
    dateEl.setAttribute('data-aue-prop', 'date');
    dateEl.setAttribute('data-aue-type', 'text');
    dateEl.textContent = date;
    body.append(dateEl);
  }

  article.append(body);
  li.append(article);
  return li;
}

/**
 * Decorate the Blog Filter block.
 * Authored table layout (UE model):
 *   Row 0 (optional, 1-2 cells, no media): filterLabel | allLabel
 *   Row 1+: image | imageAlt | title | description | category | date | link
 *
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // --- Detect optional config row ---
  // A config row has at most 2 cells and contains no media or links.
  let filterLabel = FILTER_LABEL_DEFAULT;
  let allLabel = ALL_LABEL_DEFAULT;
  let cardRows = rows;

  const firstRow = rows[0];
  if (
    firstRow
    && firstRow.children.length <= 2
    && !firstRow.querySelector('picture, img, a')
  ) {
    const cfgCells = [...firstRow.children];
    filterLabel = cfgCells[0]?.textContent.trim() || FILTER_LABEL_DEFAULT;
    allLabel = cfgCells[1]?.textContent.trim() || ALL_LABEL_DEFAULT;
    cardRows = rows.slice(1);
  }

  // --- Parse card rows ---
  const cardDataList = [];
  const categoryMap = new Map(); // key → display label (first-seen wins for display)

  cardRows.forEach((row) => {
    const cells = [...row.children];
    // UE model field order: image|imageAlt|title|description|category|date|link
    const imageCell = cells[0];
    const imageAltCell = cells[1];
    const titleCell = cells[2];
    const descCell = cells[3];
    const categoryCell = cells[4];
    const dateCell = cells[5];
    const linkCell = cells[6];

    const originalImg = imageCell?.querySelector('img') || null;
    const imageSrc = originalImg?.src || '';
    const imageAlt = imageAltCell?.textContent.trim() || '';
    const title = titleCell?.textContent.trim() || '';
    const category = categoryCell?.textContent.trim() || '';
    const date = dateCell?.textContent.trim() || '';
    const link = linkCell?.querySelector('a')?.href || '';

    if (category) {
      const key = toFilterKey(category);
      if (!categoryMap.has(key)) categoryMap.set(key, category);
    }

    cardDataList.push({
      row,
      imageSrc,
      imageAlt,
      originalImg,
      title,
      descCell,
      category,
      date,
      link,
    });
  });

  const categories = [...categoryMap.entries()].map(([key, label]) => ({ key, label }));

  // --- Build UI ---
  const { nav: filterBar, chipList } = buildFilterBar(filterLabel, allLabel, categories);

  const countEl = document.createElement('p');
  countEl.className = 'blog-filter-count';
  countEl.setAttribute('role', 'status');
  countEl.setAttribute('aria-live', 'polite');
  countEl.setAttribute('aria-atomic', 'true');

  const cardList = document.createElement('ul');
  cardList.className = 'blog-filter-cards';
  cardList.setAttribute('aria-label', 'Article cards');

  cardDataList.forEach((cardData) => {
    cardList.append(buildCard(cardData));
  });

  const emptyEl = document.createElement('p');
  emptyEl.className = 'blog-filter-empty';
  emptyEl.textContent = EMPTY_TEXT;
  emptyEl.hidden = true;

  // --- Assemble ---
  block.textContent = '';
  block.append(filterBar, countEl, cardList, emptyEl);

  // --- Initial state ---
  const initialCount = cardDataList.length;
  const plural = initialCount !== 1 ? 's' : '';
  countEl.textContent = `Showing ${initialCount} article${plural}`;
  if (initialCount === 0) emptyEl.hidden = false;

  // --- Filter interaction ---
  let activeFilter = '';

  chipList.addEventListener('click', (e) => {
    const btn = e.target.closest('.blog-filter-chip');
    if (!btn) return;
    const newFilter = btn.dataset.filter;
    if (newFilter === activeFilter) return;

    activeFilter = newFilter;

    // Update chip states
    chipList.querySelectorAll('.blog-filter-chip').forEach((chip) => {
      const active = chip === btn;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    // Show/hide cards
    let visibleCount = 0;
    cardList.querySelectorAll('.blog-filter-card').forEach((card) => {
      const matches = !activeFilter || card.dataset.category === activeFilter;
      if (matches) {
        card.removeAttribute('hidden');
        visibleCount += 1;
      } else {
        card.hidden = true;
      }
    });

    // Update live region
    const p = visibleCount !== 1 ? 's' : '';
    countEl.textContent = `Showing ${visibleCount} article${p}`;
    emptyEl.hidden = visibleCount > 0;
  });
}
