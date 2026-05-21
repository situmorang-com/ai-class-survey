export type Option = { id: string; label: string; emoji: string; weight?: number };
export type Question = {
	id: string;
	title: string;
	subtitle?: string;
	emoji: string;
	min?: number;
	scored?: boolean;
	/** if true, scoring takes only the highest-weight pick (use min:1 to enforce single pick UX-wise) */
	singleBest?: boolean;
	options: Option[];
};

export const survey: { title: string; intro: string; questions: Question[] } = {
	title: 'Kuesioner Kuliah AI — Kenalan Dulu',
	intro:
		'Klik aja yang sesuai sama kamu. Nggak ada jawaban benar atau salah — ini buat bantu aku menyesuaikan materi kuliah.',
	questions: [
		{
			id: 'interests',
			title: 'Bidang AI mana yang paling bikin kamu excited?',
			subtitle: 'Pilih semua yang bikin penasaran.',
			emoji: '✨',
			min: 1,
			options: [
				{ id: 'llms', label: 'LLM & chatbot', emoji: '💬' },
				{ id: 'vision', label: 'Computer vision', emoji: '👁️' },
				{ id: 'audio', label: 'Speech & audio', emoji: '🎙️' },
				{ id: 'robotics', label: 'Robotika', emoji: '🤖' },
				{ id: 'agents', label: 'AI agent & otomasi', emoji: '🛠️' },
				{ id: 'art', label: 'Seni & musik generatif', emoji: '🎨' },
				{ id: 'data', label: 'Data science & ML', emoji: '📊' },
				{ id: 'ethics', label: 'Etika & kebijakan AI', emoji: '⚖️' },
				{ id: 'research', label: 'Riset & paper', emoji: '🧪' }
			]
		},
		{
			id: 'goals',
			title: 'Apa tujuan kamu ambil kuliah ini?',
			subtitle: 'Pilih semua yang relevan.',
			emoji: '🎯',
			min: 1,
			options: [
				{ id: 'career', label: 'Cari kerja di bidang AI / ML', emoji: '💼' },
				{ id: 'startup', label: 'Bikin startup atau produk', emoji: '🚀' },
				{ id: 'upgrade', label: 'Upgrade kerjaan saat ini', emoji: '📈' },
				{ id: 'research', label: 'Lanjut riset / S2', emoji: '🎓' },
				{ id: 'side', label: 'Bikin side project keren', emoji: '🧩' },
				{ id: 'curious', label: 'Penasaran & pengen ngerti', emoji: '🧠' },
				{ id: 'grade', label: 'Jujur, demi SKS', emoji: '💯' }
			]
		},
		{
			id: 'experience',
			title: 'Seberapa sering kamu sudah main-main sama tools AI?',
			emoji: '🎮',
			options: [
				{ id: 'none', label: 'Pemula total', emoji: '🐣' },
				{ id: 'chatgpt', label: 'Sering pakai ChatGPT / Claude', emoji: '⚡' },
				{ id: 'builder', label: 'Pernah bikin aplikasi pakai API', emoji: '🧱' },
				{ id: 'trained', label: 'Pernah training / fine-tune model', emoji: '🛰️' }
			]
		},
		{
			id: 'tools',
			title: 'Tools mana aja yang pernah kamu coba?',
			emoji: '🧰',
			options: [
				{ id: 'chatgpt', label: 'ChatGPT', emoji: '🤖' },
				{ id: 'claude', label: 'Claude', emoji: '🟧' },
				{ id: 'gemini', label: 'Gemini', emoji: '✨' },
				{ id: 'copilot', label: 'GitHub Copilot / Cursor', emoji: '👩‍💻' },
				{ id: 'midjourney', label: 'Midjourney / DALL·E', emoji: '🖼️' },
				{ id: 'hf', label: 'Hugging Face', emoji: '🤗' },
				{ id: 'colab', label: 'Google Colab / notebook', emoji: '📓' }
			]
		},
		{
			id: 'python',
			title: 'Sudah berapa lama kamu ngoding pakai Python?',
			subtitle: 'Karena ini kelas AI, Python jadi modal utama. Pilih yang paling jujur.',
			emoji: '🐍',
			min: 1,
			scored: true,
			singleBest: true,
			options: [
				{ id: 'p0', label: 'Belum pernah', emoji: '🐣', weight: 0 },
				{ id: 'p1', label: 'Kurang dari 1 bulan', emoji: '🌱', weight: 1 },
				{ id: 'p3', label: '1–3 bulan', emoji: '🚶', weight: 2 },
				{ id: 'p6', label: '3–6 bulan', emoji: '🏃', weight: 4 },
				{ id: 'p12', label: '6–12 bulan', emoji: '🔥', weight: 6 },
				{ id: 'pmax', label: 'Lebih dari 1 tahun', emoji: '🐍', weight: 8 }
			]
		},
		{
			id: 'languages',
			title: 'Bahasa pemrograman lain yang sudah pernah kamu pakai?',
			subtitle: 'Pilih semua yang minimal pernah kamu bikin program kecil dengannya.',
			emoji: '💻',
			scored: true,
			options: [
				{ id: 'js', label: 'JavaScript / TypeScript', emoji: '🟨', weight: 1 },
				{ id: 'java', label: 'Java', emoji: '☕', weight: 1 },
				{ id: 'cpp', label: 'C / C++', emoji: '⚙️', weight: 1 },
				{ id: 'csharp', label: 'C#', emoji: '🎯', weight: 1 },
				{ id: 'go', label: 'Go', emoji: '🐹', weight: 1 },
				{ id: 'rust', label: 'Rust', emoji: '🦀', weight: 2 },
				{ id: 'r', label: 'R', emoji: '📈', weight: 2 },
				{ id: 'matlab', label: 'MATLAB', emoji: '📐', weight: 1 },
				{ id: 'sql', label: 'SQL', emoji: '🗄️', weight: 2 },
				{ id: 'php', label: 'PHP', emoji: '🐘', weight: 1 },
				{ id: 'kotlin_swift', label: 'Kotlin / Swift', emoji: '📱', weight: 1 },
				{ id: 'web', label: 'HTML / CSS', emoji: '🎨', weight: 0 },
				{ id: 'none', label: 'Belum pernah selain Python', emoji: '🤷', weight: 0 }
			]
		},
		{
			id: 'libraries',
			title: 'Library Python / AI mana yang pernah kamu pakai?',
			subtitle: 'Cukup yang pernah kamu pakai sendiri buat tugas / project — bukan cuma denger namanya.',
			emoji: '📦',
			scored: true,
			options: [
				{ id: 'numpy', label: 'NumPy', emoji: '🔢', weight: 1 },
				{ id: 'pandas', label: 'Pandas', emoji: '🐼', weight: 1 },
				{ id: 'matplotlib', label: 'Matplotlib / Seaborn', emoji: '📊', weight: 1 },
				{ id: 'sklearn', label: 'scikit-learn', emoji: '🧪', weight: 3 },
				{ id: 'pytorch', label: 'PyTorch', emoji: '🔥', weight: 4 },
				{ id: 'tensorflow', label: 'TensorFlow / Keras', emoji: '🟧', weight: 3 },
				{ id: 'transformers', label: 'Hugging Face Transformers', emoji: '🤗', weight: 4 },
				{ id: 'spacy_nltk', label: 'spaCy / NLTK', emoji: '🗣️', weight: 3 },
				{ id: 'opencv', label: 'OpenCV', emoji: '👁️', weight: 3 },
				{ id: 'langchain', label: 'LangChain / LlamaIndex', emoji: '🔗', weight: 2 },
				{ id: 'sdk', label: 'OpenAI / Anthropic SDK', emoji: '🤖', weight: 2 },
				{ id: 'jupyter', label: 'Jupyter / Colab notebook', emoji: '📓', weight: 1 },
				{ id: 'none', label: 'Belum pernah pakai library AI', emoji: '🤷', weight: 0 }
			]
		},
		{
			id: 'format',
			title: 'Kamu paling nyaman belajar dengan cara apa?',
			emoji: '📚',
			options: [
				{ id: 'projects', label: 'Langsung praktik / project', emoji: '🔨' },
				{ id: 'lectures', label: 'Kuliah & slide', emoji: '🎤' },
				{ id: 'reading', label: 'Baca sendiri', emoji: '📖' },
				{ id: 'group', label: 'Kerja kelompok', emoji: '👥' },
				{ id: 'challenges', label: 'Kompetisi / challenge', emoji: '🏆' }
			]
		},
		// --- pertanyaan bakat & kemauan (di-scoring, bobot tidak ditampilkan) ---
		{
			id: 'recent_behavior',
			title: 'Dalam 3 bulan terakhir, mana yang BENERAN kamu lakukan?',
			subtitle: 'Pilih semua yang relevan.',
			emoji: '🗓️',
			scored: true,
			options: [
				{ id: 'side_project', label: 'Bikin side project buat fun', emoji: '🛠️', weight: 4 },
				{ id: 'tutorial', label: 'Nonton tutorial sampai habis', emoji: '📺', weight: 1 },
				{ id: 'read', label: 'Baca blog atau paper teknis', emoji: '📄', weight: 3 },
				{ id: 'hackathon', label: 'Ikut hackathon atau kompetisi', emoji: '🏆', weight: 4 },
				{ id: 'helped', label: 'Bantu orang lain debug masalah', emoji: '🤝', weight: 3 },
				{ id: 'taught', label: 'Ngajarin / jelasin konsep ke orang lain', emoji: '🎤', weight: 3 },
				{ id: 'coursework', label: 'Jujur, kebanyakan tugas kuliah', emoji: '📚', weight: 0 }
			]
		},
		{
			id: 'stuck',
			title: 'Kalau lagi stuck di masalah susah, biasanya kamu ngapain?',
			subtitle: 'Jujur aja — pilih yang beneran kamu lakukan.',
			emoji: '🧩',
			scored: true,
			options: [
				{ id: 'wrestle', label: 'Coba bertarung sendiri dulu sebelum nanya', emoji: '🥊', weight: 4 },
				{ id: 'docs', label: 'Cari di dokumentasi / baca source code', emoji: '🔍', weight: 4 },
				{ id: 'ai', label: 'Nanya AI buat jelasin', emoji: '🤖', weight: 2 },
				{ id: 'friend', label: 'Tanya teman atau asisten dosen', emoji: '👥', weight: 2 },
				{ id: 'break', label: 'Istirahat dulu, balik lagi nanti', emoji: '🌿', weight: 2 },
				{ id: 'skip', label: 'Skip aja, kerjain yang lain', emoji: '🚪', weight: 0 }
			]
		},
		{
			id: 'commitment',
			title: 'Realistis, berapa jam per minggu kamu bisa luangin di luar kelas?',
			subtitle: 'Nggak dinilai — pilih yang jujur.',
			emoji: '⏳',
			min: 1,
			scored: true,
			singleBest: true,
			options: [
				{ id: 't1', label: '1–2 jam/minggu', emoji: '🐢', weight: 1 },
				{ id: 't3', label: '3–5 jam/minggu', emoji: '🚶', weight: 2 },
				{ id: 't6', label: '6–10 jam/minggu', emoji: '🏃', weight: 4 },
				{ id: 't10', label: '10+ jam, pengen mendalami', emoji: '🚀', weight: 6 }
			]
		},
		{
			id: 'track_record',
			title: 'Pilih yang sesuai sama kamu saat ini.',
			subtitle: 'Opsional. Opsi growth mindset juga dihitung kok.',
			emoji: '🌱',
			scored: true,
			options: [
				{ id: 'github', label: 'Punya GitHub yang ada isinya', emoji: '🐙', weight: 3 },
				{ id: 'shipped', label: 'Pernah merilis sesuatu yang dipakai orang lain', emoji: '🌍', weight: 5 },
				{ id: 'written', label: 'Pernah nulis soal tech di publik', emoji: '✍️', weight: 3 },
				{ id: 'taught', label: 'Pernah jadi tutor / ngajar', emoji: '🎓', weight: 3 },
				{ id: 'open_source', label: 'Pernah kontribusi ke open source', emoji: '🧵', weight: 4 },
				{ id: 'want', label: 'Belum ada — tapi pengen banget', emoji: '🌱', weight: 2 },
				{ id: 'not_me', label: 'Bukan tipe saya', emoji: '🤷', weight: 0 }
			]
		},
		{
			id: 'worries',
			title: 'Ada yang bikin kamu khawatir?',
			subtitle: 'Opsional — pilih yang beneran kamu rasain.',
			emoji: '😅',
			options: [
				{ id: 'math', label: 'Matematikanya', emoji: '➗' },
				{ id: 'coding', label: 'Codingnya', emoji: '⌨️' },
				{ id: 'pace', label: 'Tempo terlalu cepat', emoji: '🏃' },
				{ id: 'time', label: 'Beban tugas / waktu', emoji: '⏰' },
				{ id: 'jobs', label: 'AI bakal gantiin pekerjaan', emoji: '🫠' },
				{ id: 'none', label: 'Aman, saya siap', emoji: '😎' }
			]
		}
	]
};

export function scoreResponse(answers: Record<string, string[]>): number {
	let raw = 0;
	let max = 0;
	for (const q of survey.questions) {
		if (!q.scored) continue;
		const weights = q.options.map((o) => o.weight ?? 0);
		const picks = new Set(answers[q.id] ?? []);

		if (q.singleBest) {
			const best = Math.max(0, ...q.options.filter((o) => picks.has(o.id)).map((o) => o.weight ?? 0));
			raw += best;
			max += Math.max(...weights);
		} else {
			for (const o of q.options) if (picks.has(o.id)) raw += o.weight ?? 0;
			const top = [...weights].sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0);
			max += top;
		}
	}
	if (max === 0) return 0;
	return Math.round((raw / max) * 100);
}
