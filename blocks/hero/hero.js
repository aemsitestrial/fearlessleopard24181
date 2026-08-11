export default function decorate(block) {
  const rows = [...block.children];
  const [imageRow, contentRow] = rows;

  // --- Background image layer ---
  if (imageRow) {
    const pic = imageRow.querySelector('picture');
    if (pic) {
      const bg = document.createElement('div');
      bg.className = 'hero-bg';

      const overlayLR = document.createElement('div');
      overlayLR.className = 'hero-bg-overlay hero-bg-overlay-lr';

      const overlayTB = document.createElement('div');
      overlayTB.className = 'hero-bg-overlay hero-bg-overlay-tb';

      bg.append(pic, overlayLR, overlayTB);
      imageRow.replaceWith(bg);
    } else {
      imageRow.remove();
    }
  }

  // --- Content layer ---
  if (contentRow) {
    contentRow.className = 'hero-content';

    const inner = document.createElement('div');
    inner.className = 'hero-content-inner';

    const accent = document.createElement('div');
    accent.setAttribute('aria-hidden', 'true');
    accent.className = 'hero-accent';

    const text = document.createElement('div');
    text.className = 'hero-text';

    // Move all authored children (heading, paragraph…) into text wrapper
    while (contentRow.firstElementChild) {
      text.append(contentRow.firstElementChild);
    }

    // Mark first heading for sizing
    const heading = text.querySelector('h1, h2, h3');
    if (heading) heading.classList.add('hero-heading');

    // Mark first paragraph as subtitle
    const subtitle = text.querySelector('p');
    if (subtitle) subtitle.classList.add('hero-subtitle');

    inner.append(accent, text);
    contentRow.append(inner);
  }
}
