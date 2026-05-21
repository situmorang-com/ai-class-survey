<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type SortKey = 'id' | 'name' | 'score' | 'created_at';
	let sortKey = $state<SortKey>('score');
	let sortDir = $state<'asc' | 'desc'>('desc');
	let q = $state('');

	const rows = $derived.by(() => {
		if (!data.authed) return [];
		const needle = q.toLowerCase();
		const filtered = needle
			? data.rows.filter((r) =>
					[r.name, r.email, r.whatsapp].some((v) => (v ?? '').toLowerCase().includes(needle))
				)
			: data.rows;
		const sign = sortDir === 'asc' ? 1 : -1;
		return [...filtered].sort((a: any, b: any) => {
			const av = a[sortKey], bv = b[sortKey];
			if (av === bv) return 0;
			if (av == null) return 1;
			if (bv == null) return -1;
			return av > bv ? sign : -sign;
		});
	});

	function waLink(wa: string | null) {
		if (!wa) return '#';
		return `https://wa.me/${wa.replace(/[^\d]/g, '')}`;
	}

	function sortBy(k: SortKey) {
		if (sortKey === k) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		else { sortKey = k; sortDir = k === 'name' ? 'asc' : 'desc'; }
	}

	let expanded = $state<number | null>(null);

	function labelFor(qid: string, oid: string): string {
		if (!data.authed) return oid;
		const q = data.survey.questions.find((x) => x.id === qid);
		return q?.options.find((o) => o.id === oid)?.label ?? oid;
	}

	function scoreClass(s: number) {
		if (s >= 70) return 'high';
		if (s >= 40) return 'mid';
		return 'low';
	}
</script>

<svelte:head><title>Admin · Kuesioner AI</title></svelte:head>

<div class="blob b1"></div>
<div class="blob b2"></div>

