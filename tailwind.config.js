/** Brand tokens taken from the live gladofafricasafari.com (green palette, Bebas/Cormorant/DM Sans/Space Mono). */
module.exports = {
  content: ['./src/**/*.{ejs,js}', './public/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        forest: { 950: '#091d13', 900: '#123524', 800: '#1E2A1F', 700: '#2f5a3a', 600: '#3a6f43', 500: '#3e7b27', 400: '#85a947' },
        gold: { DEFAULT: '#D9A441', light: '#F0C878', dark: '#b8862c' },
        cream: '#fdfaf4',
        sand: '#f4ecdc',
        stone: '#d9d4cc',
        ink: '#151f18',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: { site: '1240px' },
    },
  },
  plugins: [],
};
