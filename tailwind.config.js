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
          primary: '#0a0a0f',
          secondary: '#12121a',
          tertiary: '#16162a',
          card: '#141420',
          hover: '#1e1e30',
          border: '#252540',
        },
        accent: {
          DEFAULT: '#00d4aa',
          hover: '#00b894',
          muted: '#009e80',
          subtle: 'rgba(0,212,170,0.1)',
          border: 'rgba(0,212,170,0.25)',
        },
        gold: {
          DEFAULT: '#f0c040',
          muted: 'rgba(240,192,64,0.12)',
          border: 'rgba(240,192,64,0.25)',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.7)',
        'card-hover': '0 12px 32px rgba(0,0,0,0.7), 0 4px 12px rgba(0,212,170,0.08)',
        'glow': '0 0 24px rgba(0,212,170,0.25)',
        'glow-sm': '0 0 12px rgba(0,212,170,0.15)',
        'gold': '0 0 20px rgba(240,192,64,0.2)',
      },
      animation: {
        'shimmer': 'shimmer 1.8s infinite',
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
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
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0,212,170,0.2)' },
          '50%': { boxShadow: '0 0 22px rgba(0,212,170,0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
}
