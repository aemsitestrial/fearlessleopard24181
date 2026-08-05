module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:json/recommended',
    'plugin:xwalk/recommended',
  ],
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': ['error', { js: 'always' }], // require js file extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
    // page-metadata is a page-properties model (title, description, keywords,
    // breadcrumbs, nav-order, ...), not a rendered block, so it legitimately
    // carries more than the default 4 cells.
    'xwalk/max-cells': ['error', { 'page-metadata': 8 }],
  },
  overrides: [
    {
      files: ['**/*.stories.js', '**/*.test.js', 'test/**', 'vitest.config.js'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
        'import/no-unresolved': 'off',
      },
    },
    {
      files: ['.storybook/**'],
      env: { node: true, browser: false },
      rules: {
        'import/no-extraneous-dependencies': 'off',
        'import/no-unresolved': 'off',
      },
    },
  ],
};
