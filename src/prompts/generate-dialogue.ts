import type { UnidadeKSI } from '../types'

export function generateDialoguePrompt(nivel: string, unidade: UnidadeKSI, langName: string): string {
  return `És um professor de coreano (currículo King Sejong Institute).
Cria um DIÁLOGO curto e natural entre 2 pessoas (A e B), ao nível ${nivel}, sobre um tema quotidiano.
A língua de apoio é ${langName} — as traduções devem estar em ${langName}.

UNIDADE: ${unidade.tema}
VOCABULÁRIO DISPONÍVEL: ${JSON.stringify(unidade.palavras.slice(0, 10))}

REGRAS:
1. 6 a 10 falas, alternando A e B, coreano natural e correto para o nível
2. NUNCA usar vocabulário/gramática acima do nível ${nivel}
3. Cada fala tem o texto em coreano, a tradução em ${langName} e a romanização

Responde APENAS em JSON (sem markdown):
{
  "tema": "",
  "linhas": [
    {"falante": "A", "kr": "", "traducao": "(em ${langName})", "romanizacao": ""}
  ]
}`
}
