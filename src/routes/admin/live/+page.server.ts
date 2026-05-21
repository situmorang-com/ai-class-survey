import { redirect } from '@sveltejs/kit';
import { isAdmin } from '$lib/server/auth';
import { computeStats } from '$lib/server/stats';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (!isAdmin(event)) throw redirect(303, '/admin');
	return { stats: computeStats() };
};
