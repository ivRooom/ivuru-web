import worker from './worker';

type WorkerEnv = Parameters<typeof worker.fetch>[1];
type WorkerContext = Parameters<typeof worker.fetch>[2];
type WorkerQueueBatch = Parameters<typeof worker.queue>[0];
type WorkerScheduledController = Parameters<typeof worker.scheduled>[0];

const parseConfiguredOrigins = (value: string | undefined) =>
  new Set(
    (value ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );

export const allowedCorsOrigin = (request: Request, env: Pick<WorkerEnv, 'ALLOWED_ORIGINS'>) => {
  const origin = request.headers.get('origin');
  if (!origin) return null;
  return parseConfiguredOrigins(env.ALLOWED_ORIGINS).has(origin) ? origin : null;
};

export const buildCorsHeaders = (request: Request, env: Pick<WorkerEnv, 'ALLOWED_ORIGINS'>) => {
  const origin = allowedCorsOrigin(request, env);
  if (!origin) return null;

  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'accept, content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  } satisfies Record<string, string>;
};

const withCors = (response: Response, corsHeaders: Record<string, string> | null) => {
  if (!corsHeaders) return response;

  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(corsHeaders)) {
    if (name !== 'vary') headers.set(name, value);
  }

  const currentVary = headers.get('vary');
  if (!currentVary) headers.set('vary', 'Origin');
  else if (!currentVary.split(',').some((value) => value.trim().toLowerCase() === 'origin')) {
    headers.set('vary', `${currentVary}, Origin`);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: WorkerContext): Promise<Response> {
    const url = new URL(request.url);
    const isApiRequest = url.pathname.startsWith('/api/');
    const corsHeaders = isApiRequest ? buildCorsHeaders(request, env) : null;

    if (isApiRequest && request.method === 'OPTIONS') {
      return corsHeaders
        ? new Response(null, { status: 204, headers: corsHeaders })
        : new Response(null, { status: 403 });
    }

    const response = await worker.fetch(request, env, ctx);
    return isApiRequest ? withCors(response, corsHeaders) : response;
  },

  async queue(batch: WorkerQueueBatch, env: WorkerEnv): Promise<void> {
    return worker.queue(batch, env);
  },

  async scheduled(controller: WorkerScheduledController, env: WorkerEnv): Promise<void> {
    return worker.scheduled(controller, env);
  },
};
