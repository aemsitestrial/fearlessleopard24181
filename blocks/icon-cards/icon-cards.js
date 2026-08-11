/**
 * Icon Cards block — 4-up (default) feature cards with an icon, title,
 * description and a text CTA link.
 *
 * Authored table layout:
 *   Row 0 (optional, 1 cell): section heading + optional subtitle paragraph
 *   Row 1+: Col 1 = icon image  |  Col 2 = title (h3) + description (p) + CTA link (a)
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'icon-cards-inner';

  // --- Section header row (single cell, no picture) ---
  if (
    rows[0].children.length === 1
    && !rows[0].querySelector('picture, img, a')
  ) {
    const headerRow = rows.shift();
    const header = document.createElement('div');
    header.className = 'icon-cards-header';

    // Red decorators
    const deco = document.createElement('div');
    deco.className = 'icon-cards-decorators';
    deco.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 3; i += 1) {
      const sq = document.createElement('span');
      sq.className = 'icon-cards-decorator-sq';
      deco.append(sq);
    }
    header.append(deco);

    // Move heading + paragraphs
    while (headerRow.firstElementChild?.firstElementChild) {
      header.append(headerRow.firstElementChild.firstElementChild);
    }

    wrapper.append(header);
  }

  // --- Cards grid ---
  const grid = document.createElement('ul');
  grid.className = 'icon-cards-grid';
  grid.setAttribute('role', 'list');

  rows.forEach((row) => {
    const [iconCell, bodyCell] = [...row.children];
    const li = document.createElement('li');
    li.className = 'icon-cards-card';

    // Icon container
    const iconWrap = document.createElement('div');
    iconWrap.className = 'icon-cards-icon';
    iconWrap.setAttribute('aria-hidden', 'true');
    const pic = iconCell?.querySelector('picture');
    const img = iconCell?.querySelector('img');
    if (pic) {
      iconWrap.append(pic);
    } else if (img) {
      iconWrap.append(img);
    }
    li.append(iconWrap);

    // Body
    const body = document.createElement('div');
    body.className = 'icon-cards-body';

    const heading = bodyCell?.querySelector('h1,h2,h3,h4,h5,h6');
    if (heading) {
      heading.className = 'icon-cards-title';
      body.append(heading);
    }

    const desc = bodyCell?.querySelector('p:not(:last-child), p:only-child');
    if (desc && !desc.querySelector('a')) {
      desc.className = 'icon-cards-desc';
      body.append(desc);
    }

    li.append(body);

    // CTA link — last anchor in the cell
    const anchor = bodyCell?.querySelector('a');
    if (anchor) {
      const cta = document.createElement('div');
      cta.className = 'icon-cards-cta';
      anchor.classList.add('icon-cards-link');
      anchor.removeAttribute('class');
      anchor.className = 'icon-cards-link';

      const arrow = document.createElement('span');
      arrow.className = 'icon-cards-link-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';
      anchor.append(arrow);

      cta.append(anchor);
      li.append(cta);
    }

    grid.append(li);
  });

  wrapper.append(grid);
  block.textContent = '';
  block.append(wrapper);
}
