import type { Config } from 'tailwindcss';

/**
 * Chromate design system tokens.
 *
 * The palette is deliberately restrained — a gallery-white canvas, ink-black
 * type, and a thin spectrum of warm neutrals — so that the analyzed seasonal
 * colors remain the only saturated elements on screen.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F5F1', // gallery paper
        ink: '#14110F', // near-black editorial type
        ash: '#8C857C', // muted captions
        bone: '#E7E2DA', // hairline dividers
        gilt: '#A88A5E', // restrained metallic accent
      },
      fontFamily: {
        display: ['"Canela"', 'Georgia', 'serif'],
        body: ['"Suisse Intl"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"GT America Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        editorial: '0.22em',
      },
    },
  },
  plugins: [],
} satisfies Config;
