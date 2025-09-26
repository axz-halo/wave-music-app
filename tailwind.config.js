/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // SK4 Color System - Dieter Rams inspired
        'sk4-white': '#ffffff',
        'sk4-off-white': '#fafafa',
        'sk4-light-gray': '#f8f8f8',
        'sk4-gray': '#e0e0e0',
        'sk4-medium-gray': '#cccccc',
        'sk4-dark-gray': '#666666',
        'sk4-charcoal': '#333333',
        'sk4-orange': '#ff6600',
        'sk4-radio-bg': '#1a1a1a',
        'sk4-radio-text': '#f0c14b',
      },
      borderRadius: {
        'sk4': '0px', // Flat design - no rounded corners except circles
        'sk4-circle': '50%', // Only for circular elements
      },
      // No shadows - completely flat design
      boxShadow: {},
      fontFamily: {
        'sk4': ['SF Pro Display', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'sk4-mono': ['SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        'sk4-xs': ['11px', '1.3'], // Timestamps, secondary info
        'sk4-sm': ['12px', '1.3'], // Artist names, captions
        'sk4-base': ['13px', '1.3'], // Usernames, comments
        'sk4-lg': ['16px', '1.3'], // Track titles, body text
        'sk4-xl': ['18px', '1.2'], // Large titles (desktop only)
      },
      spacing: {
        'sk4-sm': '8px',      // Small spacing
        'sk4-sm-plus': '14px', // Small plus spacing (for wave cards)
        'sk4-md': '16px',     // Medium spacing
        'sk4-lg': '24px',     // Large spacing
        'sk4-xl': '32px',     // Extra large spacing (special cases only)
      },
      animation: {
        // Only 3 animations allowed - Dieter Rams principle
        'sk4-lp-rotate': 'sk4LpRotate 8s linear infinite', // LP record rotation
        'sk4-hover': 'sk4Hover 0.2s ease', // Hover effect
        'sk4-color-transition': 'sk4ColorTransition 0.2s ease', // Color transitions
      },
      keyframes: {
        sk4LpRotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        sk4Hover: {
          '0%': { transform: 'translateY(0px)' },
          '100%': { transform: 'translateY(-1px)' },
        },
        sk4ColorTransition: {
          '0%': { opacity: '1' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}