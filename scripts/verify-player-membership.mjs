import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch({channel:'chrome',headless:true,args:['--disable-gpu','--renderer-process-limit=2']});
const base = process.env.APP_TEST_URL || 'http://127.0.0.1:5173';
const out = 'docs/screenshots/player-membership';
await mkdir(out,{recursive:true});
const results=[], faults=[], evidence=[];
async function test(name,fn){try{await fn();results.push({name,ok:true});}catch(e){results.push({name,ok:false,error:e.message});}console.log(JSON.stringify(results.at(-1)));}
async function create(width=390,height=844){const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});await context.addInitScript(()=>sessionStorage.setItem('aiai-app-intro-seen','1'));const page=await context.newPage();page.on('pageerror',e=>faults.push(e.message));return{context,page};}
async function go(page,path){await page.goto(base+'/#'+path);await page.waitForTimeout(120);}
const shot=(page,name)=>page.screenshot({path:out+'/'+name+'.png'});
const guest={subject:null,tier:'free',roles:[],expiresAt:null};
function account(tier='free',expired=false){return{subject:'test-'+tier,nickname:'验收用户',tier,roles:[],expiresAt:null,membership:tier==='free'?null:{level:5,growth:1280,nextLevelGrowth:2000,expiresAt:expired?'2020-01-01T00:00:00Z':'2027-09-18T00:00:00Z'}};}
async function mock(page,initial=guest,{media=true}={}){
 let session=initial, quoteCalls=0, orderCalls=0;const calls=[];
 await page.route('**/api/v1/**',async route=>{
 const r=route.request(),u=new URL(r.url()),p=u.pathname.replace('/api/v1',''),method=r.method(),body=r.postDataJSON();calls.push({p,method,body});
 let result={},status=200;
 if(p==='/session') result=session;
 else if(p==='/auth/sign-in'){session=account();result=session;}
 else if(p==='/green/contents/drama-08/playback'&&media)result={contentId:'drama-08',sources:[{src:'/media/demo/portrait.mp4',type:'video/mp4'}],expiresAt:'2027-09-18T00:00:00Z',previewEpisodeIds:['1','2'],adFree:true};
 else if(p.endsWith('/playback')){status=403;result={code:'access_denied'};}
 else if(p.startsWith('/comments'))result={items:[],cursor:null};
 else if(p==='/membership/quotes'){quoteCalls++;result={id:'q-'+quoteCalls,planId:body.planId,total:29,currency:'CNY',expiresAt:'2027-09-18T00:00:00Z',autoRenew:false};}
 else if(p==='/orders'&&method==='POST'){orderCalls++;await new Promise(r=>setTimeout(r,180));result={orderId:'order-test',checkoutUrl:'/payment-result?orderId=order-test'};}
 else if(p.startsWith('/orders/'))result={id:'order-test',status:'pending',total:29,currency:'CNY',createdAt:new Date().toISOString()};
 else if(['/orders','/me/watch-progress','/me/notifications','/me/comments','/support/tickets'].includes(p))result=method==='GET'?[]:{};
 else if(p==='/me/profile')result={id:session.subject,nickname:'验收用户',bio:'',avatarUrl:null};
 else if(p.includes('/contents/'))result={preview_episode_ids:['1','2']};
 else {status=503;result={};}
 await route.fulfill({status,contentType:'application/json',body:JSON.stringify(result)});
 });
 return{calls,get orderCalls(){return orderCalls;}};
}
async function ready(page){await expect.poll(()=>page.locator('video').evaluate(v=>v.readyState)).toBeGreaterThanOrEqual(2);}
async function checkControls(page){
 const result=await page.locator('.player-episode-control').evaluate(el=>{const buttons=[...el.querySelectorAll('button')].map(n=>{const r=n.getBoundingClientRect();return{x:r.x,right:r.right,y:r.y,bottom:r.bottom,width:r.width,height:r.height};});return{buttons,width:innerWidth,overlap:buttons.some((r,i)=>i&&r.x<buttons[i-1].right-1)};});
 expect(result.overlap).toBe(false);for(const r of result.buttons){expect(r.width).toBeGreaterThanOrEqual(43);expect(r.height).toBeGreaterThanOrEqual(43);expect(r.x).toBeGreaterThanOrEqual(-1);expect(r.right).toBeLessThanOrEqual(result.width+1);}
}
for(const width of [360,390,430])await test('播放器真实媒体与布局 '+width,async()=>{const{page,context}=await create(width);try{
 const backend=await mock(page);await go(page,'/play/drama-08?episode=1');await ready(page);
 expect(await page.locator('.player-compose,.player-cover-follow,.danmaku-note').count()).toBe(0);
 await expect(page.locator('.player-social button')).toHaveCount(4);await checkControls(page);
 await page.locator('video').evaluate(v=>v.pause());
 await page.getByRole('button',{name:'播放倍速 1.0×',exact:true}).click();
 await page.getByRole('radio',{name:'1.5×',exact:true}).click();
 await expect(page.getByRole('button',{name:'播放倍速 1.5×',exact:true})).toBeVisible();
 expect(await page.locator('video').evaluate(v=>v.playbackRate)).toBe(1.5);
 const timing=await page.locator('video').evaluate(async v=>{v.currentTime=1;const start=performance.now();await v.play();const from=v.currentTime;await new Promise(r=>setTimeout(r,850));const advance=v.currentTime-from;v.pause();return{advance,elapsed:(performance.now()-start)/1000,rate:v.playbackRate};});
 expect(timing.advance).toBeGreaterThan(.8);evidence.push({width,timing});
 await page.locator('video').evaluate(v=>{v.currentTime=2;window.__testedVideo=v;});
 await page.getByRole('button',{name:'进入全屏',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(true);
 await page.getByRole('button',{name:'播放倍速 1.5×',exact:true}).click();await page.getByRole('radio',{name:'2.0×',exact:true}).click();
 expect(await page.locator('video').evaluate(v=>v.playbackRate)).toBe(2);
 await page.getByRole('button',{name:'退出全屏',exact:true}).click();await expect.poll(()=>page.evaluate(()=>document.fullscreenElement===null)).toBe(true);
 expect(await page.locator('video').evaluate(v=>v===window.__testedVideo)).toBe(true);
 expect(await page.locator('video').evaluate(v=>v.currentTime)).toBeCloseTo(2,0);
 await page.getByRole('button',{name:'进入全屏',exact:true}).click();await page.keyboard.press('Escape');
 await expect(page.getByRole('button',{name:'进入全屏',exact:true})).toBeVisible();await expect(page.locator('.reference-player')).toBeVisible();
 await page.getByRole('button',{name:'下一集',exact:true}).click();await ready(page);expect(await page.locator('video').evaluate(v=>v.playbackRate)).toBe(2);
 await page.getByRole('button',{name:'重新加载视频',exact:true}).click();await ready(page);expect(await page.locator('video').evaluate(v=>v.playbackRate)).toBe(2);
 await page.getByRole('button',{name:'评论',exact:true}).click();await expect(page.getByRole('dialog',{name:'剧情讨论'})).toBeVisible();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'播放设置',exact:true}).click();await expect(page.getByRole('radio',{name:'2.0×',exact:true})).toBeChecked();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'收藏',exact:true}).click();await expect(page.getByRole('button',{name:'收藏',exact:true})).toHaveAttribute('aria-pressed','true');
 await shot(page,'player-'+width+'-test-media');
 expect(backend.calls.some(c=>c.p.endsWith('/playback')&&c.body?.episodeId==='2')).toBe(true);
 }finally{await context.close();}});
