import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";

export default [
  {
    ignores: ["node_modules/**", "dist/**"]
  },
      js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    ...react.configs.flat.recommended,
    files: ["**/*.{js,jsx}"]
  },
  {
    rules: {
      "react/prop-types": "off"
    }
  }
];