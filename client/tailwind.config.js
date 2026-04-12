export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'uno-red': '#EF4444',
        'uno-blue': '#3B82F6',
        'uno-green': '#22C55E',
        'uno-yellow': '#EAB308',
        'uno-dark': '#0F172A',
        'uno-darker': '#020617',
        'uno-card': '#1E293B',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-fast': 'pulse 0.5s infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'card-deal': 'cardDeal 0.5s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        cardDeal: {
          '0%': { transform: 'translateY(-200px) rotate(20deg)', opacity: 0 },
          '100%': { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #EF4444' },
          '100%': { boxShadow: '0 0 10px #fff, 0 0 20px #fff, 0 0 40px #EF4444' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-10px)' },
          '75%': { transform: 'translateX(10px)' },
        },
      },
      backgroundImage: {
        'uno-gradient': 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)',
      },
    },
  },
  plugins: [],
}