/** @type {import('tailwindcss').Config} */
function withVar(v) {
  return `rgb(var(${v}) / <alpha-value>)`
}

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic, theme-aware
        bg: withVar('--bg'),
        surface: withVar('--surface'),
        'surface-2': withVar('--surface-2'),
        fg: withVar('--fg'),
        line: withVar('--border'),
        // Brand accents (also theme-tweaked for contrast)
        vermillion: withVar('--vermillion'),
        gold: withVar('--gold'),
        jade: withVar('--jade'),
        ink: withVar('--ink-fixed'),
        // Backward-compat aliases
        paper: withVar('--bg'),
        'paper-2': withVar('--surface-2'),
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
