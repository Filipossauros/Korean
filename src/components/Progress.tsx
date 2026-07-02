import type { Sessao, Perfil } from '../types'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { BarChartIcon } from './Icons'
import { PageSplats } from './Splat'
import { useT } from '../lib/i18n'

interface Props {
  sessoes: Sessao[]
  perfil: Perfil
}

export function Progress({ sessoes, perfil }: Props) {
  const t = useT()
  const scoreData = sessoes.slice(0, 20).reverse().map((s, i) => ({
    n: i + 1,
    score: s.parte1.pontuacao + s.parte2.pontuacao,
    data: new Date(s.data).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
  }))

  const timeData = sessoes.slice(0, 20).reverse().map((s, i) => ({
    n: i + 1,
    tempo: Math.round((s.parte1.tempo_segundos + s.parte2.tempo_segundos) / 60),
    data: new Date(s.data).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
  }))

  const dominadas = perfil.estruturas.filter(e => e.estado === 'dominada').length
  const emProgresso = perfil.estruturas.filter(e => e.estado === 'em_progresso').length
  const totalVocab = perfil.vocabulario_visto.length
  const consolidado = perfil.vocabulario_visto.filter(v => v.srs_nivel === 3).length
  const dlg = perfil.dialogos
  const dlgPct = dlg && dlg.perguntas > 0 ? Math.round((dlg.certas / dlg.perguntas) * 100) : null
  const erros = perfil.erros_recorrentes

  return (
    <div className="relative min-h-screen bg-paper pb-24 md:pb-0 overflow-hidden">
      <PageSplats />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="pop-sm tilt-l inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-1.5 text-jade">
            <BarChartIcon size={18} />
            <span className="font-display text-xs">{t('nav.progress')}</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: t('prog.totalSessions'), value: perfil.sessoes_realizadas, color: 'text-fg' },
            { label: t('prog.vocabSeen'), value: totalVocab, color: 'text-fg' },
            { label: t('prog.vocabConsolidated'), value: consolidado, color: 'text-jade' },
            { label: t('prog.structMastered'), value: dominadas, color: 'text-jade' },
            { label: t('prog.inProgress'), value: emProgresso, color: 'text-gold' },
            { label: t('prog.currentStreak'), value: perfil.streak, color: 'text-vermillion' },
            ...(dlgPct !== null ? [{ label: t('prog.dialogueComp'), value: `${dlgPct}%`, color: 'text-vermillion' }] : []),
          ].map(({ label, value, color }) => (
            <div key={label} className="pop rounded-2xl bg-surface p-4">
              <p className={`text-3xl font-display ${color}`}>{value}</p>
              <p className="text-xs text-fg/60 font-ui font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Erros recorrentes — agregados das correções, alimentam o prompt */}
        {erros.length > 0 && (
          <div className="pop tilt-r rounded-2xl bg-surface p-4 mb-6">
            <h2 className="font-display text-xs text-fg mb-1">{t('prog.errorsTitle')}</h2>
            <p className="text-xs text-fg/50 font-ui font-medium mb-3">{t('prog.errorsHint')}</p>
            <div className="flex flex-wrap gap-2">
              {erros.slice(0, 6).map((e, i) => (
                <span
                  key={e.estrutura}
                  className={`pop-sm rounded-lg px-2.5 py-1 text-sm font-ui font-semibold ${
                    i === 0 ? 'bg-vermillion text-white' :
                    e.vezes > 1 ? 'bg-gold text-ink' :
                    'bg-surface text-fg/60'
                  }`}
                >
                  {t('cat.' + e.estrutura)} ×{e.vezes}
                </span>
              ))}
            </div>
          </div>
        )}

        {sessoes.length > 1 ? (
          <>
            {/* Score chart */}
            <div className="pop rounded-2xl bg-surface p-4 mb-4">
              <h2 className="font-display text-xs text-fg mb-4">{t('prog.scorePerSession')}</h2>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94908a55" />
                  <XAxis dataKey="data" tick={{ fontSize: 10, fontFamily: 'Fredoka', fill: '#94908a' }} />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 10, fontFamily: 'Fredoka', fill: '#94908a' }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, fontFamily: 'Fredoka', borderColor: '#17282B', borderWidth: 2, borderRadius: 12 }}
                    formatter={(v) => [`${v ?? 0}/20`, t('prog.score')]}
                  />
                  <Bar dataKey="score" fill="#16C1B0" stroke="#17282B" strokeWidth={2} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Time chart */}
            <div className="pop rounded-2xl bg-surface p-4 mb-6">
              <h2 className="font-display text-xs text-fg mb-4">{t('prog.avgTime')}</h2>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94908a55" />
                  <XAxis dataKey="data" tick={{ fontSize: 10, fontFamily: 'Fredoka', fill: '#94908a' }} />
                  <YAxis tick={{ fontSize: 10, fontFamily: 'Fredoka', fill: '#94908a' }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, fontFamily: 'Fredoka', borderColor: '#17282B', borderWidth: 2, borderRadius: 12 }}
                    formatter={(v) => [`${v ?? 0} min`, t('prog.time')]}
                  />
                  <Line type="monotone" dataKey="tempo" stroke="#FF6A4D" strokeWidth={4} dot={{ r: 4, fill: '#FF6A4D', stroke: '#17282B', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-fg/30">
            <p className="font-ui text-sm">{t('prog.need2')}</p>
          </div>
        )}

        {/* Structures list */}
        {perfil.estruturas.length > 0 && (
          <div className="pop rounded-2xl bg-surface p-4">
            <h2 className="font-display text-xs text-fg mb-3">{t('prog.grammarStructures')}</h2>
            <div className="space-y-2.5">
              {perfil.estruturas.map(e => (
                <div key={e.forma} className="flex items-center justify-between gap-2">
                  <span className="font-kr text-sm text-fg">{e.forma}</span>
                  <span className="flex items-center gap-2.5 shrink-0">
                    {/* Bolinhas: acertos consecutivos rumo ao domínio (3) */}
                    <span className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <span
                          key={i}
                          className={`w-3 h-3 rounded-full border-2 border-ink inline-block ${
                            e.estado === 'dominada' || i < Math.min(e.acertos_consecutivos, 3) ? 'bg-jade' : 'bg-paper'
                          }`}
                        />
                      ))}
                    </span>
                    <span className={`pop-sm text-[10px] px-2 py-0.5 rounded-lg font-display ${
                      e.estado === 'dominada' ? 'bg-jade text-ink' :
                      e.estado === 'em_progresso' ? 'bg-gold text-ink' :
                      'bg-surface-2 text-fg/50'
                    }`}>
                      {e.estado === 'dominada' ? t('prog.mastered') : e.estado === 'em_progresso' ? `${Math.min(e.acertos_consecutivos, 3)}/3` : t('prog.toWork')}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
