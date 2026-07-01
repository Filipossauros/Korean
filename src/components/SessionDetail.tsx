import type { Sessao } from '../types'
import { BookIcon, SpeakerIcon, CheckIcon, XIcon } from './Icons'
import { speakKorean, canSpeak } from '../lib/tts'
import { romanize } from '../lib/romanize'
import { useSettings } from '../lib/settings'
import { PageSplats } from './Splat'

function Speak({ text }: { text: string }) {
  if (!canSpeak() || !text.trim()) return null
  return (
    <button onClick={() => speakKorean(text)} className="text-fg/30 hover:text-jade transition-colors shrink-0" title="Ouvir">
      <SpeakerIcon size={16} />
    </button>
  )
}

export function SessionDetail({ sessao, onBack }: { sessao: Sessao; onBack: () => void }) {
  const { romanization } = useSettings()
  const total = sessao.parte1.pontuacao + sessao.parte2.pontuacao

  return (
    <div className="relative min-h-screen bg-paper pb-24 md:pb-0 overflow-hidden">
      <PageSplats />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        <button onClick={onBack} className="pop-sm inline-block bg-surface rounded-xl px-3 py-1.5 text-[11px] font-display text-fg mb-4">← Voltar</button>

        <div className="flex items-center gap-2 mb-1">
          <BookIcon size={20} />
          <h1 className="font-kr text-2xl text-fg">{sessao.tema}</h1>
        </div>
        <p className="text-xs text-fg/50 font-ui mb-6">
          {new Date(sessao.data).toLocaleString()} · {total}/20 · {sessao.unidade_ksi}
        </p>

        {/* Parte 1 */}
        <h2 className="font-display text-xs text-fg mb-2">Leitura · {sessao.parte1.pontuacao}/10</h2>
        <div className="pop rounded-2xl bg-surface p-4 mb-6">
          <div className="flex items-start gap-2 mb-3">
            <p className="font-serif text-lg text-fg flex-1">{sessao.parte1.texto_kr}</p>
            <Speak text={sessao.parte1.texto_kr} />
          </div>
          {romanization && <p className="text-xs text-fg/40 italic mb-3">{romanize(sessao.parte1.texto_kr)}</p>}
          <p className="text-xs text-fg/40 font-ui">A tua tradução:</p>
          <p className="font-ui text-sm text-fg mb-2">{sessao.parte1.traducao_utilizador || '—'}</p>
          {sessao.parte1.traducao_referencia && (
            <>
              <p className="text-xs text-fg/40 font-ui">Referência:</p>
              <p className="font-ui text-sm text-jade">{sessao.parte1.traducao_referencia}</p>
            </>
          )}
        </div>

        {/* Parte 2 */}
        <h2 className="font-display text-xs text-fg mb-2">Produção · {sessao.parte2.pontuacao}/10</h2>
        <div className="space-y-3 mb-6">
          {sessao.parte2.frases.map((f, i) => (
            <div key={i} className={`pop-sm bg-surface rounded-xl p-4 ${f.correcto ? 'pop-shadow-jade' : 'pop-shadow-coral'}`}>
              <div className="flex gap-2 items-start">
                <span className={`mt-0.5 shrink-0 ${f.correcto ? 'text-jade' : 'text-vermillion'}`}>
                  {f.correcto ? <CheckIcon size={16} /> : <XIcon size={16} />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-fg/40 font-ui">{f.pt_original}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-serif text-base text-fg mt-0.5">{f.kr_utilizador || '—'}</p>
                    <Speak text={f.kr_utilizador} />
                  </div>
                  {!f.correcto && f.kr_referencia && <p className="font-serif text-sm text-jade mt-1">{f.kr_referencia}</p>}
                  {f.nota && <p className="text-xs text-fg/50 font-ui mt-1">{f.nota}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Parte 3 */}
        {sessao.parte3 && (
          <>
            <h2 className="font-display text-xs text-fg mb-2">Escrita livre</h2>
            <div className="pop rounded-2xl bg-surface p-4">
              <p className="font-serif text-base text-fg mb-2">{sessao.parte3.texto_utilizador}</p>
              <p className="text-xs text-fg/40 font-ui mb-1">Correção:</p>
              <p className="font-serif text-sm text-jade mb-2">{sessao.parte3.correcao}</p>
              {sessao.parte3.estruturas_espontaneas.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {sessao.parte3.estruturas_espontaneas.map(e => (
                    <span key={e} className="pop-sm text-xs font-serif px-2 py-1 bg-jade text-ink rounded-lg">{e}</span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
