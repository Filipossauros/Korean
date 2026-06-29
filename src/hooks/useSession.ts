import { useState, useRef, useCallback, useEffect } from 'react'
import type { Sessao, SessionDraft, Perfil, UnidadeKSI } from '../types'
import { generateSession, correctSession } from '../api/anthropic'
import { saveSessao } from '../db'
import { saveInProgress, clearInProgress, loadInProgress } from '../lib/sessionStore'

export type SessionPhase =
  | 'idle'
  | 'generating'
  | 'part1'
  | 'correcting'
  | 'part2'
  | 'correcting2'
  | 'part3'
  | 'done'

export function useSession() {
  const [phase, setPhase] = useState<SessionPhase>('idle')
  const [draft, setDraft] = useState<SessionDraft | null>(null)
  const [sessao, setSessao] = useState<Sessao | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  // Persiste a sessão em curso sempre que muda, para sobreviver a sair/recarregar.
  useEffect(() => {
    if (!sessao) return
    const stable = phase === 'correcting' || phase === 'generating' ? 'part1'
      : phase === 'correcting2' ? 'part2'
      : phase
    if (stable === 'part1' || stable === 'part2' || stable === 'part3') {
      saveInProgress({ phase: stable, draft, sessao })
    }
  }, [phase, draft, sessao])

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now()
  }, [])

  const stopTimer = useCallback((): number => {
    return Math.floor((Date.now() - startTimeRef.current) / 1000)
  }, [])

  const startSession = useCallback(async (perfil: Perfil, unidade: UnidadeKSI) => {
    setError(null)
    setPhase('generating')
    try {
      const d = await generateSession(perfil, unidade)
      setDraft(d)
      const s: Sessao = {
        id: crypto.randomUUID(),
        data: new Date().toISOString(),
        tema: d.tema,
        tipo: 'estruturada',
        unidade_ksi: unidade.tema,
        parte1: {
          texto_kr: d.parte1.texto_kr,
          traducao_utilizador: '',
          traducao_referencia: d.parte1.texto_referencia_pt,
          pontuacao: 0,
          erros: [],
          tempo_segundos: 0,
        },
        parte2: {
          frases: d.parte2.frases.map(f => ({
            pt_original: f.pt,
            kr_referencia: f.kr_referencia,
            kr_utilizador: '',
            dicas: f.dicas,
            estrutura_foco: f.estrutura_foco,
            correcto: false,
            nota: '',
            categoria_erro: '',
          })),
          pontuacao: 0,
          tempo_segundos: 0,
        },
        vocabulario_novo: d.parte1.vocabulario_novo.map(v => ({
          kr: v.kr,
          pt: v.pt,
          vezes_visto: 1,
          vezes_correcto: 0,
          ultimo_erro: null,
          srs_nivel: 1,
          srs_proxima_revisao: new Date().toISOString().slice(0, 10),
        })),
        estruturas_praticadas: [],
      }
      setSessao(s)
      setPhase('part1')
      startTimer()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar sessão')
      setPhase('idle')
    }
  }, [startTimer])

  const submitPart1 = useCallback((traducao: string) => {
    const tempo = stopTimer()
    setSessao(prev => prev ? {
      ...prev,
      parte1: { ...prev.parte1, traducao_utilizador: traducao, tempo_segundos: tempo }
    } : prev)
    setPhase('correcting')
    startTimer()
  }, [stopTimer, startTimer])

  const applyCorrection1 = useCallback(async () => {
    if (!sessao) return
    setError(null)
    try {
      const result = await correctSession(sessao)
      const updated: Sessao = {
        ...sessao,
        parte1: {
          ...sessao.parte1,
          pontuacao: result.parte1.pontuacao,
          erros: result.parte1.erros,
          traducao_referencia: result.parte1.correcao || sessao.parte1.traducao_referencia,
        },
        parte2: {
          ...sessao.parte2,
          frases: sessao.parte2.frases.map((f, i) => {
            const r = result.parte2.frases[i]
            return r ? { ...f, correcto: r.correcto, nota: r.nota, categoria_erro: r.categoria_erro } : f
          }),
          pontuacao: result.parte2.pontuacao,
        },
        estruturas_praticadas: result.estruturas_praticadas,
      }
      setSessao(updated)
      setPhase('part2')
      startTimer()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao corrigir sessão')
    }
  }, [sessao, startTimer])

  const submitPart2 = useCallback((respostas: string[]) => {
    const tempo = stopTimer()
    setSessao(prev => {
      if (!prev) return prev
      return {
        ...prev,
        parte2: {
          ...prev.parte2,
          tempo_segundos: tempo,
          frases: prev.parte2.frases.map((f, i) => ({ ...f, kr_utilizador: respostas[i] ?? '' })),
        }
      }
    })
    setPhase('correcting2')
  }, [stopTimer])

  const finishSession = useCallback(async (skipPart3: boolean, showPart3: boolean) => {
    if (!sessao) return
    if (showPart3 && !skipPart3) {
      setPhase('part3')
      return
    }
    await saveSessao(sessao)
    clearInProgress()
    setPhase('done')
  }, [sessao])

  const applyPart3 = useCallback(async (texto: string, correcao: string, estruturas_usadas: string[], estruturas_espontaneas: string[]) => {
    if (!sessao) return
    const updated: Sessao = {
      ...sessao,
      parte3: { texto_utilizador: texto, correcao, estruturas_usadas, estruturas_espontaneas }
    }
    setSessao(updated)
    await saveSessao(updated)
    clearInProgress()
    setPhase('done')
  }, [sessao])

  // Pausa: limpa o estado em memória mas mantém o snapshot persistido (retomável).
  const reset = useCallback(() => {
    setPhase('idle')
    setDraft(null)
    setSessao(null)
    setError(null)
    timerRef.current = 0
  }, [])

  // Termina/descarta: limpa também o snapshot persistido.
  const discard = useCallback(() => {
    clearInProgress()
    reset()
  }, [reset])

  // Retoma uma sessão em curso guardada.
  const resume = useCallback(() => {
    const snap = loadInProgress()
    if (!snap) return false
    setDraft(snap.draft)
    setSessao(snap.sessao)
    setError(null)
    setPhase(snap.phase)
    startTimer()
    return true
  }, [startTimer])

  return {
    phase, draft, sessao, error,
    startSession, submitPart1, applyCorrection1, submitPart2,
    finishSession, applyPart3, reset, discard, resume
  }
}
