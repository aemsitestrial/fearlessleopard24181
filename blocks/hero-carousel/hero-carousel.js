import { moveInstrumentation } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const carousel = document.createElement('sl-carousel');
  carousel.setAttribute('navigation', '');
  carousel.setAttribute('pagination', '');
  carousel.setAttribute('loop', '');
  carousel.setAttribute('autoplay', '');
  carousel.setAttribute('autoplay-interval', '5000');
  carousel.setAttribute('mouse-dragging', '');

  [...block.children].forEach((row) => {
    const item = document.createElement('sl-carousel-item');
    moveInstrumentation(row, item);

    const [imageCell, contentCell] = [...row.children];
    if (imageCell) imageCell.className = 'hero-carousel-slide-media';
    if (contentCell) contentCell.className = 'hero-carousel-slide-body';

    item.append(...row.children);
    carousel.append(item);
  });

  block.replaceChildren(carousel);

  const { default: loadShoelace } = await import('./hero-carousel-element.js');
  await loadShoelace();
}
