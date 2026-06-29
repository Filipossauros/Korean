// Persistência da sessão em curso (para não se perder ao sair).
import type { Sessao, SessionDraft } from '../types'

const KEY = 'session_in_progress'

export interface InProgress {
  phase: 'part1' | 'part2' | 'part3'
  draft: SessionDraft | null
  sessao: Sessao
  savedAt: string
}

export function saveInProgress(data: Omit<InProgress, 'savedAt'>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, savedAt: new Date().toISOString() }))
  } catch { /* quota/serialização — ignora */ }
}

const VALID_PHASES = ['part1', 'part2', 'part3']

// Valida a forma mínima necessária para retomar. Um snapshot corrompido ou de
// uma versão antiga é tratado como inexistente (e limpo) para não mostrar um
// botão "Continuar" que não faz nada.
function isValid(data: unknown): data is InProgress {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  if (!VALID_PHASES.includes(d.phase as string)) return false
  const s = d.sessao as Record<string, unknown> | undefined
  if (!s || typeof s !== 'object' || !s.parte1 || !s.parte2) return false
  return true
}

export function loadInProgress(): InProgress | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!isValid(parsed)) {
      clearInProgress()
      return null
    }
    return parsed
  } catch {
    clearInProgress()
    return null
  }
}

export function clearInProgress() {
  localStorage.removeItem(KEY)
}

export function hasInProgress(): boolean {
  // Verifica que o snapshot é realmente retomável, não apenas que a chave existe.
  return loadInProgress() !== null
}
