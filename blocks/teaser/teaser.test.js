import {
  describe, it, expect, beforeEach,
} from 'vitest';
import decorate from './teaser.js';

function buildBlock({ variant = '', withTerms = false, bodyText = '<p>Body text.</p>' } = {}) {
  const block = document.createElement('div');
  block.className = `teaser block${variant ? ` ${variant}` : ''}`;

  const imgRow = document.createElement('div');
  const imgCell = document.createElement('div');
  const picture = document.createElement('picture');
  const img = document.createElement('img');
  img.src = '/placeholder.jpg';
  img.alt = 'Teaser image';
  picture.append(img);
  imgCell.append(picture);
  imgRow.append(imgCell);

  const contentRow = document.createElement('div');
  const contentCell = document.createElement('div');
  contentCell.innerHTML = [
    '<h2>Teaser Title</h2>',
    bodyText,
    '<p class="button-container"><a href="#" class="button">CTA</a></p>',
    withTerms ? '<p>Terms and conditions: Test terms here.</p>' : '',
  ].filter(Boolean).join('');
  contentRow.append(contentCell);

  block.append(imgRow, contentRow);
  document.body.append(block);
  return block;
}

describe('teaser block', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('decorate()', () => {
    it('adds .content to the last direct child div', () => {
      const block = buildBlock();
      decorate(block);
      expect(block.lastElementChild.classList.contains('content')).toBe(true);
    });

    it('adds .title to the heading', () => {
      const block = buildBlock();
      decorate(block);
      expect(block.querySelector('h2').classList.contains('title')).toBe(true);
    });

    it('adds .image to the img element', () => {
      const block = buildBlock();
      decorate(block);
      expect(block.querySelector('img').classList.contains('image')).toBe(true);
    });

    it('adds .terms-and-conditions to a paragraph starting with that text', () => {
      const block = buildBlock({ withTerms: true });
      decorate(block);
      expect(block.querySelector('.terms-and-conditions')).not.toBeNull();
    });

    it('does not add .terms-and-conditions when no T&C paragraph is present', () => {
      const block = buildBlock();
      decorate(block);
      expect(block.querySelector('.terms-and-conditions')).toBeNull();
    });

    it('does not throw when optional body text is absent', () => {
      const block = buildBlock({ bodyText: '' });
      expect(() => decorate(block)).not.toThrow();
    });
  });

  describe('side-by-side variants', () => {
    it('adds .image-wrapper to the first div child for side-by-side-left', () => {
      const block = buildBlock({ variant: 'side-by-side-left' });
      decorate(block);
      expect(block.firstElementChild.classList.contains('image-wrapper')).toBe(true);
    });

    it('adds .image-wrapper to the first div child for side-by-side-right', () => {
      const block = buildBlock({ variant: 'side-by-side-right' });
      decorate(block);
      expect(block.firstElementChild.classList.contains('image-wrapper')).toBe(true);
    });
  });

  describe('event listeners', () => {
    it('adds .zoom to the image on button mouseover', () => {
      const block = buildBlock();
      decorate(block);
      block.querySelector('.button').dispatchEvent(new Event('mouseover'));
      expect(block.querySelector('.image').classList.contains('zoom')).toBe(true);
    });

    it('removes .zoom from the image on button mouseout', () => {
      const block = buildBlock();
      decorate(block);
      block.querySelector('.image').classList.add('zoom');
      block.querySelector('.button').dispatchEvent(new Event('mouseout'));
      expect(block.querySelector('.image').classList.contains('zoom')).toBe(false);
    });
  });
});