await test('横屏、倍速预选、全屏不可用与实际接口错误',async()=>{const{page,context}=await create(844,390);try{
 await mock(page,guest,{media:false});await go(page,'/play/drama-08?episode=1');await expect(page.getByText('本集需要解锁')).toBeVisible();await checkControls(page);
 await page.getByRole('button',{name:'播放倍速 1.0×',exact:true}).click();await page.getByRole('radio',{name:'1.25×',exact:true}).click();await expect(page.getByRole('button',{name:'播放倍速 1.25×',exact:true})).toBeVisible();
 await page.evaluate(()=>{Object.defineProperty(document,'fullscreenEnabled',{configurable:true,value:false}); const root=document.querySelector('.reference-player'); root.requestFullscreen=undefined; root.webkitRequestFullscreen=undefined;});
 await page.getByRole('button',{name:'进入全屏',exact:true}).click();await expect(page.getByText(/此浏览器暂不支持全屏/)).toBeVisible();
 expect(await page.locator('video').count()).toBe(0);await shot(page,'player-landscape-restricted');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
 }finally{await context.close();}
 const other=await create();try{await go(other.page,'/play/private-preview-2?episode=2');await expect(other.page.getByText('请先完成专区访问确认')).toBeVisible();await other.page.getByRole('button',{name:'前往专区'}).click();await other.page.getByRole('button',{name:/确认并进入/}).click();await go(other.page,'/play/private-preview-2?episode=2');await expect(other.page.getByText('播放服务尚未连接，暂时无法获取本集片源。')).toBeVisible();await shot(other.page,'private-player-390-service-error');await other.page.getByRole('button',{name:'重新加载',exact:true}).click();await expect(other.page.getByText('暂时无法播放')).toBeVisible();}finally{await other.context.close();}
});
for(const width of [360,390,430])await test('会员价格/积分/周期/安全区 '+width,async()=>{const{page,context}=await create(width);try{
 const backend=await mock(page,account());await go(page,'/membership');
 await expect(page.locator('.membership-purchase')).toContainText('19.9');await expect(page.getByText('当前方案',{exact:true})).toBeVisible();
 await shot(page,'membership-'+width+'-monthly');
 await page.getByRole('radio',{name:/年度会员/}).check();await expect(page.locator('.membership-purchase')).toContainText('168');
 await page.getByRole('radio',{name:/尊享会员/}).check();await expect(page.locator('.membership-purchase')).toContainText('328');
 await expect(page.locator('.membership-benefits')).toContainText('年卡积分发放方式尚未配置');
 for(const [points,price] of [['60','6'],['200','18'],['580','45'],['1,500','98']]){await page.getByRole('radio',{name:new RegExp('^'+points+' 积分')}).check();await expect(page.locator('.membership-purchase')).toContainText('¥'+price);await expect(page.locator('.membership-purchase')).toContainText(points+' 积分包');}
 await page.getByRole('button',{name:'预览积分订单'}).click();await expect(page.getByRole('dialog',{name:'积分订单预览'})).toContainText('不订阅会员');await expect(page.getByRole('dialog')).toContainText('不可支付');await page.keyboard.press('Escape');
 await page.locator('.membership-page .subpage').evaluate(el=>el.scrollTop=el.scrollHeight);
 const bounds=await page.evaluate(()=>{const end=document.querySelector('.membership-end').getBoundingClientRect(),bar=document.querySelector('.membership-purchase').getBoundingClientRect(),nav=document.querySelector('.bottom-nav').getBoundingClientRect();return{end:end.bottom,barTop:bar.top,barBottom:bar.bottom,nav:nav.top,overflow:document.documentElement.scrollWidth-innerWidth};});
 expect(bounds.end).toBeLessThanOrEqual(bounds.barTop);expect(bounds.barBottom).toBeLessThanOrEqual(bounds.nav+1);expect(bounds.overflow).toBeLessThanOrEqual(1);
 await shot(page,'membership-'+width+'-bottom');
 expect(backend.calls.filter(c=>c.p==='/orders'&&c.method==='POST')).toHaveLength(0);
 }finally{await context.close();}});
