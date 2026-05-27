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

// ── Migration: add `visible` column to existing tables ──
try {
  const cols = db.pragma('table_info(scripts)') as Array<{ name: string }>
  if (!cols.some((c) => c.name === 'visible')) {
    db.exec('ALTER TABLE scripts ADD COLUMN visible INTEGER NOT NULL DEFAULT 1')
    console.log('[db] migrated: scripts.visible column added')
  }
} catch { /* ignore */ }
try {
  const cols = db.pragma('table_info(templates)') as Array<{ name: string }>
  if (!cols.some((c) => c.name === 'visible')) {
    db.exec('ALTER TABLE templates ADD COLUMN visible INTEGER NOT NULL DEFAULT 1')
    console.log('[db] migrated: templates.visible column added')
  }
} catch { /* ignore */ }

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
    visible INTEGER NOT NULL DEFAULT 1,
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
    visible INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'developer', 'user')),
    api_key TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`)

const stmts = {
  scriptInsert: db.prepare(
    'INSERT INTO scripts (id, name, version, description, schema, entry_point, checksum, file_path, tags, changelog, downloads, visible, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)'
  ),
  scriptGetAll: db.prepare('SELECT * FROM scripts WHERE visible = 1 ORDER BY updated_at DESC'),
  scriptGetAllAdmin: db.prepare('SELECT * FROM scripts ORDER BY updated_at DESC'),
  scriptGetById: db.prepare('SELECT * FROM scripts WHERE id = ?'),
  scriptUpdate: db.prepare(
    'UPDATE scripts SET name=?, version=?, description=?, schema=?, entry_point=?, checksum=?, file_path=?, tags=?, changelog=?, updated_at=? WHERE id=?'
  ),
  scriptPatch: db.prepare(
    'UPDATE scripts SET visible=? WHERE id=?'
  ),
  scriptDelete: db.prepare('DELETE FROM scripts WHERE id = ?'),
  scriptIncrementDownloads: db.prepare('UPDATE scripts SET downloads = downloads + 1 WHERE id = ?'),

  templateInsert: db.prepare(
    'INSERT INTO templates (id, name, type, version, description, schema, checksum, downloads, visible, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)'
  ),
  templateGetAll: db.prepare('SELECT * FROM templates WHERE visible = 1 ORDER BY updated_at DESC'),
  templateGetAllAdmin: db.prepare('SELECT * FROM templates ORDER BY updated_at DESC'),
  templateGetById: db.prepare('SELECT * FROM templates WHERE id = ?'),
  templateUpdate: db.prepare(
    'UPDATE templates SET name=?, type=?, version=?, description=?, schema=?, checksum=?, updated_at=? WHERE id=?'
  ),
  templatePatch: db.prepare(
    'UPDATE templates SET visible=? WHERE id=?'
  ),
  templateDelete: db.prepare('DELETE FROM templates WHERE id = ?'),
  templateIncrementDownloads: db.prepare('UPDATE templates SET downloads = downloads + 1 WHERE id = ?'),

  userInsert: db.prepare('INSERT INTO users (id, username, password_hash, display_name, role, api_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'),
  userGetByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
  userGetByApiKey: db.prepare('SELECT * FROM users WHERE api_key = ?'),
  userGetById: db.prepare('SELECT * FROM users WHERE id = ?'),
  userGetAll: db.prepare('SELECT * FROM users ORDER BY created_at DESC'),
  userDelete: db.prepare('DELETE FROM users WHERE id = ?'),
  userUpdate: db.prepare('UPDATE users SET display_name=?, role=?, updated_at=? WHERE id=?'),
  userUpdateApiKey: db.prepare('UPDATE users SET api_key=?, updated_at=? WHERE id=?'),
  userCount: db.prepare('SELECT COUNT(*) as count FROM users'),
}

export { stmts }

export function getScriptsDir(): string {
  const dir = join(dataDir, 'uploads', 'scripts')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

// getTemplatesDir was removed — unused (no callers)
