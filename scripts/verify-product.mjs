import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const baseURL = process.env.APP_TEST_URL || 'http://127.0.0.1:5173/';
const out = 'docs/screenshots/parity';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-gpu', '--renderer-process-limit=2'] });
const results = [], faults = [];
async function test(name, fn) { const start = Date.now(); try { await fn(); results.push({ name, ok: true, ms: Date.now() - start }); } catch (e) { results.push({ name, ok: false, error: e.message }); } console.log(JSON.stringify(results.at(-1))); }
async function open(width = 390) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
  await context.addInitScript(() => sessionStorage.setItem('aiai-app-intro-seen', '1'));
  const page = await context.newPage(); page.on('pageerror', e => faults.push(e.message));
  return { page, context };
}
const go = async (page, path = '/') => { await page.goto(baseURL + '#' + path); await page.waitForTimeout(180); };
const shot = (page, name) => page.screenshot({ path: out + '/' + name + '.png' });
for (const width of [360, 390, 430]) await test('布局、详情完整选集与返回 ' + width, async () => {
  const { page, context } = await open(width);
  try {
    await go(page); await expect(page.locator('.hero-card[data-active=true]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await shot(page, 'home-' + width);
    await page.locator('.hero-card[data-active=true]').click();
    await expect(page.locator('.reference-detail')).toBeVisible();
    await expect(page.locator('.reference-episodes button')).toHaveCount(48);
    await shot(page, 'detail-' + width);
    await page.getByRole('button', { name: '第 48 集', exact: true }).click();
    await expect(page.locator('.reference-player')).toBeVisible();
    await expect(page.getByText('第 48 集 / 共 48 集')).toBeVisible();
    await expect(page.getByRole('button', { name: '下一集', exact: true })).toBeDisabled();
    await expect(page.locator('.playback-unavailable')).toContainText('暂时无法播放', { timeout: 16000 });
    expect(await page.locator('video').count()).toBe(0);
    await shot(page, 'player-unavailable-' + width);
    await page.getByRole('button', { name: '返回详情' }).click();
    await page.goBack(); await expect(page.locator('.reference-detail')).toHaveCount(0);
  } finally { await context.close(); }
});
await test('未接服务不能假登录、评论草稿保留、密码重置', async () => {
  const { page, context } = await open();
  try {
    await go(page, '/detail/drama-08');
    await page.getByRole('textbox', { name: '评论内容' }).fill('这段剧情很有意思');
    await page.getByRole('button', { name: '发送评论' }).click();
    const dialog = page.getByRole('dialog', { name: '登录爱爱短剧' });
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder('请输入用户名 / 手机号 / 邮箱').fill('viewer');
    await dialog.getByPlaceholder('请输入密码').fill('password123');
    await dialog.getByRole('checkbox').check(); await dialog.getByRole('button', { name: '登录', exact: true }).click();
    await expect(dialog.locator('[role=alert]')).toBeVisible({ timeout: 16000 });
    await expect(dialog).toBeVisible(); expect(await page.evaluate(() => sessionStorage.getItem('aiai-user-login'))).toBeNull();
    await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: '评论内容' })).toHaveValue('这段剧情很有意思');
    await page.reload(); await expect(page.getByRole('textbox', { name: '评论内容' })).toHaveValue('这段剧情很有意思');
    await go(page, '/me'); await page.getByRole('button', { name: '登录', exact: true }).click();
    await page.getByRole('button', { name: '忘记密码？' }).click();
    await page.getByPlaceholder('请输入邮箱地址').fill('test@example.com');
    await page.getByRole('button', { name: '发送重置邮件' }).click();
    await expect(page.locator('.auth-form [role=alert]')).toBeVisible();
    await shot(page, 'forgot-service-error'); await page.keyboard.press('Escape');
  } finally { await context.close(); }
});
async function mockBackend(page, signedIn = true) {
  let logged = signedIn;
  let comments = [
    { id: 'c1', contentId: 'drama-08', episodeId: '1', parentId: null, author: { id: 'other', nickname: '月下追剧' }, content: '细节很耐看，期待下一集的故事。', spoiler: false, status: 'published', likeCount: 5, liked: false, createdAt: '2026-09-15T12:00:00Z' },
    { id: 'c2', contentId: 'drama-08', episodeId: '1', parentId: 'c1', author: { id: 'other2', nickname: '一眼入戏' }, content: '我也觉得这一集的转折很自然。', spoiler: false, status: 'published', likeCount: 1, liked: false, createdAt: '2026-09-16T12:00:00Z' }
  ];
  let profile = { id: 'u1', nickname: '测试观众', bio: '喜欢好故事', avatarUrl: null }, tickets = [];
  const requests = [];
  await page.route('**/api/v1/**', async route => {
    const req = route.request(), url = new URL(req.url()), path = url.pathname.replace('/api/v1', ''), method = req.method(), body = req.postDataJSON();
    requests.push({ path, method, body });
    let value, status = 200;
    const session = { subject: logged ? 'u1' : null, nickname: profile.nickname, tier: 'free', roles: [], expiresAt: '2027-01-01T00:00:00Z' };
    if (path === '/session') { if (method === 'DELETE') logged = false; value = method === 'DELETE' ? { subject: null } : session; }
    else if (path === '/auth/sign-in' || path === '/auth/register') { logged = true; value = { ...session, subject: 'u1' }; }
    else if (path === '/comments' && method === 'GET') value = { items: comments.filter(c => c.contentId === url.searchParams.get('contentId') && c.episodeId === url.searchParams.get('episodeId')), cursor: null };
    else if (path === '/comments' && method === 'POST') { const c = { ...body, id: 'new-' + comments.length, parentId: body.parentId ?? null, author: { id: 'u1', nickname: profile.nickname }, status: 'pending', likeCount: 0, liked: false, createdAt: new Date().toISOString() }; comments.push(c); value = c; }
    else if (/^\/comments\/[^/]+\/like$/.test(path)) { const c = comments.find(c => c.id === path.split('/')[2]); c.liked = method === 'PUT'; c.likeCount += c.liked ? 1 : -1; value = { liked: c.liked, likeCount: c.likeCount }; }
    else if (path.startsWith('/comments/') && method === 'DELETE') { comments = comments.filter(c => c.id !== path.split('/')[2]); value = {}; }
    else if (path.endsWith('/reports')) value = { reportId: 'r1', status: 'submitted' };
    else if (path === '/me/profile') { if (method === 'PATCH') profile = { ...profile, ...body }; value = profile; }
    else if (path === '/me/comments') value = comments.filter(c => c.author.id === 'u1');
    else if (path === '/me/notifications') value = [{ id: 'n1', kind: 'reply', title: '收到一条回复', body: '来看看大家的讨论', href: '/detail/drama-08', read: false, createdAt: '2026-09-16T12:00:00Z' }];
    else if (path.startsWith('/me/notifications/')) value = {};
    else if (/^\/(green|adult)\/contents\/[^/]+$/.test(path)) value = { preview_episode_ids: ['1','2','3','4','5','6','7'] };
    else if (path.endsWith('/playback')) value = { contentId: path.split('/')[3], sources: [{ src: '/media/demo/portrait.mp4', type: 'video/mp4' }], expiresAt: '2027-01-01T00:00:00Z', previewEpisodeIds: ['1','2'], adFree: true };
    else if (path === '/me/watch-progress') value = method === 'GET' ? [] : {};
    else if (path.startsWith('/privacy/')) value = { deleted: 1 };
    else if (path === '/membership/quotes') value = { id: 'q1', planId: body.planId, autoRenew: false, total: 19, currency: 'CNY', expiresAt: '2027-01-01T00:00:00Z' };
    else if (path === '/orders' && method === 'POST') value = { orderId: 'o1', checkoutUrl: '/payment-result?orderId=o1' };
    else if (path.startsWith('/orders')) { const order = { id: 'o1', status: 'paid', total: 19, currency: 'CNY', createdAt: '2026-09-17T12:00:00Z' }; value = path === '/orders' ? [order] : order; }
    else if (path === '/support/tickets') { if (method === 'POST') { const t = { ...body, id: 't1', status: 'open', createdAt: new Date().toISOString() }; tickets.push(t); value = t; } else value = tickets; }
    else { status = 503; value = {}; }
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) });
  });
  return requests;
}
await test('接口模拟：登录回到评论、回复显示、点赞删除、排序与草稿隔离', async () => {
  const { page, context } = await open();
  try {
    const requests = await mockBackend(page, false); await go(page, '/detail/drama-08');
    await expect(page.getByText('我也觉得这一集的转折很自然。')).toBeVisible();
    await page.getByRole('textbox', { name: '评论内容' }).fill('这部剧的氛围真不错');
    await page.getByRole('button', { name: '发送评论' }).click();
    await page.getByPlaceholder('请输入用户名 / 手机号 / 邮箱').fill('viewer'); await page.getByPlaceholder('请输入密码').fill('password123'); await page.getByRole('dialog').getByRole('checkbox').check(); await page.getByRole('button', { name: '登录', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: '评论内容' })).toHaveValue('这部剧的氛围真不错');
    await page.getByRole('button', { name: '发送评论' }).click(); await expect(page.getByText('审核中')).toBeVisible();
    await page.getByRole('button', { name: '赞评论' }).first().click(); await expect(page.getByRole('button', { name: '赞评论' }).first()).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: '回复', exact: true }).first().click(); await page.getByRole('textbox', { name: '评论内容' }).fill('同意，细节也很丰富'); await page.getByRole('button', { name: '发送评论' }).click();
    await expect(page.getByText('同意，细节也很丰富')).toBeVisible();
    await page.getByRole('button', { name: '最新', exact: true }).click(); await shot(page, 'detail-comments-mocked');
    expect(requests.filter(r => r.path === '/comments' && r.method === 'POST')).toHaveLength(2);
    expect(requests.filter(r => r.path === '/comments' && r.method === 'POST')[1].body.parentId).toBe('c1');
    await page.getByRole('button', { name: '删除', exact: true }).first().click();
    await go(page, '/detail/drama-03'); await expect(page.getByRole('textbox', { name: '评论内容' })).toHaveValue('');
  } finally { await context.close(); }
});
await test('接口模拟：播放、切集、进度持久化与跨页收藏一致', async () => {
  const { page, context } = await open();
  try {
    const requests = await mockBackend(page); await go(page, '/play/drama-08?episode=1');
    const video = page.locator('video'); await expect(video).toBeVisible();
    await expect.poll(() => video.evaluate(v => v.readyState)).toBeGreaterThanOrEqual(2);
    await video.evaluate(v => { v.currentTime = Math.min(7, v.duration / 2); v.dispatchEvent(new Event('timeupdate')); v.pause(); });
    await page.getByRole('button', { name: '收藏', exact: true }).click();
    await page.getByRole('button', { name: '播放设置' }).click(); await page.getByRole('radio', { name: '1.5×', exact: true }).click(); await page.keyboard.press('Escape');
    await shot(page, 'player-mocked');
    await page.getByRole('button', { name: '下一集', exact: true }).click(); await expect(page.getByText('第 2 集 / 共 32 集')).toBeVisible();
    expect(requests.some(r => r.path.endsWith('/playback') && r.body.episodeId === '2')).toBeTruthy();
    await page.getByRole('button', { name: '返回详情' }).click(); await expect(page.locator('.watch-progress-card')).toContainText('上次看到');
    await page.getByRole('button', { name: '追剧', exact: true }).click(); await page.getByRole('tab', { name: '收藏', exact: true }).click(); await expect(page.locator('.drama-rows')).toContainText('月色不晚');
    await page.reload(); await page.getByRole('tab', { name: '收藏', exact: true }).click(); await expect(page.locator('.drama-rows')).toContainText('月色不晚');
    await go(page, '/me/history'); await expect(page.locator('.history-list')).toContainText('月色不晚');
  } finally { await context.close(); }
});
await test('接口模拟：个人资料、会员订单、消息与反馈工单闭环', async () => {
  const { page, context } = await open();
  try {
    const requests = await mockBackend(page); await go(page, '/me/profile');
    await page.getByLabel('昵称', { exact: true }).fill('追剧小夏'); await page.getByLabel('个人简介').fill('每天发现一个好故事'); await page.getByRole('button', { name: '保存资料' }).click(); await expect(page.getByText('资料已保存')).toBeVisible();
    await go(page, '/me'); await expect(page.locator('.profile-head')).toContainText('追剧小夏'); await shot(page, 'profile-mocked');
    await go(page, '/checkout?plan=basic-month');
    await page.getByRole('button', { name: '获取最新报价' }).click(); await page.getByRole('button', { name: '提交订单并前往支付' }).click(); await expect(page.getByRole('heading', { name: '已支付' })).toBeVisible(); await shot(page, 'order-mocked');
    await go(page, '/support/feedback'); await page.getByLabel('标题', { exact: true }).fill('播放加载问题'); await page.getByLabel('问题描述').fill('切换到第二集时加载较慢，希望可以优化播放体验。'); await page.getByRole('button', { name: '提交反馈' }).click(); await expect(page.getByRole('heading', { name: '反馈详情' })).toBeVisible(); await expect(page.getByText('播放加载问题')).toBeVisible();
    await go(page, '/me/messages'); await page.getByRole('button', { name: '查看消息' }).click(); await expect(page.locator('.reference-detail')).toBeVisible();
    expect(requests.some(r => r.path === '/me/profile' && r.method === 'PATCH')).toBeTruthy();
    expect(requests.some(r => r.path === '/support/tickets' && r.method === 'POST')).toBeTruthy();
  } finally { await context.close(); }
});
await test('完整页面巡检与无效路径、专区深链接保护', async () => {
  const { page, context } = await open();
  try {
    await mockBackend(page);
    for (const path of ['/rankings','/shorts','/comics','/collections','/free','/updates','/membership','/me','/me/favorites','/me/comments','/me/messages','/me/privacy','/settings','/me/orders','/me/orders/o1','/support','/support/account','/support/feedback','/support/tickets','/terms','/privacy','/membership-guide','/copyright','/about']) {
      await go(page, path); await expect(page.locator('.subpage, .profile-screen').filter({ visible: true }).first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
    await go(page, '/detail/no-such-id'); await expect(page.getByText('没有找到这部剧')).toBeVisible();
    await go(page, '/play/private-preview-1'); await expect(page.getByText('请先完成专区访问确认')).toBeVisible(); expect(await page.locator('video').count()).toBe(0);
    await go(page, '/'); await page.getByRole('button', { name: '完整榜单' }).click(); await expect(page.getByRole('heading', { name: '短剧排行榜' })).toBeVisible(); await page.goBack(); await expect(page.locator('.hero-frame')).toBeVisible();
  } finally { await context.close(); }
});
await test('异常参数、重置链接、头像、专区收藏与弹层焦点', async () => {
  const { page, context } = await open();
  try {
    await mockBackend(page);
    await go(page, '/account/reset-password'); await expect(page.getByText('链接无效或已过期')).toBeVisible();
    await go(page, '/account/reset-password?token=abcdefghijklmnopqrstuvwxyz');
    await page.getByLabel('新密码', { exact: true }).fill('password123'); await page.getByLabel('确认新密码', { exact: true }).fill('different123');
    await page.getByRole('button', { name: '保存新密码' }).click(); await expect(page.getByText('两次输入的密码不一致。')).toBeVisible();
    await go(page, '/me/orders/%E0%A4%A'); await expect(page.locator('.subpage-header')).toContainText('订单详情');
    await go(page, '/play/drama-08?episode=1.8'); await expect(page.getByText('第 1 集 / 共 32 集')).toBeVisible();
    await page.getByRole('button', { name: '播放设置' }).click();
    await page.keyboard.press('Tab'); expect(await page.locator('[aria-modal=true]').evaluate(el => el.contains(document.activeElement))).toBeTruthy();
    await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
    await go(page, '/me/profile');
    await page.locator('input[type=file]').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aV6kAAAAASUVORK5CYII=', 'base64') });
    await expect(page.locator('.profile-avatar-large img')).toBeVisible();
    await page.getByRole('button', { name: '恢复默认头像' }).click(); await expect(page.locator('.profile-avatar-large img')).toHaveCount(0);
    await go(page, '/18plus'); await page.getByRole('button', { name: /确认并进入/ }).click();
    await page.getByRole('button', { name: '收藏高三爱情故事', exact: true }).click();
    await page.locator('.adult-wishlist').click(); await expect(page.getByRole('heading', { name: '我的私密收藏' })).toBeVisible();
    await expect(page.locator('.adult-grid .adult-card')).toHaveCount(1);
    await page.getByRole('button', { name: '查看《高三爱情故事》' }).click();
    await page.getByRole('button', { name: '第 1 集', exact: true }).click();
    await expect(page.getByRole('button', { name: '收藏', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.setViewportSize({ width: 360, height: 640 }); await shot(page, 'player-small-height-mocked');
  } finally { await context.close(); }
});
await test('权限拒绝、接口失败与损坏缓存恢复', async () => {
  const { page, context } = await open();
  try {
    await context.addInitScript(() => localStorage.setItem('aiai-app-records:guest', JSON.stringify({ following: null, saved: [null, 12], history: [null, { contentId: 'drama-01' }] })));
    await page.route('**/api/v1/**', route => route.fulfill({ status: route.request().url().endsWith('/playback') ? 403 : 503, contentType: 'application/json', body: '{}' }));
    await go(page, '/'); await expect(page.locator('.hero-frame')).toBeVisible(); await expect(page.locator('.continue-card')).toHaveCount(0);
    await go(page, '/play/drama-08?episode=8'); await expect(page.getByText('本集需要解锁')).toBeVisible(); expect(await page.locator('video').count()).toBe(0);
    await page.getByRole('button', { name: '查看会员权益' }).click(); await expect(page.getByRole('heading', { name: '会员中心', exact: true })).toBeVisible();
    await go(page, '/detail/drama-08'); await expect(page.locator('.discussion .error-state')).toBeVisible(); await expect(page.getByText('还没有评论，来聊聊这部剧吧。')).toHaveCount(0);
  } finally { await context.close(); }
});

await browser.close();
const report = { ok: results.every(r => r.ok) && !faults.length, results, pageErrors: faults, note: '接口模拟仅用于自动化验证；不代表真实后端、支付或片源已上线。' };
await writeFile('docs/verification-parity.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
