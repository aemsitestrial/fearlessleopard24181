import { moveInstrumentation } from '../../scripts/scripts.js';

const VALID_VARIANTS = new Set(['primary', 'success', 'neutral', 'warning', 'danger']);

const DEFAULT_ICONS = {
  primary: 'info-circle',
  success: 'check2-circle',
  neutral: 'gear',
  warning: 'exclamation-triangle',
  danger: 'x-octagon',
};

export default async function decorate(block) {
  // Flat model: rows are positional — icon, message, closable
  const [iconRow, messageRow, closableRow] = [...block.children];
  const iconCell = iconRow?.children[0];
  const messageCell = messageRow?.children[0];
  const closableCell = closableRow?.children[0];

  const alert = document.createElement('sl-alert');
  moveInstrumentation(block, alert);

  // Variant from CSS class variation set by UE "classes" field
  const variant = [...block.classList].find((c) => VALID_VARIANTS.has(c)) || 'primary';
  alert.setAttribute('variant', variant);
  alert.setAttribute('open', '');

  if (closableCell?.textContent.trim() === 'true') {
    alert.setAttribute('closable', '');
  }

  // Icon slot — authored name or variant default
  const iconName = iconCell?.textContent.trim() || DEFAULT_ICONS[variant];
  if (iconName) {
    const icon = document.createElement('sl-icon');
    icon.setAttribute('slot', 'icon');
    icon.setAttribute('name', iconName);
    alert.append(icon);
  }

  // Default slot — richtext message content
  if (messageCell) {
    messageCell.removeAttribute('class');
    alert.append(messageCell);
  }

  block.replaceChildren(alert);

  const { default: loadLibrary } = await import('./alert-element.js');
  await loadLibrary();
}
