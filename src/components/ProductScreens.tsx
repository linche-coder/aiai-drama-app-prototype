import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bell, ChevronRight, Clock3, Crown, Heart, History, LoaderCircle, LockKeyhole, Pause, Play, RotateCcw, Search, Settings, ShieldCheck, UserRound } from 'lucide-react';
import type { Drama } from '../data/dramas';
import { Sheet } from './Sheets';

const VIDEO_SOURCE = '/media/demo/portrait.mp4';

function episodeCount(item: Drama) {
  const match = item.status.match(/\d+/);
  return Math.max(12, Number(match?.[0] ?? 24));
}

export function DramaDetailScreen({ item, following, onToggleFollowing, onBack }: { item: Drama; following: boolean; onToggleFollowing: () => void; onBack: () => void }) {
  const [episode, setEpisode] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const count = episodeCount(item);
  const relatedEpisodes = Array.from({ length: Math.min(count, 36) }, (_, index) => index + 1);

  useEffect(() => () => video.current?.pause(), []);
  const togglePlay = () => {
    if (!video.current) return;
    if (video.current.paused) video.current.play().catch(() => setPlaying(false));
    else video.current.pause();
  };

  return <main className="detail-screen" aria-label={item.title + '详情'}>
    <div className="detail-hero">
      <img src={item.cover} alt="" style={{ objectPosition: item.crop }} />
      <span className="detail-hero-shade" />
      <button className="detail-back" onClick={onBack} aria-label="返回"><ArrowLeft size={20} /></button>
      <button className="detail-follow-top" onClick={onToggleFollowing} aria-label={following ? '取消追剧' : '加入追剧'} aria-pressed={following}><Heart size={20} fill={following ? 'currentColor' : 'none'} /></button>
      <div className="detail-title"><span>{item.genre} · {item.channel}</span><h1>{item.title}</h1><p>{item.status} · {item.region} · {item.heat}</p></div>
    </div>
    <section className="detail-body">
      <div className="detail-actions">
        <button className="detail-play" onClick={togglePlay}><Play size={18} fill="currentColor" />播放第 {episode} 集</button>
        <button className="detail-follow" data-active={following} onClick={onToggleFollowing}><Heart size={18} fill={following ? 'currentColor' : 'none'} />{following ? '已追剧' : '追剧'}</button>
      </div>
      <div className="inline-player">
        <img src={item.cover} alt="" />
        {!error && <video ref={video} src={VIDEO_SOURCE} poster={item.cover} muted playsInline preload="metadata" onLoadedData={() => setLoaded(true)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setError(true)} />}
        {!loaded && !error && <span className="player-loading"><LoaderCircle size={22} />正在准备播放</span>}
        {error && <div className="player-error"><strong>暂时无法播放</strong><span>请检查网络后重试</span><button onClick={() => { setError(false); setLoaded(false); requestAnimationFrame(() => video.current?.load()); }}><RotateCcw size={15} />重试</button></div>}
        {loaded && !error && <button className="player-toggle" onClick={togglePlay} aria-label={playing ? '暂停' : '播放'}>{playing ? <Pause size={24} fill="currentColor" /> : <Play size={26} fill="currentColor" />}</button>}
      </div>
      <section className="detail-intro"><h2>剧情简介</h2><p>{item.synopsis}</p></section>
      <section className="episode-section">
        <div><h2>选集</h2><span>{item.status}</span></div>
        <div className="episode-grid">{relatedEpisodes.map((number) => <button key={number} data-active={episode === number} onClick={() => setEpisode(number)}>{number}</button>)}</div>
      </section>
    </section>
  </main>;
}

export function FollowingScreen({ items, onOpen, onBrowse }: { items: Drama[]; onOpen: (item: Drama) => void; onBrowse: () => void }) {
  const [tab, setTab] = useState<'追剧' | '收藏'>('追剧');
  return <main className="library-screen">
    <header className="page-header"><div><small>我的片单</small><h1>追剧</h1></div><button aria-label="搜索片单"><Search size={20} /></button></header>
    <div className="library-tabs" role="tablist">{(['追剧', '收藏'] as const).map((name) => <button key={name} role="tab" aria-selected={tab === name} onClick={() => setTab(name)}>{name}</button>)}</div>
    {tab === '追剧' && items.length ? <section className="library-list">
      <div className="library-summary"><span><Bell size={15} />有更新时会在这里提醒</span><em>{items.length} 部</em></div>
      {items.map((item, index) => <button key={item.id} onClick={() => onOpen(item)}><img src={item.cover} alt="" /><span><strong>{item.title}</strong><small>{index === 0 ? '已看 12 集 · 继续第 13 集' : item.status}</small><i>{item.genre} · {item.heat}</i></span><Play size={18} fill="currentColor" /></button>)}
    </section> : <div className="product-empty"><Heart size={31} /><strong>{tab === '追剧' ? '还没有追剧内容' : '收藏夹还是空的'}</strong><span>{tab === '追剧' ? '在剧目详情点击“追剧”，更新时就能快速找到。' : '刷剧时收藏的内容会出现在这里。'}</span><button onClick={onBrowse}>去发现好剧</button></div>}
  </main>;
}

