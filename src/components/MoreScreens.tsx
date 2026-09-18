import { useState } from 'react';
import { ChevronRight, Crown } from 'lucide-react';
import { dramas, type Drama } from '../data/dramas';
import { api, dateText, enc, messageOf, safeDecode, type Order, type Ticket } from '../services/api';
import { useApp } from '../state/appState';
import { useResource } from '../hooks/useResource';
import { DramaRows, Empty, ErrorState, PageShell } from './Common';
type Props = { route: string; navigate: (path: string) => void; onBack: () => void; onOpen: (d: Drama) => void };
export { MembershipPage } from './MembershipCenter';
export { CommercePage } from './CommerceScreens';
const topics = [
  { id: 'account', title: '账号与登录', text: '使用用户名、手机号或邮箱及密码登录。忘记密码时，可使用绑定邮箱申请重置。登录失败请核对账号或稍后重试。' },
  { id: 'playback', title: '播放与选集', text: '在剧目详情选择集数进入播放页。可切换上一集、下一集，或打开选集面板。片源未上线、网络异常时会显示提示，可尝试重新加载。' },
  { id: 'membership', title: '会员权益', text: '会员中心的新积分制方案目前为演示，不能支付。原基础与高级会员商品保留独立报价入口，权益和价格以服务端确认结果为准。' },
  { id: 'orders', title: '订单与支付', text: '在我的订单查看支付和退款状态。支付后尚未生效时请刷新订单；仍有异常可提交反馈并填写订单号。' },
  { id: 'privacy', title: '隐私与记录', text: '访客观看记录、追剧与收藏保存在当前设备。可在观看记录中删除。登录后的云端记录需要服务端确认删除成功。' },
];
export function SupportPage({ route, navigate, onBack }: Pick<Props, 'route' | 'navigate' | 'onBack'>) {
  const path = route.split('?')[0], feedback = path === '/support/feedback', tickets = path.startsWith('/support/tickets'), { session, login } = useApp();
  const r = useResource<Ticket[]>(tickets && session?.subject ? '/support/tickets' : null), [category, setCategory] = useState('播放问题'), [subject, setSubject] = useState(''), [description, setDescription] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const ticketId = path.split('/')[3];
  return <PageShell title={feedback ? '意见反馈' : tickets ? ticketId ? '反馈详情' : '我的反馈' : '帮助中心'} onBack={onBack}>{feedback ? <form className="form-stack" onSubmit={async e => { e.preventDefault(); if (!session?.subject) { login(); return; } if (busy) return; setBusy(true); setError(''); try { const t = await api<Ticket>('/support/tickets', 'POST', { category, subject: subject.trim(), description: description.trim(), context: { source: 'app', orderId: new URLSearchParams(route.split('?')[1]).get('orderId') || '' } }); navigate('/support/tickets/' + enc(t.id)); } catch (e) { setError(messageOf(e)); } finally { setBusy(false); } }}><p className="muted">描述遇到的问题，我们会通过反馈工单跟进。</p><label>问题类型<select value={category} onChange={e => setCategory(e.target.value)}>{['播放问题', '账号问题', '会员订单', '意见建议', '版权问题'].map(v => <option key={v}>{v}</option>)}</select></label><label>标题<input minLength={2} maxLength={80} required value={subject} onChange={e => setSubject(e.target.value)} placeholder="简要描述问题"/></label><label>问题描述<textarea minLength={10} maxLength={2000} required value={description} onChange={e => setDescription(e.target.value)} placeholder="请描述操作步骤和遇到的问题（至少 10 字）"/></label>{error && <ErrorState error={error}/>}<button className="primary-button" disabled={busy}>{busy ? '正在提交…' : '提交反馈'}</button><button type="button" className="secondary-button" onClick={() => navigate('/support/tickets')}>查看我的反馈</button></form> : tickets ? !session?.subject ? <Empty title="登录后查看反馈"><button className="primary-button" onClick={login}>登录 / 注册</button></Empty> : r.loading ? <p role="status">正在加载反馈…</p> : r.error ? <ErrorState error={r.error} retry={r.reload}/> : r.data?.some(t => !ticketId || t.id === safeDecode(ticketId)) ? r.data.filter(t => !ticketId || t.id === safeDecode(ticketId)).map(t => <article className="notice-card" key={t.id}><small>{t.status === 'open' ? '待处理' : t.status === 'processing' ? '处理中' : '已关闭'} · {dateText(t.createdAt)}</small><h3>{t.subject}</h3><p>{t.description}</p>{!ticketId && <button onClick={() => navigate('/support/tickets/' + enc(t.id))}>查看详情</button>}</article>) : <Empty title={ticketId ? '未找到这条反馈' : '暂无反馈记录'}/> : <><div className="help-heading"><h2>有什么可以帮你？</h2><p>常见问题与使用指南</p></div>{topics.map(t => <details className="faq" key={t.id} open={path.endsWith('/' + t.id) || undefined}><summary>{t.title}</summary><p>{t.text}</p></details>)}<button className="primary-button" onClick={() => navigate('/support/feedback')}>联系帮助 · 提交反馈</button><button className="secondary-button" onClick={() => navigate('/support/tickets')}>我的反馈</button></>}</PageShell>;
}
const policyContent: Record<string, { title: string; sections: [string, string][] }> = {
  terms: { title: '用户协议', sections: [['使用说明', '请使用本人账号，妥善保管登录信息，不得侵犯他人权益或发布违法内容。'], ['内容与互动', '评论应友善并与剧情相关；涉及剧透时请勾选剧透提示。违规评论可被举报和审核。'], ['服务说明', '作品、播放和账号服务以实际可用状态为准。遇到问题可通过帮助中心反馈。']] },
  privacy: { title: '隐私政策', sections: [['账户信息', '登录和注册表单通过账号服务处理。本应用不在本地保存密码。'], ['设备记录', '追剧、收藏和访客观看记录保存在当前浏览器，评论草稿保存在当前会话。登录后部分记录可由服务端同步。'], ['管理信息', '在观看记录中删除单条或全部记录；在个人资料中修改昵称与简介。其他个人信息请求可通过帮助中心提交。']] },
  'membership-guide': { title: '会员服务说明', sections: [['方案与价格', '悦享、尊享月卡/年卡与积分包目前仅为方案演示，不能支付，也不会改变账户权益。原基础月卡、高级月卡与高级季卡单独提供服务端报价，不能与新方案直接映射。'], ['生效与续期', '支付成功后由服务端发放权益，返回支付页不代表支付成功。有效期以会员中心展示为准。'], ['订单帮助', '可在我的订单中查看状态。退款及订单异常通过帮助中心反馈，处理结果以订单实际状态为准。']] },
  copyright: { title: '版权说明', sections: [['尊重原创', '作品权利归相关权利人所有。未经授权不得复制、传播或用于商业用途。'], ['问题反馈', '如有权利异议，请在反馈中提供作品信息及权属说明。']] },
  about: { title: '关于爱爱短剧', sections: [['爱爱短剧', '好故事，一眼入戏。发现短剧、漫剧，收藏喜欢的作品，与同好交流剧情。'], ['联系我们', '在帮助与反馈中提交你的建议，并通过我的反馈查看处理状态。']] },
};
export function PolicyPage({ route, onBack, navigate }: Pick<Props, 'route' | 'navigate' | 'onBack'>) { const item = policyContent[route.slice(1)] || policyContent.about; return <PageShell title={item.title} onBack={onBack}><article className="policy-content">{item.sections.map(([h, p]) => <section key={h}><h2>{h}</h2><p>{p}</p></section>)}<button className="secondary-button" onClick={() => navigate('/support/feedback')}>帮助与反馈</button></article></PageShell>; }
export function CatalogPage({ route, onBack, onOpen, navigate }: Props) {
  const [genre, setGenre] = useState('全部'), path = route.split('?')[0], ranking = path === '/rankings', collections = path.startsWith('/collections'), free = path === '/free';
  const list = dramas.filter(d => (genre === '全部' || d.genre === genre) && (path !== '/comics' || d.channel === '漫剧')).sort((a, b) => ranking ? parseFloat(b.heat ?? '0') - parseFloat(a.heat ?? '0') : 0);
  return <PageShell title={ranking ? '短剧排行榜' : collections ? '精选专题' : free ? '免费专区' : path === '/updates' ? '追更日历' : path === '/comics' ? '漫剧馆' : '全部短剧'} onBack={onBack}><div className="chip-tabs">{['全部', '都市', '古装', '奇幻', '悬疑', '逆袭'].map(g => <button key={g} aria-pressed={genre === g} onClick={() => setGenre(g)}>{g}</button>)}</div>{collections && <p className="muted">精选都市、古装与奇幻故事，找到你的下一部心动之作。</p>}{free ? <Empty title="免费内容正在准备中" text="内容是否免费以片源服务返回的试看权限为准。"><button className="secondary-button" onClick={() => navigate('/shorts')}>浏览全部短剧</button></Empty> : <DramaRows items={path === '/updates' ? list.filter(d => d.completion === '连载中') : list} onOpen={onOpen}/>}</PageShell>;
}


