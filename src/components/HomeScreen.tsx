import { useMemo, useState } from 'react';
import { ArrowRight, Crown, Filter, Flame, Play, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { channelContent, type Channel, type Drama, type Genre } from '../data/dramas';
import { HeroCarousel } from './HeroCarousel';
import { useApp } from '../state/appState';
const go = (path: string) => { history.pushState({ aiaiApp: true }, '', '#' + path); window.dispatchEvent(new Event('hashchange')); };

function SectionTitle({ title, action = '更多' }: { title: string; action?: string }) {
  return <div className="section-heading"><h2>{title}</h2><button className="text-button" onClick={() => go(title === '继续观看' ? '/me/history' : title === '本周热榜' ? '/rankings' : title === '追更日历' ? '/updates' : '/shorts')}>{action} <ArrowRight size={15} /></button></div>;
}

function PosterRail({ items, onOpen, ranked = false }: { items: Drama[]; onOpen: (item: Drama) => void; ranked?: boolean }) {
  return <div className="poster-rail">{items.map((item, index) => <button className="rail-card" key={item.id} onClick={() => onOpen(item)}>
    <span className="rail-cover"><img src={item.cover} alt={item.title} loading="lazy" style={{ objectPosition: item.crop }} />{ranked && <i>{index + 1}</i>}<em>{item.status}</em></span>
    <strong>{item.title}</strong><small>{item.heat}</small>
  </button>)}</div>;
}

function DramaGrid({ items, onOpen, manga = false }: { items: Drama[]; onOpen: (item: Drama) => void; manga?: boolean }) {
  if (!items.length) return <div className="content-empty"><Filter size={25} /><strong>暂时没有符合条件的内容</strong><span>调整筛选条件后再看看。</span></div>;
  return <div className={manga ? 'content-grid manga-grid' : 'content-grid'}>{items.map((item) => <button className="content-card" key={item.id} onClick={() => onOpen(item)}>
    <span className="content-cover"><img src={item.cover} alt={item.title} loading="lazy" style={{ objectPosition: item.crop }} /><i>{item.status}</i>{manga && <em>漫剧</em>}</span>
    <strong>{item.title}</strong>
    <small>{item.genre} · {item.completion}</small>
  </button>)}</div>;
}

function ContinueWatching({ item, onOpen }: { item: Drama; onOpen: (item: Drama) => void }) {
  const { records } = useApp(); const progress = records.history.find(p => p.contentId === item.id);
  return <section className="section continue-section">
    <SectionTitle title="继续观看" action="观看记录" />
    <button className="continue-card" onClick={() => onOpen(item)}><img src={item.cover} alt="" /><span className="continue-info"><strong>{item.title}</strong><small>上次看到第 {progress?.episodeId ?? 1} 集</small><span className="progress"><i style={{ width: (progress?.duration ? Math.min(100, progress.seconds / progress.duration * 100) : 0) + '%' }} /></span></span><span className="continue-play"><Play size={16} fill="currentColor" /></span></button>
  </section>;
}

function RecommendPage({ items, hasHistory, onOpen }: { items: Drama[]; hasHistory: boolean; onOpen: (item: Drama) => void }) {
  const { records } = useApp(); const recent = items.find(d => d.id === records.history[0]?.contentId);
  return <>
    <HeroCarousel items={items.slice(0, 5)} onOpen={onOpen} />
    <nav className="discovery-links" aria-label="发现更多">{[['排行榜', '/rankings'], ['精选专题', '/collections'], ['免费专区', '/free'], ['追更日历', '/updates']].map(([label, path]) => <button key={path} onClick={() => go(path)}>{label}<ArrowRight size={12}/></button>)}</nav>
    {hasHistory && recent && <ContinueWatching item={recent} onOpen={onOpen} />}
    <section className="section rail-section"><SectionTitle title="本周热榜" action="完整榜单" /><PosterRail items={items.slice(0, 7)} onOpen={onOpen} ranked /></section>
    <button className="topic-banner" onClick={() => go('/collections')}>
      <span><small><Sparkles size={13} /> 编辑精选</small><strong>入夜后的心动故事</strong><i>6 部高口碑都市与古装佳作</i></span>
      <img src={items[4].cover} alt="" />
    </button>
    <section className="section latest-section"><SectionTitle title="最新上架" action="查看全部" /><PosterRail items={items.slice(7, 13)} onOpen={onOpen} /></section>
    <section className="section more-section"><div className="section-heading"><h2>猜你喜欢</h2></div>
      {items.slice(10, 16).map((item) => <button className="story-row" key={item.id} onClick={() => onOpen(item)}><img src={item.cover} alt="" /><span><strong>{item.title}</strong><small>{item.tagline}</small><i>{item.genre} · {item.status}</i></span><ArrowRight size={18} /></button>)}
    </section>
  </>;
}

const genres: Genre[] = ['全部', '都市', '古装', '奇幻', '悬疑', '逆袭'];
type Completion = '全部' | '连载中' | '已完结';
type Region = '全部' | '内地' | '海外';
type Sort = '热度优先' | '最近更新';

function ChipRow<T extends string>({ label, values, value, onChange }: { label: string; values: T[]; value: T; onChange: (value: T) => void }) {
  return <div className="filter-row"><span>{label}</span><div>{values.map((item) => <button key={item} data-active={value === item} onClick={() => onChange(item)}>{item}</button>)}</div></div>;
}

function ShortDramaPage({ items, onOpen }: { items: Drama[]; onOpen: (item: Drama) => void }) {
  const [genre, setGenre] = useState<Genre>('全部');
  const [completion, setCompletion] = useState<Completion>('全部');
  const [region, setRegion] = useState<Region>('全部');
  const [sort, setSort] = useState<Sort>('热度优先');
  const [expanded, setExpanded] = useState(false);
  const activeCount = [genre, completion, region].filter((value) => value !== '全部').length;
  const visible = useMemo(() => {
    const result = items.filter((item) => (genre === '全部' || item.genre === genre) && (completion === '全部' || item.completion === completion) && (region === '全部' || item.region === region));
    return sort === '最近更新' ? [...result].reverse() : [...result].sort((a,b) => parseFloat(b.heat ?? '0') - parseFloat(a.heat ?? '0'));
  }, [items, genre, completion, region, sort]);
  const clear = () => { setGenre('全部'); setCompletion('全部'); setRegion('全部'); setSort('热度优先'); };

  return <>
    <section className="channel-intro short-intro">
      <span><small>短剧剧场</small><h1>一屏找到想看的爽剧</h1><p>按题材与更新状态快速筛选</p></span>
      <Flame size={31} />
    </section>
    <section className="browse-tools">
      <div className="quick-chips">{genres.map((item) => <button key={item} data-active={genre === item} onClick={() => setGenre(item)}>{item}</button>)}</div>
      <button className="filter-toggle" data-active={expanded || activeCount > 0} onClick={() => setExpanded((value) => !value)}><SlidersHorizontal size={16} />筛选{activeCount ? <i>{activeCount}</i> : null}</button>
    </section>
    <AnimatePresence initial={false}>{expanded && <motion.section className="filter-panel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
      <ChipRow label="状态" values={['全部', '连载中', '已完结']} value={completion} onChange={setCompletion} />
      <ChipRow label="地区" values={['全部', '内地', '海外']} value={region} onChange={setRegion} />
      <ChipRow label="排序" values={['热度优先', '最近更新']} value={sort} onChange={setSort} />
      <button className="clear-filter" onClick={clear}>重置筛选</button>
    </motion.section>}</AnimatePresence>
    <section className="section browse-section"><div className="result-heading"><h2>全部短剧</h2><span>{visible.length} 部</span></div><DramaGrid items={visible} onOpen={onOpen} /></section>
  </>;
}

function MangaPage({ items, onOpen }: { items: Drama[]; onOpen: (item: Drama) => void }) {
  const mangaGenres = ['全部', ...Array.from(new Set(items.map((item) => item.genre)))] as Genre[];
  const [genre, setGenre] = useState<Genre>('全部');
  const visible = genre === '全部' ? items : items.filter((item) => item.genre === genre);
  const feature = visible[0] ?? items[0];

  return <>
    {feature && <button className="manga-feature" onClick={() => onOpen(feature)}>
      <img src={feature.cover} alt="" />
      <span className="manga-feature-shade" />
      <span><small>本周漫剧精选</small><strong>{feature.title}</strong><p>{feature.tagline}</p><i><Play size={15} fill="currentColor" />开始观看</i></span>
    </button>}
    <section className="manga-filter">
      <div><strong>漫剧馆</strong><small>新番、奇幻与热血故事</small></div>
      <div className="quick-chips">{mangaGenres.map((item) => <button key={item} data-active={genre === item} onClick={() => setGenre(item)}>{item}</button>)}</div>
    </section>
    <section className="section manga-section"><div className="result-heading"><h2>正在连载</h2><span>每周更新</span></div><DramaGrid items={visible} onOpen={onOpen} manga /></section>
    <section className="section manga-update-list"><SectionTitle title="追更日历" action="全部更新" />{items.slice(0, 4).map((item, index) => <button key={item.id} onClick={() => onOpen(item)}><b>{String(index + 1).padStart(2, '0')}</b><img src={item.cover} alt="" /><span><strong>{item.title}</strong><small>{item.status} · {item.genre}</small></span><ArrowRight size={17} /></button>)}</section>
  </>;
}

export function HomeScreen({ channel, setChannel, hasHistory, onSearch, onMember, onOpen }: { channel: Channel; setChannel: (value: Channel) => void; hasHistory: boolean; onSearch: () => void; onMember: () => void; onOpen: (item: Drama) => void }) {
  const items = channelContent[channel];
  return <>
    <header className="topbar">
      <button className="home-search" onClick={onSearch} aria-label="搜索短剧、漫剧"><Search size={21} /></button>
      <div className="channel-tabs" role="tablist" aria-label="内容频道">
        {(['推荐', '短剧', '漫剧'] as Channel[]).map((name) => <button role="tab" aria-selected={channel === name} key={name} onClick={() => setChannel(name)}>{name}</button>)}
      </div>
      <button className="member-button" onClick={onMember}><Crown size={15} />会员</button>
    </header>
    <AnimatePresence mode="wait"><motion.main className="channel-page" key={channel} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
      {channel === '推荐' ? <RecommendPage items={items} hasHistory={hasHistory} onOpen={onOpen} /> : channel === '短剧' ? <ShortDramaPage items={items} onOpen={onOpen} /> : <MangaPage items={items} onOpen={onOpen} />}
    </motion.main></AnimatePresence>
  </>;
}
