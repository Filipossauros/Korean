import { DriveIcon } from './Icons'
import { useT } from '../lib/i18n'

interface Props {
  onLogin: () => void
  onSkip: () => void
}

export function Welcome({ onLogin, onSkip }: Props) {
  const t = useT()
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <h1 className="font-serif text-4xl font-bold text-white mb-2">한글 일기</h1>
        <p className="font-ui text-white/50 text-sm mb-10">Korean Diary</p>

        <div className="bg-surface/5 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="text-white/80 flex justify-center mb-3">
            <DriveIcon size={32} />
          </div>
          <h2 className="font-ui font-semibold text-white text-lg mb-2">{t('welcome.recover')}</h2>
          <p className="font-ui text-white/50 text-sm leading-relaxed">
            {t('welcome.recoverDesc')}
          </p>
        </div>

        <button
          onClick={onLogin}
          className="w-full py-4 rounded-2xl bg-surface text-fg font-ui font-semibold flex items-center justify-center gap-3 active:scale-95 transition-all mb-3"
        >
          <DriveIcon size={18} />
          {t('welcome.signIn')}
        </button>

        <button
          onClick={onSkip}
          className="w-full py-3 rounded-2xl text-white/50 font-ui text-sm active:scale-95 transition-all"
        >
          {t('welcome.offline')}
        </button>
      </div>
    </div>
  )
}
