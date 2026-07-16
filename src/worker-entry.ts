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

/**
 * Netlifyの同一オリジンproxyからCloudflare Workerへ届いたAPIリクエストを、
 * ブラウザが実際に表示している許可済みOriginへ正規化する。
 *
 * これにより既存WorkerのOrigin検証とTurnstile hostname検証を維持したまま、
 * ivuru.ivrm.jpからivurugg.ivrm.jpのWorkerを利用できる。
 */
export const normalizeApiProxyRequest = (request: Request, env: Pick<WorkerEnv, 'ALLOWED_ORIGINS'>) => {
  const requestUrl = new URL(request.url);
  if (!requestUrl.pathname.startsWith('/api/')) return request;

  const browserOrigin = request.headers.get('origin');
  if (!browserOrigin || browserOrigin === requestUrl.origin) return request;

  const configuredOrigins = parseConfiguredOrigins(env.ALLOWED_ORIGINS);
  if (!configuredOrigins.has(browserOrigin)) return request;

  let publicOrigin: URL;
  try {
    publicOrigin = new URL(browserOrigin);
  } catch {
    return request;
  }

  requestUrl.protocol = publicOrigin.protocol;
  requestUrl.host = publicOrigin.host;
  return new Request(requestUrl, request);
};

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: WorkerContext): Promise<Response> {
    return worker.fetch(normalizeApiProxyRequest(request, env), env, ctx);
  },

  async queue(batch: WorkerQueueBatch, env: WorkerEnv): Promise<void> {
    return worker.queue(batch, env);
  },

  async scheduled(controller: WorkerScheduledController, env: WorkerEnv): Promise<void> {
    return worker.scheduled(controller, env);
  },
};
