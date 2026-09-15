import { AnimatePresence, motion } from 'motion/react';
import { Clock3, Film, Play, Search, X } from 'lucide-react';
import type { Drama } from '../data/dramas';

export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  return <AnimatePresence>{open && <motion.div className="sheet-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
    <div className="sheet-scrim" aria-hidden="true" />
    <motion.section className="sheet" role="dialog" aria-modal="true" aria-label={title} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 320 }} onClick={(event) => event.stopPropagation()}>
      <div className="sheet-grabber" />
      <header><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="关闭"><X /></button></header>
      {children}
    </motion.section>
  </motion.div>}</AnimatePresence>;
}

export function SearchSheet({ open, items, onClose, onOpen }: { open: boolean; items: Drama[]; onClose: () => void; onOpen: (item: Drama) => void }) {
  const [query, setQuery] = React.useState('');
  const results = query.trim() ? items.filter((item) => `${item.title}${item.genre}`.toLowerCase().includes(query.trim().toLowerCase())) : items.slice(0, 4);
  return <Sheet open={open} title="搜一部好剧" onClose={onClose}>
    <label className="search-field"><Search size={18} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索剧名或题材" /><button onClick={() => setQuery('')}>{query ? '清除' : '搜索'}</button></label>
    <p className="search-note">{query ? `找到 ${results.length} 部本地演示内容` : '最近热搜 · 演示数据'}</p>
    <div className="search-results">
      {results.map((item) => <button key={item.id} onClick={() => onOpen(item)}><img src={item.cover} alt="" /><span><strong>{item.title}</strong><small>{item.genre} · {item.status}</small></span><Play size={17} /></button>)}
      {!results.length && <div className="empty"><Search /><strong>没有找到相关剧目</strong><span>换个关键词试试，比如“月色”或“古装”。</span></div>}
    </div>
  </Sheet>;
}

export function PreviewSheet({ item, onClose }: { item: Drama | null; onClose: () => void }) {
  return <Sheet open={!!item} title="剧目预览" onClose={onClose}>{item && <div className="preview-content">
    <img className="preview-poster" src={item.cover} alt={item.title} />
    <div className="preview-copy"><span className="genre-pill">{item.genre}</span><h3>{item.title}</h3><p>{item.synopsis}</p><span className="preview-status"><Clock3 size={14} />{item.status}</span></div>
    <button className="primary-button"><Play size={18} fill="currentColor" />播放预览占位</button>
    <p className="scope-note"><Film size={15} />本期不接入正式播放器，按钮仅演示交互反馈。</p>
  </div>}</Sheet>;
}

import React from 'react';
