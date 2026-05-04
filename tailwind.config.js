/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'cyber-blue': '#00D4FF',
        'cyber-purple': '#B700FF',
        'cyber-green': '#00FF88',
        'cyber-dark': '#0A0A0F',
        'cyber-darker': '#05050A',
        'cyber-gray': '#1A1A25',
      },
      fontFamily: {
        'cyber': ['Share Tech Mono', 'monospace'],
        'orbitron': ['Orbitron', 'sans-serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'pulse-cyber': 'pulse-cyber 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.6s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { 
            'box-shadow': '0 0 5px #00D4FF, 0 0 10px #00D4FF, 0 0 15px #00D4FF',
          },
          '100%': { 
            'box-shadow': '0 0 10px #00D4FF, 0 0 20px #00D4FF, 0 0 30px #00D4FF',
          }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        'pulse-cyber': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' }
        },
        'slide-up': {
          '0%': { transform: 'translateY(100px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #0A0A0F 0%, #1A1A25 100%)',
        'cyber-card': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      }
    },
  },
  plugins: [],
}