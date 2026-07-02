// Validação leve das respostas JSON do modelo. Um cast cego deixa respostas
// malformadas rebentar profundamente na UI; aqui transformam-se num erro
// accionável ("tenta de novo") ou são normalizadas quando possível.
import type { Dialogo, SessionDraft } from '../types'
import { ApiError } from './errors'

const bad = () => new ApiError('Resposta da IA em formato inesperado. Tenta de novo.')

const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const clamp = (v: unknown, min: number, max: number): number => {
  const n = typeof v === 'number' ? v : Number(v)
  if (isNaN(n)) throw bad()
  return Math.max(min, Math.min(max, Math.round(n)))
}

export function validateSessionDraft(d: SessionDraft): SessionDraft {
  if (!d || typeof d !== 'object') throw bad()
  if (!isStr(d.tema)) throw bad()
  if (!d.parte1 || !isStr(d.parte1.texto_kr)) throw bad()
  if (!Array.isArray(d.parte1.vocabulario_novo)) d.parte1.vocabulario_novo = []
  if (!Array.isArray(d.parte2?.frases) || d.parte2.frases.length === 0) throw bad()
  d.parte2.frases = d.parte2.frases.filter(f => f && isStr(f.pt) && isStr(f.kr_referencia))
  if (d.parte2.frases.length === 0) throw bad()
  for (const f of d.parte2.frases) {
    if (!Array.isArray(f.dicas)) f.dicas = []
    if (typeof f.estrutura_foco !== 'string') f.estrutura_foco = ''
  }
  return d
}

export function validateDialogo(d: Dialogo): Dialogo {
  if (!d || typeof d !== 'object' || !isStr(d.tema)) throw bad()
  if (!Array.isArray(d.linhas)) throw bad()
  d.linhas = d.linhas.filter(l => l && isStr(l.kr) && typeof l.traducao === 'string')
  if (d.linhas.length === 0) throw bad()
  if (Array.isArray(d.perguntas)) {
    d.perguntas = d.perguntas.filter(q =>
      q && isStr(q.pergunta) &&
      Array.isArray(q.opcoes) && q.opcoes.length >= 2 && q.opcoes.every(isStr) &&
      Number.isInteger(q.correta) && q.correta >= 0 && q.correta < q.opcoes.length
    )
    if (d.perguntas.length === 0) delete d.perguntas
  } else {
    delete d.perguntas
  }
  return d
}

interface CorrectionP1 { pontuacao: number; correcao: string; erros: { original: string; correcto: string; nota: string; categoria: string }[] }

export function validateCorrectionP1(r: CorrectionP1): CorrectionP1 {
  if (!r || typeof r !== 'object' || !isStr(r.correcao)) throw bad()
  r.pontuacao = clamp(r.pontuacao, 0, 10)
  r.erros = Array.isArray(r.erros)
    ? r.erros.filter(e => e && typeof e.original === 'string' && typeof e.correcto === 'string')
        .map(e => ({ ...e, nota: e.nota ?? '', categoria: e.categoria ?? '' }))
    : []
  return r
}

interface CorrectionP2 { pontuacao: number; frases: { correcto: boolean; nota: string; categoria_erro: string }[]; estruturas_praticadas: string[] }

export function validateCorrectionP2(r: CorrectionP2, nFrases: number): CorrectionP2 {
  if (!r || typeof r !== 'object' || !Array.isArray(r.frases)) throw bad()
  if (r.frases.length < nFrases) throw bad()
  r.frases = r.frases.slice(0, nFrases).map(f => ({
    correcto: f?.correcto === true,
    nota: typeof f?.nota === 'string' ? f.nota : '',
    categoria_erro: typeof f?.categoria_erro === 'string' ? f.categoria_erro : '',
  }))
  r.pontuacao = clamp(r.pontuacao, 0, 10)
  r.estruturas_praticadas = Array.isArray(r.estruturas_praticadas) ? r.estruturas_praticadas.filter(isStr) : []
  return r
}

interface FreeWriting { correcao: string; estruturas_usadas: string[]; estruturas_espontaneas: string[]; erros: { original: string; correcto: string; nota: string }[]; nota_geral: string }

export function validateFreeWriting(r: FreeWriting): FreeWriting {
  if (!r || typeof r !== 'object' || !isStr(r.correcao)) throw bad()
  r.estruturas_usadas = Array.isArray(r.estruturas_usadas) ? r.estruturas_usadas.filter(isStr) : []
  r.estruturas_espontaneas = Array.isArray(r.estruturas_espontaneas) ? r.estruturas_espontaneas.filter(isStr) : []
  r.erros = Array.isArray(r.erros)
    ? r.erros.filter(e => e && typeof e.original === 'string' && typeof e.correcto === 'string')
        .map(e => ({ ...e, nota: e.nota ?? '' }))
    : []
  if (typeof r.nota_geral !== 'string') r.nota_geral = ''
  return r
}
