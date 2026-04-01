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
        correct: {
          DEFAULT: '#10b981',
          muted: 'rgba(16,185,129,0.1)',
          border: 'rgba(16,185,129,0.35)',
        },
        wrong: {
          DEFAULT: '#ff1744',
          muted: 'rgba(255,23,68,0.1)',
          border: 'rgba(255,23,68,0.35)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        bebas: ['"Bebas Neue"', 'sans-serif'],
        barlow: ['"Barlow Condensed"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.8)',
        'card-hover': '0 16px 48px rgba(0,0,0,0.8), 0 4px 16px rgba(8,145,178,0.15)',
        'glow': '0 0 24px rgba(8,145,178,0.3)',
        'glow-sm': '0 0 12px rgba(8,145,178,0.2)',
        'gold': '0 0 20px rgba(240,192,64,0.25)',
        'correct': '0 0 24px rgba(16,185,129,0.4)',
        'wrong': '0 0 24px rgba(255,23,68,0.4)',
      },
      animation: {
        'shimmer': 'shimmer 1.8s infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.22,1,0.36,1)',
        'slide-in-left': 'slideInLeft 0.35s cubic-bezier(0.22,1,0.36,1)',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-accent': 'pulseAccent 2s ease-in-out infinite',
        'slam-in': 'slamIn 0.4s cubic-bezier(0.22,1,0.36,1)',
        'slam-up': 'slamUp 0.38s cubic-bezier(0.22,1,0.36,1)',
        'p5-wipe': 'p5Wipe 0.45s cubic-bezier(0.22,1,0.36,1)',
        'scanline': 'scanline 2.5s linear infinite',
        'scan-load': 'scanLoad 1.6s ease-in-out infinite',
        'diagonal-flash': 'diagonalFlash 0.5s cubic-bezier(0.22,1,0.36,1)',
        'counter-tick': 'counterTick 0.25s cubic-bezier(0.22,1,0.36,1)',
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
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-32px) skewX(-4deg)' },
          '70%': { opacity: '1', transform: 'translateX(3px) skewX(0.5deg)' },
          '100%': { opacity: '1', transform: 'translateX(0) skewX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.93)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseAccent: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(8,145,178,0.25)' },
          '50%': { boxShadow: '0 0 32px rgba(8,145,178,0.65)' },
        },
        slamIn: {
          '0%': { opacity: '0', transform: 'translateX(-80px) skewX(-8deg)' },
          '65%': { opacity: '1', transform: 'translateX(5px) skewX(1deg)' },
          '100%': { opacity: '1', transform: 'translateX(0) skewX(0)' },
        },
        slamUp: {
          '0%': { opacity: '0', transform: 'translateY(50px) skewY(3deg)' },
          '65%': { opacity: '1', transform: 'translateY(-5px) skewY(-0.5deg)' },
          '100%': { opacity: '1', transform: 'translateY(0) skewY(0)' },
        },
        p5Wipe: {
          '0%': { clipPath: 'polygon(0 0, 0 0, 0 100%, 0% 100%)' },
          '100%': { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        scanLoad: {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
          '45%': { transform: 'scaleX(1)', transformOrigin: 'left' },
          '55%': { transform: 'scaleX(1)', transformOrigin: 'right' },
          '100%': { transform: 'scaleX(0)', transformOrigin: 'right' },
        },
        diagonalFlash: {
          '0%': { opacity: '0', transform: 'translateX(-100%) skewX(-20deg)' },
          '50%': { opacity: '0.4' },
          '100%': { opacity: '0', transform: 'translateX(200%) skewX(-20deg)' },
        },
        counterTick: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
