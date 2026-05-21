import { json, error } from '@sveltejs/kit';
import { recordEvent } from '$lib/server/stats';
import type { RequestHandler } from './$types';

const ALLOWED = new Set(['started', 'linkedin_click', 'mentor_click']);

export const POST: RequestHandler = async ({ request }) => {
	let body: any;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'invalid json');
	}
	const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.slice(0, 64) : '';
	const type = typeof body?.type === 'string' ? body.type : '';
	if (!sessionId || !ALLOWED.has(type)) throw error(400, 'bad payload');

	recordEvent(sessionId, type);
	return json({ ok: true });
};
