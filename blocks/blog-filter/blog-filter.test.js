import { describe, it, expect } from 'vitest';
import decorate from './blog-filter.js';

// ---------------------------------------------------------------------------
// DOM builder helpers
// ---------------------------------------------------------------------------

/**
 * Build a 7-cell card row matching the blog-filter-item UE model field order:
 * image | imageAlt | title | description | category | date | link
 */
function buildCardRow({
  imgSrc = '',
  imageAlt = '',
  title = 'Test Article',
  description = '',
  category = '',
  date = '',
  link = '',
} = {}) {
  const row = document.createElement('div');

  // cell[0]: image
  const imageCell = document.createElement('div');
  if (imgSrc) {
    const picture = document.createElement('picture');
    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = imageAlt || title;
    picture.append(img);
    imageCell.append(picture);
  }
  row.append(imageCell);

  // cell[1]: imageAlt
  const altCell = document.createElement('div');
  altCell.textContent = imageAlt;
  row.append(altCell);

  // cell[2]: title
  const titleCell = document.createElement('div');
  titleCell.textContent = title;
  row.append(titleCell);

  // cell[3]: description (richtext)
  const descCell = document.createElement('div');
  if (description) descCell.innerHTML = `<p>${description}</p>`;
  row.append(descCell);

  // cell[4]: category
  const categoryCell = document.createElement('div');
  categoryCell.textContent = category;
  row.append(categoryCell);

  // cell[5]: date
  const dateCell = document.createElement('div');
  dateCell.textContent = date;
  row.append(dateCell);

  // cell[6]: link
  const linkCell = document.createElement('div');
  if (link) {
    const a = document.createElement('a');
    a.href = link;
    a.textContent = 'Read more';
    linkCell.append(a);
  }
  row.append(linkCell);

  return row;
}

/**
 * Build the top-level block element.
 * @param {object} opts
 * @param {string} opts.filterLabel
 * @param {string} opts.allLabel
 * @param {Array}  opts.cards
 */
function buildBlock({ filterLabel = '', allLabel = '', cards = [] } = {}) {
  const block = document.createElement('div');
  block.className = 'blog-filter block';

  if (filterLabel || allLabel) {
    const configRow = document.createElement('div');
    const filterCell = document.createElement('div');
    filterCell.textContent = filterLabel;
    const allCell = document.createElement('div');
    allCell.textContent = allLabel;
    configRow.append(filterCell, allCell);
    block.append(configRow);
  }

  cards.forEach((card) => block.append(buildCardRow(card)));
  return block;
}

