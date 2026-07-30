import './badge.css';
import decorate from './badge.js';

const ALL_VARIANTS = [
  {
    label: 'New', variant: 'primary', pill: false, pulse: false,
  },
  {
    label: 'Active', variant: 'success', pill: false, pulse: false,
  },
  {
    label: 'Beta', variant: 'neutral', pill: false, pulse: false,
  },
  {
    label: 'Expiring', variant: 'warning', pill: false, pulse: false,
  },
  {
    label: 'Offline', variant: 'danger', pill: false, pulse: false,
  },
];

export default {
  title: 'Blocks/Badge',
  parameters: {
    layout: 'centered',
  },
  args: { badges: ALL_VARIANTS },
  argTypes: {
    badges: {
      name: 'Badges',
      control: 'object',
      description: 'Array of badge objects. Each may have: label, variant (primary|success|neutral|warning|danger), pill (boolean), pulse (boolean).',
    },
  },
};

function buildBlock({ badges = [] } = {}) {
  const block = document.createElement('div');
  block.className = 'badge block';

  badges.forEach(({
    label = '', variant = 'primary', pill = false, pulse = false,
  } = {}) => {
    const row = document.createElement('div');

    const labelCell = document.createElement('div');
    labelCell.textContent = label;

    const variantCell = document.createElement('div');
    variantCell.textContent = variant;

    const pillCell = document.createElement('div');
    pillCell.textContent = String(pill);

    const pulseCell = document.createElement('div');
    pulseCell.textContent = String(pulse);

    row.append(labelCell, variantCell, pillCell, pulseCell);
    block.append(row);
  });

  return block;
}

async function render({ badges }) {
  const block = buildBlock({ badges });
  await decorate(block);
  return block;
}

export const Default = { render };

export const AllVariants = {
  args: { badges: ALL_VARIANTS },
  render,
};

export const PillBadges = {
  args: { badges: ALL_VARIANTS.map((b) => ({ ...b, pill: true })) },
  render,
};

export const PulseLive = {
  args: {
    badges: [{
      label: 'Live', variant: 'danger', pill: true, pulse: true,
    }],
  },
  render,
};

export const SinglePrimary = {
  args: {
    badges: [{
      label: 'New Feature', variant: 'primary', pill: false, pulse: false,
    }],
  },
  render,
};

export const EmptyLabel = {
  args: {
    badges: [{
      label: '', variant: 'neutral', pill: false, pulse: false,
    }],
  },
  render,
};
