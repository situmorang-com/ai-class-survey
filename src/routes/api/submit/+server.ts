import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { survey, scoreResponse } from '$lib/survey';
import { validateContact } from '$lib/validate';
import { recordEvent } from '$lib/server/stats';
import type { RequestHandler } from './$types';

const validIds = new Map(survey.questions.map((q) => [q.id, new Set(q.options.map((o) => o.id))]));

export const POST: RequestHandler = async ({ request }) => {
	let body: any;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'invalid json');
	}

	const contact = validateContact({
		name: body?.name,
		email: body?.email,
		whatsapp: body?.whatsapp
	});
	if (!contact.ok || !contact.cleaned) {
		return json({ ok: false, errors: contact.errors }, { status: 400 });
	}

	const answers = body?.answers;
	if (!answers || typeof answers !== 'object') throw error(400, 'missing answers');

	const clean: Record<string, string[]> = {};
	for (const q of survey.questions) {
		const raw = answers[q.id];
		if (!Array.isArray(raw)) {
			if (q.min) throw error(400, `missing answer for ${q.id}`);
			clean[q.id] = [];
			continue;
		}
		const allowed = validIds.get(q.id)!;
		const picked = [...new Set(raw.filter((x) => typeof x === 'string' && allowed.has(x)))];
		if (q.min && picked.length < q.min) throw error(400, `not enough picks for ${q.id}`);
		clean[q.id] = picked;
	}

	const score = scoreResponse(clean);
	const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.slice(0, 64) : '';

	db.prepare(
		'INSERT INTO responses (name, email, whatsapp, session_id, score, payload) VALUES (?, ?, ?, ?, ?, ?)'
	).run(
		contact.cleaned.name,
		contact.cleaned.email,
		contact.cleaned.whatsapp,
		sessionId || null,
		score,
		JSON.stringify(clean)
	);

	if (sessionId) recordEvent(sessionId, 'completed');

	return json({ ok: true });
};
