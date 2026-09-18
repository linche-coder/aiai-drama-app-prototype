import {chromium,expect} from '@playwright/test';import{mkdir,writeFile}from'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-gpu','--renderer-process-limit=2']});const results=[];
await mkdir('docs/screenshots/auth-fix',{recursive:true});
try{for(const width of [360,390,430]){
 const page=await browser.newPage({viewport:{width,height:844}});await page.addInitScript(()=>sessionStorage.setItem('aiai-app-intro-seen','1'));
 await page.goto('http://127.0.0.1:5173/#/me');await expect(page.getByRole('button',{name:'登录',exact:true})).toBeVisible();
 await page.evaluate(()=>{window.__samples=[];window.__record=true;const record=()=>{const e=document.querySelector('.app-scroller'),p=document.querySelector('.profile-head');window.__samples.push([e.scrollTop,p.getBoundingClientRect().top,document.querySelector('.phone-surface').scrollTop]);if(window.__record)requestAnimationFrame(record);};record();});
 await page.getByRole('button',{name:'登录',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.waitForTimeout(800);
 await expect(page.locator('.auth-logo')).toBeVisible();await expect(page.locator('.auth-brand')).not.toContainText('好故事，一眼入戏');
 await expect(page.getByRole('button',{name:'关闭',exact:true})).toBeFocused();
 await page.getByRole('button',{name:'注册新账号'}).click();await expect(page.getByRole('dialog',{name:'注册账号'}).locator('.auth-logo')).toBeVisible();
 await page.getByRole('button',{name:'返回登录'}).click();await page.getByRole('button',{name:'忘记密码？'}).click();await expect(page.getByRole('dialog',{name:'找回密码'}).locator('.auth-logo')).toBeVisible();
 await page.screenshot({path:'docs/screenshots/auth-fix/forgot-'+width+'.png'});
 await page.getByRole('button',{name:'返回登录'}).click();await page.screenshot({path:'docs/screenshots/auth-fix/login-'+width+'.png'});
 await page.getByRole('button',{name:'关闭',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
 const sample=await page.evaluate(()=>{window.__record=false;return window.__samples;});const ranges=[0,1,2].map(i=>Math.max(...sample.map(s=>s[i]))-Math.min(...sample.map(s=>s[i])));ranges.forEach(r=>expect(r).toBeLessThan(.5));
 results.push({width,backgroundMovement:ranges,frames:sample.length});await page.close();
}await writeFile('docs/auth-fix-verification.json',JSON.stringify({ok:true,results},null,2));console.log(JSON.stringify({ok:true,results}));}finally{await browser.close();}