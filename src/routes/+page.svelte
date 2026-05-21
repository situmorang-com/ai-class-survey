<script lang="ts">
	import { fly, fade, scale, slide } from 'svelte/transition';
	import { cubicOut, elasticOut, backOut } from 'svelte/easing';
	import { survey } from '$lib/survey';
	import { validateContact } from '$lib/validate';

	type Stage = 'intro' | 'contact' | 'questions' | 'submitting' | 'done' | 'error';

	let stage = $state<Stage>('intro');
	let name = $state('');
	let email = $state('');
	let whatsapp = $state('');
	let contactErrors = $state<Partial<Record<'name' | 'email' | 'whatsapp', string>>>({});
	let touched = $state<{ name: boolean; email: boolean; whatsapp: boolean }>({
		name: false,
		email: false,
		whatsapp: false
	});

	let current = $state(0);
	let answers = $state<Record<string, string[]>>({});
	let errorMsg = $state('');

	function checkContact() {
		const r = validateContact({ name, email, whatsapp });
		contactErrors = r.errors;
		return r.ok;
	}
	const contactValid = $derived.by(() => {
		return validateContact({ name, email, whatsapp }).ok;
	});

	function startQuestions() {
		touched = { name: true, email: true, whatsapp: true };
		if (!checkContact()) return;
		stage = 'questions';
	}

	const total = survey.questions.length;
	const q = $derived(survey.questions[current]);
	const selected = $derived(answers[q?.id] ?? []);
	const minOk = $derived(!q?.min || selected.length >= (q.min ?? 0));
	const progress = $derived(((current + (minOk ? 1 : 0)) / total) * 100);

	function toggle(optId: string) {
		const cur = answers[q.id] ?? [];
		let next: string[];
		if (q.singleBest) {
			next = cur.includes(optId) ? [] : [optId];
		} else {
			next = cur.includes(optId) ? cur.filter((x) => x !== optId) : [...cur, optId];
		}
		answers = { ...answers, [q.id]: next };
	}

	function next() {
		if (!minOk) return;
		if (current < total - 1) current++;
		else submit();
	}
	function back() {
		if (current > 0) current--;
		else stage = 'contact';
	}

	const LINKEDIN_URL = 'https://www.linkedin.com/in/situmorang/';
	const MENTORSHIP_URL = 'https://www.situmorang.com/mentorship';

	async function submit() {
		stage = 'submitting';
		try {
			const res = await fetch('/api/submit', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name, email, whatsapp, answers })
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.errors ? Object.values(body.errors).join(' · ') : 'Gagal mengirim');
			}
			stage = 'done';
			confettiBurst();
			window.open(LINKEDIN_URL, '_blank', 'noopener,noreferrer');
		} catch (e: any) {
			errorMsg = e?.message ?? 'Ada yang salah';
			stage = 'error';
		}
	}

	function openLinkedIn() {
		window.open(LINKEDIN_URL, '_blank', 'noopener,noreferrer');
	}
	function openMentorship() {
		window.open(MENTORSHIP_URL, '_blank', 'noopener,noreferrer');
	}

	let confetti = $state<{ x: number; c: string; r: number; d: number }[]>([]);
	function confettiBurst() {
		const colors = ['#ff6bd6', '#b46bff', '#6be6ff', '#ffd86b', '#6bffb4'];
		confetti = Array.from({ length: 90 }, (_, i) => ({
			x: Math.random() * 100,
			c: colors[i % colors.length],
			r: Math.random() * 360,
			d: Math.random() * 0.6
		}));
	}
</script>

<div class="blob b1"></div>
<div class="blob b2"></div>
<div class="blob b3"></div>