/** Fire a bubbling click on an element (simulates user interaction). */
function click(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('blog-filter block', () => {
  describe('chip generation', () => {
    it('renders an "All" chip plus one chip per unique category', () => {
      const block = buildBlock({
        cards: [
          { title: 'A', category: 'Technology' },
          { title: 'B', category: 'Tips' },
          { title: 'C', category: 'Community' },
        ],
      });
      decorate(block);
      const chips = block.querySelectorAll('.blog-filter-chip');
      // All + 3 categories = 4
      expect(chips.length).toBe(4);
    });

    it('deduplicates categories so two cards with the same category produce one chip', () => {
      const block = buildBlock({
        cards: [
          { title: 'A', category: 'Technology' },
          { title: 'B', category: 'Technology' },
          { title: 'C', category: 'Tips' },
        ],
      });
      decorate(block);
      const chips = block.querySelectorAll('.blog-filter-chip');
      // All + Technology + Tips = 3
      expect(chips.length).toBe(3);
    });

    it('uses the data-filter attribute for the lowercase category key', () => {
      const block = buildBlock({ cards: [{ title: 'A', category: 'Technology' }] });
      decorate(block);
      const techChip = block.querySelector('.blog-filter-chip[data-filter="technology"]');
      expect(techChip).not.toBeNull();
    });

    it('renders the "All" chip even with only one category', () => {
      const block = buildBlock({ cards: [{ title: 'A', category: 'Tech' }] });
      decorate(block);
      const allChip = block.querySelector('.blog-filter-chip[data-filter=""]');
      expect(allChip).not.toBeNull();
    });
  });

  describe('DOM structure', () => {
    it('wraps each card in <li><article>', () => {
      const block = buildBlock({ cards: [{ title: 'A' }, { title: 'B' }] });
      decorate(block);
      const lis = block.querySelectorAll('.blog-filter-card');
      expect(lis.length).toBe(2);
      lis.forEach((li) => {
        expect(li.tagName).toBe('LI');
        expect(li.querySelector('article')).not.toBeNull();
      });
    });

    it('renders card titles as <h3> elements', () => {
      const block = buildBlock({ cards: [{ title: 'My Title' }] });
      decorate(block);
      const h3 = block.querySelector('.blog-filter-card-title');
      expect(h3.tagName).toBe('H3');
      expect(h3.textContent).toContain('My Title');
    });

    it('renders the filter bar as a <nav> element', () => {
      const block = buildBlock({ cards: [{ title: 'A' }] });
      decorate(block);
      expect(block.querySelector('nav.blog-filter-bar')).not.toBeNull();
    });

    it('renders the chip list as a <ul>', () => {
      const block = buildBlock({ cards: [{ title: 'A' }] });
      decorate(block);
      expect(block.querySelector('ul.blog-filter-chips')).not.toBeNull();
    });

    it('renders a count live region with role="status"', () => {
      const block = buildBlock({ cards: [{ title: 'A' }] });
      decorate(block);
      const count = block.querySelector('.blog-filter-count');
      expect(count).not.toBeNull();
      expect(count.getAttribute('role')).toBe('status');
      expect(count.getAttribute('aria-live')).toBe('polite');
    });

    it('sets data-aue-model and data-aue-type on each card <li>', () => {
      const block = buildBlock({ cards: [{ title: 'A' }] });
      decorate(block);
      const li = block.querySelector('.blog-filter-card');
      expect(li.getAttribute('data-aue-model')).toBe('blog-filter-item');
      expect(li.getAttribute('data-aue-type')).toBe('component');
    });
  });

  describe('filter behaviour', () => {
    it('hides non-matching cards and reveals matching cards after clicking a chip', () => {
      const block = buildBlock({
        cards: [
          { title: 'Tech 1', category: 'Technology' },
          { title: 'Tips 1', category: 'Tips' },
          { title: 'Tech 2', category: 'Technology' },
        ],
      });
      decorate(block);

      const techChip = block.querySelector('.blog-filter-chip[data-filter="technology"]');
      click(techChip);

      const allCards = block.querySelectorAll('.blog-filter-card');
      allCards.forEach((card) => {
        if (card.dataset.category === 'technology') {
          expect(card.hasAttribute('hidden')).toBe(false);
        } else {
          expect(card.hasAttribute('hidden')).toBe(true);
        }
      });
    });

    it('removes hidden from all cards when "All" chip is clicked after a filter', () => {
      const block = buildBlock({
        cards: [
          { title: 'Tech', category: 'Technology' },
          { title: 'Tips', category: 'Tips' },
        ],
      });
      decorate(block);

      const techChip = block.querySelector('.blog-filter-chip[data-filter="technology"]');
      click(techChip);

      const allChip = block.querySelector('.blog-filter-chip[data-filter=""]');
      click(allChip);

      const hidden = block.querySelectorAll('.blog-filter-card[hidden]');
      expect(hidden.length).toBe(0);
    });

    it('does nothing when clicking the already-active chip', () => {
      const block = buildBlock({
        cards: [
          { title: 'Tech', category: 'Technology' },
          { title: 'Tips', category: 'Tips' },
        ],
      });
      decorate(block);

      const allChip = block.querySelector('.blog-filter-chip[data-filter=""]');
      // Clicking All when All is already active should not hide any cards
      click(allChip);
      const hidden = block.querySelectorAll('.blog-filter-card[hidden]');
      expect(hidden.length).toBe(0);
    });
  });

  describe('aria-pressed toggling', () => {
    it('sets aria-pressed="true" on the active chip and "false" on all others', () => {
      const block = buildBlock({
        cards: [
          { title: 'A', category: 'Technology' },
          { title: 'B', category: 'Tips' },
        ],
      });
      decorate(block);

      const techChip = block.querySelector('.blog-filter-chip[data-filter="technology"]');
      click(techChip);

      block.querySelectorAll('.blog-filter-chip').forEach((chip) => {
        if (chip === techChip) {
          expect(chip.getAttribute('aria-pressed')).toBe('true');
        } else {
          expect(chip.getAttribute('aria-pressed')).toBe('false');
        }
      });
    });

    it('starts with aria-pressed="true" on the "All" chip', () => {
      const block = buildBlock({ cards: [{ title: 'A', category: 'Tech' }] });
      decorate(block);
      const allChip = block.querySelector('.blog-filter-chip[data-filter=""]');
      expect(allChip.getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('result count', () => {
    it('shows correct count on initial render', () => {
      const block = buildBlock({
        cards: [{ title: 'A' }, { title: 'B' }, { title: 'C' }],
      });
      decorate(block);
      const count = block.querySelector('.blog-filter-count');
      expect(count.textContent).toBe('Showing 3 articles');
    });

    it('updates count after applying a category filter', () => {
      const block = buildBlock({
        cards: [
          { title: 'A', category: 'Technology' },
          { title: 'B', category: 'Technology' },
          { title: 'C', category: 'Tips' },
        ],
      });
      decorate(block);
      const techChip = block.querySelector('.blog-filter-chip[data-filter="technology"]');
      click(techChip);
      const count = block.querySelector('.blog-filter-count');
      expect(count.textContent).toBe('Showing 2 articles');
    });

    it('uses singular "article" when count is exactly 1', () => {
      const block = buildBlock({
        cards: [
          { title: 'A', category: 'Technology' },
          { title: 'B', category: 'Tips' },
        ],
      });
      decorate(block);
      const techChip = block.querySelector('.blog-filter-chip[data-filter="technology"]');
      click(techChip);
      const count = block.querySelector('.blog-filter-count');
      expect(count.textContent).toBe('Showing 1 article');
    });

    it('restores count to total after clicking "All"', () => {
      const block = buildBlock({
        cards: [
          { title: 'A', category: 'Technology' },
          { title: 'B', category: 'Tips' },
        ],
      });
      decorate(block);
      const techChip = block.querySelector('.blog-filter-chip[data-filter="technology"]');
      click(techChip);
      const allChip = block.querySelector('.blog-filter-chip[data-filter=""]');
      click(allChip);
      const count = block.querySelector('.blog-filter-count');
      expect(count.textContent).toBe('Showing 2 articles');
    });
  });

  describe('empty state', () => {
    it('hides the empty-state paragraph on initial render when cards exist', () => {
      const block = buildBlock({ cards: [{ title: 'A', category: 'Tech' }] });
      decorate(block);
      const empty = block.querySelector('.blog-filter-empty');
      expect(empty.hidden).toBe(true);
    });

    it('shows the empty-state paragraph when a filter matches 0 cards', () => {
      // Create a block where a category chip will match nothing — by manually
      // building a chip that has no corresponding card.
      const block = buildBlock({
        cards: [{ title: 'A', category: 'Technology' }],
      });
      decorate(block);

      // Directly manipulate the active filter to simulate an edge case:
      // add a second chip manually and fire the listener.
      const chipList = block.querySelector('.blog-filter-chips');
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'blog-filter-chip';
      btn.setAttribute('aria-pressed', 'false');
      btn.dataset.filter = 'emptycategory';
      btn.textContent = 'Empty';
      li.append(btn);
      chipList.append(li);
      click(btn);

      const empty = block.querySelector('.blog-filter-empty');
      expect(empty.hidden).toBe(false);
    });

    it('shows the empty-state paragraph on initial render when no cards are present', () => {
      const block = buildBlock({ cards: [] });
      decorate(block);
      const empty = block.querySelector('.blog-filter-empty');
      expect(empty.hidden).toBe(false);
    });

    it('hides the empty-state paragraph after clicking "All" following an empty filter', () => {
      const block = buildBlock({
        cards: [{ title: 'A', category: 'Technology' }],
      });
      decorate(block);

      const chipList = block.querySelector('.blog-filter-chips');
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'blog-filter-chip';
      btn.setAttribute('aria-pressed', 'false');
      btn.dataset.filter = 'emptycategory';
      btn.textContent = 'Empty';
      li.append(btn);
      chipList.append(li);
      click(btn);

      const allChip = block.querySelector('.blog-filter-chip[data-filter=""]');
      click(allChip);

      const empty = block.querySelector('.blog-filter-empty');
      expect(empty.hidden).toBe(true);
    });
  });

  describe('missing optional fields', () => {
    it('renders a card with title only without throwing', () => {
      const block = buildBlock({ cards: [{ title: 'Title Only' }] });
      expect(() => decorate(block)).not.toThrow();
      expect(block.querySelector('.blog-filter-card-title').textContent).toContain('Title Only');
    });

    it('does not create an image div when image is absent', () => {
      const block = buildBlock({ cards: [{ title: 'No Image' }] });
      decorate(block);
      expect(block.querySelector('.blog-filter-card-image')).toBeNull();
    });

    it('does not wrap title in an anchor when link is absent', () => {
      const block = buildBlock({ cards: [{ title: 'No Link', imgSrc: '/img.jpg' }] });
      decorate(block);
      const h3 = block.querySelector('.blog-filter-card-title');
      expect(h3.querySelector('a')).toBeNull();
    });

    it('does not place an <a> inside the image div when link is absent', () => {
      const block = buildBlock({ cards: [{ title: 'No Link', imgSrc: '/img.jpg' }] });
      decorate(block);
      const imageDiv = block.querySelector('.blog-filter-card-image');
      expect(imageDiv).not.toBeNull();
      expect(imageDiv.querySelector('a')).toBeNull();
    });

    it('renders the card under "All" when category is missing', () => {
      const block = buildBlock({
        cards: [
          { title: 'No Category' },
          { title: 'Has Category', category: 'Tech' },
        ],
      });
      decorate(block);
      // Initially all cards are visible (no hidden attribute)
      const cards = block.querySelectorAll('.blog-filter-card');
      cards.forEach((card) => expect(card.hasAttribute('hidden')).toBe(false));
    });

    it('does not throw when description field is absent', () => {
      const block = buildBlock({ cards: [{ title: 'A', description: '' }] });
      expect(() => decorate(block)).not.toThrow();
      expect(block.querySelector('.blog-filter-card-description')).toBeNull();
    });

    it('renders the description element when description is provided', () => {
      const block = buildBlock({ cards: [{ title: 'A', description: 'An excerpt.' }] });
      decorate(block);
      const desc = block.querySelector('.blog-filter-card-description');
      expect(desc).not.toBeNull();
      expect(desc.textContent).toContain('An excerpt.');
    });
  });

  describe('empty block', () => {
    it('does not throw when block has no card rows', () => {
      const block = buildBlock({ cards: [] });
      expect(() => decorate(block)).not.toThrow();
    });

    it('renders a filter bar even with zero cards', () => {
      const block = buildBlock({ cards: [] });
      decorate(block);
      expect(block.querySelector('.blog-filter-bar')).not.toBeNull();
    });

    it('renders an empty card list with zero <li> elements', () => {
      const block = buildBlock({ cards: [] });
      decorate(block);
      expect(block.querySelectorAll('.blog-filter-card').length).toBe(0);
    });
  });

  describe('custom config row', () => {
    it('uses the authored filter label when provided', () => {
      const block = buildBlock({
        filterLabel: 'Browse by topic:',
        allLabel: 'All topics',
        cards: [{ title: 'A' }],
      });
      decorate(block);
      const label = block.querySelector('.blog-filter-bar-label');
      expect(label.textContent).toBe('Browse by topic:');
    });

    it('uses the authored all-chip label when provided', () => {
      const block = buildBlock({
        filterLabel: 'Filter:',
        allLabel: 'Show all',
        cards: [{ title: 'A' }],
      });
      decorate(block);
      const allChip = block.querySelector('.blog-filter-chip[data-filter=""]');
      expect(allChip.textContent).toBe('Show all');
    });

    it('falls back to default labels when config row is absent', () => {
      const block = buildBlock({ cards: [{ title: 'A' }] });
      decorate(block);
      const label = block.querySelector('.blog-filter-bar-label');
      const allChip = block.querySelector('.blog-filter-chip[data-filter=""]');
      expect(label.textContent).toBe('Filter articles:');
      expect(allChip.textContent).toBe('All');
    });
  });
});
