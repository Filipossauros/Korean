import { useSettings } from './settings'
import type { Language } from './settings'

type Dict = Record<string, string>

const pt: Dict = {
  // nav
  'nav.home': 'Início', 'nav.vocab': 'Vocabulário', 'nav.vocabShort': 'Vocab',
  'nav.progress': 'Progresso', 'nav.chat': 'Conversa', 'nav.chatShort': 'Chat',
  'nav.settings': 'Definições', 'nav.todaySession': 'Sessão de hoje',
  // common
  'common.loading': 'A carregar…', 'common.back': '← Sair', 'common.retry': 'Tentar de novo',
  'common.save': 'Guardar definições', 'common.saved': 'Guardado ✓', 'common.cancel': 'Cancelar',
  'common.level': 'Nível', 'common.days': 'dias', 'common.total': 'total',
  // dashboard
  'dash.streak': 'Streak', 'dash.sessions': 'Sessões', 'dash.vocab': 'Vocab',
  'dash.toReview': 'para rever', 'dash.startToday': 'Começar sessão de hoje',
  'dash.doneToday': '✓ Sessão de hoje feita', 'dash.structures': 'Estruturas',
  'dash.mastered': 'dominadas', 'dash.inProgress': 'em progresso',
  'dash.reviewCardsToday': 'para rever hoje', 'dash.recent': 'Sessões recentes',
  'dash.firstSession': 'Começa a tua primeira sessão', 'dash.oneDayAtATime': 'Aprende coreano um dia de cada vez',
  // session
  'session.reading': 'Leitura · Parte 1', 'session.production': 'Produção · Parte 2',
  'session.freeWriting': 'Escrita livre · Parte 3', 'session.newVocab': 'Vocabulário novo',
  'session.grammarPoint': 'Ponto gramatical', 'session.text': 'Texto',
  'session.yourTranslation': 'A tua tradução', 'session.submitTranslation': 'Submeter tradução',
  'session.translateToKorean': 'Traduz para coreano:', 'session.focus': 'Foco',
  'session.showHints': 'Mostrar dicas', 'session.hideHints': 'Esconder dicas',
  'session.nextSentence': 'Próxima frase →', 'session.submitAll': 'Submeter todas',
  'session.generating': 'A gerar sessão com IA…', 'session.correcting': 'A corrigir…',
  // settings
  'settings.title': 'Definições', 'settings.apiKey': 'Anthropic API Key',
  'settings.apiKeyHint': 'Guardada apenas localmente. Nunca enviada a terceiros.',
  'settings.theme': 'Tema', 'settings.themeSystem': 'Sistema', 'settings.themeLight': 'Claro', 'settings.themeDark': 'Escuro',
  'settings.language': 'Idioma de aprendizagem', 'settings.model': 'Modelo de IA',
  'settings.romanization': 'Romanização', 'settings.romanizationHint': 'Mostrar pronúncia romanizada do Hangul',
  'settings.timer': 'Cronómetro', 'settings.timerHint': 'Mostrar tempo em cada parte da sessão',
  'settings.currentLevel': 'Nível atual', 'settings.setLevel': 'Definir nível',
  'settings.localData': 'Dados locais', 'settings.exportJson': 'Exportar JSON',
  'settings.importJson': 'Importar JSON', 'settings.exportAnki': 'Exportar Anki',
  // welcome
  'welcome.recover': 'Recuperar progresso',
  'welcome.recoverDesc': 'Entra com a tua conta Google para verificar se já existe progresso guardado no Drive e continuar de onde paraste. A tua chave da API também é restaurada.',
  'welcome.signIn': 'Entrar com Google', 'welcome.offline': 'Começar sem ligar (offline)',
}

const en: Dict = {
  'nav.home': 'Home', 'nav.vocab': 'Vocabulary', 'nav.vocabShort': 'Vocab',
  'nav.progress': 'Progress', 'nav.chat': 'Chat', 'nav.chatShort': 'Chat',
  'nav.settings': 'Settings', 'nav.todaySession': "Today's session",
  'common.loading': 'Loading…', 'common.back': '← Exit', 'common.retry': 'Try again',
  'common.save': 'Save settings', 'common.saved': 'Saved ✓', 'common.cancel': 'Cancel',
  'common.level': 'Level', 'common.days': 'days', 'common.total': 'total',
  'dash.streak': 'Streak', 'dash.sessions': 'Sessions', 'dash.vocab': 'Vocab',
  'dash.toReview': 'to review', 'dash.startToday': "Start today's session",
  'dash.doneToday': "✓ Today's session done", 'dash.structures': 'Structures',
  'dash.mastered': 'mastered', 'dash.inProgress': 'in progress',
  'dash.reviewCardsToday': 'to review today', 'dash.recent': 'Recent sessions',
  'dash.firstSession': 'Start your first session', 'dash.oneDayAtATime': 'Learn Korean one day at a time',
  'session.reading': 'Reading · Part 1', 'session.production': 'Production · Part 2',
  'session.freeWriting': 'Free writing · Part 3', 'session.newVocab': 'New vocabulary',
  'session.grammarPoint': 'Grammar point', 'session.text': 'Text',
  'session.yourTranslation': 'Your translation', 'session.submitTranslation': 'Submit translation',
  'session.translateToKorean': 'Translate to Korean:', 'session.focus': 'Focus',
  'session.showHints': 'Show hints', 'session.hideHints': 'Hide hints',
  'session.nextSentence': 'Next sentence →', 'session.submitAll': 'Submit all',
  'session.generating': 'Generating session with AI…', 'session.correcting': 'Correcting…',
  'settings.title': 'Settings', 'settings.apiKey': 'Anthropic API Key',
  'settings.apiKeyHint': 'Stored locally only. Never sent to third parties.',
  'settings.theme': 'Theme', 'settings.themeSystem': 'System', 'settings.themeLight': 'Light', 'settings.themeDark': 'Dark',
  'settings.language': 'Learning language', 'settings.model': 'AI model',
  'settings.romanization': 'Romanization', 'settings.romanizationHint': 'Show romanized Hangul pronunciation',
  'settings.timer': 'Timer', 'settings.timerHint': 'Show time on each session part',
  'settings.currentLevel': 'Current level', 'settings.setLevel': 'Set level',
  'settings.localData': 'Local data', 'settings.exportJson': 'Export JSON',
  'settings.importJson': 'Import JSON', 'settings.exportAnki': 'Export Anki',
  'welcome.recover': 'Recover progress',
  'welcome.recoverDesc': 'Sign in with your Google account to check for saved progress on Drive and continue where you left off. Your API key is restored too.',
  'welcome.signIn': 'Sign in with Google', 'welcome.offline': 'Start offline',
}

const dicts: Record<Language, Dict> = { pt, en }

export function translate(lang: Language, key: string): string {
  return dicts[lang][key] ?? pt[key] ?? key
}

export function useT() {
  const { language } = useSettings()
  return (key: string) => translate(language, key)
}

// Learning-language helpers (used by AI prompts).
export function targetLanguageName(lang: Language): string {
  return lang === 'en' ? 'English' : 'Português'
}