await test('访客登录恢复选择、有效/过期会员、演示订单隔离',async()=>{const{page,context}=await create();try{
 const backend=await mock(page);await go(page,'/membership');await expect(page.locator('.member-brand')).toContainText('未登录');
 await page.getByRole('radio',{name:/年度会员/}).check();await page.getByRole('radio',{name:/尊享会员/}).check();await page.getByRole('button',{name:'预览立即开通'}).click();
 await page.getByPlaceholder('请输入用户名 / 手机号 / 邮箱').fill('test');await page.getByPlaceholder('请输入密码').fill('password123');await page.getByRole('dialog').getByRole('checkbox').check();await page.getByRole('dialog').getByRole('button',{name:'登录',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'会员订单预览'})).toContainText('尊享会员年卡');await expect(page.getByRole('dialog',{name:'登录爱爱短剧'})).toHaveCount(0);await expect(page.getByRole('dialog',{name:'会员订单预览'})).toContainText('328');await shot(page,'membership-order-preview-390');await page.keyboard.press('Escape');
 await page.reload();await expect(page.getByRole('radio',{name:/年度会员/})).toBeChecked();await expect(page.locator('.membership-purchase')).toContainText('328');
 await go(page,'/checkout?plan=demo-v2-prestige-year');await expect(page.getByText('此商品暂不可支付')).toBeVisible();expect(backend.calls.some(c=>c.p==='/orders'&&c.method==='POST')).toBe(false);
 }finally{await context.close();}
 for(const expired of [false,true]){const next=await create();try{await mock(next.page,account('premium',expired));await go(next.page,'/membership');await expect(next.page.locator('.member-brand')).toContainText(expired?'会员已到期':'高级会员 · 原方案');await expect(next.page.locator('.membership-purchase')).toContainText(expired?'预览重新开通':'预览新方案');await shot(next.page,expired?'membership-expired-390':'membership-active-390');}finally{await next.context.close();}}
});
await test('原商品报价失败重试、价格变化、重复点击与支付取消/失败',async()=>{const{page,context}=await create();try{
 const backend=await mock(page,account());await go(page,'/checkout?plan=basic-month&expected=19');
 let first=true;
 await page.route('**/api/v1/membership/quotes',async route=>{if(first){first=false;await route.fulfill({status:503,contentType:'application/json',body:'{}'});}else await route.fallback();});
 await page.getByRole('button',{name:'获取最新报价'}).click();await expect(page.locator('.error-state')).toBeVisible();await page.getByRole('button',{name:'重新加载',exact:true}).click();
 await expect(page.getByText('报价已变化：¥19.00 → ¥29.00')).toBeVisible();await expect(page.getByRole('button',{name:'提交订单并前往支付'})).toBeDisabled();
 await page.getByRole('checkbox',{name:'我已确认最新金额'}).check();await page.getByRole('button',{name:'提交订单并前往支付'}).evaluate(button=>{button.click();button.click();});
 await expect(page.getByRole('heading',{name:'待支付',exact:true})).toBeVisible();expect(backend.orderCalls).toBe(1);
 await go(page,'/payment-result?orderId=order-test&status=cancelled');await expect(page.getByText(/支付操作已取消/)).toBeVisible();await expect(page.getByRole('heading',{name:'待支付',exact:true})).toBeVisible();
 await page.route('**/api/v1/orders/order-test',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({id:'order-test',status:'failed',total:29,currency:'CNY',createdAt:new Date().toISOString()})}));
 await page.getByRole('button',{name:'刷新订单状态'}).click();await expect(page.getByRole('heading',{name:'支付失败',exact:true})).toBeVisible();
 }finally{await context.close();}});
