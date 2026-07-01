import { useState, useEffect, useRef } from 'react'
import type { SessionDraft } from '../types'
import { BookIcon, SpeakerIcon } from './Icons'
import { speakKorean, canSpeak } from '../lib/tts'
import { romanize } from '../lib/romanize'
import { useSettings } from '../lib/settings'
import { PageSplats } from './Splat'
import { useT } from '../lib/i18n'

interface Props {
  draft: SessionDraft
  onSubmit: (traducao: string) => void
  showTimer: boolean
  initialValue?: string
}

export function SessionReading({ draft, onSubmit, showTimer, initialValue = '' }: Props) {
  const t = useT()
  const { romanization } = useSettings()
  const [traducao, setTraducao] = useState(initialValue)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())

  useEffect(() => {
    if (!showTimer) return
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [showTimer])

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="relative min-h-screen bg-paper pb-24 md:pb-0 overflow-hidden">
      <PageSplats />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="pop-sm tilt-l inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-1.5 text-jade">
            <BookIcon size={18} />
            <span className="font-display text-xs">{t('session.reading')}</span>
          </div>
          {showTimer && (
            <span className="font-display text-sm text-fg/50 tabular-nums">{fmt(elapsed)}</span>
          )}
        </div>

        {/* Vocab + grammar box */}
        <div className="pop tilt-r rounded-2xl bg-gold p-4 mb-6">
          <h2 className="font-display text-[11px] text-ink mb-3">{t('session.newVocab')}</h2>
          <div className="space-y-3 mb-4">
            {draft.parte1.vocabulario_novo.map(v => (
              <div key={v.kr} className="flex flex-col">
                <div className="flex gap-2 items-baseline flex-wrap">
                  <span className="font-kr text-lg text-ink">{v.kr}</span>
                  <span className="text-ink/70 font-ui text-sm font-medium">{v.pt}</span>
                </div>
                {v.exemplo && (
                  <p className="text-ink/50 font-ui text-xs mt-0.5 leading-snug">{v.exemplo}</p>
                )}
              </div>
            ))}
          </div>
          <div className="border-t-2 border-ink/20 pt-3">
            <h2 className="font-display text-[11px] text-ink mb-2">{t('session.grammarPoint')}</h2>
            <div className="flex gap-2 items-baseline flex-wrap">
              <span className="font-kr text-base text-ink">{draft.parte1.ponto_gramatical.forma}</span>
              <span className="text-ink/70 font-ui text-sm font-medium">— {draft.parte1.ponto_gramatical.significado}</span>
            </div>
            {draft.parte1.ponto_gramatical.exemplo && (
              <p className="text-xs text-ink/50 font-ui mt-1">{draft.parte1.ponto_gramatical.exemplo}</p>
            )}
          </div>
        </div>

        {/* Reading text */}
        <div className="pop pop-shadow-jade tilt-l rounded-2xl bg-ink p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-[11px] text-vermillion">{t('session.text')}</h2>
            {canSpeak() && (
              <button onClick={() => speakKorean(draft.parte1.texto_kr)} className="text-jade" title="Ouvir">
                <SpeakerIcon size={20} />
              </button>
            )}
          </div>
          <p className="font-serif text-xl leading-relaxed text-white">{draft.parte1.texto_kr}</p>
          {romanization && <p className="text-sm text-jade italic mt-2">{romanize(draft.parte1.texto_kr)}</p>}
        </div>

        {/* Translation input */}
        <div className="mb-6">
          <label className="font-ui text-sm font-bold text-fg mb-2 block">{t('session.yourTranslation')}:</label>
          <textarea
            value={traducao}
            onChange={e => setTraducao(e.target.value)}
            rows={4}
            placeholder="Escreve aqui a tua tradução…"
            className="pop w-full rounded-xl bg-surface p-3 font-ui text-sm text-fg focus:outline-none resize-none"
          />
        </div>

        <button
          onClick={() => onSubmit(traducao)}
          disabled={!traducao.trim()}
          className="pop pop-shadow-jade tilt-r w-full py-4 rounded-2xl bg-vermillion text-white font-display text-sm disabled:opacity-40 active:translate-x-[2px] active:translate-y-[2px] transition-transform"
        >
          {t('session.submitTranslation')}
        </button>
      </div>
    </div>
  )
}
