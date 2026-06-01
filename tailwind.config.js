/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        peaBright: '#6BCB77',
        peaDroopy: '#8B9A6B',
        podGreen: '#2D6A4F',
        podDark: '#1B4332',
        cream: '#F8F5F0',
        dueSoon: '#E9C46A',
      },
    },
  },
  plugins: [],
};
