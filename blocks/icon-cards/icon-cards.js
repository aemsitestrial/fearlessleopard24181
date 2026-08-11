import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Icon Cards block — 4-up (default) feature cards with an icon, title,
 * description and a text CTA link.
 *
 * Authored table layout (2-cell / Google Docs):
 *   Row 0 (optional, 1 cell): section heading + optional subtitle paragraph
 *   Row 1+: Col 1 = icon image  |  Col 2 = title (h3) + description (p) + CTA link (a)
 *
 * UE item model layout (4-cell):
 *   Col 1 = icon (reference)  |  Col 2 = title (text)
 *   Col 3 = description (richtext)  |  Col 4 = cta link (aem-content + ctaText)
 */

function buildCta(anchor) {
  if (!anchor) return null;
  const cta = document.createElement('div');
  cta.className = 'icon-cards-cta';
  anchor.className = 'icon-cards-link';
  const arrow = document.createElement('span');
  arrow.className = 'icon-cards-link-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '→';
  anchor.append(arrow);
  cta.append(anchor);
  return cta;
}

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'icon-cards-inner';

  // --- Section header row (single cell, no picture/image/link) ---
  if (
    rows[0].children.length === 1
    && !rows[0].querySelector('picture, img, a')
  ) {
    const headerRow = rows.shift();
    const header = document.createElement('div');
    header.className = 'icon-cards-header';

    const deco = document.createElement('div');
    deco.className = 'icon-cards-decorators';
    deco.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 3; i += 1) {
      const sq = document.createElement('span');
      sq.className = 'icon-cards-decorator-sq';
      deco.append(sq);
    }
    header.append(deco);

    // Move heading + paragraphs from the single cell
    const cell = headerRow.firstElementChild;
    while (cell?.firstElementChild) {
      header.append(cell.firstElementChild);
    }

    wrapper.append(header);
  }

  // --- Cards grid ---
  const grid = document.createElement('ul');
  grid.className = 'icon-cards-grid';
  grid.setAttribute('role', 'list');

  rows.forEach((row) => {
    const cells = [...row.children];
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    li.className = 'icon-cards-card';

    // Icon — always cell[0]
    const iconWrap = document.createElement('div');
    iconWrap.className = 'icon-cards-icon';
    iconWrap.setAttribute('aria-hidden', 'true');
    const pic = cells[0]?.querySelector('picture');
    const img = cells[0]?.querySelector('img');
    if (pic) iconWrap.append(pic);
    else if (img) iconWrap.append(img);
    li.append(iconWrap);

    const body = document.createElement('div');
    body.className = 'icon-cards-body';

    if (cells.length >= 3) {
      // UE item model: [icon, title, description, cta]
      const titleCell = cells[1];
      const descCell = cells[2];
      const ctaCell = cells[3];

      // Title: use existing heading or wrap text in h3
      let heading = titleCell?.querySelector('h1,h2,h3,h4,h5,h6');
      if (!heading && titleCell?.textContent?.trim()) {
        heading = document.createElement('h3');
        heading.textContent = titleCell.textContent.trim();
      }
      if (heading) {
        heading.className = 'icon-cards-title';
        body.append(heading);
      }

      // Description
      const desc = descCell?.querySelector('p');
      if (desc) {
        desc.className = 'icon-cards-desc';
        body.append(desc);
      }

      li.append(body);

      const cta = buildCta(ctaCell?.querySelector('a'));
      if (cta) li.append(cta);
    } else {
      // 2-cell Doc-authored: [icon, body(heading + desc p + cta p>a)]
      const bodyCell = cells[1];

      const heading = bodyCell?.querySelector('h1,h2,h3,h4,h5,h6');
      if (heading) {
        heading.className = 'icon-cards-title';
        body.append(heading);
      }

      // First non-CTA paragraph as description
      const desc = bodyCell?.querySelector('p:not(:last-child), p:only-child');
      if (desc && !desc.querySelector('a')) {
        desc.className = 'icon-cards-desc';
        body.append(desc);
      }

      li.append(body);

      const cta = buildCta(bodyCell?.querySelector('a'));
      if (cta) li.append(cta);
    }

    grid.append(li);
  });

  wrapper.append(grid);
  block.textContent = '';
  block.append(wrapper);
}
