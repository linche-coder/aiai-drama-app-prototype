import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const baseURL = 'http://127.0.0.1:5173/';
const out = 'docs/screenshots';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const issues = [];

async function open(width, height = 844, seen = true) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
  if (seen) await context.addInitScript(() => sessionStorage.setItem('aiai-app-intro-seen', '1'));
  const page = await context.newPage();
  page.on('console', (msg) => { if (msg.type() === 'error') issues.push(`console:${width}:${msg.text()}`); });
  page.on('pageerror', (error) => issues.push(`page:${width}:${error.message}`));
  await page.goto(baseURL, { waitUntil: seen ? 'networkidle' : 'domcontentloaded' });
  return { context, page };
}

// WEB-derived brand reveal, static hold, direct fade, and once-per-session behavior.
{
  const { context, page } = await open(390, 844, false);
  if ((await page.locator('.app-scroller').evaluate((element) => element.style.overflow)) !== 'hidden') issues.push('splash did not lock app scroll');
  await page.waitForTimeout(1080);
  await page.screenshot({ path: `${out}/01-splash-390.png` });
  await page.waitForTimeout(500);
  const firstRect = await page.locator('.splash-brand').boundingBox();
  await page.waitForTimeout(300);
  const holdRect = await page.locator('.splash-brand').boundingBox();
  if (firstRect && holdRect && (Math.abs(firstRect.x - holdRect.x) > 1 || Math.abs(firstRect.y - holdRect.y) > 1 || Math.abs(firstRect.width - holdRect.width) > 1)) issues.push('splash logo moved during hold');
  await page.locator('.splash').waitFor({ state: 'hidden', timeout: 4000 });
  if ((await page.locator('.app-scroller').evaluate((element) => element.style.overflow)) === 'hidden') issues.push('splash did not restore app scroll state');
  await page.reload({ waitUntil: 'networkidle' });
  if (await page.locator('.splash').isVisible().catch(() => false)) issues.push('splash repeated in the same session');
  await context.close();
}

for (const width of [360, 390, 430]) {
  const { context, page } = await open(width);
  await page.getByRole('button', { name: '搜索短剧、漫剧' }).waitFor();
  await page.waitForTimeout(450);
  const overflow = await page.evaluate(() => ({ body: document.body.scrollWidth - innerWidth, html: document.documentElement.scrollWidth - innerWidth }));
  if (overflow.body > 1 || overflow.html > 1) issues.push(`overflow:${width}:${JSON.stringify(overflow)}`);
  if (await page.locator('.topbar img').count()) issues.push(`home header logo remained:${width}`);
  const card = await page.locator('.hero-card[data-active="true"]').boundingBox();
  const previous = await page.locator('.hero-card[data-offset="-1"]').boundingBox();
  const next = await page.locator('.hero-card[data-offset="1"]').boundingBox();
  if (!card || card.width / width < .69 || card.width / width > .77) issues.push(`cover-flow ratio:${width}:${card?.width}`);
  if (card && Math.abs(card.x + card.width / 2 - width / 2) > 1.5) issues.push(`cover-flow not centered:${width}:${card.x}`);
  const cardCenter = card ? card.x + card.width / 2 : width / 2;
  if (!previous || previous.x + previous.width / 2 >= cardCenter || previous.x + previous.width <= 0) issues.push(`previous card not visible:${width}`);
  if (!next || next.x + next.width / 2 <= cardCenter || next.x >= width) issues.push(`next card not visible:${width}`);
  const nav = page.getByRole('navigation', { name: '底部导航' });
  if (!(await nav.isVisible())) issues.push(`nav hidden:${width}`);
  await page.screenshot({ path: `${out}/home-${width}.png` });
  await context.close();
}

