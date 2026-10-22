/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F7F8FA',
        surface: '#FFFFFF',
        border: '#E3E6EB',
        primary: {
          DEFAULT: '#14181F',
          muted: '#5B6472',
        },
        accent: {
          DEFAULT: '#2347C5',
          hover: '#1B3AA6',
        },
        severity: {
          high: '#D92D20',
          'high-bg': '#FEF3F2',
          medium: '#F79009',
          'medium-bg': '#FFFAEB',
          low: '#2E90FA',
          'low-bg': '#EFF8FF',
        },
        status: {
          verified: '#12B76A',
          'verified-bg': '#ECFDF3',
          mismatch: '#D92D20',
          'mismatch-bg': '#FEF3F2',
          expired: '#C4320A',
          'expired-bg': '#FEF6EE',
          pending: '#475467',
          'pending-bg': '#F8F9FC',
          unavailable: '#7A5AF8',
          'unavailable-bg': '#F4F3FF',
          review: '#B54708',
          'review-bg': '#FFFAEB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        input: '8px',
        chip: '999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)',
        elevated: '0 4px 6px -2px rgba(16, 24, 40, 0.05), 0 12px 16px -4px rgba(16, 24, 40, 0.08)',
      },
    },
  },
  plugins: [],
};
