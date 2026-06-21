export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857'
        },
        ink: '#172026'
      },
      boxShadow: {
        soft: '0 12px 34px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};
