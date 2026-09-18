export type Session = { subject: string | null; nickname?: string; tier: 'free' | 'basic' | 'premium'; expiresAt?: string | null; membership?: { level: number; growth: number; nextLevelGrowth: number; expiresAt: string | null } | null };
export type Profile = { id: string; nickname: string; bio: string; avatarUrl: string | null };
export type Comment = { id: string; contentId: string; episodeId: string; parentId: string | null; author: { id: string; nickname: string }; content: string; spoiler: boolean; status: 'pending' | 'published' | 'rejected'; likeCount: number; liked: boolean; createdAt: string };
export type Progress = { contentId: string; episodeId: string; seconds: number; duration: number; updatedAt: string };
export type Notice = { id: string; kind: 'reply' | 'update' | 'system'; title: string; body: string; href: string; read: boolean; createdAt: string };
export type Order = { id: string; status: string; total: number; currency: string; createdAt: string };
export type Ticket = { id: string; category: string; subject: string; description: string; status: string; createdAt: string };
export type Playback = { contentId: string; sources: { src: string; type?: string }[]; expiresAt: string; previewEpisodeIds: string[]; adFree: boolean };
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function api<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  if (import.meta.env.DEV) { const { previewRequest } = await import('./previewAccounts'); const preview = previewRequest(path, method, body); if (preview) return preview.value as T; }
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = window.setTimeout(abort, 12000);
  try {
    const response = await fetch('/api/v1' + path, { method, credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
      headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(method !== 'GET' ? { 'X-CSRF-Token': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '' } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    if (!response.ok) {
      if (response.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('aiai-session-expired'));
      throw new ApiError(response.status, response.status === 401 ? '登录已失效或账号密码不正确，请重新登录。' : response.status === 403 ? '当前账号暂无访问权限。' : response.status === 409 ? '信息已存在或状态已变化，请刷新后重试。' : response.status === 429 ? '操作太频繁，请稍后再试。' : '服务暂时不可用，请稍后重试。');
    }
    if (response.status === 204) return undefined as T;
    if (!response.headers.get('content-type')?.includes('application/json')) throw new ApiError(503, '服务暂时不可用，请稍后重试。');
    return await response.json() as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    throw new ApiError(503, '连接服务失败，请检查网络后重试。');
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
}
export const messageOf = (error: unknown) => error instanceof Error ? error.message : '操作失败，请重试。';
export const enc = encodeURIComponent;
export const safeDecode = (value: string) => { try { return decodeURIComponent(value); } catch { return ''; } };
export const dateText = (value: string) => Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '';

