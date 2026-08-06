import { describe, it, expect } from 'vitest';
import decorate from './cards.js';

function buildCard({
  title = 'Card Title', body = 'Card body.', imgSrc = '', imgAlt = '', options = '',
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
  bodyCell.innerHTML = `<p><strong>${title}</strong></p><p>${body}</p>`;
  row.append(bodyCell);

  // AEM emits the per-card "classes" option as a trailing text-only cell,
  // e.g. "card, cards-card-span-2".
  if (options) {
    const optionsCell = document.createElement('div');
    optionsCell.textContent = options;
    row.append(optionsCell);
  }

  return row;
}

function buildBlock(cards = []) {
  const block = document.createElement('div');
  block.className = 'cards block';
  cards.forEach((card) => block.append(buildCard(card)));
  return block;
}

describe('cards block', () => {
  describe('decorate()', () => {
    it('replaces block children with a <ul>', () => {
      const block = buildBlock([{ title: 'A' }, { title: 'B' }]);
      decorate(block);
      expect(block.firstElementChild.tagName).toBe('UL');
    });

    it('converts each card row into a <li>', () => {
      const block = buildBlock([{ title: 'A' }, { title: 'B' }, { title: 'C' }]);
      decorate(block);
      expect(block.querySelectorAll('ul > li').length).toBe(3);
    });

    it('adds .cards-card-image to an image-only div', () => {
      const block = buildBlock([{ title: 'A', imgSrc: '/img.jpg' }]);
      decorate(block);
      expect(block.querySelector('.cards-card-image')).not.toBeNull();
    });

    it('adds .cards-card-body to the text content div', () => {
      const block = buildBlock([{ title: 'A', imgSrc: '/img.jpg' }]);
      decorate(block);
      expect(block.querySelector('.cards-card-body')).not.toBeNull();
    });

    it('adds .cards-card-body even when no image is present', () => {
      const block = buildBlock([{ title: 'Text only' }]);
      decorate(block);
      const li = block.querySelector('li');
      expect(li.querySelector('.cards-card-body')).not.toBeNull();
      expect(li.querySelector('.cards-card-image')).toBeNull();
    });

    it('replaces original <picture> with an optimized picture', () => {
      const block = buildBlock([{ title: 'A', imgSrc: '/photo.jpg', imgAlt: 'Photo' }]);
      decorate(block);
      const img = block.querySelector('img');
      expect(img).not.toBeNull();
      expect(img.src).toContain('/photo.jpg');
    });

    it('does not throw with a single card', () => {
      const block = buildBlock([{ title: 'Solo' }]);
      expect(() => decorate(block)).not.toThrow();
    });

    it('does not throw with an empty block', () => {
      const block = buildBlock([]);
      expect(() => decorate(block)).not.toThrow();
      expect(block.querySelector('ul')).not.toBeNull();
    });

    it('produces an empty <ul> when no cards are present', () => {
      const block = buildBlock([]);
      decorate(block);
      expect(block.querySelector('ul > li')).toBeNull();
    });

    it('applies the span class from the options cell onto the <li>', () => {
      const block = buildBlock([
        { title: 'A', options: 'card, cards-card-span-2' },
        { title: 'B', options: 'card' },
      ]);
      decorate(block);
      const [first, second] = block.querySelectorAll('ul > li');
      expect(first.classList.contains('cards-card-span-2')).toBe(true);
      expect(second.classList.contains('cards-card-span-2')).toBe(false);
    });

    it('removes the options cell so its text is not shown as card content', () => {
      const block = buildBlock([{ title: 'A', options: 'card, cards-card-span-2' }]);
      decorate(block);
      const li = block.querySelector('ul > li');
      expect(li.textContent).not.toContain('cards-card-span-2');
      expect(li.querySelector('.cards-card-body')).not.toBeNull();
    });

    it('keeps the card body when there is no options cell', () => {
      const block = buildBlock([{ title: 'Solo', body: 'Keep me.' }]);
      decorate(block);
      const li = block.querySelector('ul > li');
      expect(li.textContent).toContain('Keep me.');
      expect(li.querySelector('.cards-card-body')).not.toBeNull();
    });

    it('does not treat a text-only card body as an options cell', () => {
      // a "no image" card whose only cell is body text must not be removed
      const block = buildBlock([{ title: 'Text only', body: 'Real content.' }]);
      block.children[0].querySelector('div').innerHTML = 'Real content.';
      decorate(block);
      const li = block.querySelector('ul > li');
      expect(li.textContent).toContain('Real content.');
    });
  });
});
