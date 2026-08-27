/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          950: '#0B0F19',
          900: '#0E1424',
          800: '#131B2E',
        },
        neon: {
          pink: '#EC4899',
          violet: '#8B5CF6',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 25px rgba(236, 72, 153, 0.35)',
        'glow-violet': '0 0 25px rgba(139, 92, 246, 0.35)',
        'glow-red': '0 0 30px rgba(239, 68, 68, 0.5)',
      },
      keyframes: {
        sparkle: {
          '0%, 100%': { opacity: 0, transform: 'scale(0.5)' },
          '50%': { opacity: 1, transform: 'scale(1.2)' },
        },
        'drift-slow': {
          '0%': { transform: 'translate(0,0)' },
          '50%': { transform: 'translate(20px,-15px)' },
          '100%': { transform: 'translate(0,0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(236,72,153,0.4)' },
          '50%': { boxShadow: '0 0 25px rgba(236,72,153,0.85)' },
        },
        'dash-flow': {
          to: { strokeDashoffset: -40 },
        },
        'fade-up': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        sparkle: 'sparkle 3s ease-in-out infinite',
        'drift-slow': 'drift-slow 8s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2.2s ease-in-out infinite',
        'dash-flow': 'dash-flow 1.5s linear infinite',
        'fade-up': 'fade-up 0.5s ease-out both',
      },
    },
  },
  plugins: [],
}
