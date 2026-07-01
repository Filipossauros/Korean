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
  const [respostas, setRespostas] = useState<string[]>(frases.map(f => f.kr_utilizador || ''))
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
          <div className="pop-sm tilt-l inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-1.5 text-jade">
            <PencilIcon size={18} />
            <span className="font-display text-xs">{t('session.production')}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-display text-sm text-fg/60">{current + 1}/{frases.length}</span>
            {showTimer && <span className="font-display text-sm text-fg/50 tabular-nums">{fmt(elapsed)}</span>}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-surface rounded-full mb-6 border-2 border-ink overflow-hidden">
          <div
            className="h-full bg-vermillion transition-all"
            style={{ width: `${((current + 1) / frases.length) * 100}%` }}
          />
        </div>

        {/* Current sentence */}
        <div className="pop tilt-r rounded-2xl bg-surface p-5 mb-4">
          <p className="font-display text-[11px] text-fg/60 mb-2">{t('session.translateToKorean')}</p>
          <p className="font-ui text-xl font-semibold text-fg">{frase.pt_original}</p>
          {frase.estrutura_foco && (
            <p className="text-xs text-ink font-ui font-bold mt-2 inline-block pop-sm bg-gold rounded-lg px-2 py-0.5">{t('session.focus')}: {frase.estrutura_foco}</p>
          )}
        </div>

        {/* Dicas */}
        {frase.dicas.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowDicas(d => !d)}
              className="text-xs text-fg/60 font-ui font-semibold underline"
            >
              {showDicas ? t('session.hideHints') : t('session.showHints')}
            </button>
            {showDicas && (
              <div className="mt-2 flex flex-wrap gap-2">
                {frase.dicas.map((d, i) => (
                  <span key={i} className="pop-sm text-xs font-serif px-2 py-1 bg-gold text-ink rounded-lg">{d}</span>
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
            className="pop w-full rounded-xl bg-surface p-3 pr-12 font-serif text-lg text-fg focus:outline-none resize-none"
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
              className="pop flex-1 py-4 rounded-2xl bg-ink text-white font-display text-sm active:translate-x-[2px] active:translate-y-[2px] transition-transform"
            >
              {t('session.nextSentence')}
            </button>
          ) : (
            <button
              onClick={() => onSubmit(respostas)}
              disabled={!allAnswered}
              className="pop pop-shadow-jade flex-1 py-4 rounded-2xl bg-vermillion text-white font-display text-sm disabled:opacity-40 active:translate-x-[2px] active:translate-y-[2px] transition-transform"
            >
              {t('session.submitAll')}
            </button>
          )}
        </div>

        {/* Mini list of all answers */}
        <div className="mt-6 space-y-2.5">
          {frases.map((f, i) => (
            <div
              key={i}
              onClick={() => setCurrent(i)}
              className={`pop-sm p-3 rounded-xl cursor-pointer transition-transform active:translate-x-[1px] active:translate-y-[1px] ${
                i === current ? 'bg-gold' : 'bg-surface'
              }`}
            >
              <p className={`text-xs font-ui ${i === current ? 'text-ink/70 font-semibold' : 'text-fg/50'}`}>{f.pt_original}</p>
              {respostas[i] ? (
                <p className={`text-sm font-serif mt-1 ${i === current ? 'text-ink' : 'text-fg'}`}>{respostas[i]}</p>
              ) : (
                <p className={`text-xs font-ui mt-1 ${i === current ? 'text-ink/40' : 'text-fg/20'}`}>—</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
