import './teaser.css';
import decorate from './teaser.js';

const IMG_SRC = 'https://picsum.photos/id/10/1600/500';

export default {
  title: 'Blocks/Teaser',
  parameters: {
    a11y: { config: { rules: [] } },
  },
  // Default control values shared across all stories
  args: {
    title: 'Discover the Future',
    bodyText: 'Experience innovation at its finest with our next-generation solutions.',
    ctaLabel: 'Learn More',
    ctaHref: '#',
    withTerms: false,
    variant: '',
    imgSrc: IMG_SRC,
    imgAlt: 'Mountains and forest landscape',
  },
  argTypes: {
    variant: {
      name: 'Variant',
      options: ['', 'side-by-side-left', 'side-by-side-right'],
      control: {
        type: 'select',
        labels: {
          '': 'Default',
          'side-by-side-left': 'Side by side (image left)',
          'side-by-side-right': 'Side by side (image right)',
        },
      },
    },
    title: { name: 'Title', control: 'text' },
    bodyText: { name: 'Body text', control: 'text' },
    ctaLabel: { name: 'CTA label', control: 'text' },
    ctaHref: { name: 'CTA href', control: 'text' },
    withTerms: { name: 'Show T&C', control: 'boolean' },
    imgSrc: { name: 'Image URL', control: 'text' },
    imgAlt: { name: 'Image alt text', control: 'text' },
  },
};

function buildBlock({
  variant = '',
  title = 'Discover the Future',
  bodyText = '',
  ctaLabel = 'Learn More',
  ctaHref = '#',
  withTerms = false,
  imgSrc = IMG_SRC,
  imgAlt = 'Teaser image',
} = {}) {
  const block = document.createElement('div');
  block.className = `teaser block${variant ? ` ${variant}` : ''}`;

  const imgRow = document.createElement('div');
  const imgCell = document.createElement('div');
  const picture = document.createElement('picture');
  const img = document.createElement('img');
  img.src = imgSrc;
  img.alt = imgAlt;
  picture.append(img);
  imgCell.append(picture);
  imgRow.append(imgCell);

  const contentRow = document.createElement('div');
  const contentCell = document.createElement('div');
  contentCell.innerHTML = [
    `<h2>${title}</h2>`,
    bodyText ? `<p>${bodyText}</p>` : '',
    `<p class="button-container"><a href="${ctaHref}" class="button">${ctaLabel}</a></p>`,
    withTerms ? '<p>Terms and conditions: Offer subject to availability and may change without notice.</p>' : '',
  ].filter(Boolean).join('');
  contentRow.append(contentCell);

  block.append(imgRow, contentRow);
  return block;
}

function render(args) {
  const block = buildBlock(args);
  decorate(block);
  return block;
}

export const Default = {
  args: { variant: '' },
  render,
};

export const WithTermsAndConditions = {
  args: { variant: '', withTerms: true },
  render,
};

export const SideBySideLeft = {
  args: { variant: 'side-by-side-left' },
  render,
};

export const SideBySideRight = {
  args: { variant: 'side-by-side-right' },
  render,
};

export const MinimalContent = {
  args: { variant: '', bodyText: '' },
  render,
};
