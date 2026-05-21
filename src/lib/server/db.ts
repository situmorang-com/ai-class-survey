import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { env } from '$env/dynamic/private';

const DB_PATH = env.DB_PATH ?? 'data/survey.db';
mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    whatsapp TEXT,
    session_id TEXT,
    score INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    payload TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(session_id, type)
  );

  CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
  CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
`);

// idempotent migrations for existing dbs
const cols = (db.prepare(`PRAGMA table_info(responses)`).all() as { name: string }[]).map((c) => c.name);
if (!cols.includes('score')) db.exec(`ALTER TABLE responses ADD COLUMN score INTEGER NOT NULL DEFAULT 0`);
if (!cols.includes('email')) db.exec(`ALTER TABLE responses ADD COLUMN email TEXT`);
if (!cols.includes('whatsapp')) db.exec(`ALTER TABLE responses ADD COLUMN whatsapp TEXT`);
if (!cols.includes('session_id')) db.exec(`ALTER TABLE responses ADD COLUMN session_id TEXT`);

export type StoredResponse = {
	id: number;
	name: string | null;
	email: string | null;
	whatsapp: string | null;
	session_id: string | null;
	score: number;
	created_at: string;
	payload: string;
};
