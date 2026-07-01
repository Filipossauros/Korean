import { useState } from 'react'
import type { Perfil, Sessao } from '../types'
import {
  initiateGoogleAuth, isGoogleConnected, saveConfigToDrive,
  backupProgressToDrive, readConfigFromDrive, restoreProgressFromDrive
} from '../api/google-drive'
import { exportAllData, importAllData, getSessoes } from '../db'
import { SettingsIcon, DriveIcon, DownloadIcon, UploadIcon } from './Icons'
import { useSettings, setSetting, MODEL_PRESETS } from '../lib/settings'
import type { Theme, Language, ClaudeModel } from '../lib/settings'
import { PageSplats } from './Splat'
import { useT } from '../lib/i18n'

const LEVELS = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B']

interface Props {
  perfil: Perfil
  onUpdatePerfil: (updater: (p: Perfil) => Perfil) => void
  onRestore: () => void
}

export function Settings({ perfil, onUpdatePerfil, onRestore }: Props) {
  const t = useT()
  const settings = useSettings()
  const [apiKey, setApiKey] = useState(localStorage.getItem('anthropic_api_key') ?? '')
  const [clientId, setClientId] = useState(localStorage.getItem('google_client_id') ?? '')
  const [saved, setSaved] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [msg, setMsg] = useState('')
  const conflict = localStorage.getItem('backup_conflict')

  // Modelo: se o valor guardado não estiver nas sugestões, é "personalizado".
  const isPresetModel = MODEL_PRESETS.some(m => m.id === settings.model)
  const [customModel, setCustomModel] = useState(!isPresetModel)

  const save = async () => {
    if (apiKey.trim()) localStorage.setItem('anthropic_api_key', apiKey.trim())
    else localStorage.removeItem('anthropic_api_key')
    if (clientId.trim()) localStorage.setItem('google_client_id', clientId.trim())
    else localStorage.removeItem('google_client_id')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    if (isGoogleConnected()) {
      try {
        await saveConfigToDrive()
        const sessoes = await getSessoes()
        await backupProgressToDrive(perfil, sessoes, true)
      } catch { /* silencioso */ }
    }
  }

  const setLevel = (nivel: string) => {
    const idx = LEVELS.indexOf(nivel)
    const seguinte = idx >= 0 && idx < LEVELS.length - 1 ? LEVELS[idx + 1] : nivel
    onUpdatePerfil(p => ({ ...p, nivel_atual: nivel, nivel_seguinte: seguinte }))
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

  const handleExportAnki = () => {
    const rows = perfil.vocabulario_visto.map(v => `${v.kr}\t${v.pt}`).join('\n')
    const blob = new Blob([rows], { type: 'text/tab-separated-values' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hangeul_ilgi_anki_${new Date().toISOString().slice(0, 10)}.txt`
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
      setMsg(t('settings.importJson') + ' ✓')
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
      const cfg = await readConfigFromDrive()
      if (cfg?.anthropic_api_key) {
        localStorage.setItem('anthropic_api_key', cfg.anthropic_api_key)
        setApiKey(cfg.anthropic_api_key)
      }
      const prog = await restoreProgressFromDrive()
      if (prog) {
        await importAllData({ perfil: prog.perfil, sessoes: prog.sessoes })
        localStorage.removeItem('backup_conflict')
        setMsg('Dados restaurados do Google Drive!')
        onRestore()
      } else if (cfg) {
        setMsg('Configuração restaurada. Ainda não há progresso guardado.')
      } else {
        setMsg('Nenhum backup encontrado no Drive.')
      }
    } catch (err) {
      setMsg(`Erro: ${err instanceof Error ? err.message : err}`)
    } finally {
      setRestoring(false)
    }
  }

  const forcePush = async () => {
    setMsg('')
    try {
      const sessoes = await getSessoes()
      await backupProgressToDrive(perfil, sessoes, true)
      localStorage.removeItem('backup_conflict')
      setMsg('Progresso deste dispositivo gravado no Drive.')
    } catch (err) {
      setMsg(`Erro: ${err instanceof Error ? err.message : err}`)
    }
  }

  const card = 'pop rounded-2xl bg-surface p-4'
  const label = 'font-display text-[11px] text-fg block mb-2'
  const optBtn = (active: boolean, extra = 'bg-ink text-white') =>
    `pop-sm py-2 rounded-xl font-ui text-sm font-semibold transition-transform active:translate-x-[1px] active:translate-y-[1px] ${active ? extra : 'bg-surface text-fg/70'}`

  return (
    <div className="relative min-h-screen bg-paper pb-24 md:pb-0 overflow-hidden">
      <PageSplats />
      <div className="relative z-10 max-w-lg mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="pop-sm tilt-l inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-1.5 text-jade">
            <SettingsIcon size={18} />
            <span className="font-display text-xs">{t('settings.title')}</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Conflito de backup */}
          {conflict && (
            <div className="pop rounded-2xl bg-gold p-4">
              <p className="font-ui text-sm font-medium text-ink mb-2">
                Há progresso mais recente no Drive (outro dispositivo), de {new Date(conflict).toLocaleString()}.
              </p>
              <div className="flex gap-2">
                <button onClick={handleRestore} className="pop-sm px-3 py-2 rounded-xl bg-jade text-ink font-display text-[11px]">Trazer do Drive</button>
                <button onClick={forcePush} className="pop-sm px-3 py-2 rounded-xl bg-surface text-fg font-display text-[11px]">Manter este</button>
              </div>
            </div>
          )}

          {/* Aparência */}
          <div className={card}>
            <span className={label}>{t('settings.theme')}</span>
            <div className="grid grid-cols-3 gap-2">
              {(['system', 'light', 'dark'] as Theme[]).map(opt => (
                <button
                  key={opt}
                  onClick={() => setSetting('theme', opt)}
                  className={optBtn(settings.theme === opt)}
                >
                  {opt === 'system' ? t('settings.themeSystem') : opt === 'light' ? t('settings.themeLight') : t('settings.themeDark')}
                </button>
              ))}
            </div>
          </div>

          {/* Idioma de aprendizagem */}
          <div className={card}>
            <span className={label}>{t('settings.language')}</span>
            <div className="grid grid-cols-2 gap-2">
              {(['pt', 'en'] as Language[]).map(opt => (
                <button
                  key={opt}
                  onClick={() => setSetting('language', opt)}
                  className={optBtn(settings.language === opt)}
                >
                  {opt === 'pt' ? 'Português' : 'English'}
                </button>
              ))}
            </div>
            <p className="text-xs text-fg/40 font-ui mt-2">As sessões e correções passam a usar este idioma.</p>
          </div>

          {/* Nível */}
          <div className={card}>
            <span className={label}>{t('settings.currentLevel')}</span>
            <div className="grid grid-cols-4 gap-2">
              {LEVELS.map(lv => (
                <button
                  key={lv}
                  onClick={() => setLevel(lv)}
                  className={optBtn(perfil.nivel_atual === lv, 'bg-vermillion text-white')}
                >
                  {lv}
                </button>
              ))}
            </div>
            <p className="text-xs text-fg/40 font-ui mt-2">Muda de onde saem as sessões. O progresso é mantido.</p>
          </div>

          {/* Modelo */}
          <div className={card}>
            <span className={label}>{t('settings.model')}</span>
            <select
              value={customModel ? '__custom__' : settings.model}
              onChange={e => {
                const v = e.target.value
                if (v === '__custom__') {
                  setCustomModel(true)
                } else {
                  setCustomModel(false)
                  setSetting('model', v as ClaudeModel)
                }
              }}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 font-ui text-sm text-fg focus:outline-none focus:border-gold"
            >
              {MODEL_PRESETS.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
              <option value="__custom__">{t('settings.modelCustom')}</option>
            </select>
            {customModel && (
              <input
                type="text"
                value={settings.model}
                onChange={e => setSetting('model', e.target.value as ClaudeModel)}
                placeholder="claude-…"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                className="w-full mt-2 rounded-xl border border-line bg-surface px-3 py-2 font-ui text-sm text-fg focus:outline-none focus:border-gold"
              />
            )}
            <p className="text-xs text-fg/40 font-ui mt-2">{t('settings.modelHint')}</p>
          </div>

          {/* API Key */}
          <div className={card}>
            <label className={label}>{t('settings.apiKey')}</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-…"
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 font-ui text-sm text-fg focus:outline-none focus:border-gold"
            />
            <p className="text-xs text-fg/30 font-ui mt-1">{t('settings.apiKeyHint')}</p>
          </div>

          {/* Google Drive */}
          <div className={card}>
            <label className={label}>Google Drive</label>
            <input
              type="text"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              placeholder="Google OAuth Client ID"
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 font-ui text-sm text-fg focus:outline-none focus:border-gold mb-3"
            />
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => initiateGoogleAuth()} className="pop-sm flex items-center gap-2 px-4 py-2 rounded-xl bg-jade text-ink font-ui text-sm font-semibold">
                <DriveIcon size={16} />
                {isGoogleConnected() ? 'Drive ligado' : 'Ligar Google Drive'}
              </button>
              {isGoogleConnected() && (
                <button onClick={handleRestore} disabled={restoring} className="pop-sm flex items-center gap-2 px-4 py-2 rounded-xl bg-surface font-ui text-sm font-semibold text-fg">
                  <DownloadIcon size={16} />
                  {restoring ? 'A restaurar…' : 'Restaurar backup'}
                </button>
              )}
            </div>
          </div>

          {/* Toggles */}
          <div className={card}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-ui text-sm font-semibold text-fg">{t('settings.romanization')}</p>
                <p className="text-xs text-fg/40 font-ui">{t('settings.romanizationHint')}</p>
              </div>
              <Toggle on={settings.romanization} onClick={() => setSetting('romanization', !settings.romanization)} />
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
              <div>
                <p className="font-ui text-sm font-semibold text-fg">{t('settings.timer')}</p>
                <p className="text-xs text-fg/40 font-ui">{t('settings.timerHint')}</p>
              </div>
              <Toggle on={settings.showTimer} onClick={() => setSetting('showTimer', !settings.showTimer)} />
            </div>
          </div>

          {/* Dados */}
          <div className={card}>
            <p className="font-ui text-sm font-semibold text-fg mb-3">{t('settings.localData')}</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={handleExport} className="pop-sm flex items-center gap-2 px-4 py-2 rounded-xl bg-surface font-ui text-sm font-semibold text-fg">
                <UploadIcon size={16} /> {t('settings.exportJson')}
              </button>
              <label className="pop-sm flex items-center gap-2 px-4 py-2 rounded-xl bg-surface font-ui text-sm font-semibold text-fg cursor-pointer">
                <DownloadIcon size={16} /> {t('settings.importJson')}
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
              <button onClick={handleExportAnki} className="pop-sm flex items-center gap-2 px-4 py-2 rounded-xl bg-surface font-ui text-sm font-semibold text-fg">
                <UploadIcon size={16} /> {t('settings.exportAnki')}
              </button>
            </div>
          </div>

          {msg && (
            <div className="bg-jade/10 border border-jade/20 rounded-xl p-3">
              <p className="text-jade text-sm font-ui">{msg}</p>
            </div>
          )}

          <button onClick={save} className="pop pop-shadow-jade w-full py-4 rounded-2xl bg-vermillion text-white font-display text-sm active:translate-x-[2px] active:translate-y-[2px] transition-transform">
            {saved ? t('common.saved') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${on ? 'bg-jade' : 'bg-line'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-0.5'}`} />
    </button>
  )
}
