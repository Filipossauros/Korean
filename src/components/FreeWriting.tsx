import { useState } from 'react'
import { correctFreeWriting } from '../api/anthropic'
import { PencilIcon, CheckIcon } from './Icons'
import { useT } from '../lib/i18n'

interface Props {
  nivel: string
  tema: string
  onDone: (texto: string, correcao: string, estruturas_usadas: string[], estruturas_espontaneas: string[]) => void
}

export function FreeWriting({ nivel, tema, onDone }: Props) {
  const t = useT()
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    correcao: string
    estruturas_usadas: string[]
    estruturas_espontaneas: string[]
    erros: { original: string; correcto: string; nota: string }[]
    nota_geral: string
  } | null>(null)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!texto.trim()) return
    setLoading(true)
    setError('')
    try {
      const r = await correctFreeWriting(tema, texto, nivel)
      setResult(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao corrigir')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-0">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <PencilIcon size={20} />
          <h1 className="font-ui font-semibold text-fg">{t('session.freeWriting')}</h1>
        </div>

        <div className="bg-gold/10 rounded-2xl p-4 border border-gold/20 mb-6">
          <p className="text-xs text-gold font-ui uppercase tracking-wide mb-1">{t('fw.theme')}</p>
          <p className="font-serif text-lg text-fg">{tema}</p>
        </div>

        {!result ? (
          <>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              rows={8}
              placeholder="한국어로 자유롭게 쓰세요…"
              className="w-full rounded-xl border border-line bg-surface p-4 font-serif text-lg text-fg focus:outline-none focus:border-gold resize-none mb-4"
              lang="ko"
            />
            {error && <p className="text-vermillion text-sm font-ui mb-3">{error}</p>}
            <button
              onClick={submit}
              disabled={loading || !texto.trim()}
              className="w-full py-4 rounded-2xl bg-vermillion text-white font-ui font-semibold disabled:opacity-40"
            >
              {loading ? t('session.correcting') : t('fw.submit')}
            </button>
          </>
        ) : (
          <div className="space-y-4">
            {/* Nota geral */}
            <div className="bg-jade/10 rounded-2xl p-4 border border-jade/20">
              <CheckIcon size={16} />
              <p className="font-ui text-sm text-jade mt-1">{result.nota_geral}</p>
            </div>

            {/* Corrected text */}
            <div className="bg-surface rounded-2xl p-4 border border-line">
              <p className="text-xs text-fg/40 font-ui mb-2">{t('fw.correctedText')}</p>
              <p className="font-serif text-base text-fg">{result.correcao}</p>
            </div>

            {/* Structures used spontaneously */}
            {result.estruturas_espontaneas.length > 0 && (
              <div className="bg-surface rounded-2xl p-4 border border-jade/30">
                <p className="text-xs text-jade font-ui uppercase tracking-wide mb-2">{t('fw.spontaneous')}</p>
                <div className="flex flex-wrap gap-2">
                  {result.estruturas_espontaneas.map(e => (
                    <span key={e} className="font-serif text-sm px-2 py-1 bg-jade/10 text-jade rounded-lg">{e}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {result.erros.length > 0 && (
              <div className="bg-surface rounded-2xl p-4 border border-line">
                <p className="text-xs text-fg/40 font-ui mb-3">{t('fw.corrections')}</p>
                <div className="space-y-2">
                  {result.erros.map((e, i) => (
                    <div key={i} className="text-sm">
                      <span className="line-through text-vermillion font-serif">{e.original}</span>
                      {' → '}
                      <span className="text-jade font-serif">{e.correcto}</span>
                      {e.nota && <p className="text-xs text-fg/40 font-ui mt-0.5">{e.nota}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => onDone(texto, result.correcao, result.estruturas_usadas, result.estruturas_espontaneas)}
              className="w-full py-4 rounded-2xl bg-ink text-white font-ui font-semibold"
            >
              {t('corr.finish')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
