import type { Sessao } from '../types'

export function correctSessionPrompt(sessao: Sessao): string {
  return `És um professor de coreano. Corrige as traduções do utilizador com rigor pedagógico.

PARTE 1 — LEITURA (KO→PT):
Texto original: ${sessao.parte1.texto_kr}
Tradução do utilizador: ${sessao.parte1.traducao_utilizador}

PARTE 2 — PRODUÇÃO (PT→KO):
${sessao.parte2.frases.map((f, i) => `Frase ${i + 1}: PT="${f.pt_original}" | Utilizador: "${f.kr_utilizador}" | Referência: "${f.kr_referencia}"`).join('\n')}

Para cada erro, classifica em: partícula | vocabulário | gramática | tempo_verbal | registo | ordem_palavras

Responde APENAS em JSON sem markdown (sem \`\`\`):
{
  "parte1": {
    "pontuacao": 0-10,
    "correcao": "",
    "erros": [{"original":"","correcto":"","nota":"","categoria":""}]
  },
  "parte2": {
    "pontuacao": 0-10,
    "frases": [{
      "correcto": true,
      "tentativa": "",
      "referencia": "",
      "nota": "",
      "categoria_erro": ""
    }]
  },
  "estruturas_praticadas": [],
  "vocabulario_novo": [],
  "notas_gerais": ""
}`
}

export function correctFreeWritingPrompt(tema: string, texto: string, nivel: string): string {
  return `És um professor de coreano de nível ${nivel} (KSI). O utilizador escreveu livremente sobre o tema: "${tema}".

TEXTO DO UTILIZADOR:
${texto}

Analisa o texto e responde APENAS em JSON sem markdown:
{
  "correcao": "texto corrigido completo",
  "estruturas_usadas": ["lista de estruturas gramaticais identificadas"],
  "estruturas_espontaneas": ["estruturas usadas correctamente sem terem sido pedidas"],
  "erros": [{"original": "", "correcto": "", "nota": ""}],
  "nota_geral": "feedback positivo e encorajador de 1-2 frases"
}`
}
