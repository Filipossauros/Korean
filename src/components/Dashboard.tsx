import type { Perfil, Sessao } from '../types'
import { getSRSDueCount } from '../hooks/useProfile'
import { FireIcon, LayersIcon, BookIcon, SpeakerIcon } from './Icons'
import { useT } from '../lib/i18n'

interface Props {
  perfil: Perfil
  sessoes: Sessao[]
  resumable: boolean
  onStart: () => void
  onContinue: () => void
  onNew: () => void
  onNav: (view: string) => void
  onOpenSession: (s: Sessao) => void
}

const inkShadow = { textShadow: '2px 2px 0 rgb(var(--ink-fixed))' }

export function Dashboard({ perfil, sessoes, resumable, onStart, onContinue, onNew, onNav, onOpenSession }: Props) {
  const t = useT()
  const today = new Date().toISOString().slice(0, 10)
  const didToday = perfil.ultima_sessao.slice(0, 10) === today
  const srsDue = getSRSDueCount(perfil.vocabulario_visto)
  const dominadas = perfil.estruturas.filter(e => e.estado === 'dominada').length
  const emProgresso = perfil.estruturas.filter(e => e.estado === 'em_progresso').length

  const recentSessoes = sessoes.slice(0, 5)

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-0">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header banner */}
        <div className="pop pop-shadow-coral tilt-l inline-block rounded-2xl bg-ink px-5 py-3 mb-3">
          <h1 className="font-kr text-3xl text-jade leading-none">한글 일기</h1>
          <p className="font-display text-[10px] text-white/90 mt-1">KOREAN DIARY</p>
        </div>
        <div className="mb-6">
          <span className="pop-sm inline-block rounded-full bg-gold text-ink font-display text-[11px] px-3 py-1">
            {t('common.level')} {perfil.nivel_atual} → {perfil.nivel_seguinte}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="pop tilt-l rounded-2xl bg-vermillion p-3 text-center">
            <div className="flex justify-center text-white mb-1"><FireIcon size={24} /></div>
            <p className="font-display text-2xl text-white leading-none" style={inkShadow}>{perfil.streak}</p>
            <p className="font-ui font-semibold text-[11px] text-ink mt-1">{t('common.days')}</p>
          </div>
          <div className="pop tilt-r rounded-2xl bg-jade p-3 text-center">
            <div className="flex justify-center text-white mb-1"><BookIcon size={24} /></div>
            <p className="font-display text-2xl text-ink leading-none">{perfil.sessoes_realizadas}</p>
            <p className="font-ui font-semibold text-[11px] text-ink mt-1">{t('dash.sessions')}</p>
          </div>
          <div className="pop tilt-l rounded-2xl bg-gold p-3 text-center">
            <div className="flex justify-center text-ink mb-1"><LayersIcon size={24} /></div>
            <p className="font-display text-2xl text-ink leading-none">{srsDue}</p>
            <p className="font-ui font-semibold text-[11px] text-ink mt-1">{t('dash.toReview')}</p>
          </div>
        </div>

        {/* CTA */}
        {resumable ? (
          <div className="mb-6 space-y-3">
            <button
              onClick={onContinue}
              className="pop pop-shadow-coral tilt-r w-full rounded-2xl bg-jade py-5 px-4 text-center active:translate-x-[2px] active:translate-y-[2px] transition-transform"
            >
              <span className="block font-kr text-2xl text-ink leading-none">이어서 하기</span>
              <span className="block font-display text-[11px] text-ink mt-1">{t('dash.continueSession')}</span>
            </button>
            <button
              onClick={onNew}
              className="pop-sm w-full rounded-2xl bg-surface py-3 font-ui font-semibold text-sm text-fg active:translate-x-[2px] active:translate-y-[2px] transition-transform"
            >
              {t('dash.newSession')}
            </button>
          </div>
        ) : (
          <button
            onClick={onStart}
            disabled={didToday}
            className={`pop tilt-r w-full rounded-2xl py-5 px-4 mb-6 text-center transition-transform ${
              didToday
                ? 'bg-surface-2 opacity-70'
                : 'bg-vermillion pop-shadow-jade active:translate-x-[2px] active:translate-y-[2px]'
            }`}
          >
            <span className={`block font-kr text-2xl leading-none ${didToday ? 'text-fg/40' : 'text-white'}`} style={didToday ? undefined : inkShadow}>오늘의 일기</span>
            <span className={`block font-display text-[11px] mt-1 ${didToday ? 'text-fg/40' : 'text-ink'}`}>
              {didToday ? t('dash.doneToday') : t('dash.startToday')}
            </span>
          </button>
        )}

        {/* Diálogos */}
        <button
          onClick={() => onNav('dialogue')}
          className="pop-sm tilt-l w-full rounded-2xl bg-jade py-3.5 px-4 mb-6 flex items-center gap-3 active:translate-x-[2px] active:translate-y-[2px] transition-transform"
        >
          <span className="text-ink"><SpeakerIcon size={22} /></span>
          <span className="font-ui font-bold text-ink">{t('dash.listenDialogue')}</span>
          <span className="font-display text-[10px] text-ink/70 ml-auto">LISTEN</span>
        </button>

        {/* Structures overview */}
        {perfil.estruturas.length > 0 && (
          <div className="pop rounded-2xl bg-surface p-4 mb-6">
            <h2 className="font-display text-xs text-fg mb-3">{t('dash.structures')}</h2>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-jade inline-block border-2 border-ink" />
                <span className="text-fg/70 font-ui font-medium">{dominadas} {t('dash.mastered')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gold inline-block border-2 border-ink" />
                <span className="text-fg/70 font-ui font-medium">{emProgresso} {t('dash.inProgress')}</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {perfil.estruturas.filter(e => e.estado === 'em_progresso').slice(0, 6).map(e => (
                <span key={e.forma} className="pop-sm text-xs font-serif px-2 py-1 bg-gold text-ink rounded-lg">{e.forma}</span>
              ))}
              {perfil.estruturas.filter(e => e.estado === 'dominada').slice(0, 4).map(e => (
                <span key={e.forma} className="pop-sm text-xs font-serif px-2 py-1 bg-jade text-ink rounded-lg">{e.forma}</span>
              ))}
            </div>
          </div>
        )}

        {/* SRS CTA */}
        {srsDue > 0 && (
          <button
            onClick={() => onNav('vocabulary')}
            className="pop-sm tilt-r w-full rounded-2xl bg-gold py-3 px-4 mb-6 font-ui font-bold text-ink text-sm active:translate-x-[2px] active:translate-y-[2px] transition-transform"
          >
            {srsDue} cartão{srsDue > 1 ? 's' : ''} {t('dash.reviewCardsToday')}
          </button>
        )}

        {/* Recent sessions */}
        {recentSessoes.length > 0 && (
          <div>
            <h2 className="font-display text-xs text-fg mb-3">{t('dash.recent')}</h2>
            <div className="space-y-3">
              {recentSessoes.map(s => (
                <div key={s.id} onClick={() => onOpenSession(s)} className="pop-sm bg-surface rounded-xl p-3 flex justify-between items-center cursor-pointer active:translate-x-[1px] active:translate-y-[1px] transition-transform">
                  <div>
                    <p className="font-kr text-base text-fg leading-tight">{s.tema}</p>
                    <p className="text-xs text-fg/40 font-ui">{new Date(s.data).toLocaleDateString('pt-PT')}</p>
                  </div>
                  <div className="pop-sm rounded-lg bg-jade px-2.5 py-1">
                    <p className="font-display text-sm text-ink">{s.parte1.pontuacao + s.parte2.pontuacao}<span className="text-ink/50">/20</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sessoes.length === 0 && (
          <div className="text-center py-12 text-fg/40">
            <p className="font-kr text-xl">{t('dash.firstSession')}</p>
            <p className="text-sm font-ui mt-1">{t('dash.oneDayAtATime')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
