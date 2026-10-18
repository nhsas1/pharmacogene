/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      boxShadow: {
        soft: '0 14px 40px rgba(7, 30, 58, 0.08)',
        lift: '0 18px 60px rgba(7, 30, 58, 0.14)'
      }
    }
  },
  plugins: []
};
