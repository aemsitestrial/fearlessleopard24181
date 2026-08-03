const STORAGE_KEY = 'xcel-selected-state';
const FILL = '#C8102E';

const STATES = [
  {
    name: 'Colorado',
    href: '/colorado',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140"><rect x="5" y="5" width="190" height="130" fill="${FILL}"/></svg>`,
  },
  {
    name: 'Michigan',
    href: '/michigan',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><polygon points="5,8 118,8 118,30 80,36 5,28" fill="${FILL}"/><polygon points="80,36 100,30 115,38 132,28 145,40 152,58 158,80 155,105 140,128 115,145 88,152 60,148 38,135 20,112 18,85 26,62 44,44 68,36" fill="${FILL}"/></svg>`,
  },
  {
    name: 'Minnesota',
    href: '/minnesota',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 230"><polygon points="38,5 54,5 54,22 160,22 170,48 170,102 158,132 170,162 170,225 18,225 18,5" fill="${FILL}"/></svg>`,
  },
  {
    name: 'New Mexico',
    href: '/new-mexico',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 215"><polygon points="5,5 195,5 195,190 60,190 60,210 5,210" fill="${FILL}"/></svg>`,
  },
  {
    name: 'North Dakota',
    href: '/north-dakota',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 130"><rect x="5" y="5" width="190" height="120" fill="${FILL}"/></svg>`,
  },
  {
    name: 'South Dakota',
    href: '/south-dakota',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 135"><polygon points="5,5 195,5 195,92 138,92 130,120 110,132 82,120 74,92 5,92" fill="${FILL}"/></svg>`,
  },
  {
    name: 'Texas',
    href: '/texas',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><polygon points="5,5 70,5 70,48 195,48 185,82 188,108 175,138 162,168 145,185 118,195 95,198 62,185 35,162 8,148 8,98 5,58 5,5" fill="${FILL}"/></svg>`,
  },
  {
    name: 'Wisconsin',
    href: '/wisconsin',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220"><polygon points="55,5 92,5 108,18 142,22 160,44 165,72 158,95 175,112 170,135 148,152 125,168 112,195 95,215 72,215 50,202 30,178 20,150 16,120 28,95 16,70 22,48 42,28" fill="${FILL}"/></svg>`,
  },
];

function getSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return STATES.find((s) => s.href === saved) ?? null;
  } catch {
    return null;
  }
}

function saveState(href) {
  try {
    localStorage.setItem(STORAGE_KEY, href);
  } catch { /* storage unavailable */ }
}

function openModal(trigger) {
  const titleId = 'state-selector-modal-title';

  const overlay = document.createElement('div');
  overlay.className = 'state-selector-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', titleId);
  overlay.tabIndex = -1;

  const dialog = document.createElement('div');
  dialog.className = 'state-selector-dialog';

  const header = document.createElement('div');
  header.className = 'state-selector-header';

  const title = document.createElement('h2');
  title.className = 'state-selector-title';
  title.id = titleId;
  title.textContent = 'Select Your State';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'state-selector-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = '&times;';

  header.append(title, closeBtn);

  const ctrl = new AbortController();

  const close = () => {
    overlay.remove();
    ctrl.abort();
    trigger.focus();
  };

  const list = document.createElement('ul');
  list.className = 'state-selector-list';

  STATES.forEach(({ name, href, svg }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.className = 'state-selector-item';

    const mapDiv = document.createElement('div');
    mapDiv.className = 'state-selector-map';
    mapDiv.innerHTML = svg;

    const label = document.createElement('span');
    label.className = 'state-selector-label';
    label.textContent = name;

    a.append(mapDiv, label);
    li.append(a);
    list.append(li);

    a.addEventListener('click', (e) => {
      e.preventDefault();
      saveState(href);
      close();
      trigger.textContent = name;
      window.location.href = href;
    });
  });

  dialog.append(header, list);
  overlay.append(dialog);
  document.body.append(overlay);

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  }, { signal: ctrl.signal });

  closeBtn.focus();
}

export default function decorate(block) {
  const saved = getSavedState();

  const trigger = document.createElement('a');
  trigger.href = '#';
  trigger.className = 'state-selector-trigger';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.textContent = saved ? saved.name : 'Select your state';

  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(trigger);
  });

  block.textContent = '';
  block.append(trigger);
}
