import { redirect } from '@sveltejs/kit';
import QRCode from 'qrcode';
import { isAdmin } from '$lib/server/auth';
import { computeStats } from '$lib/server/stats';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (!isAdmin(event)) throw redirect(303, '/admin');

	// QR points to survey root — uses ORIGIN env var in prod, falls back to request origin in dev
	const surveyUrl = `${event.url.origin}/`;
	const qrSvg = await QRCode.toString(surveyUrl, {
		type: 'svg',
		errorCorrectionLevel: 'M',
		margin: 1,
		color: { dark: '#1a0b3a', light: '#ffffff' }
	});

	return {
		stats: computeStats(),
		surveyUrl,
		qrSvg
	};
};
