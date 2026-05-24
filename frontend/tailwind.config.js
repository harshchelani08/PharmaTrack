/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      colors: {
        pharma: {
          50: '#edfdf8',
          100: '#d0faf0',
          200: '#a4f5e0',
          300: '#6aead0',
          400: '#31d5b8',
          500: '#13b99d',
          600: '#0d9480',
          700: '#107566',
          800: '#125d52',
          900: '#134d45',
        },
      },
      animation: {
        'shimmer': 'shimmer 1.5s linear infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
