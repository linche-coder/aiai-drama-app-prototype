import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bookmark, ChevronLeft, ChevronRight, Heart, ListVideo, LockKeyhole, MessageCircle, MoreHorizontal, Maximize, Minimize, Play, Plus, RotateCcw, Share2 } from 'lucide-react';
import { dramas, type Drama } from '../data/dramas';
import { api, enc, messageOf, type Playback } from '../services/api';
import { useApp } from '../state/appState';
import { Comments } from './Comments';
import { Sheet } from './Sheets';
import { useResource } from '../hooks/useResource';
import { usePlayerFullscreen } from '../hooks/usePlayerFullscreen';
const playbackRates = [.75, 1, 1.25, 1.5, 2];
const rateLabel = (rate: number) => (Number.isInteger(rate) ? rate.toFixed(1) : String(rate)) + '×';
export const episodeCount = (d: Drama) => Math.max(1, d.episodeCount ?? 1);
export function EpisodeGrid({ item, episode, onSelect, allowed }: { item: Drama; episode: number; onSelect: (n: number) => void; allowed?: string[] }) { return <div className="reference-episodes">{Array.from({ length: episodeCount(item) }, (_, i) => i + 1).map(n => <button key={n} aria-label={'第 ' + n + ' 集'} aria-current={episode === n ? 'true' : undefined} onClick={() => onSelect(n)}><strong>{n}</strong><small>{allowed ? allowed.includes(String(n)) ? '可试看' : <><LockKeyhole size={10}/>需解锁</> : '选集'}</small></button>)}</div>; }
export function DramaDetailScreen({ item, onBack, onOpen, onPlay }: { item: Drama; onBack: () => void; onOpen: (d: Drama) => void; onPlay: (n: number) => void }) {
  const { records, toggle } = useApp(), saved = records.history.find(p => p.contentId === item.id), ep = Math.min(episodeCount(item), Number(saved?.episodeId ?? 1) || 1);
  const rights = useResource<{ preview_episode_ids?: string[] }>('/' + (item.adult ? 'adult' : 'green') + '/contents/' + enc(item.id));
  const related = dramas.filter(d => d.id !== item.id && d.genre === item.genre).concat(dramas.filter(d => d.id !== item.id && d.genre !== item.genre)).slice(0, 6);
  const percent = saved?.duration ? Math.min(100, Math.round(saved.seconds / saved.duration * 100)) : 0;
  return <main className="reference-detail" aria-label={item.title + '详情'}>
    <div className="reference-detail-hero"><div className="detail-ambient" style={{ backgroundImage: 'url(' + item.cover + ')' }}/><button className="round-button detail-return" aria-label="返回" onClick={onBack}><ArrowLeft size={21}/></button>
      <div className="detail-summary"><img className="detail-poster" src={item.cover} alt={item.title}/><div><h1>{item.title}</h1><div className="detail-tags"><span>{item.genre}</span><span>{item.channel}</span><span>{item.status}</span></div><p>{item.episodeCount ? `共 ${item.episodeCount} 集` : '集数待服务确认'} · {item.freeEpisodes ? `前 ${item.freeEpisodes} 集免费` : '权限待确认'}</p>{item.adult ? <span className="follow-pill"><Bookmark size={13}/>专区愿望榜仅在当前会话保存</span> : <button className="follow-pill" aria-pressed={records.following.includes(item.id)} onClick={() => toggle('following', item.id)}><Plus size={13}/>{records.following.includes(item.id) ? '已追剧' : '加入追剧'}</button>}</div></div>
    </div>
    <div className="reference-detail-body"><button className="watch-progress-card" onClick={() => onPlay(ep)}><span>{saved ? '上次看到 第 ' + ep + ' 集 · ' + percent + '%' : '开始观看 · 第 1 集'}<Play size={14}/></span><i><b style={{ width: percent + '%' }}/></i></button>
      <section className="reference-episode-section"><h2>选集 <small>({episodeCount(item)})</small></h2><EpisodeGrid item={item} episode={ep} onSelect={onPlay} allowed={rights.data?.preview_episode_ids}/></section>
      <details className="synopsis"><summary>剧情简介</summary><p>{item.synopsis}</p></details>
      <Comments contentId={item.id} episodeId={String(ep)}/>
      <section className="similar-section"><h2>相似推荐</h2><div className="poster-rail">{related.map(d => <button className="rail-card" key={d.id} onClick={() => onOpen(d)}><span className="rail-cover"><img src={d.cover} alt="" loading="lazy"/></span><strong>{d.title}</strong><small>{d.status} · {d.genre}</small></button>)}</div></section>
    </div>
  </main>;
}
export function PlayerScreen({ item, episode, onBack, onEpisode, onMember }: { item: Drama; episode: number; onBack: () => void; onEpisode: (n: number) => void; onMember: () => void }) {
  const { records, toggle, saveProgress } = useApp(), video = useRef<HTMLVideoElement>(null), container = useRef<HTMLElement>(null);
  const [media, setMedia] = useState<Playback | null>(null), [error, setError] = useState(''), [locked, setLocked] = useState(false), [loading, setLoading] = useState(true), [playing, setPlaying] = useState(false), [time, setTime] = useState(0), [duration, setDuration] = useState(0), [revision, setRevision] = useState(0), [panel, setPanel] = useState(''), [toast, setToast] = useState(''), [rate, setRate] = useState(1);
  const requestedRate = useRef(1);
  const { fullscreen, toggleFullscreen } = usePlayerFullscreen(container, video, media, setToast, () => { if (video.current) video.current.playbackRate = requestedRate.current; });
  const selectRate = (next: number) => { requestedRate.current = next; setRate(next); if (video.current) video.current.playbackRate = next; setPanel(''); };
  const lastSave = useRef(0), count = episodeCount(item), callbacks = useRef(saveProgress), position = useRef({ time: 0, duration: 0 });
  callbacks.current = saveProgress;
  const save = () => { const p = position.current; if (p.duration > 0 && p.time > 0) callbacks.current({ contentId: item.id, episodeId: String(episode), seconds: p.time, duration: p.duration, updatedAt: new Date().toISOString() }); };
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setLocked(false); setMedia(null); setTime(0); setDuration(0); setPlaying(false); position.current = { time: 0, duration: 0 }; lastSave.current = 0;
    const zone = item.adult ? 'adult' : 'green';
    api<Playback>('/' + zone + '/contents/' + enc(item.id) + '/playback', 'POST', { episodeId: String(episode) }, controller.signal).then(result => {
      if (!result || result.contentId !== item.id || !Array.isArray(result.sources)) throw new Error('片源信息不完整，请重新加载。');
      if (!Number.isFinite(Date.parse(result.expiresAt)) || Date.parse(result.expiresAt) <= Date.now()) throw new Error('播放凭证已过期，请重新加载。');
      if (!result.sources?.length) throw new Error('本集片源暂未上线，请稍后再来。');
      setMedia(result);
    }).catch(e => { if (!controller.signal.aborted) { setError(e?.status === 404 ? '播放服务尚未连接，暂时无法获取本集片源。' : messageOf(e)); setLocked(e?.status === 403); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    const leave = () => { if (document.hidden) { video.current?.pause(); save(); } };
    document.addEventListener('visibilitychange', leave);
    return () => { controller.abort(); save(); document.removeEventListener('visibilitychange', leave); };
  }, [item.id, episode, revision]);
  useEffect(() => { if (panel === 'comments') video.current?.pause(); }, [panel]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 2400); return () => clearTimeout(timer); }, [toast]);
  const changeEpisode = (n: number) => { save(); setPanel(''); onEpisode(Math.max(1, Math.min(count, n))); };
  const share = async () => { const url = location.href; try { if (navigator.share) await navigator.share({ title: item.title, url }); else { await navigator.clipboard.writeText(url); setToast('播放链接已复制'); } } catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) setPanel('share'); } };
  const play = () => { if (!video.current) return; video.current.paused ? void video.current.play().catch(() => setToast('请再次点击播放')) : video.current.pause(); };
  return <main ref={container} className="reference-player player-refined" aria-label="短剧播放">
    <header className="player-top"><button className="icon-button" aria-label="返回详情" onClick={onBack}><ArrowLeft/></button><div><h1>{item.title}</h1><span>第 {episode} 集 / 共 {count} 集</span></div><button className="icon-button" aria-label="重新加载视频" onClick={() => setRevision(v => v + 1)}><RotateCcw size={21}/></button><button className="icon-button" aria-label="播放设置" onClick={() => setPanel('settings')}><MoreHorizontal/></button></header>
    <div className="player-stage">{media && !error ? <><video ref={video} key={episode + ':' + revision} playsInline preload="metadata" poster={item.cover} tabIndex={0} role="button" aria-label={playing ? '暂停视频' : '播放视频'} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); play(); } }} onClick={play} onLoadedMetadata={e => { const v = e.currentTarget, p = records.history.find(p => p.contentId === item.id && p.episodeId === String(episode)); setDuration(v.duration); if (p && p.seconds < v.duration - 2) v.currentTime = p.seconds; v.playbackRate = requestedRate.current; v.play().catch(() => {}); }} onRateChange={e => { if (e.currentTarget.readyState > 0 && playbackRates.includes(e.currentTarget.playbackRate)) setRate(e.currentTarget.playbackRate); }} onPlay={() => setPlaying(true)} onPause={() => { setPlaying(false); save(); }} onError={() => setError('视频加载失败，请检查网络或重新加载。')} onTimeUpdate={e => { const v = e.currentTarget; setTime(v.currentTime); position.current = { time: v.currentTime, duration: Number.isFinite(v.duration) ? v.duration : 0 }; if (Math.abs(v.currentTime - lastSave.current) > 5) { lastSave.current = v.currentTime; save(); } }} onEnded={() => { save(); if (episode < count) changeEpisode(episode + 1); else setToast('已看完全部剧集'); }}>{media.sources.map(s => <source key={s.src} src={s.src} type={s.type}/>)}</video>{!playing && <button className="center-play" aria-label="播放" onClick={play}><Play size={56} fill="currentColor"/></button>}</> : <div className="playback-unavailable"><Play size={35}/><strong>{loading ? '正在准备播放' : locked ? '本集需要解锁' : '暂时无法播放'}</strong><p>{loading ? '正在获取本集片源…' : error}</p>{!loading && <button className="secondary-button" onClick={() => locked ? onMember() : setRevision(v => v + 1)}>{locked ? '查看会员权益' : '重新加载'}</button>}</div>}</div>
    <aside className="player-social">{((item.adult ? [{ key: 'comment' as const, icon: MessageCircle, label: '评论' }] : [{ key: 'liked' as const, icon: Heart, label: '喜欢' }, { key: 'comment' as const, icon: MessageCircle, label: '评论' }, { key: 'following' as const, icon: Bookmark, label: '追剧' }, { key: 'share' as const, icon: Share2, label: '分享' }])).map(({ key, icon: Icon, label }) => <button key={key} aria-label={label} aria-pressed={key === 'liked' || key === 'following' ? records[key].includes(item.id) : undefined} onClick={() => key === 'comment' ? setPanel('comments') : key === 'share' ? void share() : toggle(key, item.id)}><span><Icon size={28} fill={(key === 'liked' || key === 'following') && records[key].includes(item.id) ? 'currentColor' : 'none'}/></span><small>{label}</small></button>)}</aside>
    <div className="player-bottom"><div className="player-episode-control"><button className="round-button" aria-label="上一集" disabled={episode <= 1} onClick={() => changeEpisode(episode - 1)}><ChevronLeft size={19}/></button><button className="episode-pill" onClick={() => setPanel('episodes')}><ListVideo size={18}/>第 {episode} 集 / {count}</button><button className="round-button" aria-label="下一集" disabled={episode >= count} onClick={() => changeEpisode(episode + 1)}><ChevronRight size={19}/></button><span className="player-control-spacer"/><button className="player-speed-button" aria-label={'播放倍速 ' + rateLabel(rate)} onClick={() => setPanel('speed')}>{rateLabel(rate)}</button><button className="player-fullscreen-button" aria-label={fullscreen ? '退出全屏' : '进入全屏'} aria-pressed={fullscreen} onClick={() => void toggleFullscreen()}>{fullscreen ? <Minimize size={19}/> : <Maximize size={19}/>}<small>{fullscreen ? '退出' : '全屏'}</small></button></div><input className="player-timeline" aria-label="播放进度" type="range" min={0} max={duration || 1} step={.1} disabled={!duration} value={time} onChange={e => { const value = Number(e.target.value); if (video.current) video.current.currentTime = value; setTime(value); }}/></div>
    {toast && <div className="global-toast" role="status">{toast}</div>}
    <Sheet open={!!panel} title={panel === 'episodes' ? '选集 (' + count + ')' : panel === 'comments' ? '剧情讨论' : panel === 'share' ? '分享短剧' : panel === 'speed' ? '播放倍速' : '播放设置'} onClose={() => setPanel('')}>{panel === 'episodes' ? <EpisodeGrid item={item} episode={episode} onSelect={changeEpisode} allowed={media?.previewEpisodeIds}/> : panel === 'comments' ? <Comments contentId={item.id} episodeId={String(episode)} compact/> : panel === 'share' ? <div className="form-stack"><label>复制链接分享<input readOnly value={location.href} onFocus={e => e.target.select()}/></label></div> : <div className="form-stack"><fieldset className="speed-options"><legend>播放速度</legend>{playbackRates.map(r => <label key={r}><input type="radio" name="playback-speed" checked={rate === r} value={r} onClick={() => { if (rate === r) setPanel(''); }} onChange={() => selectRate(r)}/><span>{rateLabel(r)}{r === 1 && <small>正常</small>}</span></label>)}</fieldset>{!media && <p className="muted">片源加载后将应用所选倍速。</p>}{panel === 'settings' && <button className="secondary-button" onClick={() => { setPanel(''); setRevision(v => v + 1); }}>重新加载片源</button>}</div>}</Sheet>
  </main>;
}





