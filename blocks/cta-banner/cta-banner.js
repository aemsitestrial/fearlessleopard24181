/**
 * CTA Banner block — full-width dark-gradient call-to-action strip.
 *
 * Authored table layout:
 *   Row 1, Col 1: heading (h2) + optional subtitle paragraph
 *   Row 1, Col 2 (optional): CTA button anchor
 *
 * OR single-row, two cells.
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const inner = document.createElement('div');
  inner.className = 'cta-banner-inner';

  // Detect layout: single row (2 cells) or two rows (1 cell each)
  let textCell;
  let btnCell;

  if (rows.length === 1 && rows[0].children.length >= 2) {
    [textCell, btnCell] = rows[0].children;
  } else if (rows.length >= 1) {
    textCell = rows[0]?.children[0];
    btnCell = rows[1]?.children[0] ?? rows[0]?.children[1];
  }

  // --- Text side ---
  const textSide = document.createElement('div');
  textSide.className = 'cta-banner-text';

  const accent = document.createElement('div');
  accent.className = 'cta-banner-accent';
  accent.setAttribute('aria-hidden', 'true');
  textSide.append(accent);

  const textWrap = document.createElement('div');
  textWrap.className = 'cta-banner-text-wrap';

  if (textCell) {
    const heading = textCell.querySelector('h1,h2,h3,h4,h5,h6');
    if (heading) {
      heading.classList.add('cta-banner-heading');
      textWrap.append(heading);
    }

    textCell.querySelectorAll('p').forEach((p) => {
      if (!p.querySelector('a')) {
        p.classList.add('cta-banner-subtitle');
        textWrap.append(p);
      }
    });
  }

  textSide.append(textWrap);

  // --- Button ---
  const btnSide = document.createElement('div');
  btnSide.className = 'cta-banner-btn-wrap';

  const anchor = btnCell?.querySelector('a');
  if (anchor) {
    anchor.classList.add('cta-banner-btn');
    btnSide.append(anchor);
  }

  inner.append(textSide, btnSide);
  block.textContent = '';
  block.append(inner);
}
