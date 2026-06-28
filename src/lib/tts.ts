// Texto-para-voz coreano via Web Speech API (gratuito, embutido no browser).
export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

let koVoice: SpeechSynthesisVoice | null = null

function pickKoreanVoice(): SpeechSynthesisVoice | null {
  if (!canSpeak()) return null
  const voices = window.speechSynthesis.getVoices()
  koVoice = voices.find(v => v.lang?.toLowerCase().startsWith('ko')) ?? null
  return koVoice
}

if (canSpeak()) {
  pickKoreanVoice()
  window.speechSynthesis.onvoiceschanged = () => pickKoreanVoice()
}

export function speakKorean(text: string) {
  if (!canSpeak() || !text.trim()) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ko-KR'
  const voice = koVoice ?? pickKoreanVoice()
  if (voice) u.voice = voice
  u.rate = 0.95
  window.speechSynthesis.speak(u)
}
