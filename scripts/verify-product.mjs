import { chromium } from '@playwright/test';
const base = process.env.APP_TEST_URL || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const widths = [360,390,430];
const products = {
  'view-month': { title:'畅看月卡', total:88, durationDays:30, validity:'fixed' },
  'view-quarter': { title:'畅看季卡', total:188, durationDays:90, validity:'fixed' },
  'view-forever': { title:'永久会员', total:388, durationDays:null, validity:'permanent' },
  'points-220': { title:'220 永久积分', total:10.9, durationDays:null, validity:'permanent' },
};
async function mock(page){
 await page.addInitScript(()=>{sessionStorage.setItem('aiai-app-intro-seen','1');});
 await page.route('**/api/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace('/api/v1',''),method=req.method();let status=200,value={};
  if(path==='/session')value={subject:'verify-user',nickname:'验收用户',tier:'free',roles:[],expiresAt:null,membership:null};
  else if(path==='/me/points')value={summary:{balance:66,memberBalance:21,paidViewActive:false,permanentMember:false,membershipExpiresAt:null,checkedInToday:false,checkInType:null},transactions:[],memberTransactions:[],unlocks:[]};
  else if(path==='/me/overview')value={checkIn:{checkedInToday:false,rewardType:null,rewardAmount:0,streakDays:2,cycleDay:3,nextResetAt:'2026-09-24T16:00:00Z',rewards:Array.from({length:7},(_,i)=>({day:i+1,points:i===6?4:1,status:i<2?'claimed':i===2?'today':'upcoming'}))},trial:{status:'available',startsAt:null,expiresAt:null}};
  else if(path==='/festival')value={activityId:'midautumn-national-2026',phase:'active',claimed:false,appClaimed:false,invitationCode:'VERIFY2026',successfulInvites:2,rewardedInvites:2,participationReward:0,invitationReward:100,appReward:0,totalReward:100,permanentBalance:66,records:[]};
  else if(path==='/adult/consent'&&method==='POST')value={granted:true};
  else if(path==='/adult/consent'&&method==='DELETE')value={};
  else if(path==='/orders')value=[];
  else if(path==='/me/watch-progress'||path==='/me/comments'||path==='/me/notifications'||path==='/support/tickets')value=[];
  else if(path==='/me/profile')value={id:'verify-user',nickname:'验收用户',bio:'',avatarUrl:null};
  else if(path==='/membership/quotes'&&method==='POST'){const body=req.postDataJSON(),product=products[body.planId];if(!product){status=404;value={};}else value={id:'quote-'+body.planId,planId:body.planId,total:product.total,currency:'CNY',expiresAt:'2027-10-01T00:00:00Z',autoRenew:false,durationDays:product.durationDays,validity:product.validity};}
  else if(path.includes('/contents/')&&!path.endsWith('/playback'))value={preview_episode_ids:['1','2','3','4','5','6']};
  else {status=503;value={message:'service_unavailable'};}
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
 });
}
async function go(page,path){await page.goto(base+'#'+path);await page.waitForLoadState('domcontentloaded');await page.waitForTimeout(180);}
function assert(condition,message){if(!condition)throw new Error(message);}
try{
 for(const width of widths){
  const page=await browser.newPage({viewport:{width,height:844}});await mock(page);page.on('console',m=>{if(m.type()==='error')errors.push(`${width}: ${m.text()}`)});page.on('pageerror',e=>errors.push(`${width}: ${e.message}`));
  await go(page,'/');
  const nav=await page.locator('.bottom-nav button').allTextContents();assert(nav.join('|').includes('首页')&&nav.join('|').includes('刷剧')&&nav.join('|').includes('18+专区')&&nav.join('|').includes('追剧')&&nav.join('|').includes('我的'),'底部导航不完整');
  const home=await page.locator('.phone-surface').innerText();for(const old of ['排行榜','精选专题','免费专区','追更日历','本周热榜','编辑精选','猜你喜欢'])assert(!home.includes(old),`首页仍包含 ${old}`);
  assert(home.includes('月满中秋 · 礼遇国庆')&&home.includes('任务最高领 350 永久积分'),'首页轮播缺少双节活动入口');
  assert(await page.locator('.hero-festival-card .hero-festival-title').count()===1,'首页活动轮播缺少主文案图层');
  assert(home.includes('热门推荐')&&home.includes('最新更新'),'首页业务结构不完整');
  const overflow=await page.locator('.phone-surface').evaluate(el=>el.scrollWidth>el.clientWidth+1);assert(!overflow,`${width}px 存在横向溢出`);
  await go(page,'/membership');const membership=await page.locator('.membership-page').innerText();for(const expected of ['¥88','¥188','¥388','220 永久积分','¥10.9','24 小时免费畅看'])assert(membership.includes(expected),`会员页缺少 ${expected}`);assert(await page.locator('.recharge-emblem svg').count()===3,'会员方案缺少 WEB 分层徽章');for(const old of ['19.9','39.9','¥168','¥328','60 积分','200 积分','580 积分','1500 积分','年龄与地区'])assert(!membership.includes(old),`会员页仍含旧文案 ${old}`);
  await go(page,'/me/points');const points=await page.locator('.subpage').innerText();assert(points.includes('永久积分')&&points.includes('会员积分')&&points.includes('每日签到')&&points.includes('20 会员积分')&&points.includes('50 会员积分')&&points.includes('100 会员积分'),'积分页规则不完整');
  await go(page,'/festival');const festival=await page.locator('.subpage').innerText();assert(festival.includes('midautumn-national-2026')&&festival.includes('APP 专享 50 永久积分')&&festival.includes('畅看月卡')&&festival.includes('+7 天')&&festival.includes('+30 天'),'活动页内容不完整');assert(await page.locator('.festival-mobile-hero > div').count()===0,'活动横幅仍含左下角附加文案');assert(await page.getByRole('button',{name:/复制专属邀请链接/}).count()===1,'邀请好友模块缺少邀请按钮');
  await go(page,'/18plus');const confirm=page.getByRole('button',{name:/确认并进入/});assert(await confirm.isDisabled(),'年龄未勾选时按钮应禁用');const gate=await page.locator('.adult-gate').innerText();assert(!gate.includes('地区'),'年龄确认不应包含地区验证');await page.getByRole('checkbox',{name:'我已年满18周岁'}).check();await confirm.click();await page.waitForTimeout(100);assert(await page.locator('.adult-card').count()>=4,'专区首页未显示内容');await page.getByRole('tab',{name:'最新'}).click();assert(await page.locator('.adult-card').count()===20,'专区内容不是20部');assert(await page.getByRole('button',{name:'分享'}).count()===0,'专区不应提供公开分享按钮');
  await go(page,'/search');await page.getByPlaceholder('搜索剧名或题材').fill('盲人的秘密');assert((await page.locator('.search-results').innerText()).includes('没有找到相关剧目'),'普通搜索泄露18+内容');
  for(const path of ['/videos','/shorts','/comics','/help','/contact','/18plus/wishlist']){await go(page,path);assert(await page.locator('.phone-surface').isVisible(),`${path} 未正常渲染`);}
  for(const path of ['/free','/rankings','/collections','/collections/x','/updates','/settings']){await go(page,path);assert((await page.locator('.route-layer').innerText()).includes('页面已下线'),`${path} 未失效`);}
  await page.close();
 }
 assert(errors.length===0,'浏览器控制台错误：'+errors.join(' | '));
 console.log('PASS: WEB 1.4.3 sync routes, home, membership, points, festival, adult gate/catalog, search isolation, 360/390/430 layout');
}finally{await browser.close();}
