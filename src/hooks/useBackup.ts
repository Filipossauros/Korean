import { useCallback } from 'react'
import type { Perfil, Sessao } from '../types'
import { backupProgressToDrive, isGoogleConnected, ProgressConflictError } from '../api/google-drive'

export function useBackup() {
  const backup = useCallback(async (perfil: Perfil, sessoes: Sessao[]) => {
    if (!isGoogleConnected()) return
    try {
      await backupProgressToDrive(perfil, sessoes)
      localStorage.removeItem('backup_conflict')
    } catch (e) {
      if (e instanceof ProgressConflictError) {
        // Não sobrescrever progresso mais recente de outro dispositivo.
        localStorage.setItem('backup_conflict', e.remoteTimestamp)
      } else {
        console.warn('Backup Google Drive falhou:', e)
      }
    }
  }, [])

  return { backup }
}
