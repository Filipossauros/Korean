import { useState, useEffect, useRef } from 'react'
import type { SessionDraft } from '../types'
import { BookIcon, SpeakerIcon } from './Icons'
import { speakKorean, canSpeak } from '../lib/tts'
import { romanize } from '../lib/romanize'
import { useSettings } from '../lib/settings'
import { useT } from '../lib/i18n'

interface Props {
  draft: SessionDraft
  onSubmit: (traducao: string) => void
  showTimer: boolean
}

export function SessionReading({ draft, onSubmit, showTimer }: Props) {
  const t = useT()
  const { romanization } = useSettings()
  const [traducao, setTraducao] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())

  useEffect(() => {
    if (!showTimer) return
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [showTimer])

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-0">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BookIcon size={20} />
            <h1 className="font-ui font-semibold text-fg">{t('session.reading')}</h1>
          </div>
          {showTimer && (
            <span className="font-ui text-sm text-fg/40 tabular-nums">{fmt(elapsed)}</span>
          )}
        </div>

        {/* Vocab + grammar box */}
        <div className="bg-ink/5 rounded-2xl p-4 mb-6 border border-line">
          <h2 className="font-ui text-xs uppercase tracking-wider text-fg/50 mb-3">{t('session.newVocab')}</h2>
          <div className="space-y-2 mb-4">
            {draft.parte1.vocabulario_novo.map(v => (
              <div key={v.kr} className="flex gap-3 items-baseline">
                <span className="font-serif text-lg text-fg font-semibold">{v.kr}</span>
                <span className="text-fg/60 font-ui text-sm">— {v.pt}</span>
                {v.exemplo && <span className="text-fg/30 font-ui text-xs hidden sm:inline">{v.exemplo}</span>}
              </div>
            ))}
          </div>
          <div className="border-t border-line pt-3">
            <h2 className="font-ui text-xs uppercase tracking-wider text-fg/50 mb-2">{t('session.grammarPoint')}</h2>
            <div className="flex gap-2 items-baseline flex-wrap">
              <span className="font-serif text-base text-gold font-semibold">{draft.parte1.ponto_gramatical.forma}</span>
              <span className="text-fg/60 font-ui text-sm">— {draft.parte1.ponto_gramatical.significado}</span>
            </div>
            {draft.parte1.ponto_gramatical.exemplo && (
              <p className="text-xs text-fg/40 font-ui mt-1">{draft.parte1.ponto_gramatical.exemplo}</p>
            )}
          </div>
        </div>

        {/* Reading text */}
        <div className="bg-surface rounded-2xl p-5 mb-6 border border-line">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-ui text-xs uppercase tracking-wider text-fg/50">{t('session.text')}</h2>
            {canSpeak() && (
              <button onClick={() => speakKorean(draft.parte1.texto_kr)} className="text-fg/40 hover:text-jade transition-colors" title="Ouvir">
                <SpeakerIcon size={18} />
              </button>
            )}
          </div>
          <p className="font-serif text-xl leading-relaxed text-fg">{draft.parte1.texto_kr}</p>
          {romanization && <p className="text-sm text-fg/40 italic mt-2">{romanize(draft.parte1.texto_kr)}</p>}
        </div>

        {/* Translation input */}
        <div className="mb-6">
          <label className="font-ui text-sm text-fg/60 mb-2 block">{t('session.yourTranslation')}:</label>
          <textarea
            value={traducao}
            onChange={e => setTraducao(e.target.value)}
            rows={4}
            placeholder="Escreve aqui a tua tradução…"
            className="w-full rounded-xl border border-line bg-surface p-3 font-ui text-sm text-fg focus:outline-none focus:border-gold resize-none"
          />
        </div>

        <button
          onClick={() => onSubmit(traducao)}
          disabled={!traducao.trim()}
          className="w-full py-4 rounded-2xl bg-vermillion text-white font-ui font-semibold disabled:opacity-40 active:scale-95 transition-all"
        >
          {t('session.submitTranslation')}
        </button>
      </div>
    </div>
  )
}
