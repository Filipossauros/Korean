import type { UnidadeKSI } from '../types'

// Níveis 3A+ recebem as perguntas em coreano; abaixo disso na língua de apoio.
function perguntasEmCoreano(nivel: string): boolean {
  const n = parseInt(nivel, 10)
  return !isNaN(n) && n >= 3
}

export function generateDialoguePrompt(nivel: string, unidade: UnidadeKSI, langName: string, turns = '6 a 10'): string {
  const qLang = perguntasEmCoreano(nivel) ? 'coreano' : langName
  return `És um professor de coreano (currículo King Sejong Institute).
Cria um DIÁLOGO natural entre 2 pessoas (A e B), ao nível ${nivel}, sobre um tema quotidiano.
A língua de apoio é ${langName} — as traduções devem estar em ${langName}.

UNIDADE: ${unidade.tema}
VOCABULÁRIO DISPONÍVEL: ${JSON.stringify(unidade.palavras.slice(0, 10))}

REGRAS DO DIÁLOGO:
1. ${turns} falas, alternando A e B, coreano natural e correto para o nível
2. NUNCA usar vocabulário/gramática acima do nível ${nivel}
3. Cada fala tem o texto em coreano, a tradução em ${langName} e a romanização

PERGUNTAS DE COMPREENSÃO:
4. Cria 3 perguntas de escolha múltipla que testem a compreensão do diálogo
5. Tipos: uma de ideia principal, uma de detalhe factual, uma de inferência
6. Enunciado e opções em ${qLang}; a explicação SEMPRE em ${langName}
7. Cada pergunta tem 4 opções; "correta" é o índice (0-3) da opção certa
8. Os distractores (opções erradas) devem ser plausíveis, não absurdos
9. As perguntas têm de ser respondíveis só com o diálogo, sem conhecimento externo

Responde APENAS em JSON (sem markdown):
{
  "tema": "",
  "linhas": [
    {"falante": "A", "kr": "", "traducao": "(em ${langName})", "romanizacao": ""}
  ],
  "perguntas": [
    {"pergunta": "(em ${qLang})", "opcoes": ["", "", "", ""], "correta": 0, "explicacao": "(em ${langName})"}
  ]
}`
}
