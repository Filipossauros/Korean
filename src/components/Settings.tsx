import { useState } from 'react'
import type { Perfil, Sessao } from '../types'
import { initiateGoogleAuth, isGoogleConnected, restoreFromGoogleDrive } from '../api/google-drive'
import { exportAllData, importAllData } from '../db'
import { SettingsIcon, DriveIcon, DownloadIcon, UploadIcon } from './Icons'

interface Props {
  perfil: Perfil
  onRestore: () => void
}

export function Settings({ perfil, onRestore }: Props) {
  const [apiKey, setApiKey] = useState(localStorage.getItem('anthropic_api_key') ?? '')
  const [clientId, setClientId] = useState(localStorage.getItem('google_client_id') ?? '')
  const [showTimer, setShowTimer] = useState(localStorage.getItem('show_timer') !== 'false')
  const [saved, setSaved] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [msg, setMsg] = useState('')

  const save = () => {
    if (apiKey.trim()) localStorage.setItem('anthropic_api_key', apiKey.trim())
    else localStorage.removeItem('anthropic_api_key')
    if (clientId.trim()) localStorage.setItem('google_client_id', clientId.trim())
    else localStorage.removeItem('google_client_id')
    localStorage.setItem('show_timer', String(showTimer))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExport = async () => {
    const data = await exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hangeul_ilgi_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text) as { perfil: Perfil; sessoes: Sessao[] }
      await importAllData(data)
      setMsg('Dados importados com sucesso!')
      onRestore()
    } catch {
      setMsg('Erro ao importar ficheiro.')
    }
    e.target.value = ''
  }

  const handleRestore = async () => {
    setRestoring(true)
    setMsg('')
    try {
      const data = await restoreFromGoogleDrive()
      if (data) {
        await importAllData(data)
        setMsg('Dados restaurados do Google Drive!')
        onRestore()
      } else {
        setMsg('Nenhum backup encontrado no Drive.')
      }
    } catch (err) {
      setMsg(`Erro: ${err instanceof Error ? err.message : err}`)
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-0">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <SettingsIcon size={20} />
          <h1 className="font-ui font-semibold text-ink">Definições</h1>
        </div>

        <div className="space-y-4">
          {/* API Key */}
          <div className="bg-white rounded-2xl p-4 border border-line">
            <label className="font-ui text-sm font-semibold text-ink block mb-2">Anthropic API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-…"
              className="w-full rounded-xl border border-line px-3 py-2 font-ui text-sm text-ink focus:outline-none focus:border-gold"
            />
            <p className="text-xs text-ink/30 font-ui mt-1">Guardada apenas localmente. Nunca enviada a terceiros.</p>
          </div>

          {/* Google Drive */}
          <div className="bg-white rounded-2xl p-4 border border-line">
            <label className="font-ui text-sm font-semibold text-ink block mb-2">Google Drive</label>
            <input
              type="text"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              placeholder="Google OAuth Client ID"
              className="w-full rounded-xl border border-line px-3 py-2 font-ui text-sm text-ink focus:outline-none focus:border-gold mb-3"
            />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => initiateGoogleAuth()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-jade text-white font-ui text-sm"
              >
                <DriveIcon size={16} />
                {isGoogleConnected() ? 'Drive ligado ✓' : 'Ligar Google Drive'}
              </button>
              {isGoogleConnected() && (
                <button
                  onClick={handleRestore}
                  disabled={restoring}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-line font-ui text-sm text-ink"
                >
                  <DownloadIcon size={16} />
                  {restoring ? 'A restaurar…' : 'Restaurar backup'}
                </button>
              )}
            </div>
          </div>

          {/* Timer toggle */}
          <div className="bg-white rounded-2xl p-4 border border-line flex items-center justify-between">
            <div>
              <p className="font-ui text-sm font-semibold text-ink">Cronómetro</p>
              <p className="text-xs text-ink/40 font-ui">Mostrar tempo em cada parte da sessão</p>
            </div>
            <button
              onClick={() => setShowTimer(t => !t)}
              className={`w-12 h-6 rounded-full transition-all relative ${showTimer ? 'bg-jade' : 'bg-line'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${showTimer ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Nível info */}
          <div className="bg-white rounded-2xl p-4 border border-line">
            <p className="font-ui text-sm font-semibold text-ink mb-2">Nível actual</p>
            <p className="font-serif text-2xl text-ink">{perfil.nivel_atual} <span className="text-ink/30">→</span> {perfil.nivel_seguinte}</p>
            <p className="text-xs text-ink/40 font-ui mt-1">KSI Lisboa nível 5 → 6</p>
          </div>

          {/* Export / Import */}
          <div className="bg-white rounded-2xl p-4 border border-line">
            <p className="font-ui text-sm font-semibold text-ink mb-3">Dados locais</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-line font-ui text-sm text-ink"
              >
                <UploadIcon size={16} />
                Exportar JSON
              </button>
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-line font-ui text-sm text-ink cursor-pointer">
                <DownloadIcon size={16} />
                Importar JSON
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </div>
          </div>

          {msg && (
            <div className="bg-jade/10 border border-jade/20 rounded-xl p-3">
              <p className="text-jade text-sm font-ui">{msg}</p>
            </div>
          )}

          <button
            onClick={save}
            className="w-full py-4 rounded-2xl bg-ink text-white font-ui font-semibold"
          >
            {saved ? 'Guardado ✓' : 'Guardar definições'}
          </button>
        </div>
      </div>
    </div>
  )
}