<main>
	{#if stage === 'intro'}
		<section class="card hero" in:fly={{ y: 30, duration: 600, easing: backOut }}>
			<div class="emoji-big" in:scale={{ duration: 700, easing: elasticOut, start: 0.3 }}>🤖✨</div>
			<h1>{survey.title}</h1>
			<p class="intro">{survey.intro}</p>
			<p class="meta">~ 2 menit • {total} pertanyaan • butuh data kontak singkat</p>
			<button class="cta" onclick={() => (stage = 'contact')}>
				<span>Mulai</span><span class="arrow">→</span>
			</button>
		</section>
	{:else if stage === 'contact'}
		<section class="card contact" in:fly={{ y: 30, duration: 500, easing: cubicOut }}>
			<div class="emoji-big">👋</div>
			<h2>Kenalan dulu yuk</h2>
			<p class="muted">Aku butuh kontak kamu biar bisa follow-up & kirim materi pribadi.</p>

			<div class="field">
				<label for="f-name">Nama lengkap</label>
				<input
					id="f-name"
					type="text"
					bind:value={name}
					onblur={() => { touched.name = true; checkContact(); }}
					oninput={() => touched.name && checkContact()}
					placeholder="contoh: Budi Santoso"
					autocomplete="name"
					class:err={touched.name && contactErrors.name}
				/>
				{#if touched.name && contactErrors.name}
					<p class="field-err" in:slide>{contactErrors.name}</p>
				{/if}
			</div>

			<div class="field">
				<label for="f-email">Email pribadi</label>
				<input
					id="f-email"
					type="email"
					bind:value={email}
					onblur={() => { touched.email = true; checkContact(); }}
					oninput={() => touched.email && checkContact()}
					placeholder="nama@email.com"
					autocomplete="email"
					inputmode="email"
					class:err={touched.email && contactErrors.email}
				/>
				{#if touched.email && contactErrors.email}
					<p class="field-err" in:slide>{contactErrors.email}</p>
				{/if}
			</div>

			<div class="field">
				<label for="f-wa">Nomor WhatsApp</label>
				<input
					id="f-wa"
					type="tel"
					bind:value={whatsapp}
					onblur={() => { touched.whatsapp = true; checkContact(); }}
					oninput={() => touched.whatsapp && checkContact()}
					placeholder="08xx xxxx xxxx atau +62xxx"
					autocomplete="tel"
					inputmode="tel"
					class:err={touched.whatsapp && contactErrors.whatsapp}
				/>
				{#if touched.whatsapp && contactErrors.whatsapp}
					<p class="field-err" in:slide>{contactErrors.whatsapp}</p>
				{/if}
			</div>

			<p class="privacy">🔒 Data kamu hanya dipakai untuk kebutuhan kuliah & follow-up. Tidak dibagikan ke pihak lain.</p>

			<div class="row">
				<button class="ghost" onclick={() => (stage = 'intro')}>← kembali</button>
				<button class="cta" disabled={!contactValid} onclick={startQuestions}>
					<span>Lanjut</span><span class="arrow">→</span>
				</button>
			</div>
		</section>
	{:else if stage === 'questions'}
		<div class="progress-wrap">
			<div class="progress-track">
				<div class="progress-bar" style="width: {progress}%"></div>
			</div>
			<div class="progress-label">{current + 1} / {total}</div>
		</div>

		{#key current}
			<section class="card question-card" in:fly={{ x: 40, duration: 400, easing: cubicOut }}>
				<div class="q-head">
					<span class="q-emoji" in:scale={{ duration: 500, easing: elasticOut, start: 0.4 }}>{q.emoji}</span>
					<h2>{q.title}</h2>
					{#if q.subtitle}<p class="muted">{q.subtitle}</p>{/if}
				</div>

				<div class="options">
					{#each q.options as opt, i (opt.id)}
						<button
							type="button"
							class="opt"
							class:on={selected.includes(opt.id)}
							onclick={() => toggle(opt.id)}
							in:fly={{ y: 16, duration: 320, delay: i * 35, easing: cubicOut }}
						>
							<span class="opt-emoji">{opt.emoji}</span>
							<span class="opt-label">{opt.label}</span>
							<span class="check" aria-hidden="true">
								{#if selected.includes(opt.id)}
									<span in:scale={{ duration: 280, easing: backOut, start: 0.2 }}>✓</span>
								{/if}
							</span>
						</button>
					{/each}
				</div>

				<div class="row">
					<button class="ghost" onclick={back}>← kembali</button>
					<button class="cta" disabled={!minOk} onclick={next}>
						<span>{current === total - 1 ? 'Kirim' : 'Lanjut'}</span>
						<span class="arrow">→</span>
					</button>
				</div>
				{#if !minOk && q.min}
					<p class="hint" in:slide>
						{q.singleBest ? 'pilih salah satu untuk lanjut' : `pilih minimal ${q.min} untuk lanjut`}
					</p>
				{/if}
			</section>
		{/key}
	{:else if stage === 'submitting'}
		<section class="card" in:fade>
			<div class="emoji-big spin">🌀</div>
			<h2>Lagi kirim jawaban kamu…</h2>
		</section>
	{:else if stage === 'done'}
		{@const firstName = name.split(' ')[0]}
		<section class="card done" in:scale={{ duration: 600, easing: elasticOut, start: 0.5 }}>
			<div class="emoji-big bounce">🎉</div>
			<h1>Makasih, {firstName}!</h1>
			<p>Jawaban kamu bakal aku pakai buat menyesuaikan kuliahnya. Sampai ketemu di kelas!</p>

			<div class="cta-block">
				<p class="block-intro">
					Satu langkah lagi — terhubung yuk di LinkedIn. Profil aku sudah aku bukain di tab baru,
					tinggal klik <strong>Hubungkan</strong> di sana.
				</p>
				<button class="cta linkedin" onclick={openLinkedIn}>
					<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
						<path d="M20.45 20.45h-3.55v-5.56c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.95v5.65H9.37V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.26 2.37 4.26 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/>
					</svg>
					<span>Hubungkan di LinkedIn</span>
				</button>
				<p class="ln-note">Tab nggak kebuka? Klik tombol di atas.</p>
			</div>

			<div class="cta-block mentor">
				<div class="mentor-badge">🔥 Buat yang serius</div>
				<h3>Mau belajar AI lebih intens?</h3>
				<p class="block-intro">
					Kalau kamu serius pengen mendalami AI di luar materi kuliah — aku buka program
					<strong>mentorship 1-on-1</strong>. Slot terbatas, khusus mahasiswa yang punya
					kemauan kuat untuk belajar.
				</p>
				<button class="cta mentorship" onclick={openMentorship}>
					<span>🚀 Cek program mentorship</span>
					<span class="arrow">→</span>
				</button>
			</div>
		</section>
		<div class="confetti">
			{#each confetti as p}
				<span class="c" style="left:{p.x}%; background:{p.c}; transform:rotate({p.r}deg); animation-delay:{p.d}s"></span>
			{/each}
		</div>
	{:else if stage === 'error'}
		<section class="card" in:fly={{ y: 20 }}>
			<div class="emoji-big">😬</div>
			<h2>Gagal mengirim</h2>
			<p class="muted">{errorMsg}</p>
			<button class="cta" onclick={submit}>Coba lagi</button>
		</section>
	{/if}
</main>

<style>
	main {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		gap: 1.5rem;
	}
	.card {
		width: 100%;
		max-width: 640px;
		background: var(--card);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid var(--card-border);
		border-radius: 24px;
		padding: 2.5rem 2rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
		text-align: center;
	}
	.hero h1 {
		background: linear-gradient(90deg, #ff6bd6, #b46bff, #6be6ff, #b46bff, #ff6bd6);
		background-size: 200% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		animation: gradient-shift 6s ease infinite;
	}
	h1 { font-size: clamp(1.8rem, 5vw, 2.6rem); margin: 0.5rem 0; letter-spacing: -0.02em; }
	h2 { font-size: clamp(1.3rem, 3.5vw, 1.7rem); margin: 0.25rem 0 0.5rem; font-weight: 700; }
	.emoji-big { font-size: 3.5rem; line-height: 1; margin-bottom: 0.5rem; }
	.intro { color: var(--muted); max-width: 480px; margin: 0.75rem auto; line-height: 1.5; }
	.meta { font-size: 0.85rem; color: var(--muted); opacity: 0.8; }
	.muted { color: var(--muted); }

	.cta {
		background: linear-gradient(135deg, var(--accent), var(--accent-2));
		color: white;
		padding: 0.9rem 1.8rem;
		border-radius: 999px;
		font-weight: 600;
		font-size: 1rem;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		box-shadow: 0 8px 24px rgba(180, 107, 255, 0.4);
		transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
		margin-top: 1rem;
	}
	.cta:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(255, 107, 214, 0.5); }
	.cta:active:not(:disabled) { transform: translateY(0) scale(0.98); }
	.cta:disabled { opacity: 0.4; cursor: not-allowed; filter: grayscale(0.4); }
	.cta .arrow { transition: transform 0.2s; }
	.cta:hover:not(:disabled) .arrow { transform: translateX(4px); }

	.ghost { color: var(--muted); padding: 0.7rem 1.2rem; border-radius: 999px; transition: color 0.2s, background 0.2s; margin-top: 1rem; }
	.ghost:hover { color: var(--text); background: rgba(255,255,255,0.06); }

	input {
		width: 100%;
		padding: 1rem 1.25rem;
		border-radius: 16px;
		background: rgba(0,0,0,0.25);
		border: 1px solid var(--card-border);
		font-size: 1.1rem;
		margin-top: 1rem;
		outline: none;
		transition: border-color 0.2s, box-shadow 0.2s;
	}
	input:focus { border-color: var(--accent); box-shadow: 0 0 0 4px rgba(180,107,255,0.2); }
	input::placeholder { color: rgba(176,168,200,0.5); }

	.row { display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; gap: 1rem; }

	.progress-wrap { width: 100%; max-width: 640px; display: flex; align-items: center; gap: 0.75rem; }
	.progress-track { flex: 1; height: 8px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; }
	.progress-bar {
		height: 100%;
		background: linear-gradient(90deg, var(--accent-3), var(--accent), var(--accent-2));
		border-radius: 999px;
		transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 0 12px rgba(180,107,255,0.6);
	}
	.progress-label { font-size: 0.85rem; color: var(--muted); font-variant-numeric: tabular-nums; }

	.question-card { text-align: left; }
	.q-head { text-align: center; margin-bottom: 1.25rem; }
	.q-emoji { display: inline-block; font-size: 2.5rem; margin-bottom: 0.5rem; }

	.options { display: grid; grid-template-columns: 1fr; gap: 0.6rem; }
	@media (min-width: 520px) { .options { grid-template-columns: 1fr 1fr; } }

	.opt {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.85rem 1rem;
		border-radius: 14px;
		background: rgba(255,255,255,0.04);
		border: 1.5px solid rgba(255,255,255,0.08);
		text-align: left;
		transition: transform 0.18s, background 0.2s, border-color 0.2s, box-shadow 0.2s;
	}
	.opt:hover { transform: translateY(-2px) scale(1.01); background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }
	.opt:active { transform: scale(0.98); }
	.opt.on {
		background: linear-gradient(135deg, rgba(180,107,255,0.25), rgba(255,107,214,0.25));
		border-color: var(--accent);
		box-shadow: 0 6px 20px rgba(180,107,255,0.3);
	}
	.opt-emoji { font-size: 1.4rem; flex-shrink: 0; }
	.opt-label { flex: 1; font-weight: 500; }
	.check {
		width: 22px; height: 22px; border-radius: 50%;
		display: flex; align-items: center; justify-content: center;
		background: rgba(255,255,255,0.06);
		font-size: 0.85rem; font-weight: 700; flex-shrink: 0;
		transition: background 0.2s;
	}
	.opt.on .check { background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: white; }

	.hint { text-align: center; font-size: 0.85rem; color: var(--accent-2); margin-top: 0.75rem; }

	.spin { animation: spin 1.2s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }
	.bounce { animation: bounce 1.4s ease-in-out infinite; }
	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-12px); }
	}

	.contact { text-align: left; }
	.contact .emoji-big, .contact h2, .contact > .muted { text-align: center; }
	.field { margin-top: 1rem; }
	.field label {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text);
		margin-bottom: 0.35rem;
		letter-spacing: 0.01em;
	}
	.field input {
		width: 100%;
		padding: 0.85rem 1rem;
		border-radius: 12px;
		background: rgba(0, 0, 0, 0.3);
		border: 1.5px solid var(--card-border);
		font-size: 1rem;
		outline: none;
		transition: border-color 0.2s, box-shadow 0.2s;
	}
	.field input:focus {
		border-color: var(--accent);
		box-shadow: 0 0 0 4px rgba(180, 107, 255, 0.18);
	}
	.field input.err {
		border-color: #ff7a9e;
		box-shadow: 0 0 0 4px rgba(255, 122, 158, 0.15);
	}
	.field-err {
		margin: 0.4rem 0 0;
		font-size: 0.82rem;
		color: #ff9ab6;
	}
	.privacy {
		text-align: center;
		font-size: 0.8rem;
		color: var(--muted);
		opacity: 0.85;
		margin-top: 1.25rem;
		line-height: 1.4;
	}

	.cta-block {
		margin-top: 1.75rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--card-border);
	}
	.block-intro { color: var(--muted); max-width: 460px; margin: 0 auto 1rem; line-height: 1.5; }
	.block-intro strong { color: var(--text); }
	.ln-note { font-size: 0.8rem; color: var(--muted); margin-top: 0.5rem; opacity: 0.7; }
	.cta.linkedin {
		background: linear-gradient(135deg, #0a66c2, #0077b5);
		box-shadow: 0 8px 24px rgba(10, 102, 194, 0.45);
	}
	.cta.linkedin:hover:not(:disabled) { box-shadow: 0 12px 32px rgba(10, 102, 194, 0.6); }
	.cta.linkedin svg { display: inline-block; }

	.cta-block.mentor {
		position: relative;
		margin-top: 2rem;
		padding: 1.5rem;
		border: 1px solid rgba(255, 216, 107, 0.3);
		border-radius: 18px;
		background: linear-gradient(135deg, rgba(255, 107, 214, 0.08), rgba(255, 216, 107, 0.08));
		overflow: hidden;
	}
	.cta-block.mentor::before {
		content: '';
		position: absolute;
		inset: -2px;
		background: linear-gradient(120deg, transparent 40%, rgba(255, 216, 107, 0.2) 50%, transparent 60%);
		background-size: 200% 100%;
		animation: shimmer 4s linear infinite;
		pointer-events: none;
	}
	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -100% 0; }
	}
	.mentor-badge {
		display: inline-block;
		padding: 0.25rem 0.7rem;
		background: linear-gradient(135deg, #ffd86b, #ff9a5b);
		color: #2a1a00;
		font-weight: 700;
		font-size: 0.75rem;
		border-radius: 999px;
		margin-bottom: 0.5rem;
		letter-spacing: 0.02em;
	}
	.cta-block.mentor h3 {
		margin: 0.25rem 0 0.5rem;
		font-size: 1.25rem;
		font-weight: 700;
	}
	.cta.mentorship {
		background: linear-gradient(135deg, #ff6bd6, #ffd86b);
		color: #2a0030;
		box-shadow: 0 10px 30px rgba(255, 107, 214, 0.4);
		font-weight: 700;
	}
	.cta.mentorship:hover:not(:disabled) {
		box-shadow: 0 14px 38px rgba(255, 216, 107, 0.5);
	}

	.confetti { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 10; }
	.confetti .c {
		position: absolute;
		top: -20px;
		width: 10px;
		height: 14px;
		border-radius: 2px;
		animation: fall 2.8s cubic-bezier(0.2, 0.7, 0.4, 1) forwards;
	}
	@keyframes fall {
		0% { transform: translateY(0) rotate(0); opacity: 1; }
		100% { transform: translateY(110vh) rotate(900deg); opacity: 0; }
	}
</style>
