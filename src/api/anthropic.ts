import type { Perfil, Sessao, SessionDraft, UnidadeKSI, Dialogo } from '../types'
import { generateSessionPrompt } from '../prompts/generate-session'
import { correctTranslationPrompt, correctProductionPrompt, correctFreeWritingPrompt } from '../prompts/correct-session'
import { generateDialoguePrompt } from '../prompts/generate-dialogue'
import { getSettings } from '../lib/settings'
import { targetLanguageName } from '../lib/i18n'
import { readingSentences } from '../lib/progression'

const API_URL = 'https://api.anthropic.com/v1/messages'

export class ApiError extends Error {
  status?: number
  retryable: boolean
  constructor(message: string, status?: number, retryable = false) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.retryable = retryable
  }
}

function getApiKey(): string {
  const key = localStorage.getItem('anthropic_api_key')
  if (!key) throw new ApiError('Anthropic API key não configurada. Vai a Definições para adicionar a chave.')
  return key
}

function model(): string {
  return getSettings().model
}

function langName(): string {
  return targetLanguageName(getSettings().language)
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

interface Msg { role: 'user' | 'assistant'; content: unknown }

// Core request with retry/backoff on 429/5xx/network.
async function request(body: Record<string, unknown>, retries = 3): Promise<string> {
  const key = getApiKey()
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        return data.content[0].text
      }
      const text = await res.text()
      const retryable = res.status === 429 || res.status >= 500
      if (retryable && attempt < retries) {
        await sleep(1000 * Math.pow(2, attempt))
        continue
      }
      const friendly =
        res.status === 401 ? 'Chave da API inválida. Verifica nas Definições.' :
        res.status === 429 ? 'Limite de pedidos atingido. Tenta novamente daqui a pouco.' :
        res.status >= 500 ? 'Serviço da Anthropic indisponível. Tenta de novo.' :
        `Erro da API (${res.status}): ${text.slice(0, 200)}`
      throw new ApiError(friendly, res.status, retryable)
    } catch (e) {
      if (e instanceof ApiError) throw e
      // network error → retry
      if (attempt < retries) { await sleep(1000 * Math.pow(2, attempt)); continue }
    }
  }
  throw new ApiError('Sem ligação à API. Verifica a internet e tenta de novo.', undefined, true)
}

function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    // tenta extrair o primeiro bloco {...}
    const m = cleaned.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
    throw new ApiError('Resposta da IA em formato inesperado. Tenta de novo.')
  }
}

export async function generateSession(perfil: Perfil, unidade: UnidadeKSI): Promise<SessionDraft> {
  const prompt = generateSessionPrompt(perfil, unidade, langName(), readingSentences(perfil))
  const text = await request({ model: model(), max_tokens: 6144, messages: [{ role: 'user', content: prompt }] })
  return parseJSON<SessionDraft>(text)
}

// Correção rápida só da tradução (Parte 1) — mostrada imediatamente.
export async function correctTranslation(sessao: Sessao) {
  const prompt = correctTranslationPrompt(sessao, langName())
  const text = await request({ model: model(), max_tokens: 1536, messages: [{ role: 'user', content: prompt }] })
  return parseJSON<{
    pontuacao: number
    correcao: string
    erros: Sessao['parte1']['erros']
  }>(text)
}

// Correção só da produção (Parte 2).
export async function correctProduction(sessao: Sessao) {
  const prompt = correctProductionPrompt(sessao, langName())
  const text = await request({ model: model(), max_tokens: 2048, messages: [{ role: 'user', content: prompt }] })
  return parseJSON<{
    pontuacao: number
    frases: { correcto: boolean; nota: string; categoria_erro: string }[]
    estruturas_praticadas: string[]
  }>(text)
}

export async function generateDialogue(nivel: string, unidade: UnidadeKSI, turns?: string): Promise<Dialogo> {
  const prompt = generateDialoguePrompt(nivel, unidade, langName(), turns)
  const text = await request({ model: model(), max_tokens: 6144, messages: [{ role: 'user', content: prompt }] })
  return parseJSON<Dialogo>(text)
}

export async function correctFreeWriting(tema: string, texto: string, nivel: string) {
  const prompt = correctFreeWritingPrompt(tema, texto, nivel, langName())
  const text = await request({ model: model(), max_tokens: 2048, messages: [{ role: 'user', content: prompt }] })
  return parseJSON<{
    correcao: string
    estruturas_usadas: string[]
    estruturas_espontaneas: string[]
    erros: { original: string; correcto: string; nota: string }[]
    nota_geral: string
  }>(text)
}

// OCR de manuscrito Hangul via Claude Vision (mais preciso que Tesseract).
export async function recognizeHangulWithClaude(imageFile: File): Promise<string> {
  const base64 = await fileToBase64(imageFile)
  const mediaType = imageFile.type || 'image/jpeg'
  const content: unknown[] = [
    { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
    { type: 'text', text: 'Transcreve EXACTAMENTE o texto coreano manuscrito desta imagem. Responde apenas com o texto em Hangul, sem comentários, sem tradução, sem aspas.' },
  ]
  const messages: Msg[] = [{ role: 'user', content }]
  const text = await request({ model: model(), max_tokens: 1024, messages })
  return text.trim()
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
