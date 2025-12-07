/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        neutral: {
          900: '#060607', // near black
          800: '#0b0b0d',
          700: '#161618',
          500: '#9c9aa0'
        },
        gold: {
          50: '#fff9f2',
          100: '#fff3e6',
          300: '#d4b86f',
          DEFAULT: 'rgb(212 175 55)', // use as rgb(var) if needed
        },
        glass: 'rgba(255,255,255,0.04)'
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px'
      },
      boxShadow: {
        'soft-lg': '0 12px 30px rgba(2,6,23,0.45)',
        'card': '0 6px 22px rgba(2,6,23,0.35)'
      },
      keyframes: {
        float: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
          '100%': { transform: 'translateY(0px)' }
        },
        shine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shine: 'shine 1.2s linear infinite'
      }
    }
  },
  plugins: []
}
