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
        // Leitura legível (texto longo em coreano)
        serif: ['"Noto Serif KR"', 'serif'],
        // Corpo / UI — Fredoka (arredondada, amigável)
        sans: ['Fredoka', '"Noto Sans KR"', 'sans-serif'],
        ui: ['Fredoka', '"Noto Sans KR"', 'sans-serif'],
        // Títulos coreanos "chunky" estilo Splatoon
        kr: ['"Black Han Sans"', '"Noto Sans KR"', 'sans-serif'],
        // Display latino em bloco (etiquetas MAIÚSCULAS, números)
        display: ['Bungee', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
