// Faz crescer o tamanho do conteúdo gerado à medida que o utilizador progride.
// O "nível de progresso" combina o número de sessões feitas com as estruturas
// já dominadas — quanto mais avança, mais longos os diários e diálogos.
import type { Perfil } from '../types'

export function progressTier(perfil: Perfil): 1 | 2 | 3 | 4 {
  const dominadas = perfil.estruturas.filter(e => e.estado === 'dominada').length
  const score = perfil.sessoes_realizadas + dominadas
  if (score < 5) return 1
  if (score < 15) return 2
  if (score < 30) return 3
  return 4
}

// Nº de frases do texto de leitura (o "diário") por nível de progresso.
export function readingSentences(perfil: Perfil): string {
  return ['3-5', '5-7', '7-10', '10-14'][progressTier(perfil) - 1]
}

// Nº de falas do diálogo por nível de progresso.
export function dialogueTurns(perfil: Perfil): string {
  return ['6 a 8', '8 a 12', '12 a 16', '16 a 22'][progressTier(perfil) - 1]
}
