import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { db, type StoredResponse } from '$lib/server/db';
import { survey } from '$lib/survey';
import ExcelJS from 'exceljs';

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);

	const rows = db
		.prepare(
			'SELECT id, name, email, whatsapp, score, created_at, payload FROM responses ORDER BY id ASC'
		)
		.all() as StoredResponse[];

	const wb = new ExcelJS.Workbook();
	wb.creator = 'AI Course Survey';
	wb.created = new Date();

	// --- Responses sheet (wide format, one row per response) ---
	const ws = wb.addWorksheet('Responses');
	const columns: Partial<ExcelJS.Column>[] = [
		{ header: 'ID', key: 'id', width: 6 },
		{ header: 'Nama', key: 'name', width: 24 },
		{ header: 'Email', key: 'email', width: 28 },
		{ header: 'WhatsApp', key: 'whatsapp', width: 18 },
		{ header: 'Skor', key: 'score', width: 8 },
		{ header: 'Waktu', key: 'created_at', width: 20 }
	];
	for (const q of survey.questions) {
		columns.push({ header: q.title, key: q.id, width: 40 });
	}
	ws.columns = columns;

	for (const r of rows) {
		const ans = JSON.parse(r.payload) as Record<string, string[]>;
		const row: Record<string, any> = {
			id: r.id,
			name: r.name ?? '',
			email: r.email ?? '',
			whatsapp: r.whatsapp ?? '',
			score: r.score,
			created_at: r.created_at
		};
		for (const q of survey.questions) {
			row[q.id] = (ans[q.id] ?? [])
				.map((oid) => q.options.find((o) => o.id === oid)?.label ?? oid)
				.join(', ');
		}
		ws.addRow(row);
	}

	const header = ws.getRow(1);
	header.font = { bold: true };
	header.alignment = { vertical: 'middle' };
	ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
	ws.views = [{ state: 'frozen', ySplit: 1 }];

	// --- Tally sheet ---
	const tally = wb.addWorksheet('Tally');
	tally.columns = [
		{ header: 'Question', key: 'q', width: 40 },
		{ header: 'Option', key: 'o', width: 35 },
		{ header: 'Count', key: 'c', width: 10 },
		{ header: 'Percent', key: 'p', width: 12 }
	];
	const total = rows.length || 1;
	const parsed = rows.map((r) => JSON.parse(r.payload) as Record<string, string[]>);
	for (const q of survey.questions) {
		for (const o of q.options) {
			const count = parsed.reduce((n, a) => n + ((a[q.id] ?? []).includes(o.id) ? 1 : 0), 0);
			tally.addRow({ q: q.title, o: o.label, c: count, p: `${Math.round((count / total) * 100)}%` });
		}
	}
	tally.getRow(1).font = { bold: true };

	const buf = await wb.xlsx.writeBuffer();
	const fname = `survey-${new Date().toISOString().slice(0, 10)}.xlsx`;

	return new Response(buf as ArrayBuffer, {
		headers: {
			'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'content-disposition': `attachment; filename="${fname}"`
		}
	});
};