export function ProfileScreen({ hasHistory, onMember, loggedIn, onLogin }: { hasHistory: boolean; onMember: () => void; loggedIn: boolean; onLogin: () => void }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [toast, setToast] = useState('');
  const valid = /^1\d{10}$/.test(phone);
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 1600); };
  const finishLogin = () => {
    if (!valid) { setToast('请输入正确的手机号'); return; }
    try { sessionStorage.setItem('aiai-user-login', '1'); } catch { /* optional */ }
    onLogin(); setLoginOpen(false); showToast('登录成功');
  };

  const shortcuts = [
    { icon: History, label: '观看记录' },
    { icon: Bell, label: '更新提醒' },
    { icon: ShieldCheck, label: '青少年模式' },
    { icon: Settings, label: '设置' },
  ];

  return <main className="profile-screen">
    <header className="profile-head">
      <div className="avatar"><UserRound size={28} /></div>
      <div><strong>{loggedIn ? '爱爱短剧用户' : '登录后同步追剧记录'}</strong><span>{loggedIn ? '已登录 · 记录仅在当前设备保存' : '跨设备继续观看，不错过更新'}</span></div>
      <button onClick={() => loggedIn ? showToast('账号管理已打开') : setLoginOpen(true)}>{loggedIn ? '账号' : '登录'}</button>
    </header>
    <button className="profile-member" onClick={onMember}><span><small><Crown size={14} />会员中心</small><strong>解锁更舒适的追剧体验</strong><i>查看会员权益</i></span><ChevronRight size={20} /></button>
    <section className="profile-shortcuts">{shortcuts.map(({ icon: Icon, label }) => <button key={label} onClick={() => showToast(label + '已打开')}><span><Icon size={20} /></span><small>{label}</small></button>)}</section>
    <section className="profile-section">
      <div className="section-heading"><h2>最近观看</h2><button className="text-button">全部 <ChevronRight size={15} /></button></div>
      {hasHistory ? <div className="profile-history"><span><Clock3 size={18} /></span><div><strong>观看记录已开启</strong><small>观看过的剧目会按时间排列在这里</small></div></div> : <div className="mini-empty">暂无观看记录</div>}
    </section>
    <section className="settings-list">
      {['隐私与安全', '帮助与反馈', '关于爱爱短剧'].map((label) => <button key={label} onClick={() => showToast(label + '已打开')}><span>{label}</span><ChevronRight size={18} /></button>)}
    </section>
    {toast && <div className="global-toast">{toast}</div>}
    <Sheet open={loginOpen} title="手机号登录" onClose={() => setLoginOpen(false)}>
      <div className="login-sheet"><span className="login-mark"><LockKeyhole size={25} /></span><h3>登录爱爱短剧</h3><p>登录后可同步追剧、收藏和观看进度。</p><label><span>+86</span><input inputMode="tel" maxLength={11} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))} placeholder="请输入手机号" /></label>{toast && <em>{toast}</em>}<button className="primary-button" disabled={!valid} onClick={finishLogin}>登录</button><small>继续即代表你同意用户协议与隐私政策</small></div>
    </Sheet>
  </main>;
}

export function MemberContent({ loggedIn = false, onClose }: { loggedIn?: boolean; onClose: () => void }) {
  const benefits = ['无广告沉浸观看', '会员内容优先看', '多端记录同步'];
  return <div className="member-content">
    <div className="member-card"><span><Crown size={23} /></span><div><small>{loggedIn ? '当前账号' : '游客状态'}</small><strong>{loggedIn ? '尚未开通会员' : '登录后开通会员'}</strong></div></div>
    <div className="benefit-list">{benefits.map((item, index) => <span key={item}><i>{index + 1}</i><strong>{item}</strong></span>)}</div>
    <button className="primary-button" onClick={onClose}>了解会员权益</button>
    <p>会员开通与支付能力将在正式服务接入后开放。</p>
  </div>;
}
