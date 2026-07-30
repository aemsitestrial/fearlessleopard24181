import './hero-blade.css';
import decorate from './hero-blade.js';

const IMG_SRC = 'https://picsum.photos/id/1036/1600/560';

export default {
  title: 'Blocks/Hero Blade',
  parameters: {
    a11y: { config: { rules: [] } },
    layout: 'fullscreen',
  },
  args: {
    eyebrow: 'New announcement',
    title: 'Power Your Future',
    body: 'Explore plans and solutions designed to keep your home and business running efficiently.',
    ctaLabel: 'Get started',
    ctaHref: '#',
    imgSrc: IMG_SRC,
    imgAlt: 'Aerial view of a power grid at sunset',
  },
  argTypes: {
    eyebrow: { name: 'Eyebrow', control: 'text' },
    title: { name: 'Title', control: 'text' },
    body: { name: 'Body', control: 'text' },
    ctaLabel: { name: 'CTA Label', control: 'text' },
    ctaHref: { name: 'CTA Href', control: 'text' },
    imgSrc: { name: 'Image URL', control: 'text' },
    imgAlt: { name: 'Image Alt', control: 'text' },
  },
};

function buildBlock({
  eyebrow = '',
  title = '',
  body = '',
  ctaLabel = 'Get started',
  ctaHref = '#',
  imgSrc = IMG_SRC,
  imgAlt = '',
} = {}) {
  const block = document.createElement('div');
  block.className = 'hero-blade block';

  const imageRow = document.createElement('div');
  const imageCell = document.createElement('div');
  const picture = document.createElement('picture');
  const img = document.createElement('img');
  img.src = imgSrc;
  img.alt = imgAlt;
  picture.append(img);
  imageCell.append(picture);
  imageRow.append(imageCell);

  const contentRow = document.createElement('div');
  const contentCell = document.createElement('div');
  contentCell.innerHTML = [
    eyebrow ? `<p>${eyebrow}</p>` : '',
    title ? `<h1>${title}</h1>` : '',
    body ? `<p>${body}</p>` : '',
    ctaLabel ? `<p class="button-container"><a href="${ctaHref}" class="button primary">${ctaLabel}</a></p>` : '',
  ].filter(Boolean).join('');
  contentRow.append(contentCell);

  block.append(imageRow, contentRow);
  return block;
}

function render(args) {
  const block = buildBlock(args);
  decorate(block);
  return block;
}

export const Default = { render };

export const WithEyebrow = {
  args: { eyebrow: 'Limited time offer' },
  render,
};

export const NoEyebrow = {
  args: { eyebrow: '' },
  render,
};

export const EmptyContent = {
  args: {
    eyebrow: '', title: '', body: '', ctaLabel: '',
  },
  render,
};
