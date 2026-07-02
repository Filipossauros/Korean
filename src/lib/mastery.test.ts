import { describe, it, expect } from 'vitest'
import type { Perfil, Sessao, FraseProducao } from '../types'
import {
  applySessionToPerfil, promotionEligible, promote, postponePromotion,
  nextLevel, LEVELS, PROMO_SESSOES, PROMO_PONTUACAO, PROMO_DOMINADAS,
} from './mastery'

const HOJE = new Date('2026-07-01T12:00:00Z')

function perfil(over: Partial<Perfil> = {}): Perfil {
  return {
    nivel_atual: '3A', nivel_seguinte: '3B', streak: 0, ultima_sessao: '',
    estruturas: [], vocabulario_visto: [], erros_recorrentes: [], sessoes_realizadas: 0,
    ...over,
  }
}

function frase(over: Partial<FraseProducao> = {}): FraseProducao {
  return {
    pt_original: 'p', kr_referencia: 'r', kr_utilizador: 'u', dicas: [],
    estrutura_foco: '-(으)면', correcto: true, nota: '', categoria_erro: '',
    ...over,
  }
}

function sessao(over: Partial<Sessao> = {}): Sessao {
  return {
    id: 's1', data: HOJE.toISOString(), tema: 't', tipo: 'estruturada', unidade_ksi: '3A',
    parte1: { texto_kr: 'kr', traducao_utilizador: '', traducao_referencia: '', pontuacao: 9, erros: [], tempo_segundos: 60 },
    parte2: { frases: [], pontuacao: 9, tempo_segundos: 60 },
    vocabulario_novo: [], estruturas_praticadas: [],
    ...over,
  }
}

describe('applySessionToPerfil — estruturas', () => {
  it('incrementa acertos consecutivos e faz reset ao errar', () => {
    let p = perfil()
    p = applySessionToPerfil(p, sessao({ parte2: { frases: [frase()], pontuacao: 9, tempo_segundos: 0 } }), HOJE).perfil
    expect(p.estruturas[0].acertos_consecutivos).toBe(1)
    p = applySessionToPerfil(p, sessao({ parte2: { frases: [frase({ correcto: false, categoria_erro: 'partícula' })], pontuacao: 5, tempo_segundos: 0 } }), HOJE).perfil
    expect(p.estruturas[0].acertos_consecutivos).toBe(0)
    expect(p.estruturas[0].estado).toBe('em_progresso')
  })

  it('domina com 3 acertos + uso em escrita livre, e reporta o delta', () => {
    let p = perfil()
    for (let i = 0; i < 2; i++) {
      p = applySessionToPerfil(p, sessao({ parte2: { frases: [frase()], pontuacao: 9, tempo_segundos: 0 } }), HOJE).perfil
    }
    expect(p.estruturas[0].estado).toBe('em_progresso')
    const r = applySessionToPerfil(p, sessao({
      parte2: { frases: [frase()], pontuacao: 9, tempo_segundos: 0 },
      parte3: { texto_utilizador: '', correcao: '', estruturas_usadas: [], estruturas_espontaneas: ['-(으)면'] },
    }), HOJE)
    expect(r.perfil.estruturas[0].estado).toBe('dominada')
    expect(r.dominadasNovas).toEqual(['-(으)면'])
  })

  it('sem escrita livre, 3 acertos não chegam para dominar', () => {
    let p = perfil()
    for (let i = 0; i < 4; i++) {
      p = applySessionToPerfil(p, sessao({ parte2: { frases: [frase()], pontuacao: 9, tempo_segundos: 0 } }), HOJE).perfil
    }
    expect(p.estruturas[0].estado).toBe('em_progresso')
    expect(p.estruturas[0].acertos_consecutivos).toBe(4)
  })

  it('domínio não regride ao errar depois', () => {
    let p = perfil({
      estruturas: [{ forma: '-(으)면', estado: 'dominada', acertos_consecutivos: 3, apareceu_em_livre: true, ultima_vez: '2026-06-01' }],
    })
    p = applySessionToPerfil(p, sessao({ parte2: { frases: [frase({ correcto: false })], pontuacao: 5, tempo_segundos: 0 } }), HOJE).perfil
    expect(p.estruturas[0].estado).toBe('dominada')
  })
})

