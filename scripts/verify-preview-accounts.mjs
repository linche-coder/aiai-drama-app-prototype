import { chromium, expect } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => sessionStorage.setItem('aiai-app-intro-seen','1'));
try {
 for (const [kind, name] of [['普通','普通用户 · 小夏'],['会员','会员用户 · 小夏']]) {
  await page.goto('http://127.0.0.1:5173/#/me');
  await page.getByRole('button',{name:'登录',exact:true}).click();
  await page.getByRole('button',{name:'填入'+kind+'账号'}).click();
  await page.getByRole('dialog').getByRole('button',{name:'登录',exact:true}).click();
  await expect(page.locator('.profile-head')).toContainText(name);
  await page.reload(); await expect(page.locator('.profile-head')).toContainText(name);
  await page.goto('http://127.0.0.1:5173/#/membership');
  await expect(page.locator('.member-brand')).toContainText(kind==='会员'?'高级会员':'免费用户');
  await page.screenshot({path:'docs/screenshots/parity/preview-account-'+(kind==='会员'?'vip':'user')+'.png'});
  await page.goto('http://127.0.0.1:5173/#/settings'); await page.getByRole('button',{name:'退出登录',exact:true}).click();
  await expect(page.getByRole('button',{name:'登录账号',exact:true})).toBeVisible();
 }
 console.log('PASS: ordinary/VIP login, refresh persistence, membership styles and logout');
} finally { await browser.close(); }

