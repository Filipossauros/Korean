import { useState } from 'react'
import type { VocabItem, Perfil } from '../types'
import { LayersIcon, CheckIcon, XIcon, SpeakerIcon } from './Icons'
import { speakKorean, canSpeak } from '../lib/tts'
import { romanize } from '../lib/romanize'
import { useSettings } from '../lib/settings'

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
          <p className="font-ui mt-3">Nenhum vocabulário ainda</p>
          <p className="text-sm font-ui mt-1">Faz uma sessão para começar a aprender palavras</p>
        </div>
      </div>
    )
  }

  if (due.length === 0 || done) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-jade mb-3"><CheckIcon size={40} /></div>
          <h2 className="font-ui font-semibold text-fg text-xl">Tudo em dia!</h2>
          <p className="text-fg/50 font-ui mt-1 text-sm">
            {due.length === 0 ? 'Sem cartões para hoje.' : `Revisaste ${due.length} cartões.`}
          </p>
          <div className="mt-6 text-left bg-surface rounded-2xl p-4 border border-line max-w-xs mx-auto">
            <p className="text-xs text-fg/40 font-ui uppercase tracking-wide mb-3">Todo o vocabulário</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {perfil.vocabulario_visto.map(v => (
                <div key={v.kr} className="flex justify-between text-sm">
                  <span className="font-serif text-fg">{v.kr}</span>
                  <span className="text-fg/50 font-ui">{v.pt}</span>
                  <span className={`text-xs font-ui ${v.srs_nivel === 3 ? 'text-jade' : v.srs_nivel === 2 ? 'text-gold' : 'text-vermillion'}`}>
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
    <div className="min-h-screen bg-paper pb-24 md:pb-0">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <LayersIcon size={20} />
            <h1 className="font-ui font-semibold text-fg">Vocabulário SRS</h1>
          </div>
          <span className="text-sm text-fg/40 font-ui">{idx + 1}/{due.length}</span>
        </div>

        <div className="w-full h-1 bg-line rounded-full mb-8">
          <div className="h-1 bg-jade rounded-full transition-all" style={{ width: `${(idx / due.length) * 100}%` }} />
        </div>

        {/* Card */}
        <div
          className="bg-surface rounded-3xl border border-line shadow-sm p-8 text-center cursor-pointer select-none mb-6 min-h-48 flex flex-col justify-center"
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
              <p className="text-xs text-fg/30 font-ui">toca para ver</p>
            </>
          ) : (
            <>
              <p className="font-serif text-3xl text-fg mb-2">{card.pt}</p>
              <p className="font-serif text-xl text-fg/40 mb-1">{card.kr}</p>
              {romanization && <p className="text-xs text-fg/40 italic mb-3">{romanize(card.kr)}</p>}
              <div className="flex gap-2 justify-center mt-2">
                <span className={`text-xs px-2 py-0.5 rounded font-ui ${
                  card.srs_nivel === 3 ? 'bg-jade/10 text-jade' :
                  card.srs_nivel === 2 ? 'bg-gold/10 text-gold' : 'bg-vermillion/10 text-vermillion'
                }`}>N{card.srs_nivel}</span>
                <span className="text-xs text-fg/30 font-ui">visto {card.vezes_visto}×</span>
              </div>
            </>
          )}
        </div>

        {flipped && (
          <div className="flex gap-4">
            <button
              onClick={() => answer(false)}
              className="flex-1 py-4 rounded-2xl border border-vermillion/30 text-vermillion font-ui font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <XIcon size={18} /> Errei
            </button>
            <button
              onClick={() => answer(true)}
              className="flex-1 py-4 rounded-2xl border border-jade/30 text-jade font-ui font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <CheckIcon size={18} /> Acertei
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
