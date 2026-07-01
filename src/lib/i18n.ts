import { useSettings } from './settings'
import type { Language } from './settings'

type Dict = Record<string, string>

const pt: Dict = {
  // nav
  'nav.home': 'Início', 'nav.vocab': 'Vocabulário', 'nav.vocabShort': 'Vocab',
  'nav.progress': 'Progresso',
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
  'settings.modelCustom': 'Personalizado…', 'settings.modelHint': 'Escolhe um modelo ou escreve o id de um novo (ex.: claude-sonnet-5).',
  'settings.romanization': 'Romanização', 'settings.romanizationHint': 'Mostrar pronúncia romanizada do Hangul',
  'settings.timer': 'Cronómetro', 'settings.timerHint': 'Mostrar tempo em cada parte da sessão',
  'settings.currentLevel': 'Nível atual', 'settings.setLevel': 'Definir nível',
  'settings.localData': 'Dados locais', 'settings.exportJson': 'Exportar JSON',
  'settings.importJson': 'Importar JSON', 'settings.exportAnki': 'Exportar Anki',
  // welcome
  'welcome.recover': 'Recuperar progresso',
  'welcome.recoverDesc': 'Entra com a tua conta Google para verificar se já existe progresso guardado no Drive e continuar de onde paraste. A tua chave da API também é restaurada.',
  'welcome.signIn': 'Entrar com Google', 'welcome.offline': 'Começar sem ligar (offline)',
  // categorias de erro
  'cat.partícula': 'Partícula', 'cat.vocabulário': 'Vocabulário', 'cat.gramática': 'Gramática',
  'cat.tempo_verbal': 'Tempo verbal', 'cat.registo': 'Registo', 'cat.ordem_palavras': 'Ordem',
  // correção
  'corr.yourTranslation': 'A tua tradução:', 'corr.reference': 'Tradução de referência:',
  'corr.continueProduction': 'Continuar para produção',
  'corr.continueFree': 'Continuar para escrita livre', 'corr.skipFree': 'Saltar escrita livre',
  'corr.finish': 'Terminar sessão', 'corr.readingShort': 'Leitura', 'corr.productionShort': 'Produção',
  // escrita livre
  'fw.theme': 'Tema', 'fw.submit': 'Submeter', 'fw.correctedText': 'Texto corrigido:',
  'fw.spontaneous': 'Estruturas espontâneas ✓', 'fw.corrections': 'Correções:',
  // progresso
  'prog.totalSessions': 'Sessões totais', 'prog.vocabSeen': 'Vocabulário visto',
  'prog.vocabConsolidated': 'Vocab consolidada', 'prog.structMastered': 'Estruturas dominadas',
  'prog.inProgress': 'Em progresso', 'prog.currentStreak': 'Streak atual',
  'prog.scorePerSession': 'Pontuação por sessão', 'prog.avgTime': 'Tempo médio (min)',
  'prog.grammarStructures': 'Estruturas gramaticais', 'prog.mastered': 'Dominada',
  'prog.toWork': 'Por trabalhar', 'prog.need2': 'Faz pelo menos 2 sessões para ver gráficos',
  'prog.score': 'Pontuação', 'prog.time': 'Tempo',
  // vocabulário
  'vocab.title': 'Vocabulário SRS', 'vocab.tapToSee': 'toca para ver', 'vocab.allDone': 'Tudo em dia!',
  'vocab.noneToday': 'Sem cartões para hoje.', 'vocab.all': 'Todo o vocabulário',
  'vocab.none': 'Nenhum vocabulário ainda', 'vocab.doSession': 'Faz uma sessão para começar a aprender palavras',
  'vocab.wrong': 'Errei', 'vocab.right': 'Acertei', 'vocab.seen': 'visto',
  'vocab.reviewed': 'Revisaste {n} cartões.',
  // nav + sessão + dashboard + diálogo
  'nav.dialogue': 'Diálogos',
  'session.terminate': 'Terminar',
  'dash.continueSession': 'Continuar sessão',
  'dash.newSession': 'Nova sessão',
  'dash.listenDialogue': 'Ouvir diálogo',
  'dialogue.title': 'Diálogos', 'dialogue.generate': 'Gerar diálogo',
  'dialogue.generating': 'A gerar diálogo…', 'dialogue.playAll': '▶ Ouvir tudo',
  'dialogue.stop': '■ Parar', 'dialogue.newOne': 'Novo diálogo',
  'dialogue.noVoice': 'Este dispositivo não tem voz coreana instalada — o texto fica disponível na mesma.',
  'dialogue.intro': 'Gera um diálogo curto no teu nível, lê-o (com áudio de apoio) e testa a tua compreensão.',
  'dialogue.comprehension': 'Compreensão',
  'dialogue.check': 'Avaliar compreensão',
  'dialogue.answerAll': 'Responde a todas as perguntas primeiro.',
  'dialogue.showTranslation': 'Mostrar tradução',
  'dialogue.hideTranslation': 'Esconder tradução',
  'dialogue.locked': 'Responde às perguntas para desbloquear a tradução.',
  'dialogue.score': 'Acertaste',
  'dialogue.tryAgain': 'Repetir perguntas',
}

