import { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, ChevronRight, Heart, LoaderCircle, MessageCircle, Pause, Play, RotateCcw, Search, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { dramas, type Drama } from '../data/dramas';
import { Sheet } from './Sheets';

type FeedChannel = '短剧' | '漫剧' | '推荐';
const VIDEO_SOURCE = '/media/demo/portrait.mp4';

function readSet(key: string) {
  try { return new Set<string>(JSON.parse(sessionStorage.getItem(key) ?? '[]')); }
  catch { return new Set<string>(); }
}
function persistSet(key: string, value: Set<string>) {
  try { sessionStorage.setItem(key, JSON.stringify([...value])); } catch { /* session-only enhancement */ }
}

export function ReelsScreen({ paused, onSearch, onOpen }: { paused: boolean; onSearch: () => void; onOpen: (item: Drama) => void }) {
  const [channel, setChannel] = useState<FeedChannel>('推荐');
  const items = useMemo(() => channel === '推荐' ? dramas.slice(0, 6) : dramas.filter((item) => item.channel === channel).slice(0, 6), [channel]);
  const feed = useRef<HTMLDivElement>(null);
  const videos = useRef<Array<HTMLVideoElement | null>>([]);
  const clickTimer = useRef<number | null>(null);
  const [index, setIndex] = useState(() => {
    try { return Number(sessionStorage.getItem('aiai-reel-index') ?? 0); } catch { return 0; }
  });
  const [liked, setLiked] = useState(() => readSet('aiai-reel-liked'));
  const [saved, setSaved] = useState(() => readSet('aiai-reel-saved'));
  const [progress, setProgress] = useState<Record<string, number>>(() => {
    try { return JSON.parse(sessionStorage.getItem('aiai-reel-progress') ?? '{}'); } catch { return {}; }
  });
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [commentsFor, setCommentsFor] = useState<Drama | null>(null);
  const [playing, setPlaying] = useState(false);
  const [heartBurst, setHeartBurst] = useState(0);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const safeIndex = Math.min(index, Math.max(0, items.length - 1));
    if (safeIndex !== index) setIndex(safeIndex);
    requestAnimationFrame(() => feed.current?.scrollTo({ top: (feed.current?.clientHeight ?? 0) * safeIndex }));
  }, [channel, items.length]);

  useEffect(() => {
    const syncPlayback = () => {
      videos.current.forEach((video, videoIndex) => {
        if (!video) return;
        if (videoIndex === index && !paused && !commentsFor && !document.hidden) {
          const item = items[videoIndex];
          const savedTime = progress[item?.id];
          if (savedTime && Math.abs(video.currentTime - savedTime) > 1) video.currentTime = savedTime;
          video.muted = true;
          video.play().catch(() => setPlaying(false));
        } else video.pause();
      });
    };
    syncPlayback();
    document.addEventListener('visibilitychange', syncPlayback);
    return () => {
      document.removeEventListener('visibilitychange', syncPlayback);
      videos.current.forEach((video) => video?.pause());
    };
  }, [commentsFor, index, items, paused]);

  useEffect(() => {
    try { sessionStorage.setItem('aiai-reel-index', String(index)); } catch { /* optional */ }
  }, [index]);

  const toggleInSet = (key: string, id: string, current: Set<string>, setter: (next: Set<string>) => void) => {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    setter(next);
    persistSet(key, next);
  };
  const like = (item: Drama) => {
    if (!liked.has(item.id)) toggleInSet('aiai-reel-liked', item.id, liked, setLiked);
    setHeartBurst((value) => value + 1);
  };
  const togglePlayback = () => {
    const video = videos.current[index];
    if (!video) return;
    video.paused ? video.play().catch(() => setPlaying(false)) : video.pause();
  };
  const handleVideoClick = () => {
    if (clickTimer.current) window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(togglePlayback, 220);
  };
  const handleDoubleClick = (item: Drama) => {
    if (clickTimer.current) window.clearTimeout(clickTimer.current);
    like(item);
  };
  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 1600);
  };

  return <main className="reels-screen">
    <div className="reels-topbar">
      <div className="reels-tabs" role="tablist" aria-label="刷剧频道">{(['短剧', '漫剧', '推荐'] as FeedChannel[]).map((name) => <button key={name} role="tab" aria-selected={channel === name} onClick={() => { setChannel(name); setIndex(0); }}>{name}</button>)}</div>
      <button className="reels-search" onClick={onSearch} aria-label="搜索短剧、漫剧"><Search size={22} /></button>
    </div>
    <div className="reels-feed" ref={feed} onScroll={(event) => {
      const element = event.currentTarget;
      const next = Math.round(element.scrollTop / Math.max(1, element.clientHeight));
      if (next !== index && next >= 0 && next < items.length) setIndex(next);
    }}>
      {items.map((item, itemIndex) => {
        const isCurrent = itemIndex === index;
        const isLiked = liked.has(item.id);
        const isSaved = saved.has(item.id);
        const isLoaded = loaded.has(item.id);
        const hasError = errors.has(item.id);
        const isExpanded = expanded.has(item.id);
        const duration = durations[item.id] || 1;
        const value = Math.min(progress[item.id] ?? 0, duration);
        return <section className="reel-slide" key={item.id} data-current={isCurrent} aria-label={`${item.title}视频预览`} onClick={handleVideoClick} onDoubleClick={() => handleDoubleClick(item)}>
          <img className="reel-poster" src={item.cover} alt="" style={{ objectPosition: item.crop }} />
          {!hasError && <video
            ref={(node) => { videos.current[itemIndex] = node; }}
            className={`reel-video ${isLoaded ? 'ready' : ''}`}
            src={VIDEO_SOURCE}
            poster={item.cover}
            muted
            loop
            playsInline
            preload={Math.abs(itemIndex - index) <= 1 ? 'auto' : 'metadata'}
            onLoadedData={(event) => {
              const mediaDuration = event.currentTarget.duration || 1;
              setLoaded((current) => new Set(current).add(item.id));
              setDurations((current) => ({ ...current, [item.id]: mediaDuration }));
            }}
            onError={() => setErrors((current) => new Set(current).add(item.id))}
            onPlay={() => isCurrent && setPlaying(true)}
            onPause={() => isCurrent && setPlaying(false)}
            onTimeUpdate={(event) => {
              const time = event.currentTarget.currentTime;
              setProgress((current) => {
                const next = { ...current, [item.id]: time };
                try { sessionStorage.setItem('aiai-reel-progress', JSON.stringify(next)); } catch { /* optional */ }
                return next;
              });
            }}
          />}
          <span className="reel-contrast" />
          {!isLoaded && !hasError && <span className="reel-loading"><LoaderCircle size={24} />正在加载</span>}
          {hasError && <div className="reel-error" onClick={(event) => event.stopPropagation()}><strong>视频加载失败</strong><span>当前内容暂时无法播放，请稍后重试。</span><button onClick={() => { setErrors((current) => { const next = new Set(current); next.delete(item.id); return next; }); requestAnimationFrame(() => videos.current[itemIndex]?.load()); }}><RotateCcw size={16} />重试</button></div>}
          <AnimatePresence>{isCurrent && !playing && !hasError && <motion.span className="reel-play-state" initial={{ opacity: 0, scale: .88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><Play size={31} fill="currentColor" /></motion.span>}</AnimatePresence>
          <AnimatePresence>{isCurrent && heartBurst > 0 && <motion.span key={heartBurst} className="reel-heart-burst" initial={{ opacity: 0, scale: .6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.18 }} transition={{ duration: .3 }}><Heart size={68} fill="currentColor" /></motion.span>}</AnimatePresence>
          <div className="reel-actions" onClick={(event) => event.stopPropagation()}>
            <button aria-label="收藏" aria-pressed={isSaved} data-active={isSaved} onClick={() => toggleInSet('aiai-reel-saved', item.id, saved, setSaved)}><Bookmark fill={isSaved ? 'currentColor' : 'none'} /><span>收藏</span></button>
            <button aria-label="评论" onClick={() => setCommentsFor(item)}><MessageCircle fill="currentColor" /><span>1,286</span></button>
            <button aria-label="点赞" aria-pressed={isLiked} data-active={isLiked} onClick={() => isLiked ? toggleInSet('aiai-reel-liked', item.id, liked, setLiked) : like(item)}><Heart fill={isLiked ? 'currentColor' : 'none'} /><span>{isLiked ? '2.4万' : '2.3万'}</span></button>
            <button aria-label="分享" onClick={() => showToast('分享面板已打开')}><Send fill="currentColor" /><span>分享</span></button>
          </div>
          <div className="reel-copy" onClick={(event) => event.stopPropagation()}>
            <span className="reel-kicker">{item.genre} · {item.channel}</span>
            <h1>{item.title}</h1>
            <div className="reel-tags"><span>第1季</span><span>{item.genre}</span><span>{item.status.split('·')[0]}</span></div>
            <button className={`reel-description ${isExpanded ? 'expanded' : ''}`} onClick={() => setExpanded((current) => { const next = new Set(current); next.has(item.id) ? next.delete(item.id) : next.add(item.id); return next; })}>{item.tagline} <b>{isExpanded ? '收起' : '展开'}</b></button>
            <button className="full-drama" onClick={() => onOpen(item)}>观看完整短剧 · {item.status.split('·')[0]}<ChevronRight size={18} /></button>
          </div>
          <label className="reel-progress" onClick={(event) => event.stopPropagation()}>
            <span style={{ width: `${(value / duration) * 100}%` }} />
            <input aria-label="播放进度" type="range" min="0" max={duration} step="0.01" value={value} onChange={(event) => {
              const time = Number(event.target.value);
              const video = videos.current[itemIndex];
              if (video) video.currentTime = time;
              setProgress((current) => ({ ...current, [item.id]: time }));
            }} />
          </label>
        </section>;
      })}
    </div>
    <AnimatePresence>{toast && <motion.div className="reel-toast" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{toast}</motion.div>}</AnimatePresence>
    <Sheet open={!!commentsFor} title={`评论 · ${commentsFor?.title ?? ''}`} onClose={() => setCommentsFor(null)}><div className="comment-list">
      <p><i>剧迷小满</i><span>这个开场很抓人，已经想继续看下去了。</span></p>
      <p><i>月下追剧</i><span>画面氛围和题材很搭，期待完整剧集。</span></p>
      <p><i>一眼入戏</i><span>这个反转很有意思，等更新。</span></p>
      <label><input placeholder="说点什么…" /><button onClick={() => showToast('评论已发送')}>发送</button></label>
    </div></Sheet>
  </main>;
}
