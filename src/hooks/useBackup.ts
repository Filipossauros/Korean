import { useCallback } from 'react'
import type { Perfil, Sessao } from '../types'
import { backupToGoogleDrive, isGoogleConnected } from '../api/google-drive'

export function useBackup() {
  const backup = useCallback(async (perfil: Perfil, sessoes: Sessao[]) => {
    if (!isGoogleConnected()) return
    try {
      await backupToGoogleDrive(perfil, sessoes)
    } catch (e) {
      console.warn('Backup Google Drive falhou:', e)
    }
  }, [])

  return { backup }
}
