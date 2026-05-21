import { error, type RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const PASSWORD = env.ADMIN_PASSWORD ?? 'changeme';
export const ADMIN_COOKIE = 'admin_session';

export function checkPassword(input: string): boolean {
	if (!input) return false;
	const a = Buffer.from(input);
	const b = Buffer.from(PASSWORD);
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
	return diff === 0;
}

export function sessionToken(): string {
	return Buffer.from(PASSWORD + '|v1').toString('base64url');
}

export function requireAdmin(event: RequestEvent) {
	const cookie = event.cookies.get(ADMIN_COOKIE);
	if (cookie !== sessionToken()) throw error(401, 'unauthorized');
}

export function isAdmin(event: RequestEvent): boolean {
	return event.cookies.get(ADMIN_COOKIE) === sessionToken();
}
