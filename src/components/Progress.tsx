import type { Sessao, Perfil } from '../types'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { BarChartIcon } from './Icons'

interface Props {
  sessoes: Sessao[]
  perfil: Perfil
}

export function Progress({ sessoes, perfil }: Props) {
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

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-0">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChartIcon size={20} />
          <h1 className="font-ui font-semibold text-ink">Progresso</h1>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: 'Sessões totais', value: perfil.sessoes_realizadas, color: 'text-ink' },
            { label: 'Vocabulário visto', value: totalVocab, color: 'text-ink' },
            { label: 'Vocab consolidada', value: consolidado, color: 'text-jade' },
            { label: 'Estruturas dominadas', value: dominadas, color: 'text-jade' },
            { label: 'Em progresso', value: emProgresso, color: 'text-gold' },
            { label: 'Streak actual', value: perfil.streak, color: 'text-vermillion' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 border border-line">
              <p className={`text-3xl font-bold font-ui ${color}`}>{value}</p>
              <p className="text-xs text-ink/50 font-ui mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {sessoes.length > 1 ? (
          <>
            {/* Score chart */}
            <div className="bg-white rounded-2xl p-4 border border-line mb-4">
              <h2 className="font-ui text-sm font-semibold text-ink mb-4">Pontuação por sessão</h2>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DDDDD5" />
                  <XAxis dataKey="data" tick={{ fontSize: 10, fontFamily: 'Inter' }} />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 10, fontFamily: 'Inter' }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, fontFamily: 'Inter', borderColor: '#DDDDD5' }}
                    formatter={(v) => [`${v ?? 0}/20`, 'Pontuação']}
                  />
                  <Bar dataKey="score" fill="#2E7D6B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Time chart */}
            <div className="bg-white rounded-2xl p-4 border border-line mb-6">
              <h2 className="font-ui text-sm font-semibold text-ink mb-4">Tempo médio (min)</h2>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DDDDD5" />
                  <XAxis dataKey="data" tick={{ fontSize: 10, fontFamily: 'Inter' }} />
                  <YAxis tick={{ fontSize: 10, fontFamily: 'Inter' }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, fontFamily: 'Inter', borderColor: '#DDDDD5' }}
                    formatter={(v) => [`${v ?? 0} min`, 'Tempo']}
                  />
                  <Line type="monotone" dataKey="tempo" stroke="#C9A12E" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-ink/30">
            <p className="font-ui text-sm">Faz pelo menos 2 sessões para ver gráficos</p>
          </div>
        )}

        {/* Structures list */}
        {perfil.estruturas.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-line">
            <h2 className="font-ui text-sm font-semibold text-ink mb-3">Estruturas gramaticais</h2>
            <div className="space-y-2">
              {perfil.estruturas.map(e => (
                <div key={e.forma} className="flex items-center justify-between">
                  <span className="font-serif text-sm text-ink">{e.forma}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-lg font-ui ${
                    e.estado === 'dominada' ? 'bg-jade/10 text-jade' :
                    e.estado === 'em_progresso' ? 'bg-gold/10 text-gold' :
                    'bg-line text-ink/40'
                  }`}>
                    {e.estado === 'dominada' ? 'Dominada' : e.estado === 'em_progresso' ? 'Em progresso' : 'Por trabalhar'}
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
