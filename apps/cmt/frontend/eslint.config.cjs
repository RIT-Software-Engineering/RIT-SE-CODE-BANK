const reactPlugin = require('eslint-plugin-react');
const globals = require('globals');

// Based off https://github.com/jsx-eslint/eslint-plugin-react
// Disabled proptypes because we love Javascript here!

module.exports = [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ...reactPlugin.configs.flat.recommended,
  },
  reactPlugin.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: '18',
      },
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "react/prop-types": "off"
    }
  },
];