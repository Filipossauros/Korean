import type { Sessao } from '../types'

// Correção SÓ da Parte 1 (tradução KO→língua de apoio). Prompt pequeno → resposta
// rápida, para o utilizador ver o que acertou/falhou logo após a tradução.
export function correctTranslationPrompt(sessao: Sessao, langName: string): string {
  return `És um professor de coreano. Corrige a tradução do utilizador com rigor pedagógico.
A língua de apoio é ${langName} — escreve TODAS as notas e explicações em ${langName}.

LEITURA (KO→${langName}):
Texto original: ${sessao.parte1.texto_kr}
Tradução do utilizador: ${sessao.parte1.traducao_utilizador}

Para cada erro, classifica em: partícula | vocabulário | gramática | tempo_verbal | registo | ordem_palavras

Responde APENAS em JSON sem markdown (sem \`\`\`):
{
  "pontuacao": 0-10,
  "correcao": "(tradução de referência em ${langName})",
  "erros": [{"original":"","correcto":"","nota":"","categoria":""}]
}`
}

// Correção SÓ da Parte 2 (produção língua de apoio→KO).
export function correctProductionPrompt(sessao: Sessao, langName: string): string {
  return `És um professor de coreano. Corrige as frases de produção do utilizador com rigor pedagógico.
A língua de apoio é ${langName} — escreve TODAS as notas e explicações em ${langName}.

PRODUÇÃO (${langName}→KO):
${sessao.parte2.frases.map((f, i) => `Frase ${i + 1}: ${langName}="${f.pt_original}" | Utilizador: "${f.kr_utilizador}" | Referência: "${f.kr_referencia}"`).join('\n')}

Para cada erro, classifica em: partícula | vocabulário | gramática | tempo_verbal | registo | ordem_palavras
Mantém a MESMA ordem das frases na resposta.

Responde APENAS em JSON sem markdown (sem \`\`\`):
{
  "pontuacao": 0-10,
  "frases": [{"correcto": true, "nota": "", "categoria_erro": ""}],
  "estruturas_praticadas": []
}`
}

export function correctFreeWritingPrompt(tema: string, texto: string, nivel: string, langName: string): string {
  return `És um professor de coreano de nível ${nivel} (KSI). O utilizador escreveu livremente sobre o tema: "${tema}".
A língua de apoio é ${langName} — escreve as notas e feedback em ${langName}.

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
