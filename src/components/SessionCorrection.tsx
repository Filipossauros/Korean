import type { Sessao } from '../types'
import { CheckIcon, XIcon } from './Icons'

interface Props {
  sessao: Sessao
  showPart3Option: boolean
  onContinue: (doPart3: boolean) => void
  loading?: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  'partícula': 'Partícula',
  'vocabulário': 'Vocabulário',
  'gramática': 'Gramática',
  'tempo_verbal': 'Tempo verbal',
  'registo': 'Registo',
  'ordem_palavras': 'Ordem',
}

const CATEGORY_COLORS: Record<string, string> = {
  'partícula': 'bg-gold/10 text-gold',
  'vocabulário': 'bg-vermillion/10 text-vermillion',
  'gramática': 'bg-ink/10 text-fg/70',
  'tempo_verbal': 'bg-jade/10 text-jade',
  'registo': 'bg-gold/10 text-gold',
  'ordem_palavras': 'bg-ink/10 text-fg/70',
}

export function SessionCorrection({ sessao, showPart3Option, onContinue, loading }: Props) {
  const total = sessao.parte1.pontuacao + sessao.parte2.pontuacao
  const pct = Math.round((total / 20) * 100)

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-0">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Score summary */}
        <div className="bg-surface rounded-2xl p-5 border border-line mb-6 text-center">
          <p className="text-5xl font-bold font-ui text-fg mb-1">{total}<span className="text-2xl text-fg/30">/20</span></p>
          <div className="w-full h-2 bg-line rounded-full mt-3 mb-2">
            <div
              className={`h-2 rounded-full transition-all ${pct >= 70 ? 'bg-jade' : pct >= 40 ? 'bg-gold' : 'bg-vermillion'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-sm text-fg/50 font-ui">{pct}% · {sessao.tema}</p>
        </div>

        {/* Part 1 correction */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-ui font-semibold text-fg">Leitura</h2>
            <span className="font-ui text-sm font-bold text-fg">{sessao.parte1.pontuacao}/10</span>
          </div>
          <div className="bg-surface rounded-2xl p-4 border border-line">
            <p className="text-xs text-fg/40 font-ui mb-1">A tua tradução:</p>
            <p className="font-ui text-sm text-fg mb-3">{sessao.parte1.traducao_utilizador || '—'}</p>
            {sessao.parte1.traducao_referencia && (
              <>
                <p className="text-xs text-fg/40 font-ui mb-1">Tradução de referência:</p>
                <p className="font-ui text-sm text-jade">{sessao.parte1.traducao_referencia}</p>
              </>
            )}
            {sessao.parte1.erros.length > 0 && (
              <div className="mt-3 space-y-2">
                {sessao.parte1.erros.map((e, i) => (
                  <div key={i} className="flex gap-2 items-start text-xs">
                    <span className={`px-2 py-0.5 rounded-lg font-ui shrink-0 ${CATEGORY_COLORS[e.categoria] ?? 'bg-line text-fg/50'}`}>
                      {CATEGORY_LABELS[e.categoria] ?? e.categoria}
                    </span>
                    <div>
                      <span className="line-through text-vermillion">{e.original}</span>
                      {' → '}
                      <span className="text-jade font-serif">{e.correcto}</span>
                      {e.nota && <p className="text-fg/50 mt-0.5">{e.nota}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Part 2 correction */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-ui font-semibold text-fg">Produção</h2>
            <span className="font-ui text-sm font-bold text-fg">{sessao.parte2.pontuacao}/10</span>
          </div>
          <div className="space-y-3">
            {sessao.parte2.frases.map((f, i) => (
              <div key={i} className={`bg-surface rounded-xl p-4 border ${f.correcto ? 'border-jade/30' : 'border-vermillion/30'}`}>
                <div className="flex gap-2 items-start">
                  <span className={`mt-0.5 shrink-0 ${f.correcto ? 'text-jade' : 'text-vermillion'}`}>
                    {f.correcto ? <CheckIcon size={16} /> : <XIcon size={16} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-fg/40 font-ui">{f.pt_original}</p>
                    <p className="font-serif text-base text-fg mt-0.5">{f.kr_utilizador || '—'}</p>
                    {!f.correcto && f.kr_referencia && (
                      <p className="font-serif text-sm text-jade mt-1">{f.kr_referencia}</p>
                    )}
                    {f.nota && <p className="text-xs text-fg/50 font-ui mt-1">{f.nota}</p>}
                    {!f.correcto && f.categoria_erro && (
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-ui mt-1 inline-block ${CATEGORY_COLORS[f.categoria_erro] ?? 'bg-line text-fg/50'}`}>
                        {CATEGORY_LABELS[f.categoria_erro] ?? f.categoria_erro}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {loading && (
          <div className="text-center py-4">
            <p className="text-fg/40 font-ui text-sm animate-pulse">A corrigir…</p>
          </div>
        )}

        {/* CTA */}
        {!loading && (
          <div className="space-y-3">
            {showPart3Option && (
              <button
                onClick={() => onContinue(false)}
                className="w-full py-4 rounded-2xl bg-gold text-white font-ui font-semibold active:scale-95 transition-all"
              >
                Continuar para escrita livre
              </button>
            )}
            <button
              onClick={() => onContinue(true)}
              className="w-full py-4 rounded-2xl bg-ink text-white font-ui font-semibold active:scale-95 transition-all"
            >
              {showPart3Option ? 'Saltar escrita livre' : 'Terminar sessão'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
