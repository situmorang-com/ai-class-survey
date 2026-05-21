import { EventEmitter } from 'node:events';
import { db } from './db';
import { survey } from '$lib/survey';

export const bus = new EventEmitter();
bus.setMaxListeners(100);

export type Stats = {
	counters: {
		started: number;
		completed: number;
		linkedin: number;
		mentor: number;
	};
	completionRate: number;
	linkedinRate: number;
	mentorRate: number;
	pythonDist: { id: string; label: string; emoji: string; count: number }[];
	formatDist: { id: string; label: string; emoji: string; count: number }[];
	topInterests: { id: string; label: string; emoji: string; count: number }[];
	topGoals: { id: string; label: string; emoji: string; count: number }[];
	scoreBuckets: { label: string; count: number; color: string }[];
	avgScore: number;
	recent: { display: string; score: number; created_at: string }[];
	updatedAt: string;
};

function maskName(name: string | null): string {
	if (!name) return 'Mahasiswa';
	const parts = name.trim().split(/\s+/);
	const first = parts[0];
	const lastInitial = parts.length > 1 ? parts[parts.length - 1][0].toUpperCase() + '.' : '';
	return [first, lastInitial].filter(Boolean).join(' ');
}

function countAcrossResponses(qid: string): Map<string, number> {
	const rows = db.prepare(`SELECT payload FROM responses`).all() as { payload: string }[];
	const counts = new Map<string, number>();
	for (const r of rows) {
		try {
			const a = JSON.parse(r.payload) as Record<string, string[]>;
			for (const opt of a[qid] ?? []) counts.set(opt, (counts.get(opt) ?? 0) + 1);
		} catch {
			/* ignore malformed */
		}
	}
	return counts;
}

function distForQuestion(qid: string) {
	const q = survey.questions.find((x) => x.id === qid);
	if (!q) return [];
	const counts = countAcrossResponses(qid);
	return q.options.map((o) => ({
		id: o.id,
		label: o.label,
		emoji: o.emoji,
		count: counts.get(o.id) ?? 0
	}));
}

function topN(qid: string, n: number) {
	return distForQuestion(qid)
		.filter((x) => x.count > 0)
		.sort((a, b) => b.count - a.count)
		.slice(0, n);
}

export function computeStats(): Stats {
	const ev = db
		.prepare(`SELECT type, COUNT(*) AS n FROM events GROUP BY type`)
		.all() as { type: string; n: number }[];
	const evMap = new Map(ev.map((r) => [r.type, r.n]));

	const completed = db.prepare(`SELECT COUNT(*) AS n FROM responses`).get() as { n: number };
	const started = Math.max(evMap.get('started') ?? 0, completed.n);

	const counters = {
		started,
		completed: completed.n,
		linkedin: evMap.get('linkedin_click') ?? 0,
		mentor: evMap.get('mentor_click') ?? 0
	};

	const completionRate = started > 0 ? Math.round((counters.completed / started) * 100) : 0;
	const linkedinRate = counters.completed > 0 ? Math.round((counters.linkedin / counters.completed) * 100) : 0;
	const mentorRate = counters.completed > 0 ? Math.round((counters.mentor / counters.completed) * 100) : 0;

	// score buckets
	const scoreRows = db.prepare(`SELECT score FROM responses`).all() as { score: number }[];
	const buckets = [
		{ label: '0–39', count: 0, color: '#ff9ab6' },
		{ label: '40–69', count: 0, color: '#ffd86b' },
		{ label: '70–100', count: 0, color: '#6bffb4' }
	];
	let sum = 0;
	for (const r of scoreRows) {
		sum += r.score;
		if (r.score >= 70) buckets[2].count++;
		else if (r.score >= 40) buckets[1].count++;
		else buckets[0].count++;
	}
	const avgScore = scoreRows.length ? Math.round(sum / scoreRows.length) : 0;

	const recent = (
		db
			.prepare(`SELECT name, score, created_at FROM responses ORDER BY id DESC LIMIT 8`)
			.all() as { name: string | null; score: number; created_at: string }[]
	).map((r) => ({ display: maskName(r.name), score: r.score, created_at: r.created_at }));

	return {
		counters,
		completionRate,
		linkedinRate,
		mentorRate,
		pythonDist: distForQuestion('python'),
		formatDist: distForQuestion('format'),
		topInterests: topN('interests', 5),
		topGoals: topN('goals', 5),
		scoreBuckets: buckets,
		avgScore,
		recent,
		updatedAt: new Date().toISOString()
	};
}

export function recordEvent(sessionId: string, type: string) {
	db.prepare(`INSERT OR IGNORE INTO events (session_id, type) VALUES (?, ?)`).run(sessionId, type);
	bus.emit('change');
}
