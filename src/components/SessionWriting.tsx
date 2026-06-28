import { useState, useEffect, useRef } from 'react'
import type { FraseProducao } from '../types'
import { PencilIcon, CameraIcon, SpeakerIcon } from './Icons'
import { recognizeHangulWithClaude } from '../api/anthropic'
import { speakKorean, canSpeak } from '../lib/tts'
import { romanize } from '../lib/romanize'
import { useSettings } from '../lib/settings'
import { useT } from '../lib/i18n'

interface Props {
  frases: FraseProducao[]
  showTimer: boolean
  onSubmit: (respostas: string[]) => void
}

export function SessionWriting({ frases, showTimer, onSubmit }: Props) {
  const t = useT()
  const { romanization } = useSettings()
  const [respostas, setRespostas] = useState<string[]>(frases.map(() => ''))
  const [current, setCurrent] = useState(0)
  const [showDicas, setShowDicas] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrError, setOcrError] = useState('')
  const startRef = useRef(Date.now())
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!showTimer) return
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [showTimer])

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const frase = frases[current]

  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setOcrLoading(true)
    setOcrError('')
    try {
      const text = await recognizeHangulWithClaude(file)
      const next = [...respostas]
      next[current] = text
      setRespostas(next)
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : 'Erro ao ler imagem')
    } finally {
      setOcrLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const next = () => {
    setShowDicas(false)
    if (current < frases.length - 1) {
      setCurrent(c => c + 1)
    }
  }

  const allAnswered = respostas.every(r => r.trim())

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-0">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PencilIcon size={20} />
            <h1 className="font-ui font-semibold text-fg">{t('session.production')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-ui text-sm text-fg/40">{current + 1}/{frases.length}</span>
            {showTimer && <span className="font-ui text-sm text-fg/40 tabular-nums">{fmt(elapsed)}</span>}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-line rounded-full mb-6">
          <div
            className="h-1 bg-vermillion rounded-full transition-all"
            style={{ width: `${((current + 1) / frases.length) * 100}%` }}
          />
        </div>

        {/* Current sentence */}
        <div className="bg-surface rounded-2xl p-5 mb-4 border border-line">
          <p className="font-ui text-xs uppercase tracking-wider text-fg/50 mb-2">{t('session.translateToKorean')}</p>
          <p className="font-ui text-xl font-medium text-fg">{frase.pt_original}</p>
          {frase.estrutura_foco && (
            <p className="text-xs text-gold font-ui mt-2">{t('session.focus')}: {frase.estrutura_foco}</p>
          )}
        </div>

        {/* Dicas */}
        {frase.dicas.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowDicas(d => !d)}
              className="text-xs text-fg/40 font-ui underline"
            >
              {showDicas ? t('session.hideHints') : t('session.showHints')}
            </button>
            {showDicas && (
              <div className="mt-2 flex flex-wrap gap-2">
                {frase.dicas.map((d, i) => (
                  <span key={i} className="text-xs font-serif px-2 py-1 bg-gold/10 text-gold rounded-lg">{d}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="relative mb-4">
          <textarea
            value={respostas[current]}
            onChange={e => {
              const next = [...respostas]
              next[current] = e.target.value
              setRespostas(next)
            }}
            rows={3}
            placeholder="한국어로 쓰세요…"
            className="w-full rounded-xl border border-line bg-surface p-3 pr-12 font-serif text-lg text-fg focus:outline-none focus:border-gold resize-none"
            lang="ko"
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            {canSpeak() && respostas[current]?.trim() && (
              <button
                onClick={() => speakKorean(respostas[current])}
                className="text-fg/30 hover:text-jade transition-colors"
                title="Ouvir"
              >
                <SpeakerIcon size={20} />
              </button>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={ocrLoading}
              className="text-fg/30 hover:text-fg/60 transition-colors"
              title="Foto de manuscrito"
            >
              {ocrLoading ? <span className="text-xs font-ui">OCR…</span> : <CameraIcon size={20} />}
            </button>
          </div>
        </div>
        {romanization && respostas[current]?.trim() && (
          <p className="text-xs text-fg/40 font-ui -mt-2 mb-4 italic">{romanize(respostas[current])}</p>
        )}
        {ocrError && <p className="text-xs text-vermillion font-ui -mt-2 mb-4">{ocrError}</p>}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleOCR}
        />

        {/* Navigation */}
        <div className="flex gap-3">
          {current < frases.length - 1 ? (
            <button
              onClick={next}
              className="flex-1 py-4 rounded-2xl bg-ink text-white font-ui font-semibold active:scale-95 transition-all"
            >
              {t('session.nextSentence')}
            </button>
          ) : (
            <button
              onClick={() => onSubmit(respostas)}
              disabled={!allAnswered}
              className="flex-1 py-4 rounded-2xl bg-vermillion text-white font-ui font-semibold disabled:opacity-40 active:scale-95 transition-all"
            >
              {t('session.submitAll')}
            </button>
          )}
        </div>

        {/* Mini list of all answers */}
        <div className="mt-6 space-y-2">
          {frases.map((f, i) => (
            <div
              key={i}
              onClick={() => setCurrent(i)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                i === current ? 'border-gold bg-gold/5' : 'border-line bg-surface'
              }`}
            >
              <p className="text-xs text-fg/50 font-ui">{f.pt_original}</p>
              {respostas[i] ? (
                <p className="text-sm font-serif text-fg mt-1">{respostas[i]}</p>
              ) : (
                <p className="text-xs text-fg/20 font-ui mt-1">—</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
