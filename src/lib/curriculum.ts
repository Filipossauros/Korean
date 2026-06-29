import type { UnidadeKSI } from '../types'
import curriculo from '../data/ksi_curriculo_completo.json'

type CurriculoData = {
  curriculo: Record<string, {
    vocabulario: Record<string, { tema: string; palavras: { kr: string; pt?: string; en?: string; exemplo?: string }[] }>
    estruturas_gramaticais?: Record<string, { estruturas: { forma: string; significado: string; exemplo: string }[] }>
  }>
}

export function getUnidade(nivel: string): UnidadeKSI {
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
