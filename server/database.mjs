import { createClient } from '@libsql/client'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const schema = `
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY, handle TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, secret TEXT NOT NULL,
      institution TEXT, discoverable INTEGER NOT NULL DEFAULT 0, school_share INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS logins (
      token TEXT PRIMARY KEY, account TEXT NOT NULL REFERENCES accounts(id), expires INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS friends (
      low TEXT NOT NULL REFERENCES accounts(id), high TEXT NOT NULL REFERENCES accounts(id),
      sender TEXT NOT NULL REFERENCES accounts(id), accepted INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(low, high)
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY, account TEXT NOT NULL REFERENCES accounts(id), owner TEXT NOT NULL,
      target INTEGER NOT NULL, focused INTEGER NOT NULL DEFAULT 0, checked INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'running', revision INTEGER NOT NULL DEFAULT 0
    );
    CREATE UNIQUE INDEX IF NOT EXISTS single_session ON sessions(account) WHERE status <> 'finished';
    CREATE TABLE IF NOT EXISTS points (
      session TEXT NOT NULL REFERENCES sessions(id), revision INTEGER NOT NULL, time INTEGER NOT NULL,
      credited INTEGER NOT NULL, penalty INTEGER NOT NULL, PRIMARY KEY(session, revision)
    );
`

export function openDatabase(path) {
  const remote = path === undefined && process.env.TURSO_DATABASE_URL
  const token = process.env.TURSO_AUTH_TOKEN
  if ((remote && !token) || (process.env.VERCEL && !remote && path === undefined)) {
    throw new Error('Configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN for the hosted study API.')
  }
  const localPath = path ?? process.env.TUTORLY_DB ?? '.local/study.sqlite'
  if (!remote && localPath !== ':memory:') mkdirSync(dirname(localPath), { recursive: true, mode: 0o700 })
  const url = remote || (localPath === ':memory:' ? 'file::memory:' : pathToFileURL(resolve(localPath)).href)
  const db = createClient({ url, authToken: remote ? token : undefined })
  return db
}

export async function initializeDatabase(db) {
  await db.executeMultiple(schema)
}