const en: Dict = {
  'nav.home': 'Home', 'nav.vocab': 'Vocabulary', 'nav.vocabShort': 'Vocab',
  'nav.progress': 'Progress',
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
  'settings.modelCustom': 'Custom…', 'settings.modelHint': 'Pick a model or type the id of a new one (e.g. claude-sonnet-5).',
  'settings.romanization': 'Romanization', 'settings.romanizationHint': 'Show romanized Hangul pronunciation',
  'settings.timer': 'Timer', 'settings.timerHint': 'Show time on each session part',
  'settings.currentLevel': 'Current level', 'settings.setLevel': 'Set level',
  'settings.localData': 'Local data', 'settings.exportJson': 'Export JSON',
  'settings.importJson': 'Import JSON', 'settings.exportAnki': 'Export Anki',
  'welcome.recover': 'Recover progress',
  'welcome.recoverDesc': 'Sign in with your Google account to check for saved progress on Drive and continue where you left off. Your API key is restored too.',
  'welcome.signIn': 'Sign in with Google', 'welcome.offline': 'Start offline',
  'cat.partícula': 'Particle', 'cat.vocabulário': 'Vocabulary', 'cat.gramática': 'Grammar',
  'cat.tempo_verbal': 'Tense', 'cat.registo': 'Register', 'cat.ordem_palavras': 'Word order',
  'corr.yourTranslation': 'Your translation:', 'corr.reference': 'Reference translation:',
  'corr.continueProduction': 'Continue to production',
  'corr.continueFree': 'Continue to free writing', 'corr.skipFree': 'Skip free writing',
  'corr.finish': 'Finish session', 'corr.readingShort': 'Reading', 'corr.productionShort': 'Production',
  'fw.theme': 'Topic', 'fw.submit': 'Submit', 'fw.correctedText': 'Corrected text:',
  'fw.spontaneous': 'Spontaneous structures ✓', 'fw.corrections': 'Corrections:',
  'prog.totalSessions': 'Total sessions', 'prog.vocabSeen': 'Vocabulary seen',
  'prog.vocabConsolidated': 'Vocab consolidated', 'prog.structMastered': 'Structures mastered',
  'prog.inProgress': 'In progress', 'prog.currentStreak': 'Current streak',
  'prog.scorePerSession': 'Score per session', 'prog.avgTime': 'Average time (min)',
  'prog.grammarStructures': 'Grammar structures', 'prog.mastered': 'Mastered',
  'prog.toWork': 'To work on', 'prog.need2': 'Do at least 2 sessions to see charts',
  'prog.score': 'Score', 'prog.time': 'Time',
  'vocab.title': 'SRS Vocabulary', 'vocab.tapToSee': 'tap to flip', 'vocab.allDone': 'All caught up!',
  'vocab.noneToday': 'No cards for today.', 'vocab.all': 'All vocabulary',
  'vocab.none': 'No vocabulary yet', 'vocab.doSession': 'Do a session to start learning words',
  'vocab.wrong': 'Got it wrong', 'vocab.right': 'Got it right', 'vocab.seen': 'seen',
  'vocab.reviewed': 'You reviewed {n} cards.',
  'nav.dialogue': 'Dialogues',
  'session.terminate': 'Finish',
  'dash.continueSession': 'Continue session',
  'dash.newSession': 'New session',
  'dash.listenDialogue': 'Listen to a dialogue',
  'dialogue.title': 'Dialogues', 'dialogue.generate': 'Generate dialogue',
  'dialogue.generating': 'Generating dialogue…', 'dialogue.playAll': '▶ Play all',
  'dialogue.stop': '■ Stop', 'dialogue.newOne': 'New dialogue',
  'dialogue.noVoice': "This device has no Korean voice installed — the text is still available.",
  'dialogue.intro': 'Generate a short dialogue at your level, read it (with audio support) and test your comprehension.',
  'dialogue.comprehension': 'Comprehension',
  'dialogue.check': 'Check comprehension',
  'dialogue.answerAll': 'Answer every question first.',
  'dialogue.showTranslation': 'Show translation',
  'dialogue.hideTranslation': 'Hide translation',
  'dialogue.locked': 'Answer the questions to unlock the translation.',
  'dialogue.score': 'You got',
  'dialogue.tryAgain': 'Retry questions',
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
