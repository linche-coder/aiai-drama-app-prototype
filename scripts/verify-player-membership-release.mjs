import {chromium,expect} from '@playwright/test';
import{writeFile}from'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-gpu','--renderer-process-limit=2']});
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
await context.addInitScript(()=>sessionStorage.setItem('aiai-app-intro-seen','1'));
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/api/v1/**',async route=>{const p=new URL(route.request().url()).pathname;let data={subject:'test-release',tier:'free',nickname:'验收用户',roles:[]};if(p.endsWith('/playback'))data={contentId:'drama-08',sources:[{src:'/media/demo/portrait.mp4',type:'video/mp4'}],expiresAt:'2027-09-18T00:00:00Z',previewEpisodeIds:['1','2'],adFree:true};else if(p.includes('/comments'))data={items:[],cursor:null};else if(p.includes('watch-progress'))data=[];await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});});
try{
 await page.goto('http://127.0.0.1:4173/#/play/drama-08?episode=1');
 await expect.poll(()=>page.locator('video').evaluate(v=>v.readyState)).toBeGreaterThanOrEqual(2);
 await page.getByRole('button',{name:'进入全屏',exact:true}).click();
 await page.locator('.episode-pill').click();
 await page.getByRole('dialog').getByRole('button',{name:'第 2 集',exact:true}).click();
 await expect(page.getByText('第 2 集 / 共 32 集')).toBeVisible();await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(true);
 await expect.poll(()=>page.locator('video').evaluate(v=>v.readyState)).toBeGreaterThanOrEqual(2);
 await page.getByRole('button',{name:/播放倍速/}).click();await page.locator('.speed-options input[value="1.25"]').click();
 await page.locator('video').evaluate(v=>{v.pause();v.currentTime=2;window.__releaseVideo=v;});
 await page.evaluate(()=>document.exitFullscreen());
 await expect(page.getByRole('button',{name:'进入全屏',exact:true})).toBeVisible();
 const state=await page.locator('video').evaluate(v=>({same:v===window.__releaseVideo,rate:v.playbackRate,time:v.currentTime}));
 expect(state.same).toBe(true);expect(state.rate).toBe(1.25);expect(state.time).toBeCloseTo(2,0);
 await page.goto('http://127.0.0.1:4173/#/membership');
 await page.getByRole('radio',{name:/年度会员/}).check();await page.getByRole('radio',{name:/尊享会员/}).check();
 await page.screenshot({path:'docs/screenshots/player-membership/membership-390-annual.png'});
 await page.getByRole('radio',{name:/^200 积分/}).check();
 await page.screenshot({path:'docs/screenshots/player-membership/membership-390-credits.png'});
 expect(errors).toHaveLength(0);
 await writeFile('docs/player-membership-release.json',JSON.stringify({ok:true,base:'http://127.0.0.1:4173',checks:['生产产物：全屏中选集与倍速可操作','外部 fullscreenchange 退出同步且不重建媒体','媒体时间/倍速保留','减少动态效果模式','年卡与积分包截图'],state,errors},null,2));
 console.log('PASS: production fullscreen episode/speed sheets, external exit, same media/time/rate, reduced motion');
}finally{await browser.close();}

