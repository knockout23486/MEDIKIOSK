/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ayush: {
          50: '#f4f8f4',
          100: '#e5f0e5',
          200: '#cce1cc',
          300: '#a3caa3',
          400: '#73ad73',
          500: '#4e904e',
          600: '#3c743c',
          700: '#315c31',
          800: '#2a4a2a',
          900: '#233d23',
          950: '#0f210f',
        },
        clinical: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          900: '#0c4a6e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
