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
    'nav-item',
    'tap-highlight-transparent',
    'fluid-h1',
    'fluid-lead',
    'measure-30',
    'measure-34',
    'measure-36',
    'widow-fix',
    'has-fab-bottom-pad',
    'measure-28',
    'measure-32',
    'measure-fluid',
    'widow-tweak',
    'center-paragraph',
    'nb',
    'only-mobile',
    'jp-phrase-aware',
    'jp-body-mobile-left',
    'measure-tight',
    'ui-rail',
    'ui-h1',
    'ui-h2',
    'ui-h3',
    'ui-lead',
    'ui-body',
    'ui-measure-hero',
    'ui-measure-lead',
    'ui-measure-body',
    'ui-section-gap',
    'ui-paragraph-gap',
    'ui-bottom-content',
    'ui-fab-layer',
    'ui-fab-backdrop',
    'ui-carousel-pricing',
    'ui-carousel-center-2',
    'ui-pricing-grid'
  ],
  corePlugins: {
    textWrap: true,
  },
  theme: {
    extend: {
      colors: {
        brand: 'var(--color-brand)',
        accent: 'var(--color-accent)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        bg: 'var(--color-bg)',
        error: 'var(--color-error)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
      },
      fontSize: {
        'h1': 'var(--font-size-h1)',
        'h2': 'var(--font-size-h2)',
        'h3': 'var(--font-size-h3)',
        'body': 'var(--font-size-body)',
        'small': 'var(--font-size-small)',
      },
      lineHeight: {
        'tight': 'var(--line-height-tight)',
        'body': 'var(--line-height-body)',
        'relaxed': 'var(--line-height-relaxed)',
      },
      spacing: {
        'xs': 'var(--space-xs)',
        's': 'var(--space-s)',
        'm': 'var(--space-m)',
        'l': 'var(--space-l)',
        'xl': 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
      },
      borderRadius: {
        's': 'var(--radius-s)',
        'm': 'var(--radius-m)',
        'l': 'var(--radius-l)',
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'hover': 'var(--shadow-hover)',
      },
      zIndex: {
        'fab': 'var(--z-fab)',
        'fab-backdrop': 'var(--z-fab-backdrop)',
        'modal': 'var(--z-modal)',
        'toast': 'var(--z-toast)',
      },
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