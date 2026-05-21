import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const DB_PATH = process.env.DB_PATH ?? 'data/survey.db';
mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    whatsapp TEXT,
    score INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    payload TEXT NOT NULL
  );
`);

// idempotent migrations
const cols = (db.prepare(`PRAGMA table_info(responses)`).all() as { name: string }[]).map((c) => c.name);
if (!cols.includes('score')) db.exec(`ALTER TABLE responses ADD COLUMN score INTEGER NOT NULL DEFAULT 0`);
if (!cols.includes('email')) db.exec(`ALTER TABLE responses ADD COLUMN email TEXT`);
if (!cols.includes('whatsapp')) db.exec(`ALTER TABLE responses ADD COLUMN whatsapp TEXT`);

export type StoredResponse = {
	id: number;
	name: string | null;
	email: string | null;
	whatsapp: string | null;
	score: number;
	created_at: string;
	payload: string;
};
