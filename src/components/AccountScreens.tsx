import { useRef, useState } from 'react';
import { Bell, Bookmark, ChevronRight, Crown, History, MessageCircle, Settings, UserRound, LogOut } from 'lucide-react';
import { dramas, type Drama } from '../data/dramas';
import { useApp, readLocal } from '../state/appState';
const avatarFor = (subject?: string | null) => subject ? readLocal<string>('aiai-avatar:' + subject, '') : '';
import { api, dateText, enc, messageOf, type Notice, type Profile, type Progress, type Comment } from '../services/api';
import { useResource } from '../hooks/useResource';
import { DramaRows, Empty, ErrorState, PageShell } from './Common';
type Navigate = (to: string) => void;
export function ProfileScreen({ navigate, onOpen }: { navigate: Navigate; onOpen: (d: Drama) => void }) {
  const { session, checking, records, login } = useApp();
  const recent = records.history.map(p => dramas.find(d => d.id === p.contentId)).filter((d): d is Drama => !!d).slice(0, 3);
  return <main className="profile-screen"><header className="profile-head"><div className="avatar">{avatarFor(session?.subject) ? <img src={avatarFor(session?.subject)} alt="个人头像"/> : <UserRound size={28}/>}</div><div><strong>{session?.nickname || (session?.subject ? '爱爱短剧用户' : '登录爱爱短剧')}</strong><span>{checking ? '正在检查登录状态…' : session?.subject ? '好故事，一起追' : '登录后管理账户与评论'}</span></div><button onClick={() => session?.subject ? navigate('/me/profile') : login()}>{session?.subject ? '编辑' : '登录'}</button></header>
    <button className="profile-member" onClick={() => navigate('/membership')}><span><small><Crown size={14}/>会员中心</small><strong>{session?.tier && session.tier !== 'free' ? (session.tier === 'premium' ? '高级会员' : '基础会员') : '好故事，尽情看'}</strong><i>查看权益与会员方案</i></span><ChevronRight size={20}/></button>
    <section className="profile-shortcuts">{[{ icon: History, title: '观看记录', path: '/me/history' }, { icon: Bookmark, title: '我的收藏', path: '/me/favorites' }, { icon: MessageCircle, title: '我的评论', path: '/me/comments' }, { icon: Bell, title: '消息中心', path: '/me/messages' }].map(({ icon: Icon, title, path }) => <button key={path} onClick={() => navigate(path)}><span><Icon size={21}/></span><small>{title}</small></button>)}</section>
    <section className="profile-section"><div className="section-heading"><h2>最近观看</h2><button className="text-button" onClick={() => navigate('/me/history')}>全部<ChevronRight size={15}/></button></div>{recent.length ? <DramaRows items={recent} onOpen={onOpen}/> : <div className="mini-empty">还没有观看记录，去发现喜欢的故事吧。</div>}</section>
    <section className="settings-list">{[['我的订单', '/me/orders'], ['个人资料', '/me/profile'], ['隐私与安全', '/me/privacy'], ['设置', '/settings'], ['帮助与反馈', '/support'], ['关于爱爱短剧', '/about']].map(([title, path]) => <button key={path} onClick={() => navigate(path)}><span>{title}</span><ChevronRight size={18}/></button>)}</section>
    <LogoutButton/>
  </main>;
}
function LogoutButton() {
  const { session, accept } = useApp();
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false);
  if (!session?.subject) return null;
  return <div className="profile-logout">{error && <p role="alert">{error}</p>}<button className="secondary-button" disabled={busy} onClick={async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await api('/session', 'DELETE'); accept(null); }
    catch (e) { setError(messageOf(e)); }
    finally { lock.current = false; setBusy(false); }
  }}><LogOut size={18}/>{busy ? '正在退出…' : '退出账号'}</button></div>;
}

