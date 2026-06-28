import { useState, useEffect, useCallback, useRef } from 'react'
import type { AppView, Sessao, UnidadeKSI } from './types'
import { useProfile } from './hooks/useProfile'
import { useSession } from './hooks/useSession'
import { useBackup } from './hooks/useBackup'
import { getSessoes, importAllData } from './db'
import {
  handleGoogleOAuthCallback, consumeOAuthPending, isGoogleConnected,
  isGoogleConfigured, readConfigFromDrive, restoreProgressFromDrive,
  disconnectGoogle, initiateGoogleAuth
} from './api/google-drive'
import curriculo from './data/ksi_curriculo_completo.json'

import { Dashboard } from './components/Dashboard'
import { SessionReading } from './components/SessionReading'
import { SessionWriting } from './components/SessionWriting'
import { SessionCorrection } from './components/SessionCorrection'
import { FreeWriting } from './components/FreeWriting'
import { Vocabulary } from './components/Vocabulary'
import { Progress } from './components/Progress'
import { FreeChat } from './components/FreeChat'
import { Settings } from './components/Settings'
import { Welcome } from './components/Welcome'
import { LoadingOverlay } from './components/LoadingOverlay'
import {
  HomeIcon, LayersIcon, BarChartIcon, MessageIcon, SettingsIcon
} from './components/Icons'

type CurriculoData = {
  curriculo: Record<string, {
    vocabulario: Record<string, { tema: string; palavras: { kr: string; pt?: string; en?: string; exemplo?: string }[] }>
    estruturas_gramaticais?: Record<string, { estruturas: { forma: string; significado: string; exemplo: string }[] }>
  }>
}

function getUnidade(nivel: string): UnidadeKSI {
  const data = curriculo as unknown as CurriculoData
  const nivelData = data.curriculo[nivel]
  if (!nivelData) {
    return { tema: 'Vocabulário geral', palavras: [], estruturas: [] }
  }
  const vocabKeys = Object.keys(nivelData.vocabulario ?? {})
  const randomKey = vocabKeys[Math.floor(Math.random() * vocabKeys.length)]
  const unidade = nivelData.vocabulario?.[randomKey]
  const estruturasAll: { forma: string; significado: string; exemplo: string }[] = []
  if (nivelData.estruturas_gramaticais) {
    for (const sec of Object.values(nivelData.estruturas_gramaticais)) {
      estruturasAll.push(...sec.estruturas)
    }
  }
  return {
    tema: unidade?.tema ?? 'Vocabulário geral',
    palavras: unidade?.palavras ?? [],
    estruturas: estruturasAll,
  }
}

