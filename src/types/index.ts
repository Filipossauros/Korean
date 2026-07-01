export interface Perfil {
  nivel_atual: string
  nivel_seguinte: string
  streak: number
  ultima_sessao: string
  estruturas: EstruturaItem[]
  vocabulario_visto: VocabItem[]
  erros_recorrentes: ErroItem[]
  sessoes_realizadas: number
}

export interface EstruturaItem {
  forma: string
  estado: 'por_trabalhar' | 'em_progresso' | 'dominada'
  acertos_consecutivos: number
  apareceu_em_livre: boolean
  ultima_vez: string
}

export interface VocabItem {
  kr: string
  pt: string
  vezes_visto: number
  vezes_correcto: number
  ultimo_erro: string | null
  srs_nivel: 1 | 2 | 3
  srs_proxima_revisao: string
}

export interface ErroItem {
  estrutura: string
  vezes: number
  ultima_vez: string
}

export interface FraseProducao {
  pt_original: string
  kr_referencia: string
  kr_utilizador: string
  dicas: string[]
  estrutura_foco: string
  correcto: boolean
  nota: string
  categoria_erro: string
}

export interface ErroCorrecao {
  original: string
  correcto: string
  nota: string
  categoria: 'partícula' | 'vocabulário' | 'gramática' | 'tempo_verbal' | 'registo' | 'ordem_palavras'
}

export interface Sessao {
  id: string
  data: string
  tema: string
  tipo: 'estruturada' | 'livre'
  unidade_ksi: string
  parte1: {
    texto_kr: string
    traducao_utilizador: string
    traducao_referencia: string
    pontuacao: number
    erros: ErroCorrecao[]
    tempo_segundos: number
  }
  parte2: {
    frases: FraseProducao[]
    pontuacao: number
    tempo_segundos: number
  }
  parte3?: {
    texto_utilizador: string
    correcao: string
    estruturas_usadas: string[]
    estruturas_espontaneas: string[]
  }
  vocabulario_novo: VocabItem[]
  estruturas_praticadas: string[]
}

export interface DialogoLinha {
  falante: 'A' | 'B'
  kr: string
  traducao: string
  romanizacao?: string
}

export interface Dialogo {
  tema: string
  linhas: DialogoLinha[]
}

export interface UnidadeKSI {
  tema: string
  palavras: { kr: string; pt?: string; en?: string; exemplo?: string }[]
  estruturas: { forma: string; significado: string; exemplo: string }[]
}

export interface SessionDraft {
  tema: string
  parte1: {
    vocabulario_novo: { kr: string; pt: string; exemplo: string }[]
    ponto_gramatical: { forma: string; significado: string; exemplo: string }
    texto_kr: string
    texto_referencia_pt: string
  }
  parte2: {
    frases: { pt: string; kr_referencia: string; dicas: string[]; estrutura_foco: string }[]
  }
}

export type AppView =
  | 'dashboard'
  | 'session-detail'
  | 'session-reading'
  | 'session-writing'
  | 'session-correction'
  | 'free-writing'
  | 'vocabulary'
  | 'progress'
  | 'dialogue'
  | 'settings'
