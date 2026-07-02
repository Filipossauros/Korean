import type { Sessao } from '../types'
import { CheckIcon, XIcon } from './Icons'
import { PageSplats, Splat } from './Splat'
import { useT } from '../lib/i18n'

interface Props {
  sessao: Sessao
  showPart3Option: boolean
  onContinue: (doPart3: boolean) => void
  loading?: boolean
  // 'part1' = só a correção da tradução (com botão "continuar para produção");
  // 'final' = correção completa (Parte 1 + Parte 2) com terminar/escrita livre.
  stage?: 'part1' | 'final'
  // Deltas desta sessão no perfil (só no stage final): estruturas que passam a
  // dominadas e categorias de erro registadas.
  dominadasNovas?: string[]
  errosRegistados?: { categoria: string; vezes: number }[]
}

const CATEGORY_COLORS: Record<string, string> = {
  'partícula': 'bg-gold/10 text-gold',
  'vocabulário': 'bg-vermillion/10 text-vermillion',
  'gramática': 'bg-ink/10 text-fg/70',
  'tempo_verbal': 'bg-jade/10 text-jade',
  'registo': 'bg-gold/10 text-gold',
  'ordem_palavras': 'bg-ink/10 text-fg/70',
}

export function SessionCorrection({ sessao, showPart3Option, onContinue, loading, stage = 'final', dominadasNovas, errosRegistados }: Props) {
  const t = useT()
  const isPart1 = stage === 'part1'
  const max = isPart1 ? 10 : 20
  const total = isPart1 ? sessao.parte1.pontuacao : sessao.parte1.pontuacao + sessao.parte2.pontuacao
  const pct = Math.round((total / max) * 100)

  return (
    <div className="relative min-h-screen bg-paper pb-24 md:pb-0 overflow-hidden">
      <PageSplats />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        {/* Score summary — escondido enquanto a Parte 1 ainda está a corrigir */}
        {!(isPart1 && loading) && (
          <div className="pop pop-shadow-jade tilt-r rounded-2xl bg-ink p-5 mb-6 text-center">
            <p className="text-5xl font-display text-white mb-1">{total}<span className="text-2xl text-white/40">/{max}</span></p>
            <div className="w-full h-3 bg-black/30 rounded-full mt-3 mb-2 overflow-hidden border-2 border-white/10">
              <div
                className={`h-full transition-all ${pct >= 70 ? 'bg-jade' : pct >= 40 ? 'bg-gold' : 'bg-vermillion'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-sm text-white/60 font-display">{pct}% · {sessao.tema}</p>
          </div>
        )}

        {/* Part 1 correction */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-display text-sm text-fg">{t('corr.readingShort')}</h2>
            <span className="font-display text-sm text-fg">{sessao.parte1.pontuacao}/10</span>
          </div>
          <div className="pop rounded-2xl bg-surface p-4">
            <p className="text-xs text-fg/40 font-ui mb-1">{t('corr.yourTranslation')}</p>
            <p className="font-ui text-sm text-fg mb-3">{sessao.parte1.traducao_utilizador || '—'}</p>
            {sessao.parte1.traducao_referencia && (
              <>
                <p className="text-xs text-fg/40 font-ui mb-1">{t('corr.reference')}</p>
                <p className="font-ui text-sm text-jade">{sessao.parte1.traducao_referencia}</p>
              </>
            )}
            {sessao.parte1.erros.length > 0 && (
              <div className="mt-3 space-y-2">
                {sessao.parte1.erros.map((e, i) => (
                  <div key={i} className="flex gap-2 items-start text-xs">
                    <span className={`px-2 py-0.5 rounded-lg font-ui shrink-0 ${CATEGORY_COLORS[e.categoria] ?? 'bg-line text-fg/50'}`}>
                      {t('cat.' + e.categoria)}
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

        {/* Part 2 correction — só na correção final */}
        {!isPart1 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-display text-sm text-fg">{t('corr.productionShort')}</h2>
            <span className="font-display text-sm text-fg">{sessao.parte2.pontuacao}/10</span>
          </div>
          <div className="space-y-3">
            {sessao.parte2.frases.map((f, i) => (
              <div key={i} className={`pop-sm bg-surface rounded-xl p-4 ${f.correcto ? 'pop-shadow-jade' : 'pop-shadow-coral'}`}>
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
                        {t('cat.' + f.categoria_erro)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Estruturas que passam a dominadas com esta sessão */}
        {!loading && !isPart1 && (dominadasNovas?.length ?? 0) > 0 && (
          <div className="pop pop-shadow-coral tilt-r relative overflow-hidden rounded-2xl bg-gold p-4 mb-6">
            <Splat size={150} className="pointer-events-none absolute -right-9 -top-9 text-vermillion/30" />
            <div className="relative z-10">
              <p className="font-kr text-2xl text-ink leading-tight">완전 정복! ✦</p>
              <p className="font-display text-[10px] text-ink/70 mt-1.5">{t('corr.masteredLabel')}</p>
              <div className="flex flex-wrap gap-2 mt-2.5">
                {dominadasNovas!.map(forma => (
                  <span key={forma} className="pop-sm font-serif text-base px-2.5 py-1 bg-surface text-fg rounded-lg">{forma}</span>
                ))}
              </div>
              <p className="font-ui text-xs text-ink/65 font-medium mt-2.5">{t('corr.masteredNote')}</p>
            </div>
          </div>
        )}

        {/* Erros desta sessão somados ao perfil */}
        {!loading && !isPart1 && (errosRegistados?.length ?? 0) > 0 && (
          <div className="pop rounded-2xl bg-surface p-4 mb-6">
            <p className="font-display text-xs text-fg mb-3">{t('corr.loggedTitle')}</p>
            <div className="flex flex-wrap gap-2">
              {errosRegistados!.map(({ categoria, vezes }, i) => (
                <span
                  key={categoria}
                  className={`pop-sm rounded-lg px-2.5 py-1 text-xs font-ui font-semibold ${
                    i === 0 ? 'bg-vermillion text-white' : 'bg-gold text-ink'
                  }`}
                >
                  +{vezes} {t('cat.' + categoria)}
                </span>
              ))}
            </div>
            <p className="text-xs text-fg/50 font-ui font-medium mt-3">{t('corr.loggedNote')}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <p className="text-fg/40 font-ui text-sm animate-pulse">{t('session.correcting')}</p>
          </div>
        )}

        {/* CTA */}
        {!loading && isPart1 && (
          <button
            onClick={() => onContinue(false)}
            className="pop pop-shadow-jade tilt-r w-full py-4 rounded-2xl bg-vermillion text-white font-display text-sm active:translate-x-[2px] active:translate-y-[2px] transition-transform"
          >
            {t('corr.continueProduction')}
          </button>
        )}
        {!loading && !isPart1 && (
          <div className="space-y-3">
            {showPart3Option && (
              <button
                onClick={() => onContinue(false)}
                className="pop pop-shadow-coral w-full py-4 rounded-2xl bg-gold text-ink font-display text-sm active:translate-x-[2px] active:translate-y-[2px] transition-transform"
              >
                {t('corr.continueFree')}
              </button>
            )}
            <button
              onClick={() => onContinue(true)}
              className="pop w-full py-4 rounded-2xl bg-ink text-white font-display text-sm active:translate-x-[2px] active:translate-y-[2px] transition-transform"
            >
              {showPart3Option ? t('corr.skipFree') : t('corr.finish')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