await test('五档倍速、未就绪预选、实际横屏与独立续费确认',async()=>{
 const {page,context}=await create();try{
 await mock(page,account());let available=false;
 await page.route('**/api/v1/green/contents/drama-08/playback',async route=>{if(!available)await route.fulfill({status:503,contentType:'application/json',body:'{}'});else await route.fallback();});
 await go(page,'/play/drama-08?episode=1');await expect(page.getByText('暂时无法播放')).toBeVisible();
 await page.getByRole('button',{name:/播放倍速/}).click();await page.locator('.speed-options input[value="0.75"]').click();available=true;
 await page.getByRole('button',{name:'重新加载',exact:true}).click();await ready(page);expect(await page.locator('video').evaluate(v=>v.playbackRate)).toBe(.75);
 await page.locator('video').evaluate(v=>v.play());
 for(const rate of [.75,1,1.25,1.5,2]){await page.getByRole('button',{name:/播放倍速/}).click();await expect(page.locator('.speed-options input')).toHaveCount(5);await page.locator('.speed-options input[value="'+rate+'"]').click();await expect(page.getByRole('dialog')).toHaveCount(0);expect(await page.locator('video').evaluate(v=>v.playbackRate)).toBe(rate);expect(await page.locator('video').evaluate(v=>v.paused)).toBe(false);}
 await page.setViewportSize({width:844,height:390});await checkControls(page);await shot(page,'player-landscape-test-media');
 const sizes=await page.locator('.player-stage').evaluate(el=>{const a=el.getBoundingClientRect(),b=document.querySelector('.player-bottom').getBoundingClientRect(),s=document.querySelector('.player-social').getBoundingClientRect();return{stageBottom:a.bottom,barTop:b.top,socialBottom:s.bottom,overflow:document.documentElement.scrollWidth-innerWidth};});
 expect(sizes.stageBottom).toBeLessThanOrEqual(sizes.barTop);expect(sizes.socialBottom).toBeLessThanOrEqual(sizes.barTop);expect(sizes.overflow).toBeLessThanOrEqual(1);
 await page.route('**/api/v1/membership/quotes',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({id:'q-renew',planId:'basic-month',total:29,currency:'CNY',expiresAt:'2027-09-18T00:00:00Z',autoRenew:true,renewalDescription:'每月29元；下一周期扣款前可取消'})}));
 await go(page,'/checkout?plan=basic-month&expected=19');await page.getByRole('button',{name:'获取最新报价'}).click();await page.getByRole('checkbox',{name:'我已确认最新金额'}).check();
 await expect(page.getByRole('checkbox',{name:'我已阅读并同意上述自动续费规则'})).not.toBeChecked();await expect(page.getByRole('button',{name:'提交订单并前往支付'})).toBeDisabled();
 await page.getByRole('checkbox',{name:'我已阅读并同意上述自动续费规则'}).check();await expect(page.getByRole('button',{name:'提交订单并前往支付'})).toBeEnabled();
 }finally{await context.close();}
});

await browser.close();
const report={ok:results.every(r=>r.ok)&&!faults.length,base,results,errors:faults,mediaEvidence:evidence,scope:'Media responses are intercepted for public drama-08 only; actual MP4 decoding and fullscreen are tested. No protected-media access or actual purchase.'};
await writeFile('docs/player-membership-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.ok)process.exitCode=1;




