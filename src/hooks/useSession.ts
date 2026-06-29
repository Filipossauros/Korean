import { useState, useRef, useCallback, useEffect } from 'react'
import type { Sessao, SessionDraft, Perfil, UnidadeKSI } from '../types'
import { generateSession, correctTranslation, correctProduction } from '../api/anthropic'
import { saveSessao } from '../db'
import { saveInProgress, clearInProgress, loadInProgress } from '../lib/sessionStore'

export type SessionPhase =
  | 'idle'
  | 'generating'
  | 'part1'        // leitura + tradução
  | 'correcting1'  // a corrigir a tradução
  | 'review1'      // mostra a correção da Parte 1
  | 'part2'        // produção (escrita)
  | 'correcting2'  // a corrigir a produção
  | 'review2'      // mostra a correção final (Parte 1 + Parte 2)
  | 'part3'        // escrita livre (opcional)
  | 'done'

export function useSession() {
  const [phase, setPhase] = useState<SessionPhase>('idle')
  const [draft, setDraft] = useState<SessionDraft | null>(null)
  const [sessao, setSessao] = useState<Sessao | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  // Persiste a sessão em curso sempre que muda, para sobreviver a sair/recarregar.
  // As fases de carregamento são mapeadas para a fase estável anterior (para se
  // retomar no sítio certo se a correção for interrompida).
  useEffect(() => {
    if (!sessao) return
    const stable =
      phase === 'generating' || phase === 'correcting1' ? 'part1'
      : phase === 'review1' ? 'review1'
      : phase === 'correcting2' ? 'part2'
      : phase === 'review2' ? 'review2'
      : phase
    const persistable = ['part1', 'review1', 'part2', 'review2', 'part3']
    if (persistable.includes(stable)) {
      saveInProgress({ phase: stable as 'part1' | 'review1' | 'part2' | 'review2' | 'part3', draft, sessao })
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

  // Parte 1: regista a tradução, corrige SÓ a tradução e mostra a correção (review1).
  const submitPart1 = useCallback(async (traducao: string) => {
    if (!sessao) return
    const tempo = stopTimer()
    const base: Sessao = {
      ...sessao,
      parte1: { ...sessao.parte1, traducao_utilizador: traducao, tempo_segundos: tempo },
    }
    setSessao(base)
    setError(null)
    setPhase('correcting1')
    try {
      const r = await correctTranslation(base)
      setSessao({
        ...base,
        parte1: {
          ...base.parte1,
          pontuacao: r.pontuacao,
          erros: r.erros,
          traducao_referencia: r.correcao || base.parte1.traducao_referencia,
        },
      })
      setPhase('review1')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao corrigir a tradução')
      setPhase('part1') // permite tentar submeter de novo
    }
  }, [sessao, stopTimer])

  // Avança da correção da Parte 1 para a produção (Parte 2).
  const continueToPart2 = useCallback(() => {
    setError(null)
    setPhase('part2')
    startTimer()
  }, [startTimer])

  // Parte 2: regista as frases, corrige a produção e mostra a correção final (review2).
  const submitPart2 = useCallback(async (respostas: string[]) => {
    if (!sessao) return
    const tempo = stopTimer()
    const base: Sessao = {
      ...sessao,
      parte2: {
        ...sessao.parte2,
        tempo_segundos: tempo,
        frases: sessao.parte2.frases.map((f, i) => ({ ...f, kr_utilizador: respostas[i] ?? '' })),
      },
    }
    setSessao(base)
    setError(null)
    setPhase('correcting2')
    try {
      const r = await correctProduction(base)
      setSessao({
        ...base,
        parte2: {
          ...base.parte2,
          pontuacao: r.pontuacao,
          frases: base.parte2.frases.map((f, i) => {
            const rr = r.frases[i]
            return rr ? { ...f, correcto: rr.correcto, nota: rr.nota, categoria_erro: rr.categoria_erro } : f
          }),
        },
        estruturas_praticadas: r.estruturas_praticadas ?? [],
      })
      setPhase('review2')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao corrigir a produção')
      setPhase('part2') // permite tentar submeter de novo
    }
  }, [sessao, stopTimer])

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
    startSession, submitPart1, continueToPart2, submitPart2,
    finishSession, applyPart3, reset, discard, resume
  }
}
