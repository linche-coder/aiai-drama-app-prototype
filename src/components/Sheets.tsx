import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Play, Search, X } from 'lucide-react';
import type { Drama } from '../data/dramas';
import { useReducedMotion } from '../hooks/useReducedMotion';
export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const reduced = useReducedMotion();
  const dialog = useRef<HTMLElement>(null), close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => { const el = dialog.current; (el?.querySelector<HTMLElement>('.sheet > header button') ?? el)?.focus({ preventScroll: true }); }, 60);
    const key = (event: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[aria-modal="true"]'); if (dialogs[dialogs.length - 1] !== dialog.current) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close.current(); }
      if (event.key === 'Tab') { const nodes = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]') ?? [])].filter(n => n.getClientRects().length); const first = nodes[0], last = nodes[nodes.length - 1]; if (!first) { event.preventDefault(); dialog.current?.focus({ preventScroll: true }); } else if (event.shiftKey && (document.activeElement === first || !dialog.current?.contains(document.activeElement))) { event.preventDefault(); last.focus({ preventScroll: true }); } else if (!event.shiftKey && (document.activeElement === last || !dialog.current?.contains(document.activeElement))) { event.preventDefault(); first.focus({ preventScroll: true }); } }
    };
    window.addEventListener('keydown', key, true);
    return () => { clearTimeout(timer); window.removeEventListener('keydown', key, true); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [open]);
  return <AnimatePresence>{open && <motion.div className="sheet-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}><div className="sheet-scrim" aria-hidden="true"/><motion.section ref={dialog} tabIndex={-1} className="sheet" role="dialog" aria-modal="true" aria-label={title} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={reduced ? { duration: 0 } : { type: 'spring', damping: 30, stiffness: 320 }} onClick={e => e.stopPropagation()}><div className="sheet-grabber"/><header><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="关闭"><X/></button></header>{children}</motion.section></motion.div>}</AnimatePresence>;
}
export function SearchSheet({ open, items, onClose, onOpen }: { open: boolean; items: Drama[]; onClose: () => void; onOpen: (d: Drama) => void }) {
  const [query, setQuery] = useState(''), results = query.trim() ? items.filter(d => (d.title + d.genre).toLowerCase().includes(query.trim().toLowerCase())) : items.slice(0, 4);
  return <Sheet open={open} title="搜一部好剧" onClose={onClose}><label className="search-field"><Search size={18}/><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索剧名或题材"/><button onClick={() => setQuery('')}>{query ? '清除' : '搜索'}</button></label><p className="search-note">{query ? '找到 ' + results.length + ' 部相关内容' : '大家都在搜'}</p><div className="search-results">{results.map(d => <button key={d.id} onClick={() => onOpen(d)}><img src={d.cover} alt=""/><span><strong>{d.title}</strong><small>{d.genre} · {d.status}</small></span><Play size={17}/></button>)}{!results.length && <div className="empty"><Search/><strong>没有找到相关剧目</strong><span>换个关键词试试，比如“月色”或“古装”。</span></div>}</div></Sheet>;
}

