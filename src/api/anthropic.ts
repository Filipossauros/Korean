import type { Perfil, Sessao, SessionDraft, UnidadeKSI } from '../types'
import { generateSessionPrompt } from '../prompts/generate-session'
import { correctSessionPrompt, correctFreeWritingPrompt } from '../prompts/correct-session'

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

function getApiKey(): string {
  const key = localStorage.getItem('anthropic_api_key')
  if (!key) throw new Error('Anthropic API key não configurada. Vai a Definições para adicionar a chave.')
  return key
}

async function callAnthropic(prompt: string, maxTokens = 4096): Promise<string> {
  const key = getApiKey()
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  return data.content[0].text
}

function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  return JSON.parse(cleaned)
}

export async function generateSession(perfil: Perfil, unidade: UnidadeKSI): Promise<SessionDraft> {
  const prompt = generateSessionPrompt(perfil, unidade)
  const text = await callAnthropic(prompt)
  return parseJSON<SessionDraft>(text)
}

export async function correctSession(sessao: Sessao) {
  const prompt = correctSessionPrompt(sessao)
  const text = await callAnthropic(prompt)
  return parseJSON<{
    parte1: { pontuacao: number; correcao: string; erros: Sessao['parte1']['erros'] }
    parte2: { pontuacao: number; frases: { correcto: boolean; tentativa: string; referencia: string; nota: string; categoria_erro: string }[] }
    estruturas_praticadas: string[]
    vocabulario_novo: { kr: string; pt: string }[]
    notas_gerais: string
  }>(text)
}

export async function correctFreeWriting(tema: string, texto: string, nivel: string) {
  const prompt = correctFreeWritingPrompt(tema, texto, nivel)
  const text = await callAnthropic(prompt)
  return parseJSON<{
    correcao: string
    estruturas_usadas: string[]
    estruturas_espontaneas: string[]
    erros: { original: string; correcto: string; nota: string }[]
    nota_geral: string
  }>(text)
}

export async function sendFreeChat(messages: { role: 'user' | 'assistant'; content: string }[], nivel: string): Promise<string> {
  const key = getApiKey()
  const systemPrompt = `És um professor de coreano paciente e encorajador. O utilizador está no nível ${nivel} do King Sejong Institute. Responde sempre em português, mas inclui exemplos em coreano (hangul) com romanização e tradução quando relevante. Mantém as respostas concisas e pedagógicas.`

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  return data.content[0].text
}
