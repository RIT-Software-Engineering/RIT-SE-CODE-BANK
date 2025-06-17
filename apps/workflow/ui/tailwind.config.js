/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
    theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      'primary': '#F76902',
    },
  },
  },
  plugins: [],
}