/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Paleta fría en escala de grises + acento azul grisáceo
        brand: {
          50: '#f7f8f9',
          100: '#eef1f3',
          200: '#e1e6e9',
          300: '#cfd7dc',
          400: '#b8c3ca',
          500: '#6b7280',
          600: '#4b5563',
          700: '#27313a',
          800: '#0b1220',
          900: '#05070a',
        },
        accent: {
          50: '#f4f6f8',
          100: '#e9eef2',
          500: '#334155',
          600: '#25313b',
        },
        slate: {
          850: '#1f2937',
          900: '#0b1220',
          950: '#07090b',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #f8fafb 0%, #e6eef6 100%)',
        'gradient-dark': 'linear-gradient(to bottom right, #0b1220, #1f2937)',
        glass:
          'linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.6) 100%)',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(15, 23, 42, 0.06)',
        'glass-sm': '0 4px 16px 0 rgba(15, 23, 42, 0.04)',
        soft: '0 6px 18px rgba(2,6,23,0.08)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
