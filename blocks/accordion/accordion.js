import { moveInstrumentation } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const items = [...block.children].map((row) => {
    const [summaryCell, bodyCell] = [...row.children];
    const details = document.createElement('sl-details');
    moveInstrumentation(row, details);

    if (summaryCell) {
      const summarySlot = document.createElement('div');
      summarySlot.slot = 'summary';
      summarySlot.className = 'accordion-summary';
      if (summaryCell.children.length) {
        summarySlot.append(...summaryCell.children);
      } else {
        summarySlot.textContent = summaryCell.textContent.trim();
      }
      details.append(summarySlot);
    }

    if (bodyCell) {
      bodyCell.className = 'accordion-body';
      details.append(...bodyCell.children);
    }

    return details;
  });

  // Mutual exclusion: opening one item collapses all others
  items.forEach((item) => {
    item.addEventListener('sl-show', () => {
      items.forEach((other) => {
        if (other !== item) other.hide();
      });
    });
  });

  block.replaceChildren(...items);

  const { default: loadShoelace } = await import('./accordion-element.js');
  await loadShoelace();
}
