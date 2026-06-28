import { useState, useEffect, useRef } from 'react'
import type { FraseProducao } from '../types'
import { PencilIcon, CameraIcon } from './Icons'

interface Props {
  frases: FraseProducao[]
  showTimer: boolean
  onSubmit: (respostas: string[]) => void
}

export function SessionWriting({ frases, showTimer, onSubmit }: Props) {
  const [respostas, setRespostas] = useState<string[]>(frases.map(() => ''))
  const [current, setCurrent] = useState(0)
  const [showDicas, setShowDicas] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [ocrLoading, setOcrLoading] = useState(false)
  const startRef = useRef(Date.now())
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!showTimer) return
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [showTimer])

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const frase = frases[current]

  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setOcrLoading(true)
    try {
      const { default: Tesseract } = await import('tesseract.js')
      const { data: { text } } = await Tesseract.recognize(file, 'kor')
      const next = [...respostas]
      next[current] = text.trim()
      setRespostas(next)
    } catch (err) {
      console.error('OCR error:', err)
    } finally {
      setOcrLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const next = () => {
    setShowDicas(false)
    if (current < frases.length - 1) {
      setCurrent(c => c + 1)
    }
  }

  const allAnswered = respostas.every(r => r.trim())

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-0">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PencilIcon size={20} />
            <h1 className="font-ui font-semibold text-ink">Produção · Parte 2</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-ui text-sm text-ink/40">{current + 1}/{frases.length}</span>
            {showTimer && <span className="font-ui text-sm text-ink/40 tabular-nums">{fmt(elapsed)}</span>}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-line rounded-full mb-6">
          <div
            className="h-1 bg-vermillion rounded-full transition-all"
            style={{ width: `${((current + 1) / frases.length) * 100}%` }}
          />
        </div>

        {/* Current sentence */}
        <div className="bg-white rounded-2xl p-5 mb-4 border border-line">
          <p className="font-ui text-xs uppercase tracking-wider text-ink/50 mb-2">Traduz para coreano:</p>
          <p className="font-ui text-xl font-medium text-ink">{frase.pt_original}</p>
          {frase.estrutura_foco && (
            <p className="text-xs text-gold font-ui mt-2">Foco: {frase.estrutura_foco}</p>
          )}
        </div>

        {/* Dicas */}
        {frase.dicas.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowDicas(d => !d)}
              className="text-xs text-ink/40 font-ui underline"
            >
              {showDicas ? 'Esconder dicas' : 'Mostrar dicas'}
            </button>
            {showDicas && (
              <div className="mt-2 flex flex-wrap gap-2">
                {frase.dicas.map((d, i) => (
                  <span key={i} className="text-xs font-serif px-2 py-1 bg-gold/10 text-gold rounded-lg">{d}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="relative mb-4">
          <textarea
            value={respostas[current]}
            onChange={e => {
              const next = [...respostas]
              next[current] = e.target.value
              setRespostas(next)
            }}
            rows={3}
            placeholder="한국어로 쓰세요…"
            className="w-full rounded-xl border border-line bg-white p-3 pr-12 font-serif text-lg text-ink focus:outline-none focus:border-gold resize-none"
            lang="ko"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={ocrLoading}
            className="absolute right-3 bottom-3 text-ink/30 hover:text-ink/60 transition-colors"
            title="Foto de manuscrito"
          >
            {ocrLoading ? <span className="text-xs font-ui">OCR…</span> : <CameraIcon size={20} />}
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleOCR}
        />

        {/* Navigation */}
        <div className="flex gap-3">
          {current < frases.length - 1 ? (
            <button
              onClick={next}
              className="flex-1 py-4 rounded-2xl bg-ink text-white font-ui font-semibold active:scale-95 transition-all"
            >
              Próxima frase →
            </button>
          ) : (
            <button
              onClick={() => onSubmit(respostas)}
              disabled={!allAnswered}
              className="flex-1 py-4 rounded-2xl bg-vermillion text-white font-ui font-semibold disabled:opacity-40 active:scale-95 transition-all"
            >
              Submeter todas
            </button>
          )}
        </div>

        {/* Mini list of all answers */}
        <div className="mt-6 space-y-2">
          {frases.map((f, i) => (
            <div
              key={i}
              onClick={() => setCurrent(i)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                i === current ? 'border-gold bg-gold/5' : 'border-line bg-white'
              }`}
            >
              <p className="text-xs text-ink/50 font-ui">{f.pt_original}</p>
              {respostas[i] ? (
                <p className="text-sm font-serif text-ink mt-1">{respostas[i]}</p>
              ) : (
                <p className="text-xs text-ink/20 font-ui mt-1">—</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
