/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy brand colors (maintained for backwards compatibility)
        brand: {
          blue: '#155dfc',
          purple: '#8B5CF6',
          orange: '#F97316',
        },

        // Primary Color System (Class Management & Main UI)
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',  // Primary button & accents
          600: '#2563EB',  // Hover states
          700: '#1D4ED8',  // Active states
          800: '#1E40AF',
          900: '#1E3A8A',
        },

        // Secondary Color System (Accents & Highlights)
        secondary: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',  // Purple accents
          600: '#7C3AED',  // Purple hover
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },

        // Neutral Color System (Unified gray/slate)
        neutral: {
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

        // Semantic Colors (Status indicators)
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#06b6d4',
      },

      // 8-Point Spacing System
      spacing: {
        0: '0px',
        0.5: '2px',
        1: '4px',    // 0.25rem - micro spacing
        1.5: '6px',
        2: '8px',    // 0.5rem  - tight spacing
        2.5: '10px',
        3: '12px',   // 0.75rem - standard gap
        3.5: '14px',
        4: '16px',   // 1rem    - default padding
        5: '20px',   // 1.25rem - medium padding
        6: '24px',   // 1.5rem  - section padding
        7: '28px',
        8: '32px',   // 2rem    - large padding
        9: '36px',
        10: '40px',  // 2.5rem  - extra large
        11: '44px',
        12: '48px',  // 3rem    - hero padding
        14: '56px',
        16: '64px',
        20: '80px',
        24: '96px',
        28: '112px',
        32: '128px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
