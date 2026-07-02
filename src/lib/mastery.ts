// Motor pedagógico: aplica os resultados de uma sessão ao perfil (estruturas,
// erros recorrentes, vocabulário, streak) e decide quando propor subida de nível.
// Lógica pura, sem efeitos — App.tsx chama e persiste o resultado.
import type { Perfil, Sessao, EstruturaItem } from '../types'

export const LEVELS = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B']

export function nextLevel(nivel: string): string | null {
  const i = LEVELS.indexOf(nivel)
  return i >= 0 && i < LEVELS.length - 1 ? LEVELS[i + 1] : null
}

// Critérios de domínio de uma estrutura (mostrados na UI — manter em sincronia).
export const ACERTOS_PARA_DOMINAR = 3

function estadoDe(e: EstruturaItem): EstruturaItem['estado'] {
  if (e.estado === 'dominada') return 'dominada' // domínio não regride
  if (e.acertos_consecutivos >= ACERTOS_PARA_DOMINAR && e.apareceu_em_livre) return 'dominada'
  if (e.acertos_consecutivos >= 1 || e.estado === 'em_progresso') return 'em_progresso'
  return 'por_trabalhar'
}

export interface SessionDeltas {
  perfil: Perfil
  dominadasNovas: string[]
  errosRegistados: { categoria: string; vezes: number }[]
}

// Aplica UMA sessão terminada ao perfil. `hoje` injetável para testes.
export function applySessionToPerfil(perfil: Perfil, sessao: Sessao, hoje = new Date()): SessionDeltas {
  const today = hoje.toISOString().slice(0, 10)

  // --- Estruturas: acertos consecutivos por frase de produção -------------
  const porForma = new Map(perfil.estruturas.map(e => [e.forma, { ...e }]))
  for (const f of sessao.parte2.frases) {
    if (!f.estrutura_foco) continue
    const e = porForma.get(f.estrutura_foco)
    if (e) {
      e.acertos_consecutivos = f.correcto ? e.acertos_consecutivos + 1 : 0
      e.ultima_vez = today
    } else {
      porForma.set(f.estrutura_foco, {
        forma: f.estrutura_foco,
        estado: 'em_progresso',
        acertos_consecutivos: f.correcto ? 1 : 0,
        apareceu_em_livre: false,
        ultima_vez: today,
      })
    }
  }
  // Estruturas novas anunciadas pela sessão mas sem frase associada.
  for (const forma of sessao.estruturas_praticadas) {
    if (!porForma.has(forma)) {
      porForma.set(forma, {
        forma, estado: 'em_progresso', acertos_consecutivos: 0,
        apareceu_em_livre: false, ultima_vez: today,
      })
    }
  }
  // Escrita livre: usar a estrutura espontaneamente conta para o domínio.
  const livres = new Set([
    ...(sessao.parte3?.estruturas_espontaneas ?? []),
    ...(sessao.parte3?.estruturas_usadas ?? []),
  ])
  for (const forma of livres) {
    const e = porForma.get(forma)
    if (e) e.apareceu_em_livre = true
  }

  const antes = new Set(perfil.estruturas.filter(e => e.estado === 'dominada').map(e => e.forma))
  const estruturas = [...porForma.values()].map(e => ({ ...e, estado: estadoDe(e) }))
  const dominadasNovas = estruturas
    .filter(e => e.estado === 'dominada' && !antes.has(e.forma))
    .map(e => e.forma)

  // --- Erros recorrentes: agrega categorias das partes 1 e 2 --------------
  const categorias: string[] = [
    ...sessao.parte1.erros.map(e => e.categoria).filter(Boolean),
    ...sessao.parte2.frases.filter(f => !f.correcto && f.categoria_erro).map(f => f.categoria_erro),
  ]
  const porCategoria = new Map(perfil.erros_recorrentes.map(e => [e.estrutura, { ...e }]))
  const deltas = new Map<string, number>()
  for (const cat of categorias) {
    deltas.set(cat, (deltas.get(cat) ?? 0) + 1)
    const item = porCategoria.get(cat)
    if (item) {
      item.vezes += 1
      item.ultima_vez = today
    } else {
      porCategoria.set(cat, { estrutura: cat, vezes: 1, ultima_vez: today })
    }
  }
  const erros_recorrentes = [...porCategoria.values()].sort((a, b) => b.vezes - a.vezes)
  const errosRegistados = [...deltas.entries()].map(([categoria, vezes]) => ({ categoria, vezes }))

  // --- Vocabulário novo (sem duplicados) -----------------------------------
  const existingKr = new Set(perfil.vocabulario_visto.map(v => v.kr))
  const novoVocab = sessao.vocabulario_novo.filter(v => !existingKr.has(v.kr))

  // --- Streak ---------------------------------------------------------------
  const lastDay = perfil.ultima_sessao.slice(0, 10)
  const yesterday = new Date(hoje.getTime() - 86400000).toISOString().slice(0, 10)
  const streak = lastDay === yesterday ? perfil.streak + 1 : lastDay === today ? perfil.streak : 1

  return {
    perfil: {
      ...perfil,
      streak,
      ultima_sessao: hoje.toISOString(),
      sessoes_realizadas: perfil.sessoes_realizadas + 1,
      vocabulario_visto: [...perfil.vocabulario_visto, ...novoVocab],
      estruturas,
      erros_recorrentes,
    },
    dominadasNovas,
    errosRegistados,
  }
}

// Pré-visualização dos deltas para o ecrã de correção (antes de terminar).
export function previewSessionDeltas(perfil: Perfil, sessao: Sessao): Pick<SessionDeltas, 'dominadasNovas' | 'errosRegistados'> {
  const { dominadasNovas, errosRegistados } = applySessionToPerfil(perfil, sessao)
  return { dominadasNovas, errosRegistados }
}

// --- Promoção de nível ------------------------------------------------------
export const PROMO_SESSOES = 5          // sessões consecutivas…
export const PROMO_PONTUACAO = 16       // …com pelo menos esta pontuação (em 20)
export const PROMO_DOMINADAS = 4        // e este nº de estruturas dominadas

// `sessoes` na ordem do db: mais recente primeiro.
export function promotionEligible(perfil: Perfil, sessoes: Sessao[]): boolean {
  if (!nextLevel(perfil.nivel_atual)) return false
  if (perfil.promo_adiada_em !== undefined && perfil.sessoes_realizadas <= perfil.promo_adiada_em) return false
  // Exige um ciclo completo de sessões já no nível atual — sem isto, os
  // critérios (cumulativos) fariam a proposta reaparecer logo após promover.
  if (perfil.sessoes_realizadas < (perfil.nivel_mudado_em ?? 0) + PROMO_SESSOES) return false
  const dominadas = perfil.estruturas.filter(e => e.estado === 'dominada').length
  if (dominadas < PROMO_DOMINADAS) return false
  if (sessoes.length < PROMO_SESSOES) return false
  return sessoes
    .slice(0, PROMO_SESSOES)
    .every(s => s.parte1.pontuacao + s.parte2.pontuacao >= PROMO_PONTUACAO)
}

export function promote(perfil: Perfil): Perfil {
  const novo = nextLevel(perfil.nivel_atual)
  if (!novo) return perfil
  const { promo_adiada_em: _adiada, ...rest } = perfil
  return {
    ...rest,
    nivel_atual: novo,
    nivel_seguinte: nextLevel(novo) ?? novo,
    nivel_mudado_em: perfil.sessoes_realizadas,
  }
}

export function postponePromotion(perfil: Perfil): Perfil {
  return { ...perfil, promo_adiada_em: perfil.sessoes_realizadas }
}
