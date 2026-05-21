import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { bus, computeStats } from '$lib/server/stats';

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);

	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();
			const send = (data: unknown) => {
				try {
					controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
				} catch {
					/* client gone */
				}
			};

			send(computeStats());

			const onChange = () => send(computeStats());
			bus.on('change', onChange);

			const heartbeat = setInterval(() => {
				try {
					controller.enqueue(encoder.encode(`: ping\n\n`));
				} catch {
					/* gone */
				}
			}, 15000);

			const onAbort = () => {
				bus.off('change', onChange);
				clearInterval(heartbeat);
				try {
					controller.close();
				} catch {
					/* already closed */
				}
			};
			event.request.signal.addEventListener('abort', onAbort);
		}
	});

	return new Response(stream, {
		headers: {
			'content-type': 'text/event-stream',
			'cache-control': 'no-cache, no-transform',
			connection: 'keep-alive',
			'x-accel-buffering': 'no'
		}
	});
};
