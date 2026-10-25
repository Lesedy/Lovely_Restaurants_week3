/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: { fontFamily: { sans: ['DM Sans', 'sans-serif'], display: ['Playfair Display', 'serif'] }, colors: { cream: '#fffaf5', ink: '#27221f', tomato: '#d84c32', peach: '#f6e6d7' } } },
  plugins: []
};
