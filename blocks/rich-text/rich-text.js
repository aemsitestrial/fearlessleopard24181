export default function decorate(block) {
  const [row] = [...block.children];
  if (!row) return;

  const [col] = [...row.children];
  if (!col) return;

  // Promote standalone pictures to <figure> elements
  col.querySelectorAll('p > picture').forEach((picture) => {
    const p = picture.parentElement;
    const figure = document.createElement('figure');
    figure.className = 'rich-text-figure';
    figure.append(picture);

    // Use a following <em>-only paragraph as the caption
    const next = p.nextElementSibling;
    if (next?.tagName === 'P' && next.children.length === 1 && next.firstElementChild?.tagName === 'EM') {
      const figcaption = document.createElement('figcaption');
      figcaption.textContent = next.firstElementChild.textContent;
      figure.append(figcaption);
      next.remove();
    }

    p.replaceWith(figure);
  });

  col.className = 'rich-text-content';
  block.innerHTML = '';
  block.append(col);
}
