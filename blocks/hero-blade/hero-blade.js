export default function decorate(block) {
  const [imageRow, contentRow] = [...block.children];

  if (imageRow) {
    imageRow.classList.add('hero-blade-background');
    imageRow.querySelector('picture')?.classList.add('hero-blade-bg-picture');
  }

  if (contentRow) {
    contentRow.classList.add('hero-blade-content');
    const heading = contentRow.querySelector('h1, h2, h3');
    if (heading) {
      heading.classList.add('hero-blade-title');
      const prev = heading.previousElementSibling;
      if (prev?.tagName === 'P') prev.classList.add('hero-blade-eyebrow');
    }
  }
}
