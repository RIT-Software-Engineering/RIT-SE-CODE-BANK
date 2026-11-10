const js = require("@eslint/js")
const globals = require('globals');

// Based off frontend config

module.exports = [
  {
    ignores: [
      '**/prisma/generated/**'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },

    rules: {
      "no-extra-semi": "off"
    },
  },
];