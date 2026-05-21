import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ADMIN_COOKIE, checkPassword, isAdmin, sessionToken } from '$lib/server/auth';
import { db, type StoredResponse } from '$lib/server/db';
import { survey } from '$lib/survey';

export const load: PageServerLoad = async (event) => {
	if (!isAdmin(event)) return { authed: false as const };

	const rows = db
		.prepare(
			'SELECT id, name, email, whatsapp, score, created_at, payload FROM responses ORDER BY id DESC'
		)
		.all() as StoredResponse[];

	return {
		authed: true as const,
		survey,
		rows: rows.map((r) => ({
			id: r.id,
			name: r.name,
			email: r.email,
			whatsapp: r.whatsapp,
			score: r.score,
			created_at: r.created_at,
			answers: JSON.parse(r.payload) as Record<string, string[]>
		}))
	};
};

export const actions: Actions = {
	login: async (event) => {
		const form = await event.request.formData();
		const password = String(form.get('password') ?? '');
		if (!checkPassword(password)) return { error: 'wrong password' };
		event.cookies.set(ADMIN_COOKIE, sessionToken(), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: event.url.protocol === 'https:',
			maxAge: 60 * 60 * 24 * 7
		});
		throw redirect(303, '/admin');
	},
	logout: async (event) => {
		event.cookies.delete(ADMIN_COOKIE, { path: '/' });
		throw redirect(303, '/admin');
	},
	delete: async (event) => {
		if (!isAdmin(event)) throw redirect(303, '/admin');
		const form = await event.request.formData();
		const id = Number(form.get('id'));
		if (Number.isFinite(id)) db.prepare('DELETE FROM responses WHERE id = ?').run(id);
		return { ok: true };
	}
};
