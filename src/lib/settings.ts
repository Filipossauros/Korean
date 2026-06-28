// Central device-local settings (não sincronizadas — preferências por dispositivo).
import { useSyncExternalStore } from 'react'

export type Theme = 'system' | 'light' | 'dark'
export type Language = 'pt' | 'en'
export type ClaudeModel = 'claude-sonnet-4-6' | 'claude-opus-4-8' | 'claude-haiku-4-5-20251001'

export interface AppSettings {
  theme: Theme
  language: Language
  model: ClaudeModel
  romanization: boolean
  showTimer: boolean
}

const KEYS = {
  theme: 'app_theme',
  language: 'app_language',
  model: 'anthropic_model',
  romanization: 'show_romanization',
  showTimer: 'show_timer',
} as const

export function getSettings(): AppSettings {
  return {
    theme: (localStorage.getItem(KEYS.theme) as Theme) || 'system',
    language: (localStorage.getItem(KEYS.language) as Language) || 'pt',
    model: (localStorage.getItem(KEYS.model) as ClaudeModel) || 'claude-sonnet-4-6',
    romanization: localStorage.getItem(KEYS.romanization) === 'true',
    showTimer: localStorage.getItem(KEYS.showTimer) !== 'false',
  }
}

const listeners = new Set<() => void>()
function emit() { listeners.forEach(l => l()) }

export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
  localStorage.setItem(KEYS[key], String(value))
  if (key === 'theme') applyTheme(value as Theme)
  emit()
}

let cache = getSettings()
function subscribe(cb: () => void) {
  const wrapped = () => { cache = getSettings(); cb() }
  listeners.add(wrapped)
  return () => { listeners.delete(wrapped) }
}
function snapshot(): AppSettings { return cache }

export function useSettings(): AppSettings {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}

// ---------- Theme application ----------
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = theme === 'dark' || (theme === 'system' && prefersDark)
  root.classList.toggle('dark', dark)
}

export function initTheme() {
  applyTheme(getSettings().theme)
  // React to system changes when in 'system' mode
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getSettings().theme === 'system') applyTheme('system')
  })
}
