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
        'sk4-orange-light': '#ff8533',
        'sk4-orange-dark': '#cc5200',
        'sk4-radio-bg': '#1a1a1a',
        'sk4-radio-text': '#f0c14b',
      },
      borderRadius: {
        'sk4': '0px', // Flat design - no rounded corners except circles
        'sk4-soft': '8px', // Subtle rounding for modern feel
        'sk4-card': '12px', // Card elements
        'sk4-circle': '50%', // Only for circular elements
      },
      // Enhanced shadows with minimalist approach
      boxShadow: {
        'sk4-soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'sk4-medium': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'sk4-hard': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'sk4-glow': '0 0 20px rgba(255, 102, 0, 0.2)',
        'sk4-glow-strong': '0 0 30px rgba(255, 102, 0, 0.4)',
      },
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
        'sk4-lp-rotate': 'sk4LpRotate 8s linear infinite',
        'sk4-hover': 'sk4Hover 0.3s ease',
        'sk4-color-transition': 'sk4ColorTransition 0.2s ease',
        'sk4-float': 'sk4Float 2.8s ease-in-out infinite alternate',
        'sk4-pulse': 'sk4Pulse 0.6s ease-in-out',
        'sk4-slide-in': 'sk4SlideIn 0.3s ease-out',
        'sk4-fade-in': 'sk4FadeIn 0.2s ease-out',
        'sk4-scale-in': 'sk4ScaleIn 0.2s ease-out',
        'sk4-glow-pulse': 'sk4GlowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        sk4LpRotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        sk4Hover: {
          '0%': { transform: 'translateY(0px)' },
          '100%': { transform: 'translateY(-2px)' },
        },
        sk4ColorTransition: {
          '0%': { opacity: '1' },
          '100%': { opacity: '1' },
        },
        sk4Float: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-3px)' },
        },
        sk4Pulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        sk4SlideIn: {
          'from': { transform: 'translateY(20px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        sk4FadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        sk4ScaleIn: {
          'from': { transform: 'scale(0.95)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' },
        },
        sk4GlowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 102, 0, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(255, 102, 0, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}