/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "!./src/backend/node_modules/*"
  ],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography'),],
}

