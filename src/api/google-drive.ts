import type { Perfil, Sessao } from '../types'

const BACKUP_FILENAME = 'hangeul_ilgi_backup.json'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'

export interface BackupPayload {
  perfil: Perfil
  sessoes: Sessao[]
  anthropic_api_key?: string
  backup_em: string
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
  // Marca que estamos a meio de um fluxo OAuth para auto-restaurar ao voltar.
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
// Devolve true se acabámos de regressar de um login.
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

// Indica se voltámos agora de um redirect OAuth (para mostrar spinner/restaurar).
export function consumeOAuthPending(): boolean {
  const pending = localStorage.getItem('google_oauth_pending') === '1'
  localStorage.removeItem('google_oauth_pending')
  return pending
}

async function findBackupFileId(token: string): Promise<string | null> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name%3D%27${BACKUP_FILENAME}%27+and+trashed%3Dfalse&fields=files(id)&spaces=drive`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (res.status === 401) throw new Error('token_expirado')
  if (!res.ok) return null
  const data = await res.json()
  return data.files?.[0]?.id ?? null
}

export async function backupToGoogleDrive(perfil: Perfil, sessoes: Sessao[]): Promise<void> {
  const token = getGoogleToken()
  if (!token) return

  const payload: BackupPayload = {
    perfil,
    sessoes,
    anthropic_api_key: localStorage.getItem('anthropic_api_key') ?? undefined,
    backup_em: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })

  const existingId = await findBackupFileId(token)

  if (existingId) {
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: blob,
    })
  } else {
    const meta = JSON.stringify({ name: BACKUP_FILENAME, mimeType: 'application/json' })
    const form = new FormData()
    form.append('metadata', new Blob([meta], { type: 'application/json' }))
    form.append('file', blob)
    await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
  }
}

export async function restoreFromGoogleDrive(): Promise<BackupPayload | null> {
  const token = getGoogleToken()
  if (!token) return null

  const fileId = await findBackupFileId(token)
  if (!fileId) return null

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) throw new Error('token_expirado')
  if (!res.ok) return null
  return res.json()
}