describe('applySessionToPerfil — erros recorrentes', () => {
  it('agrega categorias das partes 1 e 2, ordenadas por frequência', () => {
    const s = sessao({
      parte1: { texto_kr: '', traducao_utilizador: '', traducao_referencia: '', pontuacao: 7, tempo_segundos: 0,
        erros: [{ original: '', correcto: '', nota: '', categoria: 'partícula' }] },
      parte2: { pontuacao: 6, tempo_segundos: 0, frases: [
        frase({ correcto: false, categoria_erro: 'partícula' }),
        frase({ estrutura_foco: '-고 싶다', correcto: false, categoria_erro: 'gramática' }),
      ] },
    })
    const r = applySessionToPerfil(perfil(), s, HOJE)
    expect(r.perfil.erros_recorrentes[0]).toMatchObject({ estrutura: 'partícula', vezes: 2 })
    expect(r.perfil.erros_recorrentes[1]).toMatchObject({ estrutura: 'gramática', vezes: 1 })
    expect(r.errosRegistados).toContainEqual({ categoria: 'partícula', vezes: 2 })
  })

  it('acumula entre sessões', () => {
    let p = perfil({ erros_recorrentes: [{ estrutura: 'partícula', vezes: 3, ultima_vez: '2026-06-01' }] })
    p = applySessionToPerfil(p, sessao({
      parte2: { pontuacao: 6, tempo_segundos: 0, frases: [frase({ correcto: false, categoria_erro: 'partícula' })] },
    }), HOJE).perfil
    expect(p.erros_recorrentes[0].vezes).toBe(4)
    expect(p.erros_recorrentes[0].ultima_vez).toBe('2026-07-01')
  })
})

describe('applySessionToPerfil — streak e contadores', () => {
  it('continua o streak de ontem e reinicia após intervalo', () => {
    const ontem = perfil({ streak: 3, ultima_sessao: '2026-06-30T10:00:00Z' })
    expect(applySessionToPerfil(ontem, sessao(), HOJE).perfil.streak).toBe(4)
    const antigo = perfil({ streak: 9, ultima_sessao: '2026-06-20T10:00:00Z' })
    expect(applySessionToPerfil(antigo, sessao(), HOJE).perfil.streak).toBe(1)
  })

  it('não duplica vocabulário já visto', () => {
    const v = { kr: '물', pt: 'água', vezes_visto: 1, vezes_correcto: 1, ultimo_erro: null, srs_nivel: 1 as const, srs_proxima_revisao: '2026-07-02' }
    const p = perfil({ vocabulario_visto: [v] })
    const r = applySessionToPerfil(p, sessao({ vocabulario_novo: [v, { ...v, kr: '불' }] }), HOJE)
    expect(r.perfil.vocabulario_visto).toHaveLength(2)
  })
})

describe('promoção de nível', () => {
  const dominadas = Array.from({ length: PROMO_DOMINADAS }, (_, i) => ({
    forma: `f${i}`, estado: 'dominada' as const, acertos_consecutivos: 3, apareceu_em_livre: true, ultima_vez: '2026-06-01',
  }))
  const boas = Array.from({ length: PROMO_SESSOES }, (_, i) =>
    sessao({ id: `s${i}`, parte1: { ...sessao().parte1, pontuacao: 8 }, parte2: { ...sessao().parte2, pontuacao: PROMO_PONTUACAO - 8 } }))

  it('elegível com sessões boas + estruturas dominadas', () => {
    expect(promotionEligible(perfil({ estruturas: dominadas, sessoes_realizadas: 9 }), boas)).toBe(true)
  })

  it('não elegível com pontuação baixa, poucas dominadas, ou no nível máximo', () => {
    const fraca = [sessao({ parte2: { ...sessao().parte2, pontuacao: 2 } }), ...boas.slice(1)]
    expect(promotionEligible(perfil({ estruturas: dominadas, sessoes_realizadas: 9 }), fraca)).toBe(false)
    expect(promotionEligible(perfil({ estruturas: dominadas.slice(1), sessoes_realizadas: 9 }), boas)).toBe(false)
    expect(promotionEligible(perfil({ nivel_atual: '4B', estruturas: dominadas, sessoes_realizadas: 9 }), boas)).toBe(false)
  })

  it('não repropõe logo após promover: exige novo ciclo de sessões no nível', () => {
    let p = promote(perfil({ estruturas: dominadas, sessoes_realizadas: 9 }))
    expect(p.nivel_mudado_em).toBe(9)
    expect(promotionEligible(p, boas)).toBe(false)
    p = { ...p, sessoes_realizadas: 9 + PROMO_SESSOES }
    expect(promotionEligible(p, boas)).toBe(true)
  })

  it('adiar esconde até haver mais uma sessão', () => {
    let p = perfil({ estruturas: dominadas, sessoes_realizadas: 9 })
    p = postponePromotion(p)
    expect(promotionEligible(p, boas)).toBe(false)
    p = { ...p, sessoes_realizadas: 10 }
    expect(promotionEligible(p, boas)).toBe(true)
  })

  it('promove para o nível seguinte e limpa o adiamento', () => {
    const p = promote(postponePromotion(perfil({ sessoes_realizadas: 9 })))
    expect(p.nivel_atual).toBe('3B')
    expect(p.nivel_seguinte).toBe('4A')
    expect(p.promo_adiada_em).toBeUndefined()
  })

  it('nextLevel cobre a escada toda', () => {
    expect(nextLevel('1A')).toBe('1B')
    expect(nextLevel('4B')).toBeNull()
    expect(LEVELS).toHaveLength(8)
  })
})
