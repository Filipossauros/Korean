import { useState, useRef, useEffect } from 'react'
import type { Dialogo, Perfil } from '../types'
import { generateDialogue } from '../api/anthropic'
import { getUnidade } from '../lib/curriculum'
import { dialogueTurns } from '../lib/progression'
import { speakKorean, stopSpeaking, canSpeak, hasKoreanVoice } from '../lib/tts'
import { useT } from '../lib/i18n'
import { useSettings } from '../lib/settings'
import { romanize } from '../lib/romanize'
import { SpeakerIcon, MessageIcon, CheckIcon, XIcon } from './Icons'
import { PageSplats } from './Splat'

export function Dialogue({ nivel, perfil }: { nivel: string; perfil: Perfil }) {
  const t = useT()
  const { romanization } = useSettings()
  const [dialogo, setDialogo] = useState<Dialogo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [playing, setPlaying] = useState(false)
  const [activeLine, setActiveLine] = useState(-1)
  // Compreensão: respostas escolhidas, se já foi avaliado, e se a tradução está desbloqueada.
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [graded, setGraded] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const cancelRef = useRef(false)

  useEffect(() => () => stopSpeaking(), [])

  const resetInteraction = () => { setAnswers({}); setGraded(false); setUnlocked(false) }

  const generate = async () => {
    setLoading(true); setError(''); stopSpeaking(); setPlaying(false); setActiveLine(-1)
    resetInteraction()
    try {
      const d = await generateDialogue(nivel, getUnidade(nivel), dialogueTurns(perfil))
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

  const perguntas = dialogo?.perguntas ?? []
  const hasQuiz = perguntas.length > 0
  const allAnswered = hasQuiz && perguntas.every((_, i) => answers[i] !== undefined)
  const score = graded ? perguntas.reduce((n, q, i) => n + (answers[i] === q.correta ? 1 : 0), 0) : 0

  const submitQuiz = () => { setGraded(true); setUnlocked(true) }

  return (
    <div className="relative min-h-screen bg-paper pb-24 md:pb-0 overflow-hidden">
      <PageSplats />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="pop-sm tilt-l inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-1.5 text-jade">
            <MessageIcon size={18} />
            <span className="font-display text-xs">{t('dialogue.title')}</span>
          </div>
        </div>

        {!dialogo && !loading && (
          <p className="text-fg/60 font-ui text-sm mb-4">{t('dialogue.intro')}</p>
        )}

        {!hasKoreanVoice() && canSpeak() && (
          <p className="text-xs text-gold font-ui mb-4">{t('dialogue.noVoice')}</p>
        )}

        {error && <p className="text-vermillion text-sm font-ui font-bold mb-3">{error}</p>}

        {dialogo && (
          <>
            <div className="pop tilt-r rounded-2xl bg-gold p-3 mb-4">
              <p className="font-kr text-lg text-ink">{dialogo.tema}</p>
            </div>
            <div className="flex gap-2 mb-4">
              {canSpeak() && (
                <button
                  onClick={playing ? stop : playAll}
                  className="pop-sm flex-1 py-3 rounded-xl bg-jade text-ink font-display text-xs active:translate-x-[2px] active:translate-y-[2px] transition-transform"
                >
                  {playing ? t('dialogue.stop') : t('dialogue.playAll')}
                </button>
              )}
              <button
                onClick={generate}
                disabled={loading}
                className="pop-sm flex-1 py-3 rounded-xl bg-surface text-fg font-display text-xs active:translate-x-[2px] active:translate-y-[2px] transition-transform"
              >
                {t('dialogue.newOne')}
              </button>
            </div>

            {/* Diálogo — coreano sempre visível; tradução só quando desbloqueada */}
            <div className="space-y-3">
              {dialogo.linhas.map((linha, i) => (
                <div
                  key={i}
                  className={`flex ${linha.falante === 'B' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`pop-sm max-w-xs md:max-w-md rounded-2xl px-4 py-3 ${
                    activeLine === i ? 'ring-4 ring-jade/40' : ''
                  } ${linha.falante === 'B' ? 'bg-jade' : 'bg-surface'}`}>
                    <div className="flex items-start gap-2">
                      <span className={`font-display text-xs shrink-0 ${linha.falante === 'B' ? 'text-ink' : 'text-vermillion'}`}>
                        {linha.falante}
                      </span>
                      <div className="min-w-0">
                        <p className={`font-serif text-lg ${linha.falante === 'B' ? 'text-ink' : 'text-fg'}`}>{linha.kr}</p>
                        {romanization && (
                          <p className={`text-xs italic ${linha.falante === 'B' ? 'text-ink/60' : 'text-fg/40'}`}>{linha.romanizacao || romanize(linha.kr)}</p>
                        )}
                        {unlocked && (
                          <p className={`text-sm font-ui mt-0.5 ${linha.falante === 'B' ? 'text-ink/70' : 'text-fg/60'}`}>{linha.traducao}</p>
                        )}
                      </div>
                      {canSpeak() && (
                        <button
                          onClick={() => speakKorean(linha.kr, { voiceIndex: voiceFor(linha.falante) })}
                          className={`shrink-0 ${linha.falante === 'B' ? 'text-ink/50' : 'text-fg/40'}`}
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

            {/* Compreensão */}
            {hasQuiz && (
              <div className="mt-6">
                <div className="pop-sm tilt-l inline-flex items-center gap-2 rounded-xl bg-vermillion px-3 py-1.5 text-white mb-3">
                  <span className="font-display text-xs">{t('dialogue.comprehension')}</span>
                </div>

                <div className="space-y-4">
                  {perguntas.map((q, qi) => (
                    <div key={qi} className="pop rounded-2xl bg-surface p-4">
                      <p className="font-serif text-base text-fg mb-3">{qi + 1}. {q.pergunta}</p>
                      <div className="space-y-2">
                        {q.opcoes.map((opt, oi) => {
                          const chosen = answers[qi] === oi
                          const isCorrect = oi === q.correta
                          let cls = 'bg-paper text-fg'
                          if (graded) {
                            if (isCorrect) cls = 'bg-jade text-ink pop-shadow-jade'
                            else if (chosen) cls = 'bg-vermillion text-white pop-shadow-coral'
                            else cls = 'bg-paper text-fg/50'
                          } else if (chosen) {
                            cls = 'bg-gold text-ink'
                          }
                          return (
                            <button
                              key={oi}
                              disabled={graded}
                              onClick={() => setAnswers(a => ({ ...a, [qi]: oi }))}
                              className={`pop-sm w-full text-left rounded-xl px-3 py-2 font-ui text-sm flex items-center gap-2 ${cls} ${!graded ? 'active:translate-x-[2px] active:translate-y-[2px] transition-transform' : ''}`}
                            >
                              {graded && isCorrect && <CheckIcon size={16} />}
                              {graded && chosen && !isCorrect && <XIcon size={16} />}
                              <span className="min-w-0">{opt}</span>
                            </button>
                          )
                        })}
                      </div>
                      {graded && (
                        <p className="text-xs text-fg/60 font-ui mt-3">{q.explicacao}</p>
                      )}
                    </div>
                  ))}
                </div>

                {!graded ? (
                  <>
                    {!allAnswered && <p className="text-xs text-fg/40 font-ui mt-3">{t('dialogue.answerAll')}</p>}
                    <button
                      onClick={submitQuiz}
                      disabled={!allAnswered}
                      className="pop pop-shadow-jade tilt-r w-full py-4 rounded-2xl bg-vermillion text-white font-display text-sm disabled:opacity-40 mt-3 active:translate-x-[2px] active:translate-y-[2px] transition-transform"
                    >
                      {t('dialogue.check')}
                    </button>
                  </>
                ) : (
                  <div className="pop rounded-2xl bg-jade p-4 text-ink mt-4">
                    <p className="font-display text-sm">{t('dialogue.score')} {score}/{perguntas.length}</p>
                  </div>
                )}
              </div>
            )}

            {/* Sem quiz (fallback): permitir revelar a tradução directamente */}
            {!hasQuiz && !unlocked && (
              <button
                onClick={() => setUnlocked(true)}
                className="pop-sm w-full py-3 rounded-xl bg-surface text-fg font-display text-xs mt-4 active:translate-x-[2px] active:translate-y-[2px] transition-transform"
              >
                {t('dialogue.showTranslation')}
              </button>
            )}

            {hasQuiz && !unlocked && (
              <p className="text-xs text-fg/40 font-ui mt-3 text-center">{t('dialogue.locked')}</p>
            )}
          </>
        )}

        {!dialogo && (
          <button
            onClick={generate}
            disabled={loading}
            className="pop pop-shadow-jade tilt-r w-full py-4 rounded-2xl bg-vermillion text-white font-display text-sm disabled:opacity-40 mt-2 active:translate-x-[2px] active:translate-y-[2px] transition-transform"
          >
            {loading ? t('dialogue.generating') : t('dialogue.generate')}
          </button>
        )}
      </div>
    </div>
  )
}
