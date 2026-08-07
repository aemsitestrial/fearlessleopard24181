import { getLocale } from '../../scripts/scripts.js';

const STORAGE_KEY = 'xcel-selected-state';

const STATES = [
  { name: 'Colorado', code: 'co' },
  { name: 'Michigan', code: 'mi' },
  { name: 'Minnesota', code: 'mn' },
  { name: 'New Mexico', code: 'nm' },
  { name: 'North Dakota', code: 'nd' },
  { name: 'South Dakota', code: 'sd' },
  { name: 'Texas', code: 'tx' },
  { name: 'Wisconsin', code: 'wi' },
];

function getSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return STATES.find((s) => s.code === saved) ?? null;
  } catch {
    return null;
  }
}

export default function decorate(block) {
  const triggerLabel = block.querySelector('div')?.textContent.trim() || 'Select your state';
  const locale = getLocale() || 'en';
  const saved = getSavedState();

  const trigger = document.createElement('a');
  trigger.href = `/${locale}/state-selector`;
  trigger.className = 'state-selector-trigger';
  trigger.textContent = saved ? saved.name : triggerLabel;

  block.textContent = '';
  block.append(trigger);
}
