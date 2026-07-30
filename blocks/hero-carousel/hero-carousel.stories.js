import './hero-carousel.css';
import decorate from './hero-carousel.js';

const IMG_BASE = 'https://picsum.photos/id';

const DEFAULT_SLIDES = [
  {
    imgSrc: `${IMG_BASE}/1036/1600/560`,
    imgAlt: 'Mountain landscape at dusk',
    title: 'Power Your Future',
    body: 'Explore plans and solutions designed to keep your home and business running efficiently.',
    ctaLabel: 'Get started',
    ctaHref: '#',
  },
  {
    imgSrc: `${IMG_BASE}/1043/1600/560`,
    imgAlt: 'Solar panels in a field',
    title: 'Renewable Energy',
    body: 'Switch to clean energy and make a difference for generations to come.',
    ctaLabel: 'Learn more',
    ctaHref: '#',
  },
  {
    imgSrc: `${IMG_BASE}/1015/1600/560`,
    imgAlt: 'Smart home devices on a table',
    title: 'Smart Home Solutions',
    body: 'Save energy and money with intelligent devices and real-time usage insights.',
    ctaLabel: 'Shop now',
    ctaHref: '#',
  },
];

export default {
  title: 'Blocks/Hero Carousel',
  parameters: {
    a11y: { config: { rules: [] } },
    layout: 'fullscreen',
  },
  args: { slides: DEFAULT_SLIDES },
  argTypes: {
    slides: {
      name: 'Slides',
      control: 'object',
      description: 'Array of slide objects. Each may have: imgSrc, imgAlt, title, body, ctaLabel, ctaHref.',
    },
  },
};

function buildSlideRow({
  imgSrc = '',
  imgAlt = '',
  title = '',
  body = '',
  ctaLabel = '',
  ctaHref = '#',
} = {}) {
  const row = document.createElement('div');

  const imageCell = document.createElement('div');
  if (imgSrc) {
    const picture = document.createElement('picture');
    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = imgAlt;
    picture.append(img);
    imageCell.append(picture);
  }

  const contentCell = document.createElement('div');
  contentCell.innerHTML = [
    title ? `<h2>${title}</h2>` : '',
    body ? `<p>${body}</p>` : '',
    ctaLabel ? `<p class="button-container"><a href="${ctaHref}" class="button primary">${ctaLabel}</a></p>` : '',
  ].filter(Boolean).join('');

  row.append(imageCell, contentCell);
  return row;
}

function buildBlock({ slides = [] } = {}) {
  const block = document.createElement('div');
  block.className = 'hero-carousel block';
  slides.forEach((slide) => block.append(buildSlideRow(slide)));
  return block;
}

// render is async so Storybook waits for Shoelace to register before displaying
async function render({ slides }) {
  const block = buildBlock({ slides });
  await decorate(block);
  return block;
}

export const Default = {
  args: { slides: DEFAULT_SLIDES },
  render,
};

export const SingleSlide = {
  args: { slides: [DEFAULT_SLIDES[0]] },
  render,
};

export const EmptySlides = {
  args: {
    slides: [{
      imgSrc: '', imgAlt: '', title: '', body: '', ctaLabel: '',
    }],
  },
  render,
};