export default function App() {
  const [view, setView] = useState<AppView>('dashboard')
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const { perfil, setPerfil, loading, reload } = useProfile()
  const session = useSession()
  const { backup } = useBackup()
  const [corrLoading, setCorrLoading] = useState(false)
  const [startup, setStartup] = useState<'init' | 'welcome' | 'restoring' | 'ready'>('init')
  const startupRan = useRef(false)

  const showTimer = localStorage.getItem('show_timer') !== 'false'

  const refreshSessoes = useCallback(() => { getSessoes().then(setSessoes) }, [])
  useEffect(() => { refreshSessoes() }, [refreshSessoes])

  // Arranque: ao abrir num browser novo, faz login no Google, verifica se há
  // backup de progresso no Drive e restaura-o (incluindo a chave da API).
  useEffect(() => {
    if (loading || startupRan.current) return
    startupRan.current = true
    void (async () => {
      const returned = handleGoogleOAuthCallback()
      consumeOAuthPending()

      if (isGoogleConnected()) {
        setStartup('restoring')
        try {
          // 1. Ficheiro permanente → repõe a chave da API
          const cfg = await readConfigFromDrive()
          if (cfg?.anthropic_api_key) localStorage.setItem('anthropic_api_key', cfg.anthropic_api_key)
          // 2. Ficheiro de progresso → restaura perfil + sessões
          const prog = await restoreProgressFromDrive()
          if (prog) {
            await importAllData({ perfil: prog.perfil, sessoes: prog.sessoes })
            await reload()
            refreshSessoes()
          }
          setStartup('ready')
          return
        } catch (e) {
          if (e instanceof Error && e.message === 'token_expirado') disconnectGoogle()
        }
      }

      const isFresh = perfil.sessoes_realizadas === 0 && perfil.vocabulario_visto.length === 0
      if (!returned && isFresh && isGoogleConfigured()) setStartup('welcome')
      else setStartup('ready')
    })()
  }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps

  // React to session phase changes
  useEffect(() => {
    if (session.phase === 'part1') setView('session-reading')
    else if (session.phase === 'correcting' || session.phase === 'correcting2') setView('session-correction')
    else if (session.phase === 'part2') setView('session-writing')
    else if (session.phase === 'part3') setView('free-writing')
    else if (session.phase === 'done') {
      if (session.sessao) {
        setPerfil(prev => {
          const today = new Date().toISOString().slice(0, 10)
          const lastDay = prev.ultima_sessao.slice(0, 10)
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
          const newStreak = lastDay === yesterday ? prev.streak + 1 : lastDay === today ? prev.streak : 1
          const existingKr = new Set(prev.vocabulario_visto.map(v => v.kr))
          const newVocab = session.sessao!.vocabulario_novo.filter(v => !existingKr.has(v.kr))
          const existingFormas = new Set(prev.estruturas.map(e => e.forma))
          const newEstruturas = session.sessao!.estruturas_praticadas
            .filter(f => !existingFormas.has(f))
            .map(f => ({
              forma: f,
              estado: 'em_progresso' as const,
              acertos_consecutivos: 0,
              apareceu_em_livre: false,
              ultima_vez: today,
            }))
          const updated = {
            ...prev,
            streak: newStreak,
            ultima_sessao: new Date().toISOString(),
            sessoes_realizadas: prev.sessoes_realizadas + 1,
            vocabulario_visto: [...prev.vocabulario_visto, ...newVocab],
            estruturas: [...prev.estruturas, ...newEstruturas],
          }
          backup(updated, [...sessoes])
          return updated
        })
        refreshSessoes()
      }
      session.reset()
      setView('dashboard')
    }
  }, [session.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartSession = async () => {
    const unidade = getUnidade(perfil.nivel_atual)
    await session.startSession(perfil, unidade)
  }

  const handleCorrection = async () => {
    setCorrLoading(true)
    await session.applyCorrection1()
    setCorrLoading(false)
  }

  const showPart3 = perfil.sessoes_realizadas > 0 && (perfil.sessoes_realizadas + 1) % 3 === 0

  if (loading || startup === 'init') return <LoadingOverlay message="A carregar…" />
  if (startup === 'restoring') return <LoadingOverlay message="A verificar progresso no Google Drive…" />
  if (startup === 'welcome') {
    return (
      <Welcome
        onLogin={() => initiateGoogleAuth()}
        onSkip={() => setStartup('ready')}
      />
    )
  }

  const isSessionActive = ['session-reading', 'session-writing', 'session-correction', 'free-writing'].includes(view)

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard perfil={perfil} sessoes={sessoes} onStart={handleStartSession} onNav={v => setView(v as AppView)} />
      case 'session-reading':
        return session.draft ? (
          <SessionReading
            draft={session.draft}
            showTimer={showTimer}
            onSubmit={traducao => { session.submitPart1(traducao); handleCorrection() }}
          />
        ) : null
      case 'session-correction':
        return session.sessao ? (
          <SessionCorrection
            sessao={session.sessao}
            showPart3Option={showPart3}
            loading={corrLoading || session.phase === 'correcting'}
            onContinue={skip => session.finishSession(skip, showPart3)}
          />
        ) : null
      case 'session-writing':
        return session.sessao ? (
          <SessionWriting
            frases={session.sessao.parte2.frases}
            showTimer={showTimer}
            onSubmit={respostas => { session.submitPart2(respostas); handleCorrection() }}
          />
        ) : null
      case 'free-writing':
        return session.sessao ? (
          <FreeWriting
            nivel={perfil.nivel_atual}
            tema={session.sessao.tema}
            onDone={(t, c, eu, ee) => session.applyPart3(t, c, eu, ee)}
          />
        ) : null
      case 'vocabulary':
        return <Vocabulary perfil={perfil} onUpdate={setPerfil} />
      case 'progress':
        return <Progress sessoes={sessoes} perfil={perfil} />
      case 'free-chat':
        return <FreeChat nivel={perfil.nivel_atual} />
      case 'settings':
        return <Settings perfil={perfil} onRestore={refreshSessoes} />
      default:
        return null
    }
  }

  const tabs = [
    { id: 'dashboard', label: 'Início', Icon: HomeIcon },
    { id: 'vocabulary', label: 'Vocab', Icon: LayersIcon },
    { id: 'progress', label: 'Progresso', Icon: BarChartIcon },
    { id: 'free-chat', label: 'Chat', Icon: MessageIcon },
    { id: 'settings', label: 'Definições', Icon: SettingsIcon },
  ] as const

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-ink shrink-0 py-6 px-3">
        <div className="px-3 mb-8">
          <h1 className="font-serif text-white text-xl font-bold">한글 일기</h1>
          <p className="text-white/40 text-xs font-ui mt-0.5">Nível {perfil.nivel_atual}</p>
        </div>
        <nav className="space-y-1 flex-1">
          {[
            { id: 'dashboard', label: 'Início', Icon: HomeIcon },
            { id: 'vocabulary', label: 'Vocabulário', Icon: LayersIcon },
            { id: 'progress', label: 'Progresso', Icon: BarChartIcon },
            { id: 'free-chat', label: 'Conversa', Icon: MessageIcon },
            { id: 'settings', label: 'Definições', Icon: SettingsIcon },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setView(id as AppView)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-ui text-sm transition-all ${
                view === id ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <button
          onClick={handleStartSession}
          className="mx-3 py-3 rounded-xl bg-vermillion text-white font-ui text-sm font-semibold active:scale-95 transition-all"
        >
          Sessão de hoje
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative">
        {session.error && (
          <div className="bg-vermillion/10 border-b border-vermillion/20 px-4 py-2 sticky top-0 z-30">
            <p className="text-vermillion text-sm font-ui">{session.error}</p>
          </div>
        )}
        {session.phase === 'generating' && <LoadingOverlay message="A gerar sessão com IA…" />}
        {renderContent()}
      </main>

      {/* Mobile bottom tab bar */}
      {!isSessionActive && (
        <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-line flex z-40 pb-safe">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setView(id as AppView)}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-all ${
                view === id ? 'text-vermillion' : 'text-ink/30'
              }`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-ui">{label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* Back from session */}
      {isSessionActive && (
        <button
          onClick={() => { session.reset(); setView('dashboard') }}
          className="fixed top-4 left-4 z-50 md:hidden bg-white border border-line rounded-xl px-3 py-1.5 text-xs font-ui text-ink/60 shadow-sm"
        >
          ← Sair
        </button>
      )}
    </div>
  )
}
