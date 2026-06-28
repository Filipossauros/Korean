import type { Perfil, Sessao } from '../types'

const BACKUP_FILENAME = 'hangeul_ilgi_backup.json'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'

export function isGoogleConnected(): boolean {
  return !!localStorage.getItem('google_drive_token')
}

export function getGoogleToken(): string | null {
  return localStorage.getItem('google_drive_token')
}

export function initiateGoogleAuth(): void {
  const clientId = localStorage.getItem('google_client_id')
  if (!clientId) {
    alert('Configura o Google Client ID nas Definições antes de ligar o Google Drive.')
    return
  }
  const redirectUri = window.location.origin + window.location.pathname
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: DRIVE_SCOPE,
    prompt: 'consent',
  })
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export function handleGoogleOAuthCallback(): boolean {
  const hash = window.location.hash
  if (!hash) return false
  const params = new URLSearchParams(hash.substring(1))
  const token = params.get('access_token')
  if (token) {
    localStorage.setItem('google_drive_token', token)
    window.history.replaceState(null, '', window.location.pathname)
    return true
  }
  return false
}

async function findBackupFileId(token: string): Promise<string | null> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name%3D%27${BACKUP_FILENAME}%27+and+trashed%3Dfalse&fields=files(id)`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.files?.[0]?.id ?? null
}

export async function backupToGoogleDrive(perfil: Perfil, sessoes: Sessao[]): Promise<void> {
  const token = getGoogleToken()
  if (!token) return

  const payload = JSON.stringify({ perfil, sessoes, backup_em: new Date().toISOString() })
  const blob = new Blob([payload], { type: 'application/json' })

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

export async function restoreFromGoogleDrive(): Promise<{ perfil: Perfil; sessoes: Sessao[] } | null> {
  const token = getGoogleToken()
  if (!token) return null

  const fileId = await findBackupFileId(token)
  if (!fileId) return null

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}
