export default function decorate(block) {
  const a = block.querySelector('a');
  if (!a) return;

  const btn = document.createElement('a');
  btn.className = 'custom-button';
  btn.href = a.href;
  btn.title = a.title || a.textContent.trim();
  if (a.rel) btn.rel = a.rel;
  if (a.target) btn.target = a.target;

  const text = document.createElement('span');
  text.className = 'button-text';
  text.textContent = a.textContent.trim();

  const arrow = document.createElement('span');
  arrow.className = 'button-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '→';

  const underline = document.createElement('span');
  underline.className = 'button-underline';
  underline.setAttribute('aria-hidden', 'true');

  btn.append(text, arrow, underline);
  block.replaceChildren(btn);
}
