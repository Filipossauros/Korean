// Texto-para-voz coreano via Web Speech API (gratuito, embutido no browser).
export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function koreanVoices(): SpeechSynthesisVoice[] {
  if (!canSpeak()) return []
  return window.speechSynthesis.getVoices().filter(v => v.lang?.toLowerCase().startsWith('ko'))
}

export function hasKoreanVoice(): boolean {
  return koreanVoices().length > 0
}

if (canSpeak()) {
  // força o carregamento das vozes
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
}

interface SpeakOpts {
  voiceIndex?: number // escolher entre vozes coreanas (ex.: falante A vs B)
  rate?: number
  onend?: () => void
}

export function speakKorean(text: string, opts: SpeakOpts = {}) {
  if (!canSpeak() || !text.trim()) { opts.onend?.(); return }
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ko-KR'
  const voices = koreanVoices()
  if (voices.length) u.voice = voices[(opts.voiceIndex ?? 0) % voices.length]
  u.rate = opts.rate ?? 0.95
  if (opts.onend) u.onend = () => opts.onend?.()
  window.speechSynthesis.speak(u)
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel()
}
