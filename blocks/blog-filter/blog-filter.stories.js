import './blog-filter.css';
import decorate from './blog-filter.js';

const IMG_BASE = 'https://picsum.photos/id';

// ---------------------------------------------------------------------------
// DOM builder helpers — mirror what AEM delivers to the block before decorate
// ---------------------------------------------------------------------------

/**
 * Build a 7-cell card row matching the blog-filter-item UE model field order:
 * image | imageAlt | title | description | category | date | link
 */
function buildCardRow({
  imgSrc = '',
  imageAlt = '',
  title = '',
  description = '',
  category = '',
  date = '',
  link = '',
} = {}) {
  const row = document.createElement('div');

  // cell[0]: image (reference)
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

  // cell[1]: imageAlt (text)
  const altCell = document.createElement('div');
  altCell.textContent = imageAlt;
  row.append(altCell);

  // cell[2]: title (text)
  const titleCell = document.createElement('div');
  titleCell.textContent = title;
  row.append(titleCell);

  // cell[3]: description (richtext)
  const descCell = document.createElement('div');
  if (description) descCell.innerHTML = `<p>${description}</p>`;
  row.append(descCell);

  // cell[4]: category (text)
  const categoryCell = document.createElement('div');
  categoryCell.textContent = category;
  row.append(categoryCell);

  // cell[5]: date (text)
  const dateCell = document.createElement('div');
  dateCell.textContent = date;
  row.append(dateCell);

  // cell[6]: link (aem-content)
  const linkCell = document.createElement('div');
  if (link) {
    const a = document.createElement('a');
    a.href = link;
    a.textContent = title || 'Read more';
    linkCell.append(a);
  }
  row.append(linkCell);

  return row;
}

/**
 * Build the full block element with an optional config row followed by card rows.
 * @param {object} opts
 * @param {string}  opts.filterLabel - custom chip bar label (omit for default)
 * @param {string}  opts.allLabel    - custom "All" chip label (omit for default)
 * @param {Array}   opts.cards       - array of card descriptor objects
 */
function buildBlock({ filterLabel = '', allLabel = '', cards = [] } = {}) {
  const block = document.createElement('div');
  block.className = 'blog-filter block';

  // Add a config row only when at least one value is provided so the test for
  // default-label behaviour is exercised in stories without a config row.
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

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const SAMPLE_CARDS = [
  {
    imgSrc: `${IMG_BASE}/10/750/562`,
    imageAlt: 'Wind turbines in a green field',
    title: 'Getting Started with Renewable Energy',
    description: 'Everything you need to know to begin your renewable energy journey.',
    category: 'Technology',
    date: 'January 15, 2026',
    link: '/articles/getting-started',
  },
  {
    imgSrc: `${IMG_BASE}/20/750/562`,
    imageAlt: 'Solar panels on a rooftop',
    title: 'Solar Panel Installation Guide',
    description: 'Step-by-step guidance for residential solar installations.',
    category: 'Technology',
    date: 'February 3, 2026',
    link: '/articles/solar-guide',
  },
  {
    imgSrc: `${IMG_BASE}/30/750/562`,
    imageAlt: 'Energy bill on a desk',
    title: 'How to Read Your Energy Bill',
    description: 'Understand every line item on your monthly statement.',
    category: 'Tips',
    date: 'March 10, 2026',
    link: '/articles/energy-bill',
  },
  {
    imgSrc: `${IMG_BASE}/40/750/562`,
    imageAlt: 'Smart thermostat on a wall',
    title: 'Smart Home Energy Savings',
    description: 'Automate your home to cut energy use without sacrificing comfort.',
    category: 'Tips',
    date: 'April 22, 2026',
    link: '/articles/smart-home',
  },
  {
    imgSrc: `${IMG_BASE}/50/750/562`,
    imageAlt: 'Community members at a meeting',
    title: 'Community Solar Programs Explained',
    description: 'How neighbourhood solar initiatives work and who can join.',
    category: 'Community',
    date: 'May 5, 2026',
    link: '/articles/community-solar',
  },
  {
    imgSrc: `${IMG_BASE}/60/750/562`,
    imageAlt: 'Children planting a tree',
    title: 'Teaching Kids About Clean Energy',
    description: 'Fun activities to spark an interest in sustainability at any age.',
    category: 'Community',
    date: 'June 18, 2026',
    link: '/articles/kids-clean-energy',
  },
];

// ---------------------------------------------------------------------------
// Story meta
// ---------------------------------------------------------------------------

export default {
  title: 'Blocks/BlogFilter',
  parameters: {
    a11y: { config: { rules: [] } },
  },
};

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Default — 6 cards across 3 categories; "All" chip is active on load. */
export const Default = {
  render: () => {
    const block = buildBlock({ cards: SAMPLE_CARDS });
    decorate(block);
    return block;
  },
};

/** SingleCategory — all cards share one category; only one category chip appears. */
export const SingleCategory = {
  render: () => {
    const cards = SAMPLE_CARDS.map((c) => ({ ...c, category: 'Technology' }));
    const block = buildBlock({ cards });
    decorate(block);
    return block;
  },
};

/**
 * NoOptionalFields — cards authored with title only (no image, description,
 * date, category, or link). Verifies the block degrades gracefully.
 */
export const NoOptionalFields = {
  render: () => {
    const cards = [
      { title: 'Article Without Extras' },
      { title: 'Another Minimal Card' },
      { title: 'Yet Another Card' },
    ];
    const block = buildBlock({ cards });
    decorate(block);
    return block;
  },
};

/**
 * EmptyBlock — zero card items; the empty-state paragraph must be visible
 * and the card list is empty.
 */
export const EmptyBlock = {
  render: () => {
    const block = buildBlock({ cards: [] });
    decorate(block);
    return block;
  },
};

/**
 * ManyCategories — 12 cards each with a unique category; tests that the chip
 * bar scrolls horizontally without breaking layout.
 */
export const ManyCategories = {
  render: () => {
    const categoryNames = [
      'Solar', 'Wind', 'Hydro', 'Geothermal', 'Nuclear', 'Efficiency',
      'Policy', 'Innovation', 'Storage', 'Grid', 'Community', 'Education',
    ];
    const cards = categoryNames.map((cat, i) => ({
      imgSrc: `${IMG_BASE}/${(i + 1) * 10}/750/562`,
      imageAlt: `${cat} energy illustration`,
      title: `${cat} Energy Overview`,
      description: `An introduction to ${cat.toLowerCase()} energy topics.`,
      category: cat,
      date: `January ${i + 1}, 2026`,
      link: `/articles/${cat.toLowerCase()}`,
    }));
    const block = buildBlock({ filterLabel: 'Browse by topic:', allLabel: 'All topics', cards });
    decorate(block);
    return block;
  },
};
