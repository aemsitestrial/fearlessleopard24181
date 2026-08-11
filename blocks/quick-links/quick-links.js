export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'quick-links-inner';

  // Detect optional heading row: single cell with no anchor
  let headingRow = null;
  if (rows[0].children.length === 1 && !rows[0].querySelector('a')) {
    headingRow = rows.shift();
  }

  if (headingRow) {
    const heading = document.createElement('h2');
    heading.className = 'quick-links-heading';
    heading.textContent = headingRow.textContent.trim();
    wrapper.append(heading);
  }

  const grid = document.createElement('ul');
  grid.className = 'quick-links-grid';
  grid.setAttribute('role', 'list');

  rows.forEach((row) => {
    const anchor = row.querySelector('a');
    if (!anchor) return;

    const li = document.createElement('li');
    li.className = 'quick-links-item';

    const btn = document.createElement('a');
    btn.className = 'quick-links-btn';
    btn.href = anchor.href;
    btn.textContent = anchor.textContent.trim() || row.textContent.trim();

    const arrow = document.createElement('span');
    arrow.className = 'quick-links-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';

    btn.append(arrow);
    li.append(btn);
    grid.append(li);
  });

  wrapper.append(grid);
  block.textContent = '';
  block.append(wrapper);
}
