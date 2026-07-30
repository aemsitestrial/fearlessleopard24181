import './cards.css';
import decorate from './cards.js';

const IMG_BASE = 'https://picsum.photos/id';

const DEFAULT_CARDS = [
  {
    title: 'Getting Started',
    body: 'Everything you need to know to get up and running quickly.',
    imgSrc: `${IMG_BASE}/10/750/500`,
    imgAlt: 'Mountains with forest',
  },
  {
    title: 'Advanced Features',
    body: 'Explore powerful capabilities built for scale.',
    imgSrc: `${IMG_BASE}/20/750/500`,
    imgAlt: 'Mountain lake reflection',
  },
  {
    title: 'Best Practices',
    body: 'Proven patterns and recommendations from the community.',
    imgSrc: `${IMG_BASE}/30/750/500`,
    imgAlt: 'Rocky coastline',
  },
];

export default {
  title: 'Blocks/Cards',
  parameters: {
    a11y: { config: { rules: [] } },
  },
  args: {
    cards: DEFAULT_CARDS,
  },
  argTypes: {
    cards: {
      name: 'Cards',
      control: 'object',
      description: 'Array of card objects. Each card may have: title, body, imgSrc, imgAlt.',
    },
  },
};

function buildCard({
  title = '',
  body = '',
  imgSrc = '',
  imgAlt = '',
} = {}) {
  const row = document.createElement('div');

  if (imgSrc) {
    const imgCell = document.createElement('div');
    const picture = document.createElement('picture');
    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = imgAlt || title;
    picture.append(img);
    imgCell.append(picture);
    row.append(imgCell);
  }

  const bodyCell = document.createElement('div');
  bodyCell.innerHTML = [
    title ? `<p><strong>${title}</strong></p>` : '',
    body ? `<p>${body}</p>` : '',
  ].filter(Boolean).join('');
  row.append(bodyCell);

  return row;
}

function buildBlock({ cards = [] } = {}) {
  const block = document.createElement('div');
  block.className = 'cards block';
  cards.forEach((card) => block.append(buildCard(card)));
  return block;
}

function render({ cards }) {
  const block = buildBlock({ cards });
  decorate(block);
  return block;
}

export const Default = {
  args: { cards: DEFAULT_CARDS },
  render,
};

export const WithoutImages = {
  args: {
    cards: DEFAULT_CARDS.map(({ title, body }) => ({ title, body })),
  },
  render,
};

export const SingleCard = {
  args: {
    cards: [DEFAULT_CARDS[0]],
  },
  render,
};

export const FullGrid = {
  args: {
    cards: [
      ...DEFAULT_CARDS,
      {
        title: 'Community',
        body: 'Join thousands of developers building with us.',
        imgSrc: `${IMG_BASE}/40/750/500`,
        imgAlt: 'Community gathering',
      },
      {
        title: 'Documentation',
        body: 'Comprehensive guides and API references.',
        imgSrc: `${IMG_BASE}/50/750/500`,
        imgAlt: 'Open book',
      },
      {
        title: 'Support',
        body: 'Get help when you need it from our expert team.',
        imgSrc: `${IMG_BASE}/60/750/500`,
        imgAlt: 'Support team',
      },
    ],
  },
  render,
};
