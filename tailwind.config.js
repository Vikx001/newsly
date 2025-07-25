/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Newsreader', 'Inter', 'system-ui', 'sans-serif'],
      },
      container: {
        queries: {
          '480px': '480px',
        }
      }
    },
  },
  plugins: [],
}
