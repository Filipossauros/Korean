import { useState } from 'react'
import type { VocabItem, Perfil } from '../types'
import { LayersIcon, CheckIcon, XIcon, SpeakerIcon } from './Icons'
import { speakKorean, canSpeak } from '../lib/tts'
import { romanize } from '../lib/romanize'
import { useSettings } from '../lib/settings'
import { PageSplats } from './Splat'
import { useT } from '../lib/i18n'

interface Props {
  perfil: Perfil
  onUpdate: (updater: (p: Perfil) => Perfil) => void
}

function getNextReview(nivel: 1 | 2 | 3): string {
  const d = new Date()
  if (nivel === 1) d.setDate(d.getDate() + 1)
  else if (nivel === 2) d.setDate(d.getDate() + 7)
  else d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

export function Vocabulary({ perfil, onUpdate }: Props) {
  const { romanization } = useSettings()
  const t = useT()
  const today = new Date().toISOString().slice(0, 10)
  const due = perfil.vocabulario_visto.filter(v => v.srs_proxima_revisao <= today)
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)

  if (perfil.vocabulario_visto.length === 0) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center text-fg/30">
          <LayersIcon size={40} />
          <p className="font-ui mt-3">{t('vocab.none')}</p>
          <p className="text-sm font-ui mt-1">{t('vocab.doSession')}</p>
        </div>
      </div>
    )
  }

  if (due.length === 0 || done) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-jade mb-3"><CheckIcon size={40} /></div>
          <h2 className="font-ui font-semibold text-fg text-xl">{t('vocab.allDone')}</h2>
          <p className="text-fg/50 font-ui mt-1 text-sm">
            {due.length === 0 ? t('vocab.noneToday') : t('vocab.reviewed').replace('{n}', String(due.length))}
          </p>
          <div className="pop mt-6 text-left bg-surface rounded-2xl p-4 max-w-xs mx-auto">
            <p className="font-display text-[11px] text-fg/60 mb-3">{t('vocab.all')}</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {perfil.vocabulario_visto.map(v => (
                <div key={v.kr} className="flex justify-between items-center text-sm gap-2">
                  <span className="font-kr text-fg">{v.kr}</span>
                  <span className="text-fg/50 font-ui flex-1">{v.pt}</span>
                  <span className={`pop-sm text-[10px] font-display rounded px-1.5 py-0.5 text-ink ${v.srs_nivel === 3 ? 'bg-jade' : v.srs_nivel === 2 ? 'bg-gold' : 'bg-vermillion text-white'}`}>
                    N{v.srs_nivel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const card: VocabItem = due[idx]

  const answer = (correct: boolean) => {
    onUpdate(p => ({
      ...p,
      vocabulario_visto: p.vocabulario_visto.map(v => {
        if (v.kr !== card.kr) return v
        const newNivel = correct
          ? Math.min(3, v.srs_nivel + 1) as 1 | 2 | 3
          : 1
        return {
          ...v,
          vezes_correcto: correct ? v.vezes_correcto + 1 : v.vezes_correcto,
          ultimo_erro: correct ? v.ultimo_erro : new Date().toISOString().slice(0, 10),
          srs_nivel: newNivel,
          srs_proxima_revisao: getNextReview(newNivel),
        }
      })
    }))
    setFlipped(false)
    if (idx + 1 >= due.length) {
      setDone(true)
    } else {
      setIdx(i => i + 1)
    }
  }

  return (
    <div className="relative min-h-screen bg-paper pb-24 md:pb-0 overflow-hidden">
      <PageSplats />
      <div className="relative z-10 max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="pop-sm tilt-l inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-1.5 text-jade">
            <LayersIcon size={18} />
            <span className="font-display text-xs">{t('vocab.title')}</span>
          </div>
          <span className="font-display text-sm text-fg/60">{idx + 1}/{due.length}</span>
        </div>

        <div className="w-full h-2.5 bg-surface rounded-full mb-8 border-2 border-ink overflow-hidden">
          <div className="h-full bg-jade transition-all" style={{ width: `${(idx / due.length) * 100}%` }} />
        </div>

        {/* Card */}
        <div
          className="pop pop-shadow-jade tilt-r bg-surface rounded-3xl p-8 text-center cursor-pointer select-none mb-6 min-h-48 flex flex-col justify-center"
          onClick={() => setFlipped(f => !f)}
        >
          {!flipped ? (
            <>
              <p className="font-serif text-5xl text-fg mb-2">{card.kr}</p>
              {romanization && <p className="text-sm text-fg/40 italic mb-2">{romanize(card.kr)}</p>}
              {canSpeak() && (
                <button onClick={e => { e.stopPropagation(); speakKorean(card.kr) }} className="text-fg/30 hover:text-jade mx-auto mb-2" title="Ouvir">
                  <SpeakerIcon size={22} />
                </button>
              )}
              <p className="text-xs text-fg/30 font-ui">{t('vocab.tapToSee')}</p>
            </>
          ) : (
            <>
              <p className="font-ui font-bold text-3xl text-fg mb-2">{card.pt}</p>
              <p className="font-kr text-xl text-fg/50 mb-1">{card.kr}</p>
              {romanization && <p className="text-xs text-fg/40 italic mb-3">{romanize(card.kr)}</p>}
              <div className="flex gap-2 justify-center items-center mt-2">
                <span className={`pop-sm text-[10px] px-2 py-0.5 rounded-lg font-display text-ink ${
                  card.srs_nivel === 3 ? 'bg-jade' :
                  card.srs_nivel === 2 ? 'bg-gold' : 'bg-vermillion text-white'
                }`}>N{card.srs_nivel}</span>
                <span className="text-xs text-fg/40 font-ui">{t('vocab.seen')} {card.vezes_visto}×</span>
              </div>
            </>
          )}
        </div>

        {flipped && (
          <div className="flex gap-4">
            <button
              onClick={() => answer(false)}
              className="pop flex-1 py-4 rounded-2xl bg-vermillion text-white font-display text-sm flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[2px] transition-transform"
            >
              <XIcon size={18} /> {t('vocab.wrong')}
            </button>
            <button
              onClick={() => answer(true)}
              className="pop flex-1 py-4 rounded-2xl bg-jade text-ink font-display text-sm flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[2px] transition-transform"
            >
              <CheckIcon size={18} /> {t('vocab.right')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
