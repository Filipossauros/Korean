import { describe, it, expect } from 'vitest'
import type { Dialogo } from '../types'
import { validateDialogo, validateCorrectionP1, validateCorrectionP2, validateSessionDraft, validateFreeWriting } from './validate'

const dialogo = (over: Partial<Dialogo> = {}): Dialogo => ({
  tema: '커피',
  linhas: [{ falante: 'A', kr: '안녕', traducao: 'olá' }],
  perguntas: [{ pergunta: '뭐?', opcoes: ['a', 'b', 'c', 'd'], correta: 1, explicacao: 'x' }],
  ...over,
})

describe('validateDialogo', () => {
  it('aceita um diálogo válido', () => {
    const d = validateDialogo(dialogo())
    expect(d.perguntas).toHaveLength(1)
  })

  it('remove perguntas com índice fora dos limites ou opções em falta', () => {
    const d = validateDialogo(dialogo({
      perguntas: [
        { pergunta: 'ok?', opcoes: ['a', 'b'], correta: 7, explicacao: '' },
        { pergunta: 'ok?', opcoes: ['a'], correta: 0, explicacao: '' },
        { pergunta: 'ok?', opcoes: ['a', 'b'], correta: 1, explicacao: '' },
      ],
    }))
    expect(d.perguntas).toHaveLength(1)
    expect(d.perguntas![0].correta).toBe(1)
  })

  it('apaga o campo perguntas quando nenhuma sobrevive', () => {
    const d = validateDialogo(dialogo({ perguntas: [{ pergunta: '', opcoes: [], correta: 0, explicacao: '' }] }))
    expect(d.perguntas).toBeUndefined()
  })

  it('rejeita diálogo sem linhas válidas', () => {
    expect(() => validateDialogo(dialogo({ linhas: [{ falante: 'A', kr: '', traducao: '' }] }))).toThrow()
  })
})

describe('validateCorrectionP1/P2', () => {
  it('normaliza a pontuação para 0-10', () => {
    expect(validateCorrectionP1({ pontuacao: 14, correcao: 'ok', erros: [] }).pontuacao).toBe(10)
    expect(validateCorrectionP1({ pontuacao: -2, correcao: 'ok', erros: [] }).pontuacao).toBe(0)
  })

  it('rejeita P2 com menos frases do que o pedido e corta as a mais', () => {
    expect(() => validateCorrectionP2({ pontuacao: 8, frases: [], estruturas_praticadas: [] }, 2)).toThrow()
    const r = validateCorrectionP2({
      pontuacao: 8,
      frases: [{ correcto: true, nota: '', categoria_erro: '' }, { correcto: false, nota: '', categoria_erro: 'partícula' }, { correcto: true, nota: '', categoria_erro: '' }],
      estruturas_praticadas: ['x'],
    }, 2)
    expect(r.frases).toHaveLength(2)
  })
})

describe('validateSessionDraft / validateFreeWriting', () => {
  it('rejeita draft sem texto ou sem frases', () => {
    expect(() => validateSessionDraft({ tema: 't', parte1: { texto_kr: '', vocabulario_novo: [], ponto_gramatical: { forma: '', significado: '', exemplo: '' }, texto_referencia_pt: '' }, parte2: { frases: [] } })).toThrow()
  })

  it('normaliza arrays em falta na escrita livre', () => {
    const r = validateFreeWriting({ correcao: 'ok' } as never)
    expect(r.estruturas_usadas).toEqual([])
    expect(r.erros).toEqual([])
  })
})
