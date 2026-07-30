const path = require('path');

/** @type { import('@storybook/html-vite').StorybookConfig } */
const config = {
  stories: ['../blocks/**/*.stories.js'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/html-vite',
    options: {},
  },
  async viteFinal(viteConfig) {
    viteConfig.resolve.alias = {
      ...viteConfig.resolve.alias,
      // Redirect AEM runtime imports to lightweight mocks so block code works in isolation
      [path.resolve(__dirname, '../scripts/aem.js')]: path.resolve(__dirname, '../test/mocks/aem.js'),
      [path.resolve(__dirname, '../scripts/scripts.js')]: path.resolve(__dirname, '../test/mocks/scripts.js'),
    };
    return viteConfig;
  },
};

module.exports = config;
