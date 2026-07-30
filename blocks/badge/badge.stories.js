import './badge.css';
import decorate from './badge.js';

const ALL_VARIANTS = [
  { label: 'New', variant: 'primary' },
  { label: 'Active', variant: 'success' },
  { label: 'Beta', variant: 'neutral' },
  { label: 'Expiring', variant: 'warning' },
  { label: 'Offline', variant: 'danger' },
];

export default {
  title: 'Blocks/Badge',
  parameters: {
    layout: 'centered',
  },
  args: {
    badges: ALL_VARIANTS,
    pill: false,
    pulse: false,
  },
  argTypes: {
    badges: {
      name: 'Badges',
      control: 'object',
      description: 'Array of badge objects. Each may have: label, variant (primary|success|neutral|warning|danger).',
    },
    pill: {
      name: 'Pill',
      control: 'boolean',
      description: 'Render all badges with a rounded pill shape.',
    },
    pulse: {
      name: 'Pulse',
      control: 'boolean',
      description: 'Render all badges with an animated pulse indicator.',
    },
  },
};

function buildBlock({ badges = [], pill = false, pulse = false } = {}) {
  const block = document.createElement('div');
  const classes = ['badge', 'block'];
  if (pill) classes.push('pill');
  if (pulse) classes.push('pulse');
  block.className = classes.join(' ');

  badges.forEach(({ label = '', variant = 'primary' } = {}) => {
    const row = document.createElement('div');
    const labelCell = document.createElement('div');
    labelCell.textContent = label;
    const variantCell = document.createElement('div');
    variantCell.textContent = variant;
    row.append(labelCell, variantCell);
    block.append(row);
  });

  return block;
}

async function render({ badges, pill, pulse }) {
  const block = buildBlock({ badges, pill, pulse });
  await decorate(block);
  return block;
}

export const Default = { render };

export const Pill = {
  args: { badges: ALL_VARIANTS, pill: true, pulse: false },
  render,
};

export const Pulse = {
  args: { badges: [{ label: 'Live', variant: 'danger' }], pill: false, pulse: true },
  render,
};

export const SinglePrimary = {
  args: { badges: [{ label: 'New Feature', variant: 'primary' }] },
  render,
};

export const EmptyLabel = {
  args: { badges: [{ label: '', variant: 'neutral' }] },
  render,
};
