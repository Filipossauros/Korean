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

export function loadInProgress(): InProgress | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as InProgress
  } catch {
    return null
  }
}

export function clearInProgress() {
  localStorage.removeItem(KEY)
}

export function hasInProgress(): boolean {
  return !!localStorage.getItem(KEY)
}
