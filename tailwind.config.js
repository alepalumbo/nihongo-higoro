/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens backed by CSS variables (see index.css).
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        elevated: 'var(--elevated)',
        line: 'var(--line)',
        txt: 'var(--text)',
        muted: 'var(--muted)',
        carddark: 'var(--card-dark)',
        'accent-soft': 'var(--accent-soft)',
        accent: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        sumi: '#2b2b2b',
        washi: '#faf9f6',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Inter"',
          '"Noto Sans JP"',
          '"Hiragino Sans"',
          'sans-serif',
        ],
        jp: [
          '"Noto Sans JP"',
          '"Hiragino Sans"',
          '-apple-system',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 4px 24px -8px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
