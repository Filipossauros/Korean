import type { Dialogo } from '../types'

// Guarda o diálogo atual (e o estado do quiz) para que sair da aba e voltar
// retome o diálogo em curso em vez de gerar um novo. Persiste também entre
// reinícios da app (PWA), tal como o snapshot de sessão.
const KEY = 'dialogue_current'

export interface DialogueSnapshot {
  dialogo: Dialogo
  answers: Record<number, number>
  graded: boolean
  unlocked: boolean
}

export function loadDialogue(): DialogueSnapshot | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as DialogueSnapshot
    return s?.dialogo?.linhas?.length ? s : null
  } catch {
    return null
  }
}

export function saveDialogue(s: DialogueSnapshot): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* quota/serialização — ignora */ }
}

export function clearDialogue(): void {
  try { localStorage.removeItem(KEY) } catch { /* ignora */ }
}
