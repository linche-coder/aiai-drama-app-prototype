import { ArrowRight, Crown, Play, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { channelContent, type Channel, type Drama } from '../data/dramas';
import { HeroCarousel } from './HeroCarousel';

function PosterRail({ items, onOpen, ranked = false }: { items: Drama[]; onOpen: (item: Drama) => void; ranked?: boolean }) {
  return <div className="poster-rail">{items.map((item, index) => <button className="rail-card" key={item.id} onClick={() => onOpen(item)}>
    <span className="rail-cover"><img src={item.cover} alt={item.title} loading="lazy" />{ranked && <i>{index + 1}</i>}</span>
    <strong>{item.title}</strong><small>{item.status}</small>
  </button>)}</div>;
}

export function HomeScreen({ channel, setChannel, hasHistory, onSearch, onMember, onOpen }: { channel: Channel; setChannel: (value: Channel) => void; hasHistory: boolean; onSearch: () => void; onMember: () => void; onOpen: (item: Drama) => void }) {
  const items = channelContent[channel];
  const featured = items.slice(0, Math.min(5, items.length));
  return <>
    <header className="topbar">
      <button className="home-search" onClick={onSearch}><Search size={18} /><span>搜索短剧、漫剧</span></button>
      <button className="member-button" onClick={onMember}><Crown size={15} />会员</button>
    </header>
    <div className="channel-tabs" role="tablist" aria-label="内容频道">{(['推荐', '短剧', '漫剧'] as Channel[]).map((name) => <button role="tab" aria-selected={channel === name} key={name} onClick={() => setChannel(name)}>{name}{channel === name && <motion.span layoutId="channel-pill" />}</button>)}</div>
    <AnimatePresence mode="wait"><motion.main key={channel} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
      <HeroCarousel items={featured} onOpen={onOpen} />
      {hasHistory && <section className="section continue-section">
        <div className="section-heading"><h2>继续观看</h2><button className="text-button">全部 <ArrowRight size={15} /></button></div>
        <button className="continue-card" onClick={() => onOpen(items[1] ?? items[0])}><img src={(items[1] ?? items[0]).cover} alt="" /><span className="continue-info"><strong>{(items[1] ?? items[0]).title}</strong><small>上次看到第 12 集</small><span className="progress"><i /></span></span><span className="continue-play"><Play size={16} fill="currentColor" /></span></button>
      </section>}
      <section className="section rail-section">
        <div className="section-heading"><h2>热门趋势</h2><button className="text-button">更多 <ArrowRight size={15} /></button></div>
        <PosterRail items={items.slice(0, 7)} onOpen={onOpen} ranked />
      </section>
      <section className="section latest-section" id="latest">
        <div className="section-heading"><h2>最新上架</h2><button className="text-button">查看全部 <ArrowRight size={15} /></button></div>
        <PosterRail items={(items.length > 7 ? items.slice(7, 13) : items.slice(-3).reverse())} onOpen={onOpen} />
      </section>
      {items.length > 10 && <section className="section more-section">
        <div className="section-heading"><h2>更多推荐</h2></div>
        {items.slice(10, 16).map((item) => <button className="story-row" key={item.id} onClick={() => onOpen(item)}><img src={item.cover} alt="" /><span><strong>{item.title}</strong><small>{item.tagline}</small><i>{item.genre} · {item.status}</i></span><ArrowRight size={18} /></button>)}
      </section>}
    </motion.main></AnimatePresence>
  </>;
}

import React from 'react';
