import './accordion.css';
import decorate from './accordion.js';

const DEFAULT_ITEMS = [
  {
    summary: 'What is Edge Delivery Services?',
    body: 'Edge Delivery Services (EDS) is Adobe\'s high-performance publishing platform that delivers content with sub-second load times using a file-based authoring model.',
  },
  {
    summary: 'How do I start a new energy plan?',
    body: 'You can start a new energy plan by visiting your account portal, selecting <strong>Plans &amp; Services</strong>, and following the guided setup wizard.',
  },
  {
    summary: 'What renewable energy options are available?',
    body: 'We offer solar buyback programs, wind energy credits, and green power subscriptions. Contact your local service centre for availability in your area.',
  },
];

export default {
  title: 'Blocks/Accordion',
  parameters: {
    a11y: { config: { rules: [] } },
  },
  args: { items: DEFAULT_ITEMS },
  argTypes: {
    items: {
      name: 'Items',
      control: 'object',
      description: 'Array of accordion items. Each item has a summary (trigger) and body (content).',
    },
  },
};

function buildItemRow({ summary = '', body = '' } = {}) {
  const row = document.createElement('div');

  const summaryCell = document.createElement('div');
  const summaryP = document.createElement('p');
  summaryP.textContent = summary;
  summaryCell.append(summaryP);

  const bodyCell = document.createElement('div');
  const bodyP = document.createElement('p');
  bodyP.innerHTML = body;
  bodyCell.append(bodyP);

  row.append(summaryCell, bodyCell);
  return row;
}

function buildBlock({ items = [] } = {}) {
  const block = document.createElement('div');
  block.className = 'accordion block';
  items.forEach((item) => block.append(buildItemRow(item)));
  return block;
}

async function render({ items }) {
  const block = buildBlock({ items });
  await decorate(block);
  return block;
}

export const Default = {
  args: { items: DEFAULT_ITEMS },
  render,
};

export const SingleItem = {
  args: { items: [DEFAULT_ITEMS[0]] },
  render,
};

export const EmptyContent = {
  args: {
    items: [{
      summary: '', body: '',
    }],
  },
  render,
};
