import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const baseURL = 'http://127.0.0.1:5173/';
const out = 'docs/screenshots/final';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const issues = [];

async function open(width, height = 844, seen = true) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  if (seen) await context.addInitScript(() => sessionStorage.setItem('aiai-app-intro-seen', '1'));
  const page = await context.newPage();
  page.on('console', (msg) => { if (msg.type() === 'error') issues.push('console:' + width + ':' + msg.text()); });
  page.on('pageerror', (error) => issues.push('page:' + width + ':' + error.message));
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  return { context, page };
}

{
  const { context, page } = await open(390, 844, false);
  await page.waitForTimeout(1050);
  await page.screenshot({ path: out + '/splash-390.png' });
  await page.locator('.splash').waitFor({ state: 'hidden', timeout: 4500 });
  await context.close();
}

for (const width of [360, 390, 430]) {
  const { context, page } = await open(width);
  await page.locator('.hero-card[data-active="true"]').waitFor();
  const overflow = await page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - innerWidth);
  if (overflow > 1) issues.push('overflow:' + width + ':' + overflow);
  const active = await page.locator('.hero-card[data-active="true"]').boundingBox();
  const prev = await page.locator('.hero-card[data-offset="-1"]').boundingBox();
  const next = await page.locator('.hero-card[data-offset="1"]').boundingBox();
  if (!active || Math.abs(active.x + active.width / 2 - width / 2) > 1.5) issues.push('hero-center:' + width);
  if (!prev || prev.x + prev.width <= 0) issues.push('hero-prev:' + width);
  if (!next || next.x >= width) issues.push('hero-next:' + width);
  await page.screenshot({ path: out + '/home-' + width + '.png', fullPage: true });
  await context.close();
}

{
  const { context, page } = await open(390);
  await page.getByRole('tab', { name: '短剧' }).click();
  await page.locator('.short-intro').waitFor();
  await page.getByRole('button', { name: /筛选/ }).click();
  await page.locator('.filter-panel').waitFor();
  await page.locator('.filter-row').filter({ hasText: '状态' }).getByRole('button', { name: '已完结' }).click();
  await page.screenshot({ path: out + '/short-filter-390.png', fullPage: true });
  if (await page.locator('.content-card').count() < 1) issues.push('short-filter-empty');

  await page.getByRole('tab', { name: '漫剧' }).click();
  await page.locator('.manga-feature').waitFor();
  if (await page.locator('.hero-frame').count()) issues.push('manga-reused-recommend-hero');
  await page.screenshot({ path: out + '/manga-390.png', fullPage: true });

  await page.getByRole('tab', { name: '推荐' }).click();
  await page.getByRole('button', { name: '搜索短剧、漫剧' }).click();
  const input = page.getByPlaceholder('搜索剧名或题材');
  await input.fill('月色');
  await page.getByText('月色不晚', { exact: true }).waitFor();
  await page.screenshot({ path: out + '/search-result.png' });
  await input.fill('完全不存在');
  await page.getByText('没有找到相关剧目').waitFor();
  await page.screenshot({ path: out + '/search-empty.png' });
  await page.keyboard.press('Escape');

  await page.locator('.hero-card[data-active="true"]').click();
  await page.locator('.detail-screen').waitFor();
  await page.getByRole('button', { name: /加入追剧|取消追剧/ }).first().click();
  await page.screenshot({ path: out + '/detail-390.png' });
  await page.locator('.episode-grid').getByRole('button', { name: '2', exact: true }).click();
  await page.screenshot({ path: out + '/detail-episodes.png' });
  await page.getByRole('button', { name: '返回' }).click();

  await page.getByRole('button', { name: '追剧', exact: true }).click();
  await page.getByRole('heading', { name: '追剧' }).waitFor();
  await page.screenshot({ path: out + '/following-390.png', fullPage: true });

  await page.getByRole('button', { name: '我的', exact: true }).click();
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.getByPlaceholder('请输入手机号').fill('13800138000');
  await page.locator('.login-sheet').getByRole('button', { name: '登录', exact: true }).click();
  await page.locator('.sheet-layer').waitFor({ state: 'hidden' });
  await page.getByText('登录成功').waitFor();
  await page.screenshot({ path: out + '/profile-390.png' });
  await page.getByText('登录成功').waitFor({ state: 'hidden' });
  await page.getByText('会员中心', { exact: true }).click();
  await page.locator('.member-content').waitFor();
  if (!(await page.getByText('尚未开通会员').isVisible())) issues.push('member-login-state');
  await page.waitForTimeout(800);
  await page.screenshot({ path: out + '/member.png' });
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: '18+专区' }).click();
  if (await page.getByRole('heading', { name: '进入18+专区' }).isVisible().catch(() => false)) await page.getByRole('button', { name: /确认并进入/ }).click();
  await page.locator('.adult-hero').waitFor();
  await page.screenshot({ path: out + '/adult-390.png', fullPage: true });
  await context.close();
}

{
  const { context, page } = await open(390);
  await page.getByRole('button', { name: '刷剧', exact: true }).click();
  await page.locator('.reel-slide[data-current="true"]').waitFor();
  await page.waitForTimeout(700);
  const paused = await page.locator('.reel-slide[data-current="true"] video').evaluate((video) => video.paused);
  if (paused) issues.push('reel-autoplay');
  await page.screenshot({ path: out + '/reels-390.png' });
  const current = page.locator('.reel-slide[data-current="true"]');
  await current.getByRole('button', { name: '评论' }).click();
  await page.locator('.comment-list').waitFor();
  await page.screenshot({ path: out + '/comments.png' });
  await page.getByRole('button', { name: '关闭' }).click();
  await context.close();
}

await browser.close();
console.log(JSON.stringify({ ok: issues.length === 0, issues }, null, 2));
if (issues.length) process.exitCode = 1;
