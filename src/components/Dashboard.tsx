import type { Perfil, Sessao } from '../types'
import { getSRSDueCount } from '../hooks/useProfile'
import { HomeIcon, FireIcon, LayersIcon, BookIcon } from './Icons'

interface Props {
  perfil: Perfil
  sessoes: Sessao[]
  onStart: () => void
  onNav: (view: string) => void
}

export function Dashboard({ perfil, sessoes, onStart, onNav }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const didToday = perfil.ultima_sessao.slice(0, 10) === today
  const srsDue = getSRSDueCount(perfil.vocabulario_visto)
  const dominadas = perfil.estruturas.filter(e => e.estado === 'dominada').length
  const emProgresso = perfil.estruturas.filter(e => e.estado === 'em_progresso').length

  const recentSessoes = sessoes.slice(0, 5)

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-0">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <HomeIcon size={20} />
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink">한글 일기</h1>
            <p className="text-sm text-ink/60 font-ui">Nível {perfil.nivel_atual} → {perfil.nivel_seguinte}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-line">
            <div className="flex items-center gap-2 mb-1">
              <FireIcon size={18} />
              <span className="text-xs text-ink/50 font-ui uppercase tracking-wide">Streak</span>
            </div>
            <p className="text-3xl font-bold text-ink">{perfil.streak}</p>
            <p className="text-xs text-ink/40 font-ui">dias</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-line">
            <div className="flex items-center gap-2 mb-1">
              <BookIcon size={18} />
              <span className="text-xs text-ink/50 font-ui uppercase tracking-wide">Sessões</span>
            </div>
            <p className="text-3xl font-bold text-ink">{perfil.sessoes_realizadas}</p>
            <p className="text-xs text-ink/40 font-ui">total</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-line">
            <div className="flex items-center gap-2 mb-1">
              <LayersIcon size={18} />
              <span className="text-xs text-ink/50 font-ui uppercase tracking-wide">Vocab</span>
            </div>
            <p className="text-3xl font-bold text-gold">{srsDue}</p>
            <p className="text-xs text-ink/40 font-ui">para rever</p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          className={`w-full py-5 rounded-2xl font-ui font-semibold text-lg mb-6 transition-all active:scale-95 ${
            didToday
              ? 'bg-paper-2 text-ink/40 border border-line cursor-default'
              : 'bg-vermillion text-white shadow-lg shadow-vermillion/30'
          }`}
          disabled={false}
        >
          {didToday ? '✓ Sessão de hoje feita' : 'Começar sessão de hoje'}
        </button>

        {/* Structures overview */}
        {perfil.estruturas.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-line mb-6">
            <h2 className="font-ui font-semibold text-ink mb-3">Estruturas</h2>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-jade inline-block" />
                <span className="text-ink/60 font-ui">{dominadas} dominadas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gold inline-block" />
                <span className="text-ink/60 font-ui">{emProgresso} em progresso</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {perfil.estruturas.filter(e => e.estado === 'em_progresso').slice(0, 6).map(e => (
                <span key={e.forma} className="text-xs font-serif px-2 py-1 bg-gold/10 text-gold rounded-lg">{e.forma}</span>
              ))}
              {perfil.estruturas.filter(e => e.estado === 'dominada').slice(0, 4).map(e => (
                <span key={e.forma} className="text-xs font-serif px-2 py-1 bg-jade/10 text-jade rounded-lg">{e.forma}</span>
              ))}
            </div>
          </div>
        )}

        {/* SRS CTA */}
        {srsDue > 0 && (
          <button
            onClick={() => onNav('vocabulary')}
            className="w-full py-3 rounded-2xl bg-jade/10 text-jade font-ui font-medium mb-6 border border-jade/20 text-sm"
          >
            {srsDue} cartão{srsDue > 1 ? 's' : ''} para rever hoje
          </button>
        )}

        {/* Recent sessions */}
        {recentSessoes.length > 0 && (
          <div>
            <h2 className="font-ui font-semibold text-ink mb-3">Sessões recentes</h2>
            <div className="space-y-2">
              {recentSessoes.map(s => (
                <div key={s.id} className="bg-white rounded-xl p-3 border border-line flex justify-between items-center">
                  <div>
                    <p className="font-ui text-sm font-medium text-ink">{s.tema}</p>
                    <p className="text-xs text-ink/40 font-ui">{new Date(s.data).toLocaleDateString('pt-PT')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-jade font-ui">{s.parte1.pontuacao + s.parte2.pontuacao}<span className="text-ink/30">/20</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sessoes.length === 0 && (
          <div className="text-center py-12 text-ink/30">
            <p className="font-serif text-lg">Começa a tua primeira sessão</p>
            <p className="text-sm font-ui mt-1">Aprende coreano um dia de cada vez</p>
          </div>
        )}
      </div>
    </div>
  )
}
