/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
  ],
  darkMode: 'class', // Habilitar modo oscuro basado en clase
  theme: {
    extend: {
      colors: {
        // 🎨 NUEVA PALETA MODERNA 2025
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF', 
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1', // Indigo vibrante principal
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        secondary: {
          50: '#FDF2F8',
          100: '#FCE7F3',
          200: '#FBCFE8',
          300: '#F9A8D4',
          400: '#F472B6',
          500: '#EC4899', // Pink moderno principal
          600: '#DB2777',
          700: '#BE185D',
          800: '#9D174D',
          900: '#831843',
        },
        
        // 🌈 COLORES SEMÁNTICOS VIBRANTES
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981', // Emerald principal
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B', // Amber principal
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444', // Red principal
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        info: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#06B6D4', // Cyan principal
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
        },
        
        // 🎭 NEUTROS MODERNOS
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },

        // 🌙 MODO OSCURO VIBRANTE
        dark: {
          primary: '#818CF8',      // Primary más claro para modo oscuro
          'bg-primary': '#0F172A', // Slate 900
          'bg-secondary': '#1E293B', // Slate 800  
          'bg-surface': '#334155',  // Slate 700
          'text-primary': '#F8FAFC', // Slate 50
          'text-secondary': '#CBD5E1', // Slate 300
          'text-muted': '#94A3B8',   // Slate 400
          'border': '#475569',       // Slate 600
        }
      },

      // 🎨 GRADIENTES MODERNOS
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #EC4899 0%, #F59E0B 100%)',
        'gradient-success': 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
        'gradient-warning': 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
        'gradient-danger': 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
        'gradient-info': 'linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)',
        'gradient-surface': 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
        'glass-light': 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
        'glass-dark': 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.4) 100%)',
      },

      // 🔮 GLASSMORPHISM & ELEVATION SYSTEM  
      boxShadow: {
        // Sombras estándar mejoradas
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        
        // Sombras con color para elementos vibrantes
        'primary': '0 10px 15px -3px rgba(99, 102, 241, 0.2), 0 4px 6px -2px rgba(99, 102, 241, 0.1)',
        'secondary': '0 10px 15px -3px rgba(236, 72, 153, 0.2), 0 4px 6px -2px rgba(236, 72, 153, 0.1)',
        'success': '0 10px 15px -3px rgba(16, 185, 129, 0.2), 0 4px 6px -2px rgba(16, 185, 129, 0.1)',
        'warning': '0 10px 15px -3px rgba(245, 158, 11, 0.2), 0 4px 6px -2px rgba(245, 158, 11, 0.1)',
        'danger': '0 10px 15px -3px rgba(239, 68, 68, 0.2), 0 4px 6px -2px rgba(239, 68, 68, 0.1)',
        'info': '0 10px 15px -3px rgba(6, 182, 212, 0.2), 0 4px 6px -2px rgba(6, 182, 212, 0.1)',
        
        // Glassmorphism shadows
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-hover': '0 20px 40px -14px rgba(31, 38, 135, 0.5)',
        
        // Sombras para modo oscuro
        'dark-xs': '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        'dark-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        'dark-md': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        'dark-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
      },

      // 🔄 BORDER RADIUS MODERNO
      borderRadius: {
        'xs': '0.125rem',  // 2px
        'sm': '0.25rem',   // 4px
        'md': '0.5rem',    // 8px
        'lg': '0.75rem',   // 12px
        'xl': '1rem',      // 16px
        '2xl': '1.5rem',   // 24px
        '3xl': '2rem',     // 32px
        'full': '9999px',  // Circular
      },

      // 📏 ESPACIADO EXPONENCIAL
      spacing: {
        '0.5': '0.125rem',  // 2px
        '1.5': '0.375rem',  // 6px
        '2.5': '0.625rem',  // 10px
        '3.5': '0.875rem',  // 14px
        '4.5': '1.125rem',  // 18px
        '5.5': '1.375rem',  // 22px
        '6.5': '1.625rem',  // 26px
        '7.5': '1.875rem',  // 30px
        '8.5': '2.125rem',  // 34px
        '9.5': '2.375rem',  // 38px
        '11': '2.75rem',    // 44px
        '13': '3.25rem',    // 52px
        '15': '3.75rem',    // 60px
        '17': '4.25rem',    // 68px
        '18': '4.5rem',     // 72px
        '19': '4.75rem',    // 76px
        '21': '5.25rem',    // 84px
        '22': '5.5rem',     // 88px
        '23': '5.75rem',    // 92px
        '26': '6.5rem',     // 104px
        '28': '7rem',       // 112px
        '30': '7.5rem',     // 120px
        '34': '8.5rem',     // 136px
        '36': '9rem',       // 144px
        '44': '11rem',      // 176px
        '52': '13rem',      // 208px
        '60': '15rem',      // 240px
        '68': '17rem',      // 272px
        '76': '19rem',      // 304px
      },

      // 🎬 ANIMACIONES MODERNAS
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 4s ease-in-out infinite alternate',
        'slide-up': 'slideUp 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        'glass-appear': 'glassAppear 600ms cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },

      // 🎯 KEYFRAMES MODERNOS
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-30px) rotate(120deg)' },
          '66%': { transform: 'translateY(-20px) rotate(240deg)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.3', filter: 'blur(80px)' },
          '50%': { opacity: '0.6', filter: 'blur(100px)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        glassAppear: {
          from: { 
            opacity: '0', 
            transform: 'translateY(20px) scale(0.95)',
            backdropFilter: 'blur(0px)',
          },
          to: { 
            opacity: '1', 
            transform: 'translateY(0) scale(1)',
            backdropFilter: 'blur(20px)',
          },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.7)' },
          '50%': { boxShadow: '0 0 0 10px rgba(99, 102, 241, 0)' },
        },
      },

      // ⏱️ TIMING FUNCTIONS NATURALES
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'ease-spring': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ease-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.35)',
      },

      // 🎨 BACKDROP BLUR MODERNO
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
        '20': '20px',
        '40': '40px',
        '84': '21rem',      // 336px
        '92': '23rem',      // 368px
        '100': '25rem',     // 400px
        '104': '26rem',     // 416px
        '112': '28rem',     // 448px
        '128': '32rem',     // 512px
      },

      // 🎬 ANIMACIONES NATURALES
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce 2s infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s infinite',
        'glass-appear': 'glassAppear 0.6s ease-out',
        'hover-lift': 'hoverLift 0.25s ease-out',
      },

      // 📐 TIMING FUNCTIONS NATURALES
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.35)',
        'spring': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },

      // 🔠 TIPOGRAFÍA FLUIDA  
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],      // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],       // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],  // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],    // 36px
        '5xl': ['3rem', { lineHeight: '1' }],            // 48px
        '6xl': ['3.75rem', { lineHeight: '1' }],         // 60px
        '7xl': ['4.5rem', { lineHeight: '1' }],          // 72px
        '8xl': ['6rem', { lineHeight: '1' }],            // 96px
        '9xl': ['8rem', { lineHeight: '1' }],            // 128px
      },

      // ✨ BACKDROP BLUR PARA GLASSMORPHISM
      backdropBlur: {
        'none': '0',
        'sm': '4px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '40px',
        '3xl': '64px',
      },

      // 🔧 SCALE UTILITIES
      scale: {
        '102': '1.02',
        '105': '1.05',
      },

      // 🎯 Z-INDEX PARA MODALES Y OVERLAYS
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
        'modal': '50000',
        'modal-backdrop': '49999',
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'tooltip': '1070',
        'popover': '1080',
      },
    },
  },

  // 🔌 PLUGINS NECESARIOS
  plugins: [
    // Función para agregar utilities personalizados
    function({ addUtilities }) {
      const newUtilities = {
        '.glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          background: 'rgba(30, 41, 59, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.hover-lift': {
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            transform: 'translateY(-4px) scale(1.02)',
          }
        }
      }
      addUtilities(newUtilities)
    }
  ],
}

// Keyframes personalizados (se pueden agregar con plugin adicional)
const keyframes = `
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-10px) rotate(1deg); }
  66% { transform: translateY(-5px) rotate(-1deg); }
}

@keyframes glow {
  from { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); }
  to { box-shadow: 0 0 30px rgba(99, 102, 241, 0.6); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes glassAppear {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    backdrop-filter: blur(20px);
  }
}

@keyframes hoverLift {
  from { transform: translateY(0) scale(1); }
  to { transform: translateY(-4px) scale(1.02); }
}
`
