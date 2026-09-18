import type { Session } from './api';
const key = 'aiai-style-preview-account';
export const previewAccounts = import.meta.env.DEV ? [
  { account: import.meta.env.VITE_PREVIEW_USER || '', password: import.meta.env.VITE_PREVIEW_PASSWORD || '', nickname: '普通用户 · 小夏', tier: 'free' as const },
  { account: import.meta.env.VITE_PREVIEW_VIP || '', password: import.meta.env.VITE_PREVIEW_PASSWORD || '', nickname: '会员用户 · 小夏', tier: 'premium' as const },
].filter(a => a.account && a.password) : [];
export function previewRequest(path: string, method: string, body?: unknown): { value: unknown } | undefined {
  const input = body as { account?: string; password?: string; nickname?: string; bio?: string } | undefined;
  let selected: string | null = null;
  try { selected = sessionStorage.getItem(key); } catch {}
  if (path === '/auth/sign-in' && method === 'POST' && previewAccounts.some(a => a.account === input?.account)) {
    const account = previewAccounts.find(a => a.account === input?.account && a.password === input?.password);
    if (!account) throw new Error('测试账号密码不正确。');
    sessionStorage.setItem(key, account.account); selected = account.account;
  } else if (!selected) return undefined;
  const account = previewAccounts.find(a => a.account === selected);
  if (!account) return undefined;
  const session: Session = { subject: 'preview:' + account.account, nickname: account.nickname, tier: account.tier, expiresAt: null, membership: account.tier === 'premium' ? { level: 5, growth: 1280, nextLevelGrowth: 2000, expiresAt: '2027-09-18T00:00:00+08:00' } : null };
  if (path === '/session' && method === 'DELETE') { sessionStorage.removeItem(key); return { value: undefined }; }
  if (path === '/auth/sign-in' && !previewAccounts.some(a => a.account === input?.account && a.password === input?.password)) throw new Error('请先退出测试账号，再使用其他账号登录。');
  if (path === '/session' || path === '/auth/sign-in') return { value: session };
  if (path === '/me/profile' && method === 'GET') return { value: { id: session.subject, nickname: account.nickname, bio: '喜欢好故事，每天都有新期待。', avatarUrl: null } };
  if (path === '/me/notifications') return { value: [{ id: 'preview-welcome', kind: 'system', title: account.tier === 'premium' ? '欢迎体验高级会员' : '欢迎来到爱爱短剧', body: '这是本地样式预览账号，可以查看个人中心和会员中心。', href: '/membership', read: false, createdAt: '2026-09-18T09:00:00+08:00' }] };
  if (['/me/watch-progress', '/me/comments', '/orders', '/support/tickets'].includes(path) && method === 'GET') return { value: [] };
  if (path === '/me/watch-progress' && method === 'PUT') return { value: undefined };
  throw new Error('当前为样式预览账号，此操作需要正式服务。');
}


