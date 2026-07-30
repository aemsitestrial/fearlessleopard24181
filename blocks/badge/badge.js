import { moveInstrumentation } from '../../scripts/scripts.js';

const VALID_VARIANTS = new Set(['primary', 'success', 'neutral', 'warning', 'danger']);

export default async function decorate(block) {
  const group = document.createElement('div');
  group.className = 'badge-group';

  [...block.children].forEach((row) => {
    const [labelCell, variantCell, pillCell, pulseCell] = [...row.children];

    const badge = document.createElement('sl-badge');
    moveInstrumentation(row, badge);

    const rawVariant = variantCell?.textContent.trim().toLowerCase() || '';
    badge.setAttribute('variant', VALID_VARIANTS.has(rawVariant) ? rawVariant : 'primary');

    if (pillCell?.textContent.trim() === 'true') badge.setAttribute('pill', '');
    if (pulseCell?.textContent.trim() === 'true') badge.setAttribute('pulse', '');

    badge.textContent = labelCell?.textContent.trim() || '';

    group.append(badge);
  });

  block.replaceChildren(group);

  const { default: loadLibrary } = await import('./badge-element.js');
  await loadLibrary();
}
