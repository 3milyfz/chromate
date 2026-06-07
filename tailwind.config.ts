import type { Config } from 'tailwindcss';

/**
 * Chromate design system tokens.
 *
 * An archival-stationery palette: raw linen whites, warm concrete greys,
 * rich charcoal type, and dark espresso/chocolate accents. The analyzed
 * seasonal colors remain the only saturated elements on screen.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        linen: '#FAF9F6', // raw linen paper
        ivory: '#F4F3EF', // warm textured canvas
        suede: '#EFEBE6', // soft warm concrete
        concrete: '#D8D2C8', // mid warm grey
        stone: '#A89F93', // muted caption grey
        ash: '#6E665C', // secondary text
        ink: '#23201C', // rich charcoal type
        espresso: '#2B1E19', // dark chocolate accent
        bark: '#3A2A22', // softer espresso
        gilt: '#A88A5E', // restrained metallic accent
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        editorial: '0.25em',
        archive: '0.32em',
      },
      boxShadow: {
        deboss:
          'inset 0 2px 5px rgba(35,32,28,0.28), inset 0 -1px 2px rgba(255,255,255,0.55)',
        plate: '0 1px 2px rgba(35,32,28,0.10), 0 8px 22px rgba(35,32,28,0.10)',
        page: '0 30px 60px -25px rgba(35,32,28,0.45)',
        tab: '2px 2px 6px -2px rgba(35,32,28,0.30)',
      },
      keyframes: {
        'flap-open': {
          '0%': { transform: 'rotateX(0deg)' },
          '100%': { transform: 'rotateX(-178deg)' },
        },
        'insert-rise': {
          '0%': { transform: 'translateY(28%) scale(0.98)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'fade-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'flap-open': 'flap-open 0.9s cubic-bezier(0.22,0.61,0.36,1) forwards',
        'insert-rise': 'insert-rise 0.8s cubic-bezier(0.22,0.61,0.36,1) 0.45s both',
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22,0.61,0.36,1) forwards',
        'fade-in': 'fade-in 0.6s ease forwards',
      },
    },
  },
  plugins: [],
} satisfies Config;
