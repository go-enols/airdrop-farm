export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'
  },
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'
  },
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12'
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d'
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f'
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d'
  },
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e'
  },
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87'
  },
  cyan: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63'
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712'
  }
}
export const theme = {
  colors: {
    primary: colors.primary[500],
    primaryHover: colors.primary[600],
    primaryLight: colors.primary[100],
    primaryDark: colors.primary[700],
    success: colors.success[500],
    successHover: colors.success[600],
    successLight: colors.success[100],
    warning: colors.warning[500],
    warningHover: colors.warning[600],
    warningLight: colors.warning[100],
    danger: colors.danger[500],
    dangerHover: colors.danger[600],
    dangerLight: colors.danger[100],
    info: colors.info[500],
    infoHover: colors.info[600],
    infoLight: colors.info[100],
    bgPage: 'var(--color-bg-page, #f9fafb)',
    bgCard: 'var(--color-bg-card, #ffffff)',
    bgCardHover: 'var(--color-bg-card-hover, #f9fafb)',
    bgTertiary: 'var(--color-bg-tertiary, #f3f4f6)',
    borderLight: 'var(--color-border-light, #e5e7eb)',
    borderHover: 'var(--color-border-hover, #d1d5db)',
    textPrimary: 'var(--color-text-primary, #111827)',
    textSecondary: 'var(--color-text-secondary, #4b5563)',
    textMuted: 'var(--color-text-muted, #6b7280)',
    shadowCard: 'var(--color-shadow-card, 0 1px 3px rgba(0, 0, 0, 0.1))',
    shadowCardHover: 'var(--color-shadow-card-hover, 0 4px 6px rgba(0, 0, 0, 0.1))'
  },
  status: {
    running: {
      bg: colors.blue[100],
      text: colors.blue[700],
      border: colors.blue[200]
    },
    complete: {
      bg: colors.success[100],
      text: colors.success[700],
      border: colors.success[200]
    },
    error: {
      bg: colors.danger[100],
      text: colors.danger[700],
      border: colors.danger[200]
    },
    idle: {
      bg: colors.gray[100],
      text: colors.gray[600],
      border: colors.gray[200]
    },
    paused: {
      bg: colors.warning[100],
      text: colors.warning[700],
      border: colors.warning[200]
    },
    stopped: {
      bg: colors.orange[100],
      text: colors.orange[700],
      border: colors.orange[200]
    },
    active: {
      bg: colors.success[100],
      text: colors.success[700],
      border: colors.success[200]
    },
    inactive: {
      bg: colors.gray[100],
      text: colors.gray[600],
      border: colors.gray[200]
    },
    expired: {
      bg: colors.danger[100],
      text: colors.danger[700],
      border: colors.danger[200]
    }
  },
  walletType: {
    evm: {
      bg: colors.blue[100],
      text: colors.blue[700]
    },
    solana: {
      bg: colors.purple[100],
      text: colors.purple[700]
    },
    sui: {
      bg: colors.cyan[100],
      text: colors.cyan[700]
    }
  }
}
export const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        'bg-page': '#f9fafb',
        'bg-card': '#ffffff',
        'bg-card-hover': '#f9fafb',
        'bg-tertiary': '#f3f4f6',
        'border-light': '#e5e7eb',
        'border-hover': '#d1d5db',
        'text-primary': '#111827',
        'text-secondary': '#4b5563',
        'text-muted': '#6b7280',
        'shadow-card': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'shadow-card-hover': '0 4px 6px rgba(0, 0, 0, 0.1)'
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      }
    }
  },
  darkMode: 'class'
}
export const darkThemeVars = {
  '--color-bg-page': '#030712',
  '--color-bg-card': '#111827',
  '--color-bg-card-hover': '#1f2937',
  '--color-bg-tertiary': '#1f2937',
  '--color-border-light': '#374151',
  '--color-border-hover': '#4b5563',
  '--color-text-primary': '#f9fafb',
  '--color-text-secondary': '#d1d5db',
  '--color-text-muted': '#9ca3af',
  '--color-shadow-card': '0 1px 3px rgba(0, 0, 0, 0.3)',
  '--color-shadow-card-hover': '0 4px 6px rgba(0, 0, 0, 0.4)'
}
export const lightThemeVars = {
  '--color-bg-page': '#f9fafb',
  '--color-bg-card': '#ffffff',
  '--color-bg-card-hover': '#f9fafb',
  '--color-bg-tertiary': '#f3f4f6',
  '--color-border-light': '#e5e7eb',
  '--color-border-hover': '#d1d5db',
  '--color-text-primary': '#111827',
  '--color-text-secondary': '#4b5563',
  '--color-text-muted': '#6b7280',
  '--color-shadow-card': '0 1px 3px rgba(0, 0, 0, 0.1)',
  '--color-shadow-card-hover': '0 4px 6px rgba(0, 0, 0, 0.1)'
}
