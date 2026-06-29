import { useState, useRef, useEffect } from 'react'
import type { Dialogo } from '../types'
import { generateDialogue } from '../api/anthropic'
import { getUnidade } from '../lib/curriculum'
import { speakKorean, stopSpeaking, canSpeak, hasKoreanVoice } from '../lib/tts'
import { useT } from '../lib/i18n'
import { useSettings } from '../lib/settings'
import { romanize } from '../lib/romanize'
import { SpeakerIcon, MessageIcon } from './Icons'

export function Dialogue({ nivel }: { nivel: string }) {
  const t = useT()
  const { romanization } = useSettings()
  const [dialogo, setDialogo] = useState<Dialogo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [playing, setPlaying] = useState(false)
  const [activeLine, setActiveLine] = useState(-1)
  const cancelRef = useRef(false)

  useEffect(() => () => stopSpeaking(), [])

  const generate = async () => {
    setLoading(true); setError(''); stopSpeaking(); setPlaying(false); setActiveLine(-1)
    try {
      const d = await generateDialogue(nivel, getUnidade(nivel))
      setDialogo(d)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }

  const voiceFor = (falante: string) => (falante === 'B' ? 1 : 0)

  const playAll = () => {
    if (!dialogo) return
    cancelRef.current = false
    setPlaying(true)
    let i = 0
    const next = () => {
      if (cancelRef.current || i >= dialogo.linhas.length) {
        setPlaying(false); setActiveLine(-1); return
      }
      const linha = dialogo.linhas[i]
      setActiveLine(i)
      speakKorean(linha.kr, { voiceIndex: voiceFor(linha.falante), onend: () => { i++; next() } })
    }
    next()
  }

  const stop = () => { cancelRef.current = true; stopSpeaking(); setPlaying(false); setActiveLine(-1) }

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-0">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageIcon size={20} />
          <h1 className="font-ui font-semibold text-fg">{t('dialogue.title')}</h1>
        </div>

        {!dialogo && !loading && (
          <p className="text-fg/50 font-ui text-sm mb-4">{t('dialogue.intro')}</p>
        )}

        {!hasKoreanVoice() && canSpeak() && (
          <p className="text-xs text-gold font-ui mb-4">{t('dialogue.noVoice')}</p>
        )}

        {error && <p className="text-vermillion text-sm font-ui mb-3">{error}</p>}

        {dialogo && (
          <>
            <div className="bg-gold/10 rounded-2xl p-3 border border-gold/20 mb-4">
              <p className="font-serif text-base text-fg">{dialogo.tema}</p>
            </div>
            <div className="flex gap-2 mb-4">
              {canSpeak() && (
                <button
                  onClick={playing ? stop : playAll}
                  className="flex-1 py-3 rounded-xl bg-jade text-white font-ui text-sm font-semibold"
                >
                  {playing ? t('dialogue.stop') : t('dialogue.playAll')}
                </button>
              )}
              <button
                onClick={generate}
                disabled={loading}
                className="flex-1 py-3 rounded-xl border border-line text-fg font-ui text-sm"
              >
                {t('dialogue.newOne')}
              </button>
            </div>

            <div className="space-y-3">
              {dialogo.linhas.map((linha, i) => (
                <div
                  key={i}
                  className={`flex ${linha.falante === 'B' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs md:max-w-md rounded-2xl px-4 py-3 border ${
                    activeLine === i ? 'border-jade ring-2 ring-jade/30' : 'border-line'
                  } ${linha.falante === 'B' ? 'bg-jade/5' : 'bg-surface'}`}>
                    <div className="flex items-start gap-2">
                      <span className={`text-xs font-ui font-bold shrink-0 ${linha.falante === 'B' ? 'text-jade' : 'text-vermillion'}`}>
                        {linha.falante}
                      </span>
                      <div className="min-w-0">
                        <p className="font-serif text-lg text-fg">{linha.kr}</p>
                        {romanization && linha.romanizacao && (
                          <p className="text-xs text-fg/40 italic">{linha.romanizacao || romanize(linha.kr)}</p>
                        )}
                        <p className="text-sm text-fg/60 font-ui mt-0.5">{linha.traducao}</p>
                      </div>
                      {canSpeak() && (
                        <button
                          onClick={() => speakKorean(linha.kr, { voiceIndex: voiceFor(linha.falante) })}
                          className="text-fg/30 hover:text-jade shrink-0"
                          title="Ouvir"
                        >
                          <SpeakerIcon size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!dialogo && (
          <button
            onClick={generate}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-vermillion text-white font-ui font-semibold disabled:opacity-40 mt-2"
          >
            {loading ? t('dialogue.generating') : t('dialogue.generate')}
          </button>
        )}
      </div>
    </div>
  )
}
