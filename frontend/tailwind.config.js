/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        critical: '#ef4444',
        high: '#f97316',
        warning: '#eab308',
        safe: '#22c55e',
        info: '#3b82f6',
        resource: '#a855f7',
      }
    },
  },
  plugins: [],
}
