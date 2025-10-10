/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/globals.css',
  ],
  safelist: [
    'jp-heading',
    'jp-body',
    'jp-cta',
    'btn-nowrap',
    'footer-link-nowrap',
    'card-text',
    'jp-avoid-break',
    'jp-number-unit',
    'jp-step-number',
    'jp-text-natural',
    'jp-punctuation-safe',
    'jp-faq-question',
    'cta-btn',
    'cta-btn--primary',
    'cta-btn--outline',
    'step-card',
    'step-badge',
    'section-pad',
    'section-gap',
    'section-spacing',
    'no-widow',
    'nav-link',
    'tap-highlight-transparent'
  ],
  corePlugins: {
    textWrap: true,
  },
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            textWrap: 'balance',
          },
        },
      },
      animation: {
        'blob': 'blob 7s infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
      },
      keyframes: {
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-20px)',
          },
        },
        'fade-in': {
          '0%': {
            opacity: '0',
          },
          '100%': {
            opacity: '1',
          },
        },
        'slide-up': {
          '0%': {
            transform: 'translateY(100px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}