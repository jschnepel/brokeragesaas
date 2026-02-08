/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50, #f0f9ff)',
          100: 'var(--color-primary-100, #e0f2fe)',
          200: 'var(--color-primary-200, #bae6fd)',
          300: 'var(--color-primary-300, #7dd3fc)',
          400: 'var(--color-primary-400, #38bdf8)',
          500: 'var(--color-primary-500, #0ea5e9)',
          600: 'var(--color-primary-600, #0284c7)',
          700: 'var(--color-primary-700, #0369a1)',
          800: 'var(--color-primary-800, #075985)',
          900: 'var(--color-primary-900, #0c4a6e)',
        },
        secondary: {
          50: 'var(--color-secondary-50, #fafafa)',
          100: 'var(--color-secondary-100, #f4f4f5)',
          200: 'var(--color-secondary-200, #e4e4e7)',
          300: 'var(--color-secondary-300, #d4d4d8)',
          400: 'var(--color-secondary-400, #a1a1aa)',
          500: 'var(--color-secondary-500, #71717a)',
          600: 'var(--color-secondary-600, #52525b)',
          700: 'var(--color-secondary-700, #3f3f46)',
          800: 'var(--color-secondary-800, #27272a)',
          900: 'var(--color-secondary-900, #18181b)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.secondary.700'),
            a: {
              color: theme('colors.primary.600'),
              '&:hover': {
                color: theme('colors.primary.500'),
              },
            },
          },
        },
      }),
    },
  },
  plugins: [],
};
