/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Kriyadocs color scheme
        'kriya': {
          'primary': '#7C3AED',
          'primary-dark': '#6D28D9',
          'primary-light': '#8B5CF6',
          'secondary': '#EC4899',
          'accent': '#F59E0B',
          'success': '#10B981',
          'warning': '#F59E0B',
          'error': '#EF4444',
          'info': '#3B82F6',
        }
      },
    },
  },
  plugins: [],
}
