/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0a1628',
          secondary: '#0f1d32',
          tertiary: '#162544',
          card: '#1a2d45',
          hover: '#243550',
          border: '#243550',
        },
        accent: {
          DEFAULT: '#0891b2',
          hover: '#0779a0',
          muted: '#066d8f',
          subtle: 'rgba(8,145,178,0.1)',
          border: 'rgba(8,145,178,0.25)',
        },
        gold: {
          DEFAULT: '#f0c040',
          muted: 'rgba(240,192,64,0.12)',
          border: 'rgba(240,192,64,0.25)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        bebas: ['"Bebas Neue"', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.8)',
        'card-hover': '0 16px 48px rgba(0,0,0,0.8), 0 4px 16px rgba(8,145,178,0.15)',
        'glow': '0 0 24px rgba(8,145,178,0.3)',
        'glow-sm': '0 0 12px rgba(8,145,178,0.2)',
        'gold': '0 0 20px rgba(240,192,64,0.25)',
      },
      animation: {
        'shimmer': 'shimmer 1.8s infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.7,0,0.3,1)',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-red': 'pulseRed 2s ease-in-out infinite',
        'slam-in': 'slamIn 0.3s cubic-bezier(0.7,0,0.3,1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(8,145,178,0.3)' },
          '50%': { boxShadow: '0 0 28px rgba(8,145,178,0.7)' },
        },
        slamIn: {
          '0%': { opacity: '0', transform: 'translateX(-40px) skewX(-3deg)' },
          '100%': { opacity: '1', transform: 'translateX(0) skewX(0deg)' },
        },
      },
    },
  },
  plugins: [],
}
