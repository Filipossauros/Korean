import type { Perfil, UnidadeKSI } from '../types'

export function generateSessionPrompt(perfil: Perfil, unidade: UnidadeKSI, langName: string, readingLen = '3-5'): string {
  return `És um professor de coreano especializado no currículo King Sejong Institute.
A língua de apoio do utilizador é ${langName} — TODAS as traduções, explicações e frases na língua de apoio devem estar em ${langName}.

PERFIL DO UTILIZADOR:
- Nível actual: ${perfil.nivel_atual} (KSI Lisboa nível 5→6)
- Estruturas dominadas: ${perfil.estruturas.filter(e => e.estado === 'dominada').map(e => e.forma).join(', ') || 'nenhuma ainda'}
- Estruturas em progresso: ${perfil.estruturas.filter(e => e.estado === 'em_progresso').map(e => e.forma).join(', ') || 'nenhuma ainda'}
- Erros recorrentes (categoria × frequência, pior primeiro): ${perfil.erros_recorrentes.slice(0, 5).map(e => `${e.estrutura} ×${e.vezes}`).join(', ') || 'nenhum registado'}
- Vocabulário visto nas últimas 2 sessões: ${perfil.vocabulario_visto.slice(-20).map(v => v.kr).join(', ') || 'nenhum ainda'}

UNIDADE EM CURSO: ${unidade.tema}
VOCABULÁRIO DA UNIDADE: ${JSON.stringify(unidade.palavras.slice(0, 10))}
ESTRUTURAS DA UNIDADE: ${JSON.stringify(unidade.estruturas)}

REGRAS:
1. Parte 1 (leitura): texto ${readingLen} frases, nível ligeiramente acima do actual, tema quotidiano real
2. Apresenta ANTES do texto: máx 3 palavras novas + 1 ponto gramatical novo
3. Reutiliza obrigatoriamente 2 palavras das últimas 2 sessões (se existirem)
4. Parte 2 (produção): 6 frases ${langName}→Coreano, nível actual, foco nas estruturas em progresso
5. As frases de produção devem partilhar o mesmo tema da leitura; pelo menos 2 delas devem treinar deliberadamente as categorias de erros recorrentes do utilizador (se existirem)
6. NUNCA introduzir vocabulário ou gramática fora do currículo KSI até ao nível actual
7. Os campos "pt", "significado", "texto_referencia_pt" e "exemplo" devem estar em ${langName}

Responde APENAS em JSON com esta estrutura exacta (sem markdown, sem \`\`\`):
{
  "tema": "",
  "parte1": {
    "vocabulario_novo": [{"kr":"","pt":"(em ${langName})","exemplo":""}],
    "ponto_gramatical": {"forma":"","significado":"(em ${langName})","exemplo":""},
    "texto_kr": "",
    "texto_referencia_pt": "(tradução em ${langName})"
  },
  "parte2": {
    "frases": [{"pt":"(frase em ${langName})","kr_referencia":"","dicas":[],"estrutura_foco":""}]
  }
}`
}
