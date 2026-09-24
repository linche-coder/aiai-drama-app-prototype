import { useState } from 'react';
import { ArrowRight, CalendarDays, Check, Clock3, Coins, Crown, ReceiptText, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../state/appState';
import { products, festivalBonus, money, type Product } from '../data/membershipOffers';
import { festivalPhase } from '../data/festival';
import { PageShell, ErrorState } from './Common';
import { Sheet } from './Sheets';
import { useResource } from '../hooks/useResource';
import { api, messageOf } from '../services/api';
import { MembershipEmblem } from './MembershipEmblem';

type PointsSummary = { summary: { balance: number; memberBalance: number; paidViewActive: boolean; permanentMember: boolean; membershipExpiresAt: string | null; trialActive: boolean } };
type Trial = { status: 'available'|'active'|'expired'|'claimed'|'ineligible'; startsAt: string|null; expiresAt: string|null };
const positions = ['入门畅看', '中期畅看', '长期权益'];

export function MembershipPage({ navigate, onBack }: { navigate: (path: string) => void; onBack: () => void }) {
  const { session, login } = useApp(), points = useResource<PointsSummary>(session?.subject ? '/me/points' : null), trial = useResource<{ trial: Trial }>(session?.subject ? '/me/overview' : null);
  const [selected, setSelected] = useState<Product | null>(null), [trialBusy, setTrialBusy] = useState(false), [trialError, setTrialError] = useState('');
  const membership = session?.membership as ({ expiresAt: string | null; permanent?: boolean } | null | undefined);
  const lifetime = membership?.permanent || points.data?.summary.permanentMember, expiry = membership?.expiresAt || points.data?.summary.membershipExpiresAt;
  const status = !session?.subject ? '未登录' : lifetime ? '永久会员' : points.data?.summary.paidViewActive ? '畅看会员' : '免费用户';
  const trialState = trial.data?.trial;
  const claimTrial = async () => { if (!session?.subject) return login(); setTrialBusy(true); setTrialError(''); try { await api('/me/trial', 'POST', { source: 'app' }); trial.reload(); points.reload(); } catch (e) { setTrialError(messageOf(e)); } finally { setTrialBusy(false); } };
  const plans = products.filter(p => p.kind === 'membership');
  return <div className="membership-page latest-membership membership-showcase"><PageShell title="畅看会员" onBack={onBack}>
    <div className="member-universe" aria-hidden="true"><i/><i/><i/></div>
    <header className="membership-intro"><Sparkles className="member-spark"/><div className="vip-emblem"><Crown size={46}/></div><h2><span>爱爱短剧</span> 畅看会员</h2><p>会员期内畅看不扣积分 · 永久积分按需购买</p></header>
    <section className="member-status-card membership-account"><div className="member-avatar"><Crown/></div><div className="member-account-copy"><div className="member-account-title"><h3>{session?.subject ? session.nickname || '爱爱短剧用户' : '登录后查看会员权益'}</h3><span><Crown size={14}/>{status}</span></div>{expiry && !lifetime && <p><CalendarDays size={14}/>有效期至 {new Date(expiry).toLocaleDateString('zh-CN')}</p>}<div className="member-balances"><button onClick={() => navigate('/me/points')}>永久积分 <strong>{points.loading ? '…' : points.error ? '暂不可用' : points.data?.summary.balance ?? 0}</strong></button><button onClick={() => navigate('/me/points?tab=member')}>会员积分 <strong>{points.loading ? '…' : points.error ? '暂不可用' : points.data?.summary.memberBalance ?? 0}</strong></button></div></div>{points.error && <ErrorState error="积分服务暂时不可用" retry={points.reload}/>}<button className="member-order-button" onClick={() => navigate('/me/orders')}><ReceiptText size={17}/>我的订单 <ArrowRight size={15}/></button></section>
    <section className="trial-card membership-trial"><span className="trial-clock"><Clock3/><i>24h</i></span><div><small>限时体验</small><h3>24 小时免费畅看</h3><p>{!session?.subject ? '登录后查看领取资格' : lifetime ? '永久会员已享畅看权益' : trial.loading ? '正在加载体验状态…' : trial.error ? '体验资格暂时无法获取' : trialState?.status === 'active' ? `体验中 · 至 ${trialState.expiresAt ? new Date(trialState.expiresAt).toLocaleString('zh-CN') : '服务端确认'}` : trialState?.status === 'available' ? (session.tier === 'free' ? '免费用户可领取一次，不支付、不自动扣款' : '领取后当前会员有效期增加 1 天') : '领取机会已使用或不符合资格'}</p>{trialError && <p role="alert">{trialError}</p>}</div><button disabled={trialBusy || !!lifetime || !!session?.subject && trialState?.status !== 'available'} onClick={() => void claimTrial()}>{!session?.subject ? '登录领取' : trialBusy ? '领取中…' : trialState?.status === 'available' ? '立即领取' : '不可领取'}<ArrowRight size={15}/></button></section>
    <p className="membership-free-note">免费用户可直接观看免费剧集；付费单集使用永久积分解锁。签到积分不提供会员专区权限。</p>
    <section className="latest-plan-grid recharge-tiers" aria-label="畅看会员方案">{plans.map((plan, index) => <article key={plan.id} className={`latest-plan-card recharge-card recharge-tone-${index}`}><header><MembershipEmblem level={index}/><h3>{plan.title}</h3><small>{positions[index]}</small></header><div className="latest-price"><small>¥</small>{money(plan.price)}<em>/{plan.durationDays ? `${plan.durationDays} 天` : '永久'}</em></div><p className="plan-pill">{plan.durationDays ? '观看不扣积分 · 每日签到领会员积分' : '无到期日 · 观看不扣积分'}</p>{festivalPhase() === 'active' && festivalBonus[plan.id] && <p className="festival-plan-bonus">双节活动额外赠 <b>{festivalBonus[plan.id]}</b> 天畅看</p>}<div className="plan-rule"/><ul>{plan.benefits.map(value => <li key={value}><span><Check size={12}/></span>{value}</li>)}</ul><button className="recharge-cta" disabled={!!lifetime} onClick={() => !session?.subject ? login() : navigate('/checkout?plan=' + plan.id)}>{lifetime ? '已享永久权益' : `选择${plan.title}`}<ArrowRight size={17}/></button></article>)}</section>
    <section className="points-offer membership-credits"><div><small>按需补充</small><h3><Coins/> 永久积分</h3><p>积分永不过期，可重复购买。</p><span>免费用户付费单集 5 积分；不能换取会员专区权限。</span></div><strong><b>220 永久积分</b>¥10.9</strong><button onClick={() => setSelected(products.find(p => p.id === 'points-220')!)}>购买永久积分 <ArrowRight size={15}/></button></section>
    <nav className="membership-service-links"><button onClick={() => navigate('/me/orders')}>我的订单 <ArrowRight size={14}/></button><button onClick={() => navigate('/membership-guide')}>会员与积分说明 <ArrowRight size={14}/></button></nav><p className="membership-payment-note"><ShieldCheck size={14}/>支付前请核对商品、金额及账户；18+专区仍需确认年满18周岁。</p>
  </PageShell><Sheet open={!!selected} title="购买永久积分" onClose={() => setSelected(null)}><div className="offer-order-summary"><h3>{selected?.title}</h3><strong>¥{selected && money(selected.price)}</strong><p role="status">购买需要服务端创建真实订单；当前不会在本地伪造积分到账。</p><button className="primary-button" onClick={() => { setSelected(null); navigate('/checkout?plan=points-220'); }}>获取服务端报价</button><button className="secondary-button" onClick={() => setSelected(null)}><RefreshCw size={15}/>稍后再说</button></div></Sheet></div>;
}
