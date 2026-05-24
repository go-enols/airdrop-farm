import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

const dataDir = join(process.cwd(), 'data')
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

const dbPath = join(dataDir, 'marketplace.db')

export const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS scripts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    schema TEXT NOT NULL DEFAULT '{}',
    entry_point TEXT NOT NULL DEFAULT '',
    checksum TEXT NOT NULL,
    file_path TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    changelog TEXT NOT NULL DEFAULT '',
    downloads INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0.0',
    description TEXT NOT NULL DEFAULT '',
    schema TEXT NOT NULL DEFAULT '{}',
    checksum TEXT NOT NULL DEFAULT '',
    downloads INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`)

const stmts = {
  scriptInsert: db.prepare(
    'INSERT INTO scripts (id, name, version, description, schema, entry_point, checksum, file_path, tags, changelog, downloads, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ),
  scriptGetAll: db.prepare('SELECT * FROM scripts ORDER BY updated_at DESC'),
  scriptGetById: db.prepare('SELECT * FROM scripts WHERE id = ?'),
  scriptUpdate: db.prepare(
    'UPDATE scripts SET name=?, version=?, description=?, schema=?, entry_point=?, checksum=?, file_path=?, tags=?, changelog=?, updated_at=? WHERE id=?'
  ),
  scriptDelete: db.prepare('DELETE FROM scripts WHERE id = ?'),
  scriptIncrementDownloads: db.prepare('UPDATE scripts SET downloads = downloads + 1 WHERE id = ?'),

  templateInsert: db.prepare(
    'INSERT INTO templates (id, name, type, version, description, schema, checksum, downloads, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ),
  templateGetAll: db.prepare('SELECT * FROM templates ORDER BY updated_at DESC'),
  templateGetById: db.prepare('SELECT * FROM templates WHERE id = ?'),
  templateUpdate: db.prepare(
    'UPDATE templates SET name=?, type=?, version=?, description=?, schema=?, checksum=?, updated_at=? WHERE id=?'
  ),
  templateDelete: db.prepare('DELETE FROM templates WHERE id = ?'),
  templateIncrementDownloads: db.prepare('UPDATE templates SET downloads = downloads + 1 WHERE id = ?'),
}

export { stmts }

export function getScriptsDir(): string {
  const dir = join(dataDir, 'uploads', 'scripts')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

// getTemplatesDir was removed — unused (no callers)
