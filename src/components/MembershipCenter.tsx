import { useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronRight, Crown, Gem, Coins } from 'lucide-react';
import { useApp } from '../state/appState';
import { dateText } from '../services/api';
import { families, creditPacks, membershipOffer, creditsOffer, money, type OfferFamily, type OfferPeriod } from '../data/membershipOffers';
import { PageShell } from './Common';
import { Sheet } from './Sheets';

type Selection = { family: OfferFamily; period: OfferPeriod; kind: 'membership' | 'credits'; pack: number };
const initial: Selection = { family: 'joy', period: 'month', kind: 'membership', pack: 0 };
function loadSelection(): Selection {
  try { const v = JSON.parse(sessionStorage.getItem('aiai-membership-selection-v2') || 'null'); if (v && ['joy','prestige'].includes(v.family) && ['month','year'].includes(v.period) && ['membership','credits'].includes(v.kind) && Number.isInteger(v.pack) && v.pack >= 0 && v.pack < 4) return v; } catch {}
  return initial;
}
export function MembershipPage({ navigate, onBack }: { navigate: (path: string) => void; onBack: () => void }) {
  const { session, login } = useApp();
  const [selection, setSelection] = useState(loadSelection), [summary, setSummary] = useState(false), [pendingLogin, setPendingLogin] = useState(false);
  const { family, period, kind, pack } = selection;
  const offer = kind === 'credits' ? creditsOffer(pack) : membershipOffer(family, period);
  const expiry = session?.membership?.expiresAt;
  const expired = !!expiry && Number.isFinite(Date.parse(expiry)) && Date.parse(expiry) <= Date.now();
  const paid = session?.tier === 'basic' || session?.tier === 'premium';
  const status = !session?.subject ? '未登录' : expired ? '会员已到期' : paid ? (session.tier === 'premium' ? '高级会员' : '基础会员') : '免费用户';
  const action = kind === 'credits' ? '购买积分' : expired ? '重新开通' : paid ? '查看方案' : '立即开通';
  const select = (patch: Partial<Selection>) => { setSummary(false); setSelection(v => ({ ...v, ...patch })); };
  const purchase = () => { if (!session?.subject) { setPendingLogin(true); login(); } else setSummary(true); };
  useEffect(() => { try { sessionStorage.setItem('aiai-membership-selection-v2', JSON.stringify(selection)); } catch {} }, [selection]);
  useEffect(() => { if (pendingLogin && session?.subject) { setPendingLogin(false); setSummary(true); } }, [pendingLogin, session?.subject]);
  return <div className="membership-page membership-showcase">
    <PageShell title="会员中心" onBack={onBack}>
      <div className="membership-intro"><div className="vip-emblem" aria-hidden="true"><i/><Crown size={40}/><i/></div><h2><em>爱爱短剧</em> 会员方案</h2><p>会员每月送积分，精彩剧集按需解锁</p></div>
      <section className="member-brand"><span>{status}</span>{paid && expiry && <small>{expired ? '已于 ' : '有效期至 '}{dateText(expiry)}</small>}</section>
      <fieldset className="period-switch"><legend className="sr-only">会员周期</legend>{(['month','year'] as const).map(p => <label key={p}><input type="radio" name="membership-period" checked={period === p} onChange={() => select({ period: p, kind: 'membership' })}/><span>{p === 'month' ? '月度会员' : '年度会员'}</span></label>)}</fieldset>
      <fieldset className="membership-options"><legend className="sr-only">会员套餐</legend>{(['joy','prestige'] as const).map(f => { const value = membershipOffer(f, period); return <label className={'membership-option ' + f} key={f}><input type="radio" name="membership-family" aria-label={families[f].name} checked={family === f && kind === 'membership'} onChange={() => select({ family: f, kind: 'membership' })}/><span className="membership-option-surface">{f === 'joy' && <span className="recommended"><Crown size={11}/>推荐</span>}<span className="option-title">{f === 'joy' ? <Crown size={18}/> : <Gem size={18}/>}<strong>{families[f].name}</strong></span><span className="option-price"><small>¥</small><b>{money(value.price)}</b><small>/{period === 'year' ? '年' : '月'}</small></span><span className="credit-pill">{value.credits} <small>积分/月</small></span><span className="plan-benefits">{families[f].benefits.map(b => <span key={b}><Check size={14}/>{b}</span>)}</span><span className="plan-select-label">{family === f && kind === 'membership' ? <><Check size={14}/>已选择</> : '选择方案'}</span></span></label>; })}</fieldset>
      <section className="free-comparison"><div><strong>免费用户</strong><span><b>¥0</b> · 40 积分/月</span></div><p>短剧可看 · 前段剧集免费<br/>积分解锁后续剧集 · 1 台设备</p><button className="free-plan-state" disabled={!!session?.subject && (!paid || expired)} onClick={() => navigate('/')}>{session?.subject && (!paid || expired) ? '当前方案' : '免费开始'}</button></section>
      <section className="credits-section"><header><h3>积分不够？<em>按需补充</em></h3><Coins size={23}/></header><fieldset className="credit-pack-grid"><legend className="sr-only">积分包</legend>{creditPacks.map((value, index) => <label key={value.credits}><input type="radio" name="credit-pack" aria-label={value.credits + ' 积分'} checked={kind === 'credits' && pack === index} onChange={() => select({ kind: 'credits', pack: index })}/><span><strong>{value.credits.toLocaleString()}<small> 积分</small></strong><b>¥{money(value.price)}</b><i><Check size={12}/></i></span></label>)}</fieldset></section>
      <section className="annual-offers"><h3>年卡更省</h3>{(['joy','prestige'] as const).map(f => <button key={f} className={f} onClick={() => select({ family: f, period: 'year', kind: 'membership' })}><span>{f === 'joy' ? '悦享年卡' : '尊享年卡'}<small>按月购买 ¥{families[f].yearlyComparison}</small></span><strong>¥{families[f].yearly}<small>/年</small></strong><ChevronRight size={16}/></button>)}</section>
      <p className="membership-end">18+专区需完成年龄与地区验证</p>
    </PageShell>
    <footer className={'membership-purchase ' + (kind === 'membership' ? family : 'credits')}><div aria-live="polite"><small>{offer.title}</small><strong><small>¥</small>{money(offer.price)}<span>/{kind === 'credits' ? '次' : period === 'year' ? '年' : '月'}</span></strong></div><button onClick={purchase}>{action}<ArrowRight size={16}/></button></footer>
    <Sheet open={summary} title={kind === 'credits' ? '积分购买' : '开通会员'} onClose={() => setSummary(false)}><div className="offer-order-summary"><h3>{offer.title}</h3><strong>¥{money(offer.price)}<small> / {offer.period}</small></strong><p role="status">该方案暂未开放购买，当前不会创建订单或扣款。</p><button className="primary-button" onClick={() => setSummary(false)}>知道了</button></div></Sheet>
  </div>;
}
