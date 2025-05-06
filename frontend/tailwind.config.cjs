/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Paleta de colores oscura y elegante (monocromática + acentos)
      colors: {
        'background': '#0a0a0a',
        'surface': '#1f1f1f',
        'primary': '#e5e5e5',
        'primary-variant': '#cccccc',
        'secondary': '#6b7280',
        'accent': '#cc0000',
        'accent-hover': '#ff1a1a',
        'text-primary': '#f0f0f0',
        'text-secondary': '#b0b0b0',
        'text-on-primary': '#0a0a0a',
        'border-color': '#404040',
        'input-bg': '#2a2a2a',
        // Colores de estado literales
        'status-scheduled': '#6b7280',
        'status-completed': '#10b981',
        'status-canceled': '#4b5563',
        'status-noshow': '#ef4444',
      },
      fontFamily: {
        sans: ['system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
      }
    },
  },

  plugins: [
  ],
}