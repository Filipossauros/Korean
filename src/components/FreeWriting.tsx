import { useState } from 'react'
import { correctFreeWriting } from '../api/anthropic'
import { PencilIcon, CheckIcon } from './Icons'
import { PageSplats } from './Splat'
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
    <div className="relative min-h-screen bg-paper pb-24 md:pb-0 overflow-hidden">
      <PageSplats />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="pop-sm tilt-l inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-1.5 text-jade">
            <PencilIcon size={18} />
            <span className="font-display text-xs">{t('session.freeWriting')}</span>
          </div>
        </div>

        <div className="pop tilt-r rounded-2xl bg-gold p-4 mb-6">
          <p className="font-display text-[11px] text-ink mb-1">{t('fw.theme')}</p>
          <p className="font-kr text-lg text-ink">{tema}</p>
        </div>

        {!result ? (
          <>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              rows={8}
              placeholder="한국어로 자유롭게 쓰세요…"
              className="pop w-full rounded-xl bg-surface p-4 font-serif text-lg text-fg focus:outline-none resize-none mb-4"
              lang="ko"
            />
            {error && <p className="text-vermillion text-sm font-ui font-bold mb-3">{error}</p>}
            <button
              onClick={submit}
              disabled={loading || !texto.trim()}
              className="pop pop-shadow-jade tilt-r w-full py-4 rounded-2xl bg-vermillion text-white font-display text-sm disabled:opacity-40 active:translate-x-[2px] active:translate-y-[2px] transition-transform"
            >
              {loading ? t('session.correcting') : t('fw.submit')}
            </button>
          </>
        ) : (
          <div className="space-y-4">
            {/* Nota geral */}
            <div className="pop rounded-2xl bg-jade p-4 text-ink">
              <CheckIcon size={18} />
              <p className="font-ui text-sm font-medium mt-1">{result.nota_geral}</p>
            </div>

            {/* Corrected text */}
            <div className="pop rounded-2xl bg-surface p-4">
              <p className="font-display text-[11px] text-fg/60 mb-2">{t('fw.correctedText')}</p>
              <p className="font-serif text-base text-fg">{result.correcao}</p>
            </div>

            {/* Structures used spontaneously */}
            {result.estruturas_espontaneas.length > 0 && (
              <div className="pop rounded-2xl bg-surface p-4">
                <p className="font-display text-[11px] text-jade mb-2">{t('fw.spontaneous')}</p>
                <div className="flex flex-wrap gap-2">
                  {result.estruturas_espontaneas.map(e => (
                    <span key={e} className="pop-sm font-serif text-sm px-2 py-1 bg-jade text-ink rounded-lg">{e}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {result.erros.length > 0 && (
              <div className="pop rounded-2xl bg-surface p-4">
                <p className="font-display text-[11px] text-fg/60 mb-3">{t('fw.corrections')}</p>
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
              className="pop w-full py-4 rounded-2xl bg-ink text-white font-display text-sm active:translate-x-[2px] active:translate-y-[2px] transition-transform"
            >
              {t('corr.finish')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
