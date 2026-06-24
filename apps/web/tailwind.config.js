export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        space: ['Plus Jakarta Sans', 'Space Grotesk', 'sans-serif']
      },
      colors: {
        dark: '#06080F',
        surface: '#0D1117',
        card: '#161B22',
        'card-hover': '#1C2333',
        purple: { DEFAULT: '#A855F7', light: '#C084FC', dark: '#7C3AED' },
        cyan: { DEFAULT: '#22D3EE', light: '#67E8F9', dark: '#06B6D4' },
        gold: { DEFAULT: '#F59E0B', light: '#FCD34D', dark: '#D97706' },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        border: 'rgba(255,255,255,0.06)',
        // Legacy fallbacks
        royal: '#A855F7',
        cyanNeon: '#22D3EE',
        ink: '#06080F',
        midnight: '#0D1117',
        velvet: '#161B22'
      },
      boxShadow: {
        glow: '0 0 40px rgba(168, 85, 247, 0.15)',
        'glow-lg': '0 0 60px rgba(168, 85, 247, 0.2)',
        cyan: '0 0 30px rgba(34, 211, 238, 0.2)',
        'cyan-lg': '0 0 50px rgba(34, 211, 238, 0.25)',
        gold: '0 0 30px rgba(245, 158, 11, 0.2)',
        neon: '0 0 20px rgba(168, 85, 247, 0.3), 0 0 40px rgba(168, 85, 247, 0.1)',
        'card-glow': '0 8px 32px rgba(0,0,0,0.4)'
      },
      animation: {
        'float': 'float 8s ease-in-out infinite',
        'float-delayed': 'float-delayed 12s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'grid-move': 'grid-scroll 30s linear infinite',
        'shimmer': 'shimmer 3s linear infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-20px) scale(1.05)' }
        },
        'float-delayed': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-30px) rotate(3deg)' }
        },
        'grid-scroll': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '60px 60px' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    }
  },
  plugins: []
};
