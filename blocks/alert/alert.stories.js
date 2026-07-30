import './alert.css';
import decorate from './alert.js';

const VARIANT_ICONS = {
  primary: 'info-circle',
  success: 'check2-circle',
  neutral: 'gear',
  warning: 'exclamation-triangle',
  danger: 'x-octagon',
};

export default {
  title: 'Blocks/Alert',
  parameters: {
    layout: 'padded',
  },
  args: {
    variant: 'primary',
    icon: '',
    message: '<p><strong>Heads up!</strong> Here is some important information for you.</p>',
    closable: false,
  },
  argTypes: {
    variant: {
      name: 'Variant',
      control: 'select',
      options: ['primary', 'success', 'neutral', 'warning', 'danger'],
      description: 'Maps to sl-alert variant attribute.',
    },
    icon: {
      name: 'Icon',
      control: 'text',
      description: 'Shoelace icon name. Leave blank to use the variant default.',
    },
    message: {
      name: 'Message',
      control: 'text',
      description: 'Alert message content (HTML string).',
    },
    closable: {
      name: 'Closable',
      control: 'boolean',
      description: 'Shows a close button — maps to sl-alert closable attribute.',
    },
  },
};

function buildBlock({
  variant = 'primary', icon = '', message = '', closable = false,
} = {}) {
  const block = document.createElement('div');
  block.className = `alert block${variant ? ` ${variant}` : ''}`;

  // Row 0: icon
  const iconRow = document.createElement('div');
  const iconCell = document.createElement('div');
  iconCell.textContent = icon || VARIANT_ICONS[variant] || '';
  iconRow.append(iconCell);

  // Row 1: message (richtext)
  const messageRow = document.createElement('div');
  const messageCell = document.createElement('div');
  messageCell.innerHTML = message;
  messageRow.append(messageCell);

  // Row 2: closable boolean
  const closableRow = document.createElement('div');
  const closableCell = document.createElement('div');
  closableCell.textContent = String(closable);
  closableRow.append(closableCell);

  block.append(iconRow, messageRow, closableRow);
  return block;
}

async function render({
  variant, icon, message, closable,
}) {
  const block = buildBlock({
    variant, icon, message, closable,
  });
  await decorate(block);
  return block;
}

export const Primary = {
  args: {
    variant: 'primary',
    message: '<p><strong>Heads up!</strong> Here is some important information.</p>',
  },
  render,
};

export const Success = {
  args: {
    variant: 'success',
    message: '<p><strong>Done!</strong> Your changes have been saved successfully.</p>',
  },
  render,
};

export const Neutral = {
  args: {
    variant: 'neutral',
    message: '<p>This is a neutral alert with general information.</p>',
  },
  render,
};

export const Warning = {
  args: {
    variant: 'warning',
    message: '<p><strong>Caution!</strong> Please review these details before proceeding.</p>',
  },
  render,
};

export const Danger = {
  args: {
    variant: 'danger',
    message: '<p><strong>Error!</strong> Something went wrong. Please try again.</p>',
  },
  render,
};

export const Closable = {
  args: {
    variant: 'neutral',
    message: '<p>You can dismiss this alert by clicking the close button.</p>',
    closable: true,
  },
  render,
};

export const CustomIcon = {
  args: {
    variant: 'primary',
    icon: 'lightning-charge',
    message: '<p>Using a custom Shoelace icon name.</p>',
  },
  render,
};
