import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './ui/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Manrope"', ...defaultTheme.fontFamily.sans],
        display: ['"Sora"', ...defaultTheme.fontFamily.sans]
      },
      colors: {
        ocean: {
          50: '#e7f4fb',
          100: '#cbe7f6',
          200: '#9fd2ee',
          300: '#70bce5',
          400: '#3aa3d9',
          500: '#1e88c5',
          600: '#166ea2',
          700: '#135b86',
          800: '#114b6d',
          900: '#0f3f5b'
        },
        agreste: {
          50: '#eef6ec',
          100: '#d9ecd3',
          200: '#b6d8a6',
          300: '#8ec072',
          400: '#6aa24f',
          500: '#4f853a',
          600: '#3e6a2e',
          700: '#345626',
          800: '#2b4620',
          900: '#243a1c'
        },
        sand: {
          50: '#faf6ef',
          100: '#f1e7d3',
          200: '#e6d2a9',
          300: '#d9bb7c',
          400: '#cba358',
          500: '#b8893d',
          600: '#9d6d32',
          700: '#7f552a',
          800: '#654524',
          900: '#533a20'
        },
        sun: {
          400: '#f5a524',
          500: '#ef8f1f',
          600: '#db7418'
        }
      },
      boxShadow: {
        soft: '0 12px 30px -20px rgba(15, 63, 91, 0.4)'
      },
      backgroundImage: {
        'hero-glow': 'radial-gradient(circle at top left, rgba(58, 163, 217, 0.25), transparent 55%), radial-gradient(circle at 80% 20%, rgba(245, 165, 36, 0.2), transparent 45%)'
      }
    }
  },
  plugins: []
};
