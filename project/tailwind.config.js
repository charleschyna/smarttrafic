/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f3e6',
          100: '#c2e0c2',
          200: '#9acf9a',
          300: '#70bf70',
          400: '#4aaf4a',
          500: '#2F9E44', // Kenyan green
          600: '#298d3c',
          700: '#237c33',
          800: '#1d6c2a',
          900: '#175c21',
        },
        secondary: {
          50: '#f5f5f5',
          100: '#e6e6e6',
          200: '#cccccc',
          300: '#b3b3b3',
          400: '#999999',
          500: '#808080',
          600: '#666666',
          700: '#4d4d4d',
          800: '#333333',
          900: '#101010', // Kenyan black
        },
        accent: {
          50: '#fcebeb',
          100: '#f8cdcd',
          200: '#f3adad',
          300: '#ee8d8d',
          400: '#e96d6d',
          500: '#E03131', // Kenyan red
          600: '#cc2c2c',
          700: '#b32727',
          800: '#992222',
          900: '#801c1c',
        },
        success: {
          500: '#10B981',
        },
        warning: {
          500: '#F59E0B',
        },
        error: {
          500: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};