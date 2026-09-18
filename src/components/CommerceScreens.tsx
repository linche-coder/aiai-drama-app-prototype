import { useEffect, useRef, useState } from 'react';
import { api, dateText, enc, messageOf, safeDecode, type Order } from '../services/api';
import { useApp } from '../state/appState';
import { useResource } from '../hooks/useResource';
import { legacyPlans } from '../data/membershipOffers';
import { PageShell, Empty, ErrorState } from './Common';

type Props = { route: string; navigate: (path: string) => void; onBack: () => void };
type Quote = { id: string; planId: string; total: number; currency: string; expiresAt: string; autoRenew?: boolean; renewalDescription?: string };
const orderStatus: Record<string, string> = { pending: '待支付', processing: '处理中', paid: '已支付', closed: '已关闭', refunding: '退款中', refunded: '已退款', cancelled: '已取消', failed: '支付失败' };
function Checkout({ route, navigate }: Pick<Props, 'route' | 'navigate'>) {
  const params = new URLSearchParams(route.split('?')[1] || ''), planId = params.get('plan') || '', plan = legacyPlans.find(p => p.id === planId);
  const expected = params.has('expected') ? Number(params.get('expected')) : null;
  const [quote, setQuote] = useState<Quote | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [acknowledged, setAcknowledged] = useState(false), [subscriptionAccepted, setSubscriptionAccepted] = useState(false);
  const lock = useRef(false), idem = useRef(crypto.randomUUID()), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const changed = !!quote && expected !== null && Number.isFinite(expected) && expected !== quote.total;
  async function refreshQuote() {
    if (lock.current || !plan) return;
    lock.current = true; setBusy(true); setError(''); setQuote(null); setAcknowledged(false); setSubscriptionAccepted(false);
    try {
      const q = await api<Quote>('/membership/quotes', 'POST', { planId });
      if (q.planId !== planId || !q.id || q.id.startsWith('demo-') || !Number.isFinite(q.total) || q.total <= 0 || q.currency !== 'CNY' || !Number.isFinite(Date.parse(q.expiresAt)) || Date.parse(q.expiresAt) <= Date.now()) throw new Error('报价信息无效，请重新获取。');
      setQuote(q); idem.current = crypto.randomUUID();
    } catch (e) { setError(messageOf(e)); } finally { lock.current = false; setBusy(false); }
  }
  async function submit() {
    if (lock.current || !plan || !quote || typeof quote.autoRenew !== 'boolean' || changed && !acknowledged || quote.autoRenew && !subscriptionAccepted || quote.autoRenew && !quote.renewalDescription) return;
    if (Date.parse(quote.expiresAt) <= Date.now()) { setError('报价已过期，请重新获取并确认。'); setQuote(null); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      const result = await api<{ orderId: string; checkoutUrl: string }>('/orders', 'POST', { quoteId: quote.id, idempotencyKey: idem.current });
      if (!result.orderId) throw new Error('订单返回信息不完整，请稍后在我的订单查询。');
      const target = new URL(result.checkoutUrl, location.origin);
      if (target.protocol !== 'https:' && !(target.origin === location.origin && target.protocol === location.protocol)) throw new Error('支付链接无效，请在订单页重试。');
      if (target.origin === location.origin && target.pathname === '/payment-result') navigate('/payment-result?orderId=' + enc(result.orderId));
      else window.location.assign(target.href);
    } catch (e) { setError(messageOf(e)); if (typeof e === 'object' && e && 'status' in e && e.status === 409) setQuote(null); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  if (!plan) return <Empty title="此商品暂不可支付" text="新会员方案和积分包仅供演示，不会使用旧商品 ID 进入支付。"><button className="secondary-button" onClick={() => navigate('/membership')}>返回会员中心</button></Empty>;
  return <div className="form-stack legacy-checkout"><span className="demo-summary-badge">原会员商品 · 与积分制方案不同</span><h2>{plan.title}</h2><p>{plan.description}</p><p className="muted">续费起始时间、有效期叠加和升级差价均以服务端订单规则为准。</p>{error && <ErrorState error={error} retry={() => void refreshQuote()}/>}
    {!quote ? <button className="primary-button" disabled={busy} onClick={() => void refreshQuote()}>{busy ? '获取报价中…' : '获取最新报价'}</button> : <>
      <div className="quote-card"><strong>¥ {quote.total.toFixed(2)}</strong><p>报价有效期至 {dateText(quote.expiresAt)}</p><p>{quote.autoRenew === false ? '单次购买 · 不自动续费' : quote.autoRenew === true ? '自动续费：' + (quote.renewalDescription || '详细续费规则待服务端提供') : '自动续费规则未提供，暂不能提交订单'}</p></div>
      {changed && <div className="quote-change" role="alert"><p>报价已变化：¥{expected?.toFixed(2)} → ¥{quote.total.toFixed(2)}</p><label><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)}/>我已确认最新金额</label></div>}
      {quote.autoRenew === true && <label className="subscription-consent"><input type="checkbox" checked={subscriptionAccepted} onChange={e => setSubscriptionAccepted(e.target.checked)}/>我已阅读并同意上述自动续费规则</label>}
      <button className="primary-button" disabled={busy || typeof quote.autoRenew !== 'boolean' || changed && !acknowledged || quote.autoRenew && !subscriptionAccepted || quote.autoRenew && !quote.renewalDescription} onClick={() => void submit()}>{busy ? '正在提交…' : '提交订单并前往支付'}</button>
      <button className="secondary-button" disabled={busy} onClick={() => void refreshQuote()}>重新获取报价</button>
    </>}<button className="text-button" onClick={() => navigate('/membership-guide')}>会员服务说明</button></div>;
}
export function CommercePage({ route, navigate, onBack }: Props) {
  const { session, login } = useApp(), path = route.split('?')[0], params = new URLSearchParams(route.split('?')[1] || '');
  const id = path.startsWith('/me/orders/') ? safeDecode(path.slice('/me/orders/'.length)) : params.get('orderId') || '';
  const isDetail = path.startsWith('/me/orders/');
  const endpoint = path === '/checkout' || isDetail && !id ? null : id ? '/orders/' + enc(id) : path === '/payment-result' ? null : '/orders';
  const resource = useResource<Order | Order[]>(session?.subject ? endpoint : null);
  const title = path === '/checkout' ? '确认订单' : path === '/payment-result' ? '支付结果' : isDetail ? '订单详情' : '我的订单';
  return <PageShell title={title} onBack={onBack}>{!session?.subject ? <Empty title="登录后查看订单"><button className="primary-button" onClick={login}>登录 / 注册</button></Empty> : path === '/checkout' ? <Checkout key={route} route={route} navigate={navigate}/> : resource.loading ? <p role="status">正在查询订单…</p> : resource.error ? <ErrorState error={resource.error} retry={resource.reload}/> : !resource.data || Array.isArray(resource.data) && !resource.data.length ? <Empty title="暂无订单信息" text="支付状态以服务端查询结果为准。"><button className="secondary-button" onClick={() => navigate('/me/orders')}>查看我的订单</button></Empty> : (Array.isArray(resource.data) ? resource.data : [resource.data]).map(order => <article className="notice-card" key={order.id}><h3>{orderStatus[order.status] || '待确认'}</h3>{params.get('status') === 'cancelled' && order.status !== 'paid' && <p role="status">支付操作已取消，未确认支付成功。请以订单查询状态为准。</p>}<p>订单号：{order.id}</p><strong>{order.currency} {order.total.toFixed(2)}</strong><p>{dateText(order.createdAt)}</p>{!id ? <button onClick={() => navigate('/me/orders/' + enc(order.id))}>查看详情</button> : <><button onClick={resource.reload}>刷新订单状态</button><button onClick={() => navigate('/support/feedback?orderId=' + enc(order.id))}>订单有问题</button></>}</article>)}</PageShell>;
}




