/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        crete: {
          blue: 'var(--crete-blue, #1e3678)', // Deep navy blue from the logo
          gold: 'var(--crete-gold, #c89f45)', // Gold from the pillar
        }
      }
    },
  },
  plugins: [],
}

