import { useState, useRef, useEffect } from 'react'
import { streamFreeChat } from '../api/anthropic'
import { MessageIcon, SendIcon } from './Icons'
import { useSettings } from '../lib/settings'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  nivel: string
}

export function FreeChat({ nivel }: Props) {
  const { model } = useSettings()
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `안녕하세요! 저는 한국어 선생님이에요. Estou aqui para ajudar com o teu coreano (nível ${nivel}). Podes perguntar sobre gramática, vocabulário, ou praticar conversação. Como posso ajudar?` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setError('')
    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setLoading(true)
    // mensagem do assistente que vai sendo preenchida com o streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])
    try {
      await streamFreeChat(newMessages, nivel, chunk => {
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: copy[copy.length - 1].content + chunk }
          return copy
        })
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro')
      setMessages(prev => prev.slice(0, -1)) // remove o placeholder vazio
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-paper">
      {/* Header */}
      <div className="px-4 py-4 border-b border-line bg-surface flex items-center gap-2">
        <MessageIcon size={20} />
        <h1 className="font-ui font-semibold text-fg">Conversa livre</h1>
        <span className="ml-auto text-xs text-fg/30 font-ui">{model}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24 md:pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md rounded-2xl px-4 py-3 text-sm font-ui whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-vermillion text-white rounded-br-sm'
                : 'bg-surface border border-line text-fg rounded-bl-sm'
            }`}>
              {m.content || <span className="text-fg/30 animate-pulse">…</span>}
            </div>
          </div>
        ))}
        {error && (
          <div className="text-center">
            <p className="text-xs text-vermillion font-ui">{error}</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:relative px-4 py-3 bg-surface border-t border-line">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Escreve aqui…"
            className="flex-1 rounded-xl border border-line px-3 py-2 text-sm font-ui text-fg focus:outline-none focus:border-gold"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-vermillion text-white disabled:opacity-40"
          >
            <SendIcon size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
