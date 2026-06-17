/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        crete: {
          blue: '#1e3678', // Deep navy blue from the logo
          gold: '#c89f45', // Gold from the pillar
        }
      }
    },
  },
  plugins: [],
}