// Home tabs, cover-flow gesture, search states, sheets and 18+ icon modes.
{
  const { context, page } = await open(390);
  await page.getByRole('tab', { name: '漫剧' }).click();
  if (await page.getByRole('tab', { name: '漫剧' }).getAttribute('aria-selected') !== 'true') issues.push('channel switch failed');
  await page.waitForTimeout(320);
  const hero = page.locator('.hero-frame');
  const beforeDrag = await page.locator('.hero-summary strong').innerText();
  const box = await hero.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width * .76, box.y + box.height * .5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * .2, box.y + box.height * .5, { steps: 9 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    if (beforeDrag === await page.locator('.hero-summary strong').innerText()) issues.push('carousel drag did not change slide');
  } else issues.push('hero missing');

  await page.getByRole('button', { name: '搜索短剧、漫剧' }).click();
  const input = page.getByPlaceholder('搜索剧名或题材');
  await input.fill('月色');
  await page.getByText('月色不晚', { exact: true }).waitFor();
  await page.screenshot({ path: `${out}/search-result.png` });
  await input.fill('不存在的剧名');
  await page.getByText('没有找到相关剧目').waitFor();
  await page.screenshot({ path: `${out}/search-empty.png` });
  await page.keyboard.press('Escape');
  await page.locator('.sheet-layer').waitFor({ state: 'hidden' });

  await page.locator('.hero-card[data-active="true"]').click();
  await page.getByText('播放预览占位').waitFor();
  await page.screenshot({ path: `${out}/drama-preview.png` });
  await page.locator('.sheet-layer').click({ position: { x: 10, y: 10 } });
  await page.locator('.sheet-layer').waitFor({ state: 'hidden' });

  const adultButton = page.getByRole('button', { name: '18+专区' });
  const inactiveOpacity = await adultButton.locator('img').evaluate((element) => getComputedStyle(element).opacity);
  if (inactiveOpacity !== '0') issues.push(`adult icon inactive is not monochrome:${inactiveOpacity}`);
  await adultButton.click();
  await page.getByRole('heading', { name: '进入18+专区' }).waitFor();
  await page.waitForTimeout(240);
  const activeOpacity = await adultButton.locator('img').evaluate((element) => getComputedStyle(element).opacity);
  if (activeOpacity !== '1') issues.push(`adult icon active gradient is hidden:${activeOpacity}`);
  await page.screenshot({ path: `${out}/adult-gate-390.png` });
  await page.getByRole('button', { name: '确认并进入' }).click();
  await page.locator('.adult-hero').waitFor();
  if (await page.getByRole('tab').filter({ hasText: /^成人/ }).count() < 2) issues.push('adult channel structure missing');
  await page.screenshot({ path: `${out}/adult-home-390.png`, fullPage: true });
  await page.getByRole('button', { name: '搜索专区内容' }).click();
  await page.getByPlaceholder('搜索剧名或题材').fill('高三');
  await page.locator('.search-results').getByText('高三爱情故事', { exact: true }).waitFor();
  await page.keyboard.press('Escape');
  await page.locator('.sheet-layer').waitFor({ state: 'hidden' });
  const adultSave = page.getByRole('button', { name: '收藏高三爱情故事' });
  await adultSave.click();
  if (await adultSave.getAttribute('aria-pressed') !== 'true') issues.push('adult wishlist state failed');
  await page.getByRole('tab', { name: '成人漫剧' }).click();
  if (await page.getByRole('tab', { name: '成人漫剧' }).getAttribute('aria-selected') !== 'true') issues.push('adult channel switch failed');
  await page.locator('.bottom-nav').getByRole('button', { name: '首页', exact: true }).click();
  if (await page.getByRole('tab', { name: '漫剧' }).getAttribute('aria-selected') !== 'true') issues.push('home channel state not preserved');
  await page.getByRole('button', { name: '会员' }).click();
  await page.getByText('会员功能暂未接入').waitFor();
  await page.keyboard.press('Escape');
  await context.close();
}

// Reel autoplay, vertical snap, play/pause, like/save persistence, comments and progress.
{
  const { context, page } = await open(390);
  await page.getByRole('button', { name: '刷剧', exact: true }).click();
  await page.locator('.reel-slide[data-current="true"]').waitFor();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/reels-390.png` });
  const firstPaused = await page.locator('.reel-slide[data-current="true"] video').evaluate((video) => video.paused);
  if (firstPaused) issues.push('current reel did not autoplay');
  await page.locator('.reel-slide[data-current="true"]').click({ position: { x: 150, y: 260 } });
  await page.waitForTimeout(280);
  if (!(await page.locator('.reel-slide[data-current="true"] video').evaluate((video) => video.paused))) issues.push('single tap did not pause');
  await page.locator('.reel-slide[data-current="true"]').dblclick({ position: { x: 150, y: 260 } });
  const currentSlide = page.locator('.reel-slide[data-current="true"]');
  if (await currentSlide.getByRole('button', { name: '点赞' }).getAttribute('aria-pressed') !== 'true') issues.push('double tap did not like');
  await currentSlide.getByRole('button', { name: '收藏' }).click();
  await currentSlide.click({ position: { x: 150, y: 260 } });
  await page.waitForTimeout(280);
  await currentSlide.getByRole('button', { name: '评论' }).click();
  await page.getByText('演示评论仅用于确认底部抽屉交互。').waitFor();
  if (!(await page.locator('.reel-slide[data-current="true"] video').evaluate((video) => video.paused))) issues.push('video did not pause behind comments');
  await page.getByRole('button', { name: '关闭' }).click();
  await page.locator('.sheet-layer').waitFor({ state: 'hidden' });
  await page.locator('.reels-feed').evaluate((element) => element.scrollTo({ top: element.clientHeight, behavior: 'instant' }));
  await page.waitForTimeout(450);
  if (await page.locator('.reel-slide[data-current="true"]').getAttribute('data-current') !== 'true') issues.push('vertical reel snap failed');
  await page.getByRole('button', { name: '首页', exact: true }).click();
  await page.getByRole('button', { name: '刷剧', exact: true }).click();
  if (await page.locator('.reel-slide').first().getByRole('button', { name: '收藏' }).getAttribute('aria-pressed') !== 'true') issues.push('reel session state not retained');
  if (!(await page.getByRole('slider', { name: '播放进度' }).first().isVisible())) issues.push('reel progress control missing');
  await context.close();
}

// Desktop phone preview and external replay control.
{
  const context = await browser.newContext({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 1 });
  await context.addInitScript(() => sessionStorage.setItem('aiai-app-intro-seen', '1'));
  const page = await context.newPage();
  page.on('console', (msg) => { if (msg.type() === 'error') issues.push(`console:desktop:${msg.text()}`); });
  page.on('pageerror', (error) => issues.push(`page:desktop:${error.message}`));
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '430' }).click();
  await page.getByRole('button', { name: '新用户' }).click();
  await page.getByRole('button', { name: '重播品牌开屏' }).click();
  await page.waitForTimeout(1150);
  await page.screenshot({ path: `${out}/desktop-replay.png` });
  await page.locator('.splash').waitFor({ state: 'hidden', timeout: 4000 });
  await page.screenshot({ path: `${out}/desktop-demo-controls.png` });
  await context.close();
}

await browser.close();
console.log(JSON.stringify({ ok: issues.length === 0, issues }, null, 2));
if (issues.length) process.exitCode = 1;
