/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   '#000000',
          secondary: '#080808',
          card:      '#0d0d0d',
          hover:     '#111111',
          border:    'rgba(255,255,255,0.07)',
        },
        text: {
          primary:   '#FFFFFF',
          secondary: '#A1A1AA',
          muted:     '#52525B',
        },
        // App/dashboard accent only — never on public pages
        accent: {
          DEFAULT: '#2563EB',
          hover:   '#1d4ed8',
          light:   '#60A5FA',
          glow:    'rgba(37,99,235,0.15)',
        },
        success: {
          DEFAULT: '#10B981',
          light:   '#34D399',
          bg:      'rgba(16,185,129,0.1)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light:   '#FCD34D',
          bg:      'rgba(245,158,11,0.1)',
        },
        error: {
          DEFAULT: '#EF4444',
          light:   '#F87171',
          bg:      'rgba(239,68,68,0.1)',
        },
      },
      fontFamily: {
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg, #1E40AF 0%, #2563EB 60%, #3B82F6 100%)',
        'gradient-success': 'linear-gradient(135deg, #059669, #10B981)',
        'gradient-danger':  'linear-gradient(135deg, #DC2626, #EF4444)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.5s ease-out',
        'float':      'float 7s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
        'marquee':    'marquee 30s linear infinite',
        'star-pulse': 'star-pulse 5s ease-in-out infinite alternate',
        'spin-slow':  'spin 10s linear infinite',
      },
      keyframes: {
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:      { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float:        { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        shimmer:      { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        marquee:      { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'star-pulse': { '0%': { opacity: '0.3' }, '50%': { opacity: '0.85' }, '100%': { opacity: '0.5' } },
      },
      boxShadow: {
        'glow':         '0 0 20px rgba(37,99,235,0.2)',
        'glow-lg':      '0 0 40px rgba(37,99,235,0.3)',
        'glow-success': '0 0 20px rgba(16,185,129,0.2)',
        'card':         '0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.6)',
        'card-hover':   '0 1px 0 rgba(255,255,255,0.07), 0 8px 40px rgba(0,0,0,0.8)',
        'neu-flat':     '4px 4px 12px rgba(0,0,0,0.9), -4px -4px 12px rgba(255,255,255,0.02)',
        'neu-pressed':  'inset 4px 4px 10px rgba(0,0,0,0.9), inset -4px -4px 10px rgba(255,255,255,0.015)',
      },
      // Sharp radii — 8px max for buttons/inputs, 12px for cards
      borderRadius: {
        'sm':  '4px',
        DEFAULT: '6px',
        'md':  '8px',
        'lg':  '10px',
        'xl':  '12px',
        '2xl': '14px',
        '3xl': '16px',
        '4xl': '20px',
        'full': '9999px',
      },
    },
  },
  plugins: [],
};
