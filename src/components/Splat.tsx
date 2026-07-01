// Mancha de tinta (estilo Splatoon). A cor vem de `currentColor`, por isso
// controla-se com utilitários de texto do Tailwind (ex.: text-jade/20).
export function Splat({ size = 220, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 300 300" className={className} aria-hidden="true">
      <path fill="currentColor" d="M148 24c26-9 47 16 74 20 27 4 26 34 44 55 17 20 3 47 10 74 6 25-25 33-38 57-14 25-45 9-73 17-27 8-44-17-71-27-26-10-24-42-40-64-15-22 4-47 8-74 4-25 34-27 57-44 17-12 14-32 42-40z"/>
      <circle fill="currentColor" cx="255" cy="70" r="14"/>
      <circle fill="currentColor" cx="278" cy="120" r="8"/>
      <circle fill="currentColor" cx="42" cy="238" r="15"/>
      <circle fill="currentColor" cx="70" cy="268" r="9"/>
      <circle fill="currentColor" cx="250" cy="245" r="11"/>
    </svg>
  )
}

// Splats subtis nos cantos, para o fundo dos ecrãs (não distrai o conteúdo).
export function PageSplats() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden="true">
      <Splat size={200} className="absolute -top-14 -right-16 text-jade/20 dark:text-jade/25" />
      <Splat size={210} className="absolute -bottom-16 -left-16 text-vermillion/15 dark:text-vermillion/20" />
    </div>
  )
}
