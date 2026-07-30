import { moveInstrumentation } from '../../scripts/scripts.js';

const VALID_VARIANTS = new Set(['primary', 'success', 'neutral', 'warning', 'danger']);

export default async function decorate(block) {
  const isPill = block.classList.contains('pill');
  const isPulse = block.classList.contains('pulse');

  const group = document.createElement('div');
  group.className = 'badge-group';

  [...block.children].forEach((row) => {
    const [labelCell, variantCell] = [...row.children];

    const badge = document.createElement('sl-badge');
    moveInstrumentation(row, badge);

    const rawVariant = variantCell?.textContent.trim().toLowerCase() || '';
    badge.setAttribute('variant', VALID_VARIANTS.has(rawVariant) ? rawVariant : 'primary');
    if (isPill) badge.setAttribute('pill', '');
    if (isPulse) badge.setAttribute('pulse', '');

    badge.textContent = labelCell?.textContent.trim() || '';

    group.append(badge);
  });

  block.replaceChildren(group);

  const { default: loadLibrary } = await import('./badge-element.js');
  await loadLibrary();
}
