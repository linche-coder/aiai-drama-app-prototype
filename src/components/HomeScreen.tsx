import { useMemo, useState } from 'react';
import { ArrowRight, Crown, Filter, Play, Search, SlidersHorizontal } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { channelContent, genres, type Channel, type Drama, type Genre } from '../data/dramas';
import { HeroCarousel } from './HeroCarousel';
import { useApp } from '../state/appState';
const go = (path: string) => { history.pushState({ aiaiApp: true }, '', '#' + path); window.dispatchEvent(new Event('hashchange')); };

function SectionTitle({ title, subtitle, action }: { title: string; subtitle: string; action?: string }) {
  return <div className="section-heading rich"><span><h2>{title}</h2><small>{subtitle}</small></span>{action && <button className="text-button" onClick={() => go(action)}>更多 <ArrowRight size={15}/></button>}</div>;
}
function Cards({ items, onOpen }: { items: Drama[]; onOpen: (item: Drama) => void }) {
  if (!items.length) return <div className="content-empty"><Filter size={25}/><strong>暂时没有符合条件的内容</strong><span>调整筛选条件后再看看。</span></div>;
  return <div className="content-grid">{items.map(item => <button className="content-card" key={item.id} onClick={() => onOpen(item)}><span className="content-cover"><img src={item.cover} alt={item.title} loading="lazy" onError={e => e.currentTarget.classList.add('image-error')}/><i>{item.status}</i>{item.original && <em>原创</em>}</span><strong>{item.title}</strong><small>{item.genre} · {item.channel}</small></button>)}</div>;
}
function ContinueWatching({ item, onOpen }: { item: Drama; onOpen: (item: Drama) => void }) {
  const { records } = useApp(), progress = records.history.find(p => p.contentId === item.id);
  return <section className="section continue-section"><SectionTitle title="继续观看" subtitle="从上次停下的位置继续" action="/me/history"/><button className="continue-card" onClick={() => onOpen(item)}><img src={item.cover} alt=""/><span className="continue-info"><strong>{item.title}</strong><small>上次看到第 {progress?.episodeId ?? 1} 集</small><span className="progress"><i style={{ width: (progress?.duration ? Math.min(100, progress.seconds / progress.duration * 100) : 0) + '%' }}/></span></span><span className="continue-play"><Play size={16} fill="currentColor"/></span></button></section>;
}
function RecommendPage({ items, hasHistory, onOpen }: { items: Drama[]; hasHistory: boolean; onOpen: (item: Drama) => void }) {
  const { records } = useApp(), recent = items.find(d => d.id === records.history[0]?.contentId), [genre, setGenre] = useState<Genre>('全部');
  const filtered = genre === '全部' ? items : items.filter(item => item.genre === genre);
  return <><HeroCarousel items={items.slice(0, 5)} onOpen={onOpen} onFestival={() => go('/festival')}/>{hasHistory && recent && <ContinueWatching item={recent} onOpen={onOpen}/>}<section className="section browse-section"><SectionTitle title="热门推荐" subtitle="精选好故事，下一部心动就在这里"/><div className="quick-chips home-genres">{genres.map(value => <button key={value} data-active={genre === value} onClick={() => setGenre(value)}>{value}</button>)}</div><Cards items={filtered.slice(0, 10)} onOpen={onOpen}/></section><section className="section browse-section"><SectionTitle title="最新更新" subtitle="发现新故事，让期待继续"/><Cards items={items.slice(10)} onOpen={onOpen}/></section></>;
}
function ChannelPage({ items, channel, onOpen }: { items: Drama[]; channel: Exclude<Channel, '推荐'>; onOpen: (item: Drama) => void }) {
  const [genre, setGenre] = useState<Genre>('全部'), [expanded, setExpanded] = useState(false);
  const visible = useMemo(() => genre === '全部' ? items : items.filter(item => item.genre === genre), [items, genre]);
  return <><section className="channel-intro short-intro"><span><small>{channel}</small><h1>{channel === '真人短剧' ? '一屏找到想看的好剧' : '新番、奇幻与热血故事'}</h1><p>作品状态和权限以 WEB 最新内容数据为准</p></span></section><section className="browse-tools"><div className="quick-chips">{genres.map(value => <button key={value} data-active={genre === value} onClick={() => setGenre(value)}>{value}</button>)}</div><button className="filter-toggle" data-active={expanded} onClick={() => setExpanded(!expanded)}><SlidersHorizontal size={16}/>题材筛选</button></section><section className="section browse-section"><div className="result-heading"><h2>{channel}</h2><span>{visible.length} 部</span></div><Cards items={visible} onOpen={onOpen}/></section></>;
}
export function HomeScreen({ channel, setChannel, hasHistory, onSearch, onMember, onOpen }: { channel: Channel; setChannel: (value: Channel) => void; hasHistory: boolean; onSearch: () => void; onMember: () => void; onOpen: (item: Drama) => void }) {
  const items = channelContent[channel];
  return <><header className="topbar"><button className="home-search" onClick={onSearch} aria-label="搜索真人短剧、AI漫剧"><Search size={21}/></button><div className="channel-tabs" role="tablist" aria-label="内容频道">{(['推荐', '真人短剧', 'AI漫剧'] as Channel[]).map(name => <button role="tab" aria-selected={channel === name} key={name} onClick={() => setChannel(name)}>{name}</button>)}</div><button className="member-button" onClick={onMember}><Crown size={15}/>会员</button></header><AnimatePresence mode="wait"><motion.main className="channel-page" key={channel} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>{channel === '推荐' ? <RecommendPage items={items} hasHistory={hasHistory} onOpen={onOpen}/> : <ChannelPage items={items} channel={channel} onOpen={onOpen}/>}</motion.main></AnimatePresence></>;
}
