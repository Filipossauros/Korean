import { useState, useEffect, useCallback } from 'react'
import type { Perfil, EstruturaItem, Sessao, VocabItem } from '../types'
import { getPerfil, savePerfil, defaultPerfil } from '../db'

export function useProfile() {
  const [perfil, setPerfil] = useState<Perfil>({ ...defaultPerfil })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPerfil().then(p => {
      setPerfil(p)
      setLoading(false)
    })
  }, [])

  const updatePerfil = useCallback(async (updates: Partial<Perfil>) => {
    setPerfil(prev => {
      const next = { ...prev, ...updates }
      savePerfil(next)
      return next
    })
  }, [])

  const updatePerfil_ = useCallback(async (updater: (p: Perfil) => Perfil) => {
    setPerfil(prev => {
      const next = updater(prev)
      savePerfil(next)
      return next
    })
  }, [])

  return { perfil, setPerfil: updatePerfil_, loading, updatePerfil }
}

export function avaliarEstrutura(estrutura: EstruturaItem, sessoes: Sessao[]): EstruturaItem['estado'] {
  const acertos = sessoes
    .flatMap(s => s.parte2.frases)
    .filter(f => f.estrutura_foco === estrutura.forma && f.correcto).length
  const emLivre = sessoes.some(s => s.parte3?.estruturas_espontaneas.includes(estrutura.forma))
  if (acertos >= 3 && emLivre && estrutura.acertos_consecutivos >= 2) return 'dominada'
  if (acertos >= 1) return 'em_progresso'
  return 'por_trabalhar'
}

export function calcStreak(ultima_sessao: string): number {
  if (!ultima_sessao) return 0
  const last = new Date(ultima_sessao)
  const today = new Date()
  const diff = Math.floor((today.getTime() - last.getTime()) / 86400000)
  if (diff > 1) return 0
  return diff === 0 || diff === 1 ? 1 : 0
}

export function getSRSDueCount(vocabItems: VocabItem[]): number {
  const today = new Date().toISOString().slice(0, 10)
  return vocabItems.filter(v => v.srs_proxima_revisao <= today).length
}
