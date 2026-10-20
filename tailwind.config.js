/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        brand: ['Montserrat', 'Poppins', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fff1f1',
          100: '#ffe1e1',
          200: '#ffc8c8',
          500: '#FF2E2E', // Exact TH3EE Brand Red
          600: '#e51d1d',
          700: '#c51010',
          800: '#990d0d',
          dark: '#111113',
          graphite: '#1c1c20',
        }
      },
      animation: {
        'float-slow': 'floating 4.8s ease-in-out infinite',
        'float-delay': 'floating 5.6s ease-in-out 1.2s infinite',
        'float-shield': 'shieldFloat 4s ease-in-out infinite',
        'key-bob': 'keyBob 3.2s ease-in-out infinite',
        'sway': 'sway 4.2s ease-in-out infinite',
      },
      keyframes: {
        floating: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shieldFloat: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-6px) rotate(-3deg)' },
        },
        keyBob: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-5px) rotate(-1.5deg)' },
        },
        sway: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(1.5deg)' },
        }
      }
    }
  },
  plugins: [],
};