export function LibraryScreen({ onOpen, navigate, tab: initial = 'following' }: { onOpen: (d: Drama) => void; navigate: Navigate; tab?: 'following' | 'saved' }) {
  const { records } = useApp(), [tab, setTab] = useState(initial), [query, setQuery] = useState('');
  const items = dramas.filter(d => records[tab].includes(d.id) && d.title.includes(query.trim()));
  return <main className="library-screen"><header className="page-header"><div><small>我的片单 · 保存在此设备</small><h1>追剧</h1></div><Bookmark/></header><div className="library-tabs" role="tablist">{(['following', 'saved'] as const).map(t => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t === 'following' ? '追剧' : '收藏'}</button>)}</div><label className="search-field"><input aria-label="搜索片单" placeholder="搜索片单" value={query} onChange={e => setQuery(e.target.value)}/></label>{items.length ? <DramaRows items={items} onOpen={onOpen}/> : <Empty title={query ? '没有匹配的剧目' : '片单还是空的'} text="收藏或追剧后，可以在这里快速找到。"><button className="primary-button" onClick={() => navigate('/')}>去发现好剧</button></Empty>}</main>;
}
function LoginRequired() { const { login } = useApp(); return <Empty title="请先登录" text="登录后查看并管理账号内容。"><button className="primary-button" onClick={login}>登录 / 注册</button></Empty>; }
export function AccountPage({ kind, onBack, navigate, onOpen }: { kind: string; onBack: () => void; navigate: Navigate; onOpen: (d: Drama) => void }) {
  const title: Record<string, string> = { profile: '个人资料', history: '观看记录', favorites: '我的收藏', comments: '我的评论', messages: '消息中心', privacy: '隐私与安全', settings: '设置' };
  const { session } = useApp();
  return <PageShell title={title[kind] || '个人中心'} onBack={onBack}>{kind === 'history' ? <HistoryContent onOpen={onOpen}/> : kind === 'favorites' ? <LibraryScreen onOpen={onOpen} navigate={navigate} tab="saved"/> : kind === 'settings' || kind === 'privacy' ? <SettingsContent navigate={navigate}/> : !session?.subject ? <LoginRequired/> : kind === 'profile' ? <ProfileContent navigate={navigate}/> : kind === 'messages' ? <MessagesContent navigate={navigate}/> : <MyCommentsContent onOpen={onOpen}/>}</PageShell>;
}
function ProfileContent({ navigate }: { navigate: Navigate }) {
  const { session, accept } = useApp(), resource = useResource<Profile>('/me/profile');
  const [avatar, setAvatar] = useState(() => avatarFor(session?.subject)), [avatarError, setAvatarError] = useState('');
  const [nickname, setNickname] = useState<string | null>(null), [bio, setBio] = useState<string | null>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  if (resource.loading) return <p role="status" className="muted">正在加载资料…</p>;
  if (resource.error) return <ErrorState error={resource.error} retry={resource.reload}/>;
  return <form className="form-stack" onSubmit={async e => { e.preventDefault(); if (busy) return; setBusy(true); setMessage(''); try { const p = await api<Profile>('/me/profile', 'PATCH', { nickname: (nickname ?? resource.data?.nickname ?? '').trim(), bio: (bio ?? resource.data?.bio ?? '').trim() }); resource.setData(p); if (session) accept({ ...session, nickname: p.nickname }); setMessage('资料已保存'); } catch (e) { setMessage(messageOf(e)); } finally { setBusy(false); } }}><div className="profile-avatar-large">{avatar || resource.data?.avatarUrl ? <img src={avatar || resource.data?.avatarUrl || ''} alt="个人头像"/> : <UserRound size={38}/>}</div><label>更换头像<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const element = e.currentTarget, file = element.files?.[0]; if (!file || !session?.subject) return; setAvatarError(''); if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { setAvatarError('请选择不超过 2 MB 的 JPG、PNG 或 WebP 图片。'); element.value = ''; return; } const subject = session.subject; const reader = new FileReader(); reader.onload = () => { const value = String(reader.result); const image = new Image(); image.onload = () => { try { localStorage.setItem('aiai-avatar:' + subject, JSON.stringify(value)); setAvatar(value); } catch { setAvatarError('设备存储空间不足，请使用更小的图片。'); } }; image.onerror = () => setAvatarError('图片无法读取，请换一张图片。'); image.src = value; element.value = ''; }; reader.onerror = () => setAvatarError('图片读取失败，请重试。'); reader.readAsDataURL(file); }}/><small className="muted">头像保存在当前设备，支持 JPG、PNG、WebP。</small></label>{avatarError && <ErrorState error={avatarError}/>}<button type="button" className="text-button" onClick={() => { try { localStorage.removeItem('aiai-avatar:' + session?.subject); setAvatar(''); setAvatarError(''); } catch { setAvatarError('暂时无法清除头像，请重试。'); } }}>恢复默认头像</button><label>登录账号<input disabled value={session?.subject ?? ''}/></label><label>昵称<input minLength={2} maxLength={24} required value={nickname ?? resource.data?.nickname ?? ''} onChange={e => setNickname(e.target.value)}/></label><label>个人简介<textarea maxLength={120} value={bio ?? resource.data?.bio ?? ''} onChange={e => setBio(e.target.value)} placeholder="介绍一下自己吧"/></label>{message && <p role="status">{message}</p>}<button className="primary-button" disabled={busy}>{busy ? '保存中…' : '保存资料'}</button><button type="button" className="secondary-button" onClick={() => navigate('/account/forgot-password')}>修改 / 找回密码</button></form>;
}
function HistoryContent({ onOpen }: { onOpen: (d: Drama) => void }) {
  const { records, clearHistory, session } = useApp(), remote = useResource<Progress[]>(session?.subject ? '/me/watch-progress' : null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const merged = [...records.history, ...(remote.data ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).filter((p, i, arr) => arr.findIndex(v => v.contentId === p.contentId) === i);
  const remove = async (id?: string) => { setBusy(true); setError(''); try { if (session?.subject) await api('/privacy/green/history' + (id ? '/' + enc(id) : ''), 'DELETE'); clearHistory(id); remote.setData(v => id ? v?.filter(p => p.contentId !== id) ?? [] : []); } catch (e) { setError(messageOf(e)); } finally { setBusy(false); } };
  return <><p className="muted">从上次停下的位置继续。访客记录保存在当前设备。</p>{remote.error && <ErrorState error={remote.error} retry={remote.reload}/>}<div className="history-list">{merged.map(p => { const item = dramas.find(d => d.id === p.contentId); return item ? <article key={p.contentId}><button onClick={() => onOpen(item)}><img src={item.cover} alt=""/><span><strong>{item.title}</strong><small>第 {p.episodeId} 集 · 已看 {Math.round(p.seconds)} 秒</small><small>{dateText(p.updatedAt)}</small></span></button><button disabled={busy} aria-label={'删除记录 ' + item.title} onClick={() => void remove(item.id)}>删除</button></article> : null; })}</div>{!merged.length && <Empty title="暂无观看记录"/>}{error && <ErrorState error={error}/>}<button className="secondary-button" disabled={busy || !merged.length} onClick={() => void remove()}>清空观看记录</button></>;
}
function MessagesContent({ navigate }: { navigate: Navigate }) {
  const r = useResource<Notice[]>('/me/notifications'), [filter, setFilter] = useState('all'), [error, setError] = useState('');
  return <><div className="chip-tabs">{[['all', '全部'], ['reply', '回复'], ['update', '更新'], ['system', '系统']].map(([id, label]) => <button key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}</div>{r.loading ? <p role="status">正在加载消息…</p> : r.error ? <ErrorState error={r.error} retry={r.reload}/> : <>{(r.data ?? []).filter(n => filter === 'all' || n.kind === filter).map(n => <article className="notice-card" key={n.id}><h3>{!n.read && <i/>}{n.title}</h3><p>{n.body}</p><small>{dateText(n.createdAt)}</small><button onClick={async () => { try { await api('/me/notifications/' + enc(n.id), 'PATCH', { read: true }); r.setData(v => v?.map(i => i.id === n.id ? { ...i, read: true } : i) ?? []); if (n.href.startsWith('/') && !n.href.startsWith('//')) navigate(n.href); } catch (e) { setError(messageOf(e)); } }}>查看消息</button></article>)}{!(r.data ?? []).some(n => filter === 'all' || n.kind === filter) && <Empty title="暂无消息"/>}</>}{error && <ErrorState error={error}/>}</>;
}
function MyCommentsContent({ onOpen }: { onOpen: (d: Drama) => void }) {
  const r = useResource<Comment[]>('/me/comments'), [error, setError] = useState('');
  return <>{r.loading ? <p role="status">正在加载评论…</p> : r.error ? <ErrorState error={r.error} retry={r.reload}/> : r.data?.length ? r.data.map(c => <article className="notice-card" key={c.id}><small>{dateText(c.createdAt)} · {c.status === 'pending' ? '审核中' : c.status === 'rejected' ? '未通过' : '已发布'}</small><p>{c.content}</p><button onClick={() => { const d = dramas.find(d => d.id === c.contentId); if (d) onOpen(d); }}>查看剧目</button><button onClick={async () => { try { await api('/comments/' + enc(c.id), 'DELETE'); r.setData(v => v?.filter(i => i.id !== c.id) ?? []); } catch (e) { setError(messageOf(e)); } }}>删除</button></article>) : <Empty title="还没有评论" text="看剧时留下你的想法吧。"/>}{error && <ErrorState error={error}/>}</>;
}
function SettingsContent({ navigate }: { navigate: Navigate }) {
  const { session, accept, login } = useApp(), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  return <><div className="settings-intro"><Settings size={26}/><h2>管理你的观看体验</h2><p>追剧、收藏保存在当前设备；登录和公开互动由账号服务处理。</p></div><div className="settings-list">{[['观看记录', '/me/history'], ['个人资料', '/me/profile'], ['修改密码', '/account/forgot-password'], ['隐私政策', '/privacy'], ['用户协议', '/terms'], ['帮助与反馈', '/support']].map(([name, to]) => <button key={to} onClick={() => navigate(to)}>{name}<ChevronRight size={17}/></button>)}</div>{message && <p role="alert">{message}</p>}<button className="secondary-button" disabled={busy} onClick={async () => { if (!session?.subject) { login(); return; } setBusy(true); try { await api('/session', 'DELETE'); accept(null); setMessage('已退出登录'); } catch (e) { setMessage(messageOf(e)); } finally { setBusy(false); } }}>{session?.subject ? '退出登录' : '登录账号'}</button></>;
}
