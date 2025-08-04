/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Changed from 'media' to 'class' for manual control
  theme: {
    extend: {
      colors: {
        surface: {
          light: '#ffffff',
          dark: '#1f2937', // Tailwind gray-800
        },
        card: {
          light: '#f9fafb',
          dark: '#2d3748', // Tailwind gray-700
          'hover-dark': '#374151', // Tailwind gray-800, good for white text
        },
        textPrimary: {
          light: '#111827', // Tailwind gray-900
          dark: '#f9fafb',
        },
        textSecondary: {
          light: '#6b7280', // Tailwind gray-500
          dark: '#9ca3af',  // Tailwind gray-400
        },
        border: {
          light: '#e5e7eb', // Tailwind gray-200
          dark: '#374151', // Tailwind gray-700
        },
        accent: {
          light: '#3b82f6', // Tailwind blue-500
          dark: '#60a5fa',  // Tailwind blue-400
        },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': {
            transform: 'translateY(0px) rotate(0deg)',
          },
          '33%': {
            transform: 'translateY(-10px) rotate(5deg)',
          },
          '66%': {
            transform: 'translateY(10px) rotate(-5deg)',
          },
        },
        shake: {
          '0%, 100%': {
            transform: 'translateX(0)',
          },
          '10%, 30%, 50%, 70%, 90%': {
            transform: 'translateX(-2px)',
          },
          '20%, 40%, 60%, 80%': {
            transform: 'translateX(2px)',
          },
        },
        'pulse-slow': {
          '0%, 100%': {
            opacity: '0.2',
          },
          '50%': {
            opacity: '0.4',
          },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
};