<main>
	{#if !data.authed}
		<section class="card login" in:fly={{ y: 20 }}>
			<div class="emoji">🔒</div>
			<h1>Admin</h1>
			<form method="POST" action="?/login">
				<!-- svelte-ignore a11y_autofocus -->
				<input type="password" name="password" placeholder="kata sandi" autocomplete="current-password" autofocus />
				{#if form?.error}<p class="err">Kata sandi salah</p>{/if}
				<button type="submit" class="cta">Masuk</button>
			</form>
		</section>
	{:else}
		<header class="top" in:fade>
			<div>
				<h1>Jawaban Mahasiswa</h1>
				<p class="muted">{data.rows.length} total · diurutkan menurut {sortKey} {sortDir}</p>
			</div>
			<div class="actions">
				<input class="search" type="search" bind:value={q} placeholder="cari nama / email / WA…" />
				<a class="btn live-btn" href="/admin/live">🔴 Live</a>
				<a class="btn" href="/admin/export.xlsx">⬇ Ekspor .xlsx</a>
				<form method="POST" action="?/logout"><button class="btn ghost" type="submit">Keluar</button></form>
			</div>
		</header>

		{#if rows.length === 0}
			<div class="empty">Belum ada jawaban. Bagikan linknya!</div>
		{:else}
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th class="sortable" onclick={() => sortBy('id')}>#</th>
							<th class="sortable" onclick={() => sortBy('name')}>Nama</th>
							<th>Kontak</th>
							<th class="sortable" onclick={() => sortBy('score')}>Skor</th>
							<th class="sortable" onclick={() => sortBy('created_at')}>Waktu</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each rows as r (r.id)}
							<tr class:open={expanded === r.id}>
								<td>{r.id}</td>
								<td><strong>{r.name ?? '—'}</strong></td>
								<td class="contact-cell">
									{#if r.email}<a href="mailto:{r.email}" class="cl">✉ {r.email}</a>{/if}
									{#if r.whatsapp}<a href={waLink(r.whatsapp)} target="_blank" rel="noopener" class="cl wa">💬 {r.whatsapp}</a>{/if}
								</td>
								<td>
									<span class="pill {scoreClass(r.score)}">{r.score}</span>
								</td>
								<td class="muted">{new Date(r.created_at + 'Z').toLocaleString()}</td>
								<td class="row-actions">
									<button class="link" onclick={() => (expanded = expanded === r.id ? null : r.id)}>
										{expanded === r.id ? 'sembunyikan' : 'lihat'}
									</button>
									<form method="POST" action="?/delete" onsubmit={(e) => { if (!confirm('Hapus jawaban ini?')) e.preventDefault(); }}>
										<input type="hidden" name="id" value={r.id} />
										<button class="link danger" type="submit">hapus</button>
									</form>
								</td>
							</tr>
							{#if expanded === r.id}
								<tr class="detail" in:fade={{ duration: 150 }}>
									<td colspan="6">
										<div class="detail-grid">
											{#each data.survey.questions as q}
												<div class="qblock">
													<div class="qlabel">{q.emoji} {q.title}</div>
													<div class="picks">
														{#each r.answers[q.id] ?? [] as oid}
															<span class="chip">{labelFor(q.id, oid)}</span>
														{:else}
															<span class="muted">—</span>
														{/each}
													</div>
												</div>
											{/each}
										</div>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}
</main>

<style>
	main { max-width: 1100px; margin: 0 auto; padding: 2rem 1.25rem; }

	.login { max-width: 380px; margin: 4rem auto; text-align: center; background: var(--card); border: 1px solid var(--card-border); padding: 2rem; border-radius: 20px; backdrop-filter: blur(20px); }
	.login .emoji { font-size: 2.5rem; }
	.login input { width: 100%; padding: 0.85rem 1rem; margin: 1rem 0; border-radius: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--card-border); }
	.login input:focus { outline: none; border-color: var(--accent); }
	.err { color: #ff7a9e; font-size: 0.9rem; }

	.top { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
	.top h1 { margin: 0; font-size: 1.8rem; }
	.actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
	.search { padding: 0.55rem 0.85rem; border-radius: 10px; background: rgba(0,0,0,0.3); border: 1px solid var(--card-border); color: var(--text); }
	.search:focus { outline: none; border-color: var(--accent); }

	.btn { display: inline-flex; align-items: center; padding: 0.55rem 1rem; border-radius: 10px; background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: white; font-weight: 600; text-decoration: none; font-size: 0.9rem; }
	.btn.ghost { background: rgba(255,255,255,0.06); color: var(--text); }
	.btn.live-btn { background: linear-gradient(135deg, #ff5470, #ff8a5b); box-shadow: 0 6px 18px rgba(255, 84, 112, 0.35); }
	.cta { background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: white; padding: 0.8rem 1.4rem; border-radius: 999px; font-weight: 600; }

	.muted { color: var(--muted); }
	.empty { text-align: center; padding: 4rem; color: var(--muted); }

	.table-wrap { overflow-x: auto; background: var(--card); border: 1px solid var(--card-border); border-radius: 16px; backdrop-filter: blur(20px); }
	table { width: 100%; border-collapse: collapse; }
	th, td { padding: 0.85rem 1rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.06); }
	th { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); font-weight: 600; }
	.sortable { cursor: pointer; user-select: none; }
	.sortable:hover { color: var(--text); }
	tr.open { background: rgba(180,107,255,0.06); }
	tr.detail td { background: rgba(0,0,0,0.2); padding: 1.25rem; }

	.pill { display: inline-block; min-width: 38px; text-align: center; padding: 0.2rem 0.6rem; border-radius: 999px; font-weight: 700; font-size: 0.9rem; }
	.pill.high { background: rgba(107,255,180,0.18); color: #6bffb4; }
	.pill.mid { background: rgba(255,216,107,0.18); color: #ffd86b; }
	.pill.low { background: rgba(255,107,158,0.15); color: #ff9ab6; }

	.contact-cell { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.85rem; }
	.cl { color: var(--accent-3); text-decoration: none; }
	.cl:hover { text-decoration: underline; }
	.cl.wa { color: #6bffb4; }

	.row-actions { display: flex; gap: 0.75rem; align-items: center; }
	.row-actions form { display: inline; }
	.link { color: var(--accent-3); font-size: 0.85rem; }
	.link:hover { text-decoration: underline; }
	.link.danger { color: #ff7a9e; }

	.detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
	.qblock .qlabel { font-size: 0.85rem; color: var(--muted); margin-bottom: 0.4rem; }
	.picks { display: flex; flex-wrap: wrap; gap: 0.35rem; }
	.chip { background: rgba(180,107,255,0.18); border: 1px solid rgba(180,107,255,0.3); padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.82rem; }
</style>
