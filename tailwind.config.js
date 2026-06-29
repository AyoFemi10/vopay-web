/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // VOPayX Brand Colors
        bg: {
          primary:   '#0A0A0A',
          secondary: '#111111',
          card:      '#1A1A1A',
          hover:     '#222222',
          border:    '#2A2A2A',
        },
        text: {
          primary:   '#FFFFFF',
          secondary: '#B3B3B3',
          muted:     '#666666',
        },
        accent: {
          DEFAULT: '#3B82F6',
          hover:   '#2563EB',
          light:   '#60A5FA',
          glow:    'rgba(59,130,246,0.15)',
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
        'gradient-brand':    'linear-gradient(135deg, #2563EB 0%, #3B82F6 50%, #60A5FA 100%)',
        'gradient-dark':     'linear-gradient(135deg, #0A0A0A 0%, #1A1A2E 100%)',
        'gradient-card':     'linear-gradient(135deg, #1A1A1A 0%, #222222 100%)',
        'gradient-success':  'linear-gradient(135deg, #059669, #10B981)',
        'gradient-danger':   'linear-gradient(135deg, #DC2626, #EF4444)',
        'gradient-glow':     'radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, transparent 70%)',
      },
      animation: {
        'fade-in':      'fadeIn 0.4s ease-out',
        'slide-up':     'slideUp 0.4s ease-out',
        'slide-down':   'slideDown 0.3s ease-out',
        'scale-in':     'scaleIn 0.3s ease-out',
        'pulse-glow':   'pulseGlow 2s ease-in-out infinite',
        'float':        'float 6s ease-in-out infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'spin-slow':    'spin 8s linear infinite',
        'bounce-soft':  'bounceSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59,130,246,0.3)' },
          '50%':       { boxShadow: '0 0 40px rgba(59,130,246,0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-6px)' },
        },
      },
      boxShadow: {
        'glow':         '0 0 30px rgba(59,130,246,0.2)',
        'glow-lg':      '0 0 60px rgba(59,130,246,0.3)',
        'glow-success': '0 0 30px rgba(16,185,129,0.2)',
        'card':         '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover':   '0 8px 40px rgba(0,0,0,0.6)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
