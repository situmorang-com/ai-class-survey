export type Contact = { name: string; email: string; whatsapp: string };

export function validateContact(c: Partial<Contact>): {
	ok: boolean;
	errors: Partial<Record<keyof Contact, string>>;
	cleaned?: Contact;
} {
	const errors: Partial<Record<keyof Contact, string>> = {};

	const name = (c.name ?? '').trim();
	if (name.length < 3) errors.name = 'Tulis nama lengkap kamu';
	else if (name.length > 80) errors.name = 'Nama terlalu panjang';
	else if (!/\s/.test(name)) errors.name = 'Tulis nama lengkap (nama depan dan belakang)';

	const email = (c.email ?? '').trim().toLowerCase();
	if (!email) errors.email = 'Email wajib diisi';
	else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Format email tidak valid';
	else if (email.length > 120) errors.email = 'Email terlalu panjang';

	// WhatsApp: accept +62..., 62..., or 08..., 7-15 digits after normalization
	const waRaw = (c.whatsapp ?? '').trim();
	const waDigits = waRaw.replace(/[\s\-().]/g, '');
	let whatsapp = '';
	if (!waRaw) {
		errors.whatsapp = 'Nomor WhatsApp wajib diisi';
	} else if (!/^(\+?\d){8,16}$/.test(waDigits)) {
		errors.whatsapp = 'Nomor WhatsApp tidak valid';
	} else {
		// normalize to +62 format for Indonesian numbers
		let n = waDigits.replace(/^\+/, '');
		if (n.startsWith('0')) n = '62' + n.slice(1);
		whatsapp = '+' + n;
	}

	const ok = Object.keys(errors).length === 0;
	return ok ? { ok, errors, cleaned: { name, email, whatsapp } } : { ok, errors };
}
