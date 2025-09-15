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
        // Cream/Beige + Orange color system
        primary: {
          50: '#fff7f0',
          100: '#ffede0',
          200: '#ffd9c0',
          300: '#ffc299',
          400: '#ffa366',
          500: '#ff5500', // Main orange accent
          600: '#e64d00',
          700: '#cc4400',
          800: '#b33a00',
          900: '#993000',
        },
        cream: {
          50: '#fefdfb',
          100: '#fdf9f3',
          200: '#faf2e7',
          300: '#f6e8d5',
          400: '#f0dcc0',
          500: '#e8d0a8',
          600: '#d4b894',
          700: '#b89d7a',
          800: '#9c8260',
          900: '#806a4a',
        },
        beige: {
          50: '#faf9f7',
          100: '#f5f3f0',
          200: '#ebe7e1',
          300: '#ddd6cc',
          400: '#c9bfb0',
          500: '#b5a894',
          600: '#a18f78',
          700: '#8d7a5c',
          800: '#796540',
          900: '#655024',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // Soft muted backgrounds
        surface: {
          50: '#fefdfb',
          100: '#fdf9f3',
          200: '#faf2e7',
          300: '#f6e8d5',
          400: '#f0dcc0',
        }
      },
      borderRadius: {
        'soft': '12px',
        'medium': '16px',
        'large': '20px',
      },
      boxShadow: {
        'neumorphic': '2px 2px 4px rgba(0, 0, 0, 0.06), -2px -2px 4px rgba(255, 255, 255, 0.8)',
        'neumorphic-inset': 'inset 1px 1px 2px rgba(0, 0, 0, 0.06), inset -1px -1px 2px rgba(255, 255, 255, 0.8)',
        'soft': '0 1px 3px rgba(0, 0, 0, 0.04)',
        'tactile': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'minimal': '0 1px 1px rgba(0, 0, 0, 0.02)',
        'elevated': '0 2px 4px rgba(0, 0, 0, 0.06)',
      },
      fontFamily: {
        'system': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'hierarchy': ['16px', '1.5'],
        'hierarchy-lg': ['20px', '1.4'],
        'hierarchy-xl': ['24px', '1.4'],
        'hierarchy-2xl': ['32px', '1.3'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      animation: {
        'spring': 'spring 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        spring: {
          '0%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}