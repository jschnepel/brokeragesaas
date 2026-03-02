/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      /* ── 1. Colors ─────────────────────────────────────── */
      colors: {
        // Design system brand colors (DESIGN_SYSTEM.md §1)
        navy: '#0C1C2E',
        gold: '#BFA67A',
        cream: '#F9F8F6',
        'cream-alt': '#F5F5F0',
        accent: '#E07A5F',
        'navy-mid': '#162a42',

        // Phase 0 compat — primary remapped to navy tones
        primary: {
          50: '#eef2f5',
          100: '#d5dee6',
          200: '#abbdcd',
          300: '#819cb4',
          400: '#57799a',
          500: '#1a3550',
          600: '#0C1C2E',
          700: '#0a1826',
          800: '#08131e',
          900: '#040a12',
        },
        // Phase 0 compat — secondary stays neutral gray (zinc)
        secondary: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
      },

      /* ── 2. Typography ─────────────────────────────────── */
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '3xs': ['0.4375rem', { lineHeight: '1.2' }],   // 7px
        '2xs': ['0.5rem', { lineHeight: '1.2' }],       // 8px
        meta: ['0.5625rem', { lineHeight: '1.4' }],      // 9px
        label: ['0.625rem', { lineHeight: '1.4' }],      // 10px
        tab: ['0.6875rem', { lineHeight: '1.4' }],       // 11px
        'body-lg': ['0.9375rem', { lineHeight: '1.6' }], // 15px
        narrative: ['1rem', { lineHeight: '1.75' }],      // 16px
      },
      letterSpacing: {
        xs: '0.15em',
        sm: '0.2em',
        md: '0.25em',
        lg: '0.3em',
        xl: '0.4em',
      },

      /* ── 3. Layout ─────────────────────────────────────── */
      maxWidth: {
        narrow: '800px',
        'content-sm': '900px',
        content: '1400px',
        'content-lg': '1600px',
        'content-xl': '1800px',
      },

      /* ── 4. Shadows ────────────────────────────────────── */
      boxShadow: {
        card: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
        marker: '0 2px 8px rgba(0,0,0,0.3)',
      },

      /* ── 5. Z-Index ────────────────────────────────────── */
      zIndex: {
        base: '0',
        overlay: '10',
        float: '20',
        popup: '30',
        nav: '50',
      },

      /* ── 6. Animation ──────────────────────────────────── */
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeSlideIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'fade-in': 'fade-in 0.8s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        float: 'float 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
