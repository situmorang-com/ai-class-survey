<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { cubicOut, elasticOut } from 'svelte/easing';
	import { tweened } from 'svelte/motion';
	import type { PageData } from './$types';
	import type { Stats } from '$lib/server/stats';

	let { data }: { data: PageData } = $props();
	// strip protocol for cleaner display
	const displayUrl = $derived(data.surveyUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''));
	/* eslint-disable svelte/no-state-referenced-locally */
	// svelte-ignore state_referenced_locally
	let stats = $state<Stats>(data.stats);
	let connected = $state(false);
	let pulse = $state(0);
	let es: EventSource | null = null;

	// tweened counters for animated count-up — initial values are intentionally snapshot
	// svelte-ignore state_referenced_locally
	const tStarted = tweened(stats.counters.started, { duration: 600, easing: cubicOut });
	// svelte-ignore state_referenced_locally
	const tCompleted = tweened(stats.counters.completed, { duration: 600, easing: cubicOut });
	// svelte-ignore state_referenced_locally
	const tLinkedin = tweened(stats.counters.linkedin, { duration: 600, easing: cubicOut });
	// svelte-ignore state_referenced_locally
	const tMentor = tweened(stats.counters.mentor, { duration: 600, easing: cubicOut });

	function updateTweens(s: Stats) {
		tStarted.set(s.counters.started);
		tCompleted.set(s.counters.completed);
		tLinkedin.set(s.counters.linkedin);
		tMentor.set(s.counters.mentor);
	}

	onMount(() => {
		updateTweens(stats);
		es = new EventSource('/admin/live/stream');
		es.onopen = () => (connected = true);
		es.onerror = () => (connected = false);
		es.onmessage = (e) => {
			try {
				const next = JSON.parse(e.data) as Stats;
				stats = next;
				updateTweens(next);
				pulse++;
			} catch {
				/* ignore */
			}
		};
	});
	onDestroy(() => es?.close());

	const maxOf = (xs: { count: number }[]) => Math.max(1, ...xs.map((x) => x.count));

	// derived metrics
	const pythonProf = $derived(
		stats.pythonDist.filter((x) => ['p12', 'pmax'].includes(x.id)).reduce((a, b) => a + b.count, 0)
	);
	const pythonZero = $derived(stats.pythonDist.find((x) => x.id === 'p0')?.count ?? 0);
	const practicalFans = $derived(stats.formatDist.find((x) => x.id === 'projects')?.count ?? 0);

	function timeAgo(iso: string): string {
		const diff = Date.now() - new Date(iso + 'Z').getTime();
		const s = Math.floor(diff / 1000);
		if (s < 10) return 'baru saja';
		if (s < 60) return `${s}d lalu`;
		const m = Math.floor(s / 60);
		if (m < 60) return `${m}m lalu`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h}j lalu`;
		return new Date(iso + 'Z').toLocaleDateString();
	}

	// re-render time-ago every 5s
	let tick = $state(0);
	let interval: ReturnType<typeof setInterval>;
	onMount(() => {
		interval = setInterval(() => tick++, 5000);
	});
	onDestroy(() => clearInterval(interval));
</script>

<svelte:head>
	<title>Live Dashboard · Kuesioner Kelas AI</title>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<div class="blob b1"></div>
<div class="blob b2"></div>
<div class="blob b3"></div>

<header class="bar">
	<div class="brand">
		<span class="dot" class:live={connected}></span>
		<span class="lbl">{connected ? 'LIVE' : 'CONNECTING…'}</span>
		<h1>Kuesioner Kelas AI</h1>
	</div>
	<div class="bar-actions">
		<a class="back" href="/admin">← admin</a>
	</div>
</header>

<main>
	<!-- Scan to join banner -->
	<section class="join" in:fly={{ y: -20, duration: 500, easing: cubicOut }}>
		<div class="qr">
			{@html data.qrSvg}
		</div>
		<div class="join-text">
			<div class="join-eyebrow">📱 Scan untuk ikutan</div>
			<div class="join-url">{displayUrl}</div>
			<div class="join-sub">Buka kamera HP kamu, arahkan ke QR — atau ketik link di atas.</div>
		</div>
	</section>

	<!-- Top funnel cards -->
	<section class="cards">
		{#each [
			{ key: 'started', label: 'Mulai isi', n: $tStarted, max: stats.counters.started, sub: 'mahasiswa membuka & klik Mulai', emoji: '🚀', color: 'a' },
			{ key: 'completed', label: 'Selesai', n: $tCompleted, max: stats.counters.completed, sub: `${stats.completionRate}% completion rate`, emoji: '🎯', color: 'b' },
			{ key: 'linkedin', label: 'Klik LinkedIn', n: $tLinkedin, max: stats.counters.linkedin, sub: `${stats.linkedinRate}% dari yang selesai`, emoji: '💼', color: 'c' },
			{ key: 'mentor', label: 'Klik Mentorship', n: $tMentor, max: stats.counters.mentor, sub: `${stats.mentorRate}% dari yang selesai`, emoji: '🔥', color: 'd' }
		] as c (c.key)}
			<div class="card big {c.color}" in:fly={{ y: 20, duration: 400 }}>
				{#key pulse + ':' + c.key + ':' + c.max}
					<div class="emoji" in:scale={{ duration: 500, easing: elasticOut, start: 0.6 }}>{c.emoji}</div>
				{/key}
				<div class="big-num">{Math.round(c.n)}</div>
				<div class="big-label">{c.label}</div>
				<div class="big-sub">{c.sub}</div>
			</div>
		{/each}
	</section>

	<!-- Quick insights row -->
	<section class="insights">
		<div class="insight">
			<div class="i-emoji">🐍</div>
			<div>
				<div class="i-num">{pythonProf}</div>
				<div class="i-label">sudah mahir Python (6+ bulan)</div>
			</div>
		</div>
		<div class="insight">
			<div class="i-emoji">🐣</div>
			<div>
				<div class="i-num">{pythonZero}</div>
				<div class="i-label">belum pernah pakai Python</div>
			</div>
		</div>
		<div class="insight">
			<div class="i-emoji">🔨</div>
			<div>
				<div class="i-num">{practicalFans}</div>
				<div class="i-label">suka belajar lewat praktik / project</div>
			</div>
		</div>
		<div class="insight">
			<div class="i-emoji">⭐</div>
			<div>
				<div class="i-num">{stats.avgScore}</div>
				<div class="i-label">rata-rata skor aptitude</div>
			</div>
		</div>
	</section>

	<!-- Charts grid -->
	<section class="grid">
		<div class="panel">
			<h2>🐍 Pengalaman Python</h2>
			<div class="bars">
				{#each stats.pythonDist as o (o.id)}
					{@const max = maxOf(stats.pythonDist)}
					<div class="bar-row">
						<div class="bar-label"><span>{o.emoji}</span> {o.label}</div>
						<div class="bar-track">
							<div class="bar-fill py" style="width: {(o.count / max) * 100}%"></div>
						</div>
						<div class="bar-num">{o.count}</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="panel">
			<h2>📚 Cara belajar favorit</h2>
			<div class="bars">
				{#each stats.formatDist as o (o.id)}
					{@const max = maxOf(stats.formatDist)}
					<div class="bar-row">
						<div class="bar-label"><span>{o.emoji}</span> {o.label}</div>
						<div class="bar-track">
							<div class="bar-fill fmt" style="width: {(o.count / max) * 100}%"></div>
						</div>
						<div class="bar-num">{o.count}</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="panel">
			<h2>✨ Minat AI terpopuler</h2>
			{#if stats.topInterests.length === 0}
				<p class="empty">Belum ada data.</p>
			{:else}
				<div class="bars">
					{#each stats.topInterests as o (o.id)}
						{@const max = maxOf(stats.topInterests)}
						<div class="bar-row">
							<div class="bar-label"><span>{o.emoji}</span> {o.label}</div>
							<div class="bar-track">
								<div class="bar-fill int" style="width: {(o.count / max) * 100}%"></div>
							</div>
							<div class="bar-num">{o.count}</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="panel">
			<h2>🎯 Tujuan ambil kuliah</h2>
			{#if stats.topGoals.length === 0}
				<p class="empty">Belum ada data.</p>
			{:else}
				<div class="bars">
					{#each stats.topGoals as o (o.id)}
						{@const max = maxOf(stats.topGoals)}
						<div class="bar-row">
							<div class="bar-label"><span>{o.emoji}</span> {o.label}</div>
							<div class="bar-track">
								<div class="bar-fill goal" style="width: {(o.count / max) * 100}%"></div>
							</div>
							<div class="bar-num">{o.count}</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="panel">
			<h2>📊 Sebaran skor aptitude</h2>
			<div class="score-buckets">
				{#each stats.scoreBuckets as b}
					{@const total = stats.scoreBuckets.reduce((a, c) => a + c.count, 0) || 1}
					<div class="sb">
						<div class="sb-num" style="color: {b.color}">{b.count}</div>
						<div class="sb-label">{b.label}</div>
						<div class="sb-bar">
							<div class="sb-fill" style="width: {(b.count / total) * 100}%; background: {b.color}"></div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="panel feed">
			<h2>🔴 Live feed</h2>
			{#if stats.recent.length === 0}
				<p class="empty">Belum ada yang submit. Bagikan linknya!</p>
			{:else}
				<ul>
					{#key tick}
						{#each stats.recent as r, i (r.created_at + r.display)}
							<li in:fly={{ y: -8, duration: 250, delay: i * 30 }}>
								<span class="who">{r.display}</span>
								<span class="meta">selesai · skor {r.score}</span>
								<span class="when">{timeAgo(r.created_at)}</span>
							</li>
						{/each}
					{/key}
				</ul>
			{/if}
		</div>
	</section>
</main>

<style>
	main {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1.5rem 3rem;
	}

	.bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1.5rem;
		max-width: 1400px;
		margin: 0 auto;
	}
	.brand { display: flex; align-items: center; gap: 0.75rem; }
	.brand h1 {
		margin: 0;
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--muted);
	}
	.dot {
		width: 10px; height: 10px; border-radius: 50%;
		background: #555;
		box-shadow: 0 0 0 0 transparent;
	}
	.dot.live {
		background: #ff5470;
		animation: pulse 2s ease-out infinite;
	}
	@keyframes pulse {
		0% { box-shadow: 0 0 0 0 rgba(255, 84, 112, 0.7); }
		70% { box-shadow: 0 0 0 14px rgba(255, 84, 112, 0); }
		100% { box-shadow: 0 0 0 0 rgba(255, 84, 112, 0); }
	}
	.lbl {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: #ff5470;
	}
	.bar-actions a {
		color: var(--muted);
		text-decoration: none;
		font-size: 0.9rem;
	}
	.bar-actions a:hover { color: var(--text); }

	.join {
		display: flex;
		align-items: center;
		gap: 2rem;
		padding: 1.5rem 2rem;
		margin-bottom: 1.5rem;
		background: linear-gradient(135deg, rgba(180, 107, 255, 0.15), rgba(107, 230, 255, 0.1));
		border: 1px solid rgba(180, 107, 255, 0.3);
		border-radius: 24px;
		backdrop-filter: blur(20px);
		position: relative;
		overflow: hidden;
	}
	.join::before {
		content: '';
		position: absolute;
		inset: -1px;
		background: linear-gradient(120deg, transparent 40%, rgba(255, 255, 255, 0.08) 50%, transparent 60%);
		background-size: 200% 100%;
		animation: shimmer 6s linear infinite;
		pointer-events: none;
	}
	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -100% 0; }
	}
	.qr {
		flex-shrink: 0;
		background: white;
		padding: 0.75rem;
		border-radius: 16px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
		line-height: 0;
		display: flex;
	}
	.qr :global(svg) {
		width: 180px;
		height: 180px;
		display: block;
	}
	.join-text { flex: 1; min-width: 0; }
	.join-eyebrow {
		display: inline-block;
		padding: 0.3rem 0.8rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 999px;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		color: var(--text);
		margin-bottom: 0.75rem;
	}
	.join-url {
		font-size: clamp(2rem, 5vw, 3.4rem);
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.05;
		background: linear-gradient(90deg, #ffffff, #ffd86b, #ff6bd6, #ffffff);
		background-size: 200% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		animation: gradient-shift 5s ease infinite;
		word-break: break-all;
	}
	.join-sub {
		color: var(--muted);
		font-size: 0.95rem;
		margin-top: 0.5rem;
	}
	@media (max-width: 640px) {
		.join { flex-direction: column; text-align: center; gap: 1rem; padding: 1.25rem; }
		.qr :global(svg) { width: 160px; height: 160px; }
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	.card {
		background: var(--card);
		border: 1px solid var(--card-border);
		border-radius: 20px;
		padding: 1.5rem;
		backdrop-filter: blur(20px);
		text-align: center;
		position: relative;
		overflow: hidden;
	}
	.card.big::before {
		content: '';
		position: absolute; inset: 0;
		background: radial-gradient(circle at 50% 0%, currentColor 0%, transparent 60%);
		opacity: 0.12;
		pointer-events: none;
	}
	.card.a { color: #6be6ff; }
	.card.b { color: #6bffb4; }
	.card.c { color: #6b9aff; }
	.card.d { color: #ffd86b; }
	.emoji { font-size: 2.5rem; line-height: 1; }
	.big-num {
		font-size: clamp(2.5rem, 6vw, 4.5rem);
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.03em;
		margin-top: 0.25rem;
		color: var(--text);
		line-height: 1;
	}
	.big-label {
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: currentColor;
		margin-top: 0.5rem;
	}
	.big-sub {
		font-size: 0.8rem;
		color: var(--muted);
		margin-top: 0.35rem;
	}

	.insights {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	.insight {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		background: rgba(255,255,255,0.04);
		border: 1px solid var(--card-border);
		border-radius: 14px;
	}
	.i-emoji { font-size: 2rem; }
	.i-num {
		font-size: 1.8rem;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}
	.i-label { font-size: 0.82rem; color: var(--muted); margin-top: 0.2rem; }

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
		gap: 1rem;
	}
	.panel {
		background: var(--card);
		border: 1px solid var(--card-border);
		border-radius: 20px;
		padding: 1.5rem;
		backdrop-filter: blur(20px);
	}
	.panel h2 {
		margin: 0 0 1rem;
		font-size: 1.05rem;
		font-weight: 700;
	}
	.empty { color: var(--muted); font-size: 0.9rem; }

	.bars { display: flex; flex-direction: column; gap: 0.55rem; }
	.bar-row {
		display: grid;
		grid-template-columns: 1fr 2.5fr 2.5rem;
		gap: 0.75rem;
		align-items: center;
		font-size: 0.9rem;
	}
	.bar-label { color: var(--text); display: flex; gap: 0.4rem; align-items: center; }
	.bar-label span { font-size: 1.05rem; }
	.bar-track {
		background: rgba(255,255,255,0.06);
		border-radius: 999px;
		height: 14px;
		overflow: hidden;
	}
	.bar-fill {
		height: 100%;
		border-radius: 999px;
		transition: width 0.7s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 0 12px currentColor;
	}
	.bar-fill.py { background: linear-gradient(90deg, #6bffb4, #6be6ff); }
	.bar-fill.fmt { background: linear-gradient(90deg, #ffd86b, #ff9a5b); }
	.bar-fill.int { background: linear-gradient(90deg, #b46bff, #ff6bd6); }
	.bar-fill.goal { background: linear-gradient(90deg, #6b9aff, #b46bff); }
	.bar-num {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		color: var(--text);
	}

	.score-buckets {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 1rem;
	}
	.sb { text-align: center; }
	.sb-num {
		font-size: 2.5rem;
		font-weight: 800;
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}
	.sb-label {
		font-size: 0.78rem;
		color: var(--muted);
		margin: 0.25rem 0 0.5rem;
		font-weight: 600;
	}
	.sb-bar {
		height: 6px;
		background: rgba(255,255,255,0.06);
		border-radius: 999px;
		overflow: hidden;
	}
	.sb-fill {
		height: 100%;
		border-radius: 999px;
		transition: width 0.7s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.feed ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
	.feed li {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 0.75rem;
		align-items: baseline;
		padding: 0.6rem 0.8rem;
		background: rgba(255,255,255,0.03);
		border: 1px solid rgba(255,255,255,0.06);
		border-radius: 10px;
		font-size: 0.9rem;
	}
	.feed .who { font-weight: 600; }
	.feed .meta { color: var(--muted); font-size: 0.82rem; }
	.feed .when { color: var(--muted); font-size: 0.78rem; font-variant-numeric: tabular-nums; }
</style>
