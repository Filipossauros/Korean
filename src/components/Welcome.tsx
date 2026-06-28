import { DriveIcon } from './Icons'

interface Props {
  onLogin: () => void
  onSkip: () => void
}

export function Welcome({ onLogin, onSkip }: Props) {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <h1 className="font-serif text-4xl font-bold text-white mb-2">한글 일기</h1>
        <p className="font-ui text-white/50 text-sm mb-10">Korean Diary</p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="text-white/80 flex justify-center mb-3">
            <DriveIcon size={32} />
          </div>
          <h2 className="font-ui font-semibold text-white text-lg mb-2">Recuperar progresso</h2>
          <p className="font-ui text-white/50 text-sm leading-relaxed">
            Entra com a tua conta Google para verificar se já existe progresso guardado no Drive
            e continuar de onde paraste. A tua chave da API também é restaurada.
          </p>
        </div>

        <button
          onClick={onLogin}
          className="w-full py-4 rounded-2xl bg-white text-ink font-ui font-semibold flex items-center justify-center gap-3 active:scale-95 transition-all mb-3"
        >
          <DriveIcon size={18} />
          Entrar com Google
        </button>

        <button
          onClick={onSkip}
          className="w-full py-3 rounded-2xl text-white/50 font-ui text-sm active:scale-95 transition-all"
        >
          Começar sem ligar (offline)
        </button>
      </div>
    </div>
  )
}
