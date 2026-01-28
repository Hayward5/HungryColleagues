/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'hsl(var(--paper) / <alpha-value>)',
        ink: 'hsl(var(--ink) / <alpha-value>)',
        cocoa: 'hsl(var(--cocoa) / <alpha-value>)',
        saffron: 'hsl(var(--saffron) / <alpha-value>)',
        clay: 'hsl(var(--clay) / <alpha-value>)',
        fog: 'hsl(var(--fog) / <alpha-value>)'
      },
      borderRadius: {
        menu: '18px'
      },
      boxShadow: {
        paper: '0 18px 50px -22px hsl(var(--cocoa) / 0.35)'
      },
      fontFamily: {
        display: ['"Playfair Display SC"', 'serif'],
        body: ['Karla', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
}
