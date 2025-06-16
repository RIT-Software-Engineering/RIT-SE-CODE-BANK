/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "rit-orange": "#F76902",
        "rit-off-white": "#D7D2CB",
        "rit-gray": "#A2AAAD",
        "rit-dark-gray": "#7C878E",
        "rit-light-gray": "#D0D3D4",
        "rit-beige": "#ACA39A",
      },
    },
  },
  plugins: [],
}

