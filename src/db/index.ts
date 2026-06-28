import { openDB } from 'idb'
import type { IDBPDatabase } from 'idb'
import type { Perfil, Sessao } from '../types'

const DB_NAME = 'hangeul-ilgi'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('perfil')) {
          db.createObjectStore('perfil', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('sessoes')) {
          db.createObjectStore('sessoes', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export const defaultPerfil: Perfil = {
  nivel_atual: '3A',
  nivel_seguinte: '3B',
  streak: 0,
  ultima_sessao: '',
  estruturas: [],
  vocabulario_visto: [],
  erros_recorrentes: [],
  sessoes_realizadas: 0,
}

export async function initDB() {
  await getDB()
}

export async function getPerfil(): Promise<Perfil> {
  const db = await getDB()
  const record = await db.get('perfil', 'main')
  return record ? record.data : { ...defaultPerfil }
}

export async function savePerfil(perfil: Perfil): Promise<void> {
  const db = await getDB()
  await db.put('perfil', { id: 'main', data: perfil })
}

export async function getSessoes(): Promise<Sessao[]> {
  const db = await getDB()
  const all = await db.getAll('sessoes')
  return all.sort((a, b) => b.data.localeCompare(a.data))
}

export async function saveSessao(sessao: Sessao): Promise<void> {
  const db = await getDB()
  await db.put('sessoes', sessao)
}

export async function deleteSessao(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('sessoes', id)
}

export async function exportAllData(): Promise<{ perfil: Perfil; sessoes: Sessao[]; backup_em: string }> {
  const [perfil, sessoes] = await Promise.all([getPerfil(), getSessoes()])
  return { perfil, sessoes, backup_em: new Date().toISOString() }
}

export async function importAllData(data: { perfil: Perfil; sessoes: Sessao[] }): Promise<void> {
  await savePerfil(data.perfil)
  for (const sessao of data.sessoes) {
    await saveSessao(sessao)
  }
}
