/** @type {import('tailwindcss').Config} */
export default {

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      //colors for the overall frontend
      colors: {
        main: {
          primary: "#14161A",
          secondary: "#181B20",
        },
        //current does not account for highlighted keywords
        text: {
          primary: "#34C759",
          muted: "#8E8E93",
        },
        button: {
          default: "#E8DEF8",
          hover: "#b2a1cc",
          text: "#4A4459",
        },
        border: {
          primary: "#2A2E37",
        }
      }
    },
  },
  plugins: [],
}
