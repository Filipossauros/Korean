/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1A1A2E',
        vermillion: '#C0392B',
        gold: '#C9A12E',
        jade: '#2E7D6B',
        paper: '#F7F6F2',
        'paper-2': '#EFEFEA',
        line: '#DDDDD5',
      },
      fontFamily: {
        serif: ['"Noto Serif KR"', 'serif'],
        sans: ['"Noto Sans KR"', 'Inter', 'sans-serif'],
        ui: ['Inter', '"Noto Sans KR"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
