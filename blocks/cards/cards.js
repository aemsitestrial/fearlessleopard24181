import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    // The per-card "classes" option is emitted as a trailing text cell for
    // container items (e.g. "card, cards-card-span-2"), not as a class on the
    // row. Read the span from there, apply it to the <li>, and drop the cell so
    // its raw text is not shown as card content. The cell holds only option
    // tokens (each "card" or "cards-card-span-N"), so it never matches real
    // card body content.
    const optionsCell = row.lastElementChild;
    if (optionsCell && !optionsCell.querySelector('picture, img')) {
      const tokens = optionsCell.textContent.split(',').map((t) => t.trim()).filter(Boolean);
      const isOptions = tokens.length > 0
        && tokens.every((t) => t === 'card' || /^cards-card-span-\d+$/.test(t));
      if (isOptions) {
        const span = tokens.find((t) => /^cards-card-span-\d+$/.test(t));
        if (span) li.classList.add(span);
        optionsCell.remove();
      }
    }

    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
