/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#1B2A4A',
        gold: '#C8943E',
        green: '#2D6A4F',
        cream: '#F5F0E8',
        charcoal: '#0D1B2A',
        'soft-white': '#F3F4F6',
      },
      fontFamily: {
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'Calibri', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
