import type { Perfil, Sessao } from '../types'

// Dois ficheiros separados no Drive:
//  - CONFIG: permanente, gerado uma vez, só guarda a chave da API. Raramente muda.
//  - PROGRESSO: reescrito ao fim de cada sessão (perfil + sessões).
const CONFIG_FILENAME = 'hangeul_ilgi_config.json'
const PROGRESS_FILENAME = 'hangeul_ilgi_progresso.json'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'

export interface ConfigPayload {
  anthropic_api_key?: string
  criado_em: string
  atualizado_em: string
}

export interface ProgressPayload {
  perfil: Perfil
  sessoes: Sessao[]
  backup_em: string
}

const SYNCED_KEY = 'progress_synced_at'

export class ProgressConflictError extends Error {
  remoteTimestamp: string
  constructor(remoteTimestamp: string) {
    super('Existe progresso mais recente no Drive (outro dispositivo).')
    this.name = 'ProgressConflictError'
    this.remoteTimestamp = remoteTimestamp
  }
}

export function getSyncedAt(): string {
  return localStorage.getItem(SYNCED_KEY) || ''
}
function setSyncedAt(ts: string) {
  localStorage.setItem(SYNCED_KEY, ts)
}

// O Client ID vem da build (VITE_GOOGLE_CLIENT_ID) para que um browser novo,
// sem nada no localStorage, consiga iniciar o login. Fallback: localStorage.
export function getClientId(): string | null {
  const fromEnv = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  return (fromEnv && fromEnv.trim()) || localStorage.getItem('google_client_id') || null
}

export function isGoogleConfigured(): boolean {
  return !!getClientId()
}

export function isGoogleConnected(): boolean {
  return !!localStorage.getItem('google_drive_token')
}

export function getGoogleToken(): string | null {
  return localStorage.getItem('google_drive_token')
}

export function disconnectGoogle(): void {
  localStorage.removeItem('google_drive_token')
}

export function initiateGoogleAuth(): void {
  const clientId = getClientId()
  if (!clientId) {
    alert('Configura o Google Client ID nas Definições (ou na build) antes de ligar o Google Drive.')
    return
  }
  localStorage.setItem('google_oauth_pending', '1')
  const redirectUri = window.location.origin + window.location.pathname
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: DRIVE_SCOPE,
    include_granted_scopes: 'true',
    prompt: 'consent',
  })
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

// Lê o token devolvido pelo Google no fragmento (#access_token=...).
export function handleGoogleOAuthCallback(): boolean {
  const hash = window.location.hash
  if (!hash || !hash.includes('access_token')) return false
  const params = new URLSearchParams(hash.substring(1))
  const token = params.get('access_token')
  if (token) {
    localStorage.setItem('google_drive_token', token)
    window.history.replaceState(null, '', window.location.pathname)
    return true
  }
  return false
}

export function consumeOAuthPending(): boolean {
  const pending = localStorage.getItem('google_oauth_pending') === '1'
  localStorage.removeItem('google_oauth_pending')
  return pending
}

// ---------- Operações genéricas sobre ficheiros ----------

async function findFileId(token: string, filename: string): Promise<string | null> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name%3D%27${filename}%27+and+trashed%3Dfalse&fields=files(id)&spaces=drive`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (res.status === 401) throw new Error('token_expirado')
  if (!res.ok) return null
  const data = await res.json()
  return data.files?.[0]?.id ?? null
}

async function uploadFile(token: string, filename: string, content: unknown, existingId: string | null): Promise<void> {
  const blob = new Blob([JSON.stringify(content)], { type: 'application/json' })
  if (existingId) {
    const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: blob,
    })
    if (res.status === 401) throw new Error('token_expirado')
  } else {
    const meta = JSON.stringify({ name: filename, mimeType: 'application/json' })
    const form = new FormData()
    form.append('metadata', new Blob([meta], { type: 'application/json' }))
    form.append('file', blob)
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (res.status === 401) throw new Error('token_expirado')
  }
}

async function readFile<T>(token: string, filename: string): Promise<T | null> {
  const fileId = await findFileId(token, filename)
  if (!fileId) return null
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) throw new Error('token_expirado')
  if (!res.ok) return null
  return res.json()
}

// ---------- Ficheiro CONFIG (permanente: chave da API) ----------

export async function saveConfigToDrive(): Promise<void> {
  const token = getGoogleToken()
  if (!token) return
  const existingId = await findFileId(token, CONFIG_FILENAME)
  const existing = existingId ? await readFile<ConfigPayload>(token, CONFIG_FILENAME) : null
  const payload: ConfigPayload = {
    anthropic_api_key: localStorage.getItem('anthropic_api_key') ?? undefined,
    criado_em: existing?.criado_em ?? new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
  }
  await uploadFile(token, CONFIG_FILENAME, payload, existingId)
}

export async function readConfigFromDrive(): Promise<ConfigPayload | null> {
  const token = getGoogleToken()
  if (!token) return null
  return readFile<ConfigPayload>(token, CONFIG_FILENAME)
}

// ---------- Ficheiro PROGRESSO (perfil + sessões) ----------

export async function backupProgressToDrive(perfil: Perfil, sessoes: Sessao[], force = false): Promise<void> {
  const token = getGoogleToken()
  if (!token) return
  const existingId = await findFileId(token, PROGRESS_FILENAME)

  // Deteção de conflito: se o ficheiro remoto é mais recente do que a última
  // sincronização deste dispositivo, não sobrescrever sem confirmação.
  if (existingId && !force) {
    const remote = await readFile<ProgressPayload>(token, PROGRESS_FILENAME)
    const synced = getSyncedAt()
    if (remote?.backup_em && synced && remote.backup_em > synced) {
      throw new ProgressConflictError(remote.backup_em)
    }
  }

  const payload: ProgressPayload = { perfil, sessoes, backup_em: new Date().toISOString() }
  await uploadFile(token, PROGRESS_FILENAME, payload, existingId)
  setSyncedAt(payload.backup_em)
}

export async function restoreProgressFromDrive(): Promise<ProgressPayload | null> {
  const token = getGoogleToken()
  if (!token) return null
  const data = await readFile<ProgressPayload>(token, PROGRESS_FILENAME)
  if (data?.backup_em) setSyncedAt(data.backup_em)
  return data
}
