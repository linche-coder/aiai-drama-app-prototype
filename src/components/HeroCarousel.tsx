import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import type { Drama } from '../data/dramas';
import { useReducedMotion } from '../hooks/useReducedMotion';

export function HeroCarousel({ items, onOpen }: { items: Drama[]; onOpen: (item: Drama) => void }) {
  const reduced = useReducedMotion();
  const frame = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [geometry, setGeometry] = useState({ card: 288, stride: 300, frame: 390 });
  const [manual, setManual] = useState(false);
  const direction = useRef(1);
  const suppressClickUntil = useRef(0);
  const renderedItems = useMemo(() => items.length > 1 ? [items.at(-1)!, ...items, items[0]] : items, [items]);

  useEffect(() => {
    const resize = () => {
      const width = frame.current?.clientWidth ?? 390;
      const card = Math.min(width * .74, 306);
      setGeometry({ card, stride: card + 12, frame: width });
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (frame.current) observer.observe(frame.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => setIndex(0), [items]);
  useEffect(() => {
    if (manual || reduced || items.length < 2) return;
    const timer = window.setInterval(() => setIndex((value) => {
      if (value === items.length - 1) direction.current = -1;
      if (value === 0) direction.current = 1;
      return value + direction.current;
    }), 4600);
    return () => window.clearInterval(timer);
  }, [items.length, manual, reduced]);

  const x = useMemo(() => (geometry.frame - geometry.card) / 2 - (items.length > 1 ? index + 1 : index) * geometry.stride, [geometry, index, items.length]);
  const active = items[index];
  return (
    <section className="featured" aria-label="精选推荐">
      <div ref={frame} className="hero-frame">
        <motion.div
          className="hero-track"
          drag={items.length > 1 ? 'x' : false}
          dragConstraints={{ left: x - 36, right: x + 36 }}
          dragElastic={.16}
          animate={{ x }}
          transition={{ type: 'spring', stiffness: 290, damping: 31 }}
          onDragStart={() => { suppressClickUntil.current = performance.now() + 700; setManual(true); }}
          onDragEnd={(_, info) => {
            if (info.offset.x < -42 || info.velocity.x < -480) setIndex((v) => Math.min(items.length - 1, v + 1));
            if (info.offset.x > 42 || info.velocity.x > 480) setIndex((v) => Math.max(0, v - 1));
            suppressClickUntil.current = performance.now() + 250;
          }}
        >
          {renderedItems.map((item, renderIndex) => {
            const logicalIndex = items.length > 1 ? (renderIndex - 1 + items.length) % items.length : 0;
            const isActive = logicalIndex === index && renderIndex === index + 1;
            return (
            <motion.button
              key={`${item.id}-${renderIndex}`}
              className="hero-card"
              data-active={isActive}
              onClick={() => {
                if (performance.now() < suppressClickUntil.current) return;
                if (isActive) onOpen(item); else { setManual(true); setIndex(logicalIndex); }
              }}
              aria-label={`查看《${item.title}》预览`}
              animate={{ scale: isActive ? 1 : .91, opacity: isActive ? 1 : .45 }}
              transition={{ duration: reduced ? 0 : .28 }}
            >
              <img src={item.cover} alt={item.title} draggable={false} style={{ objectPosition: item.crop }} />
              <span className="hero-shade" />
              {isActive && <span className="hero-badge">{item.genre}</span>}
            </motion.button>
          );})}
        </motion.div>
      </div>
      <div className="dots" aria-label="轮播位置">
        {items.map((item, i) => <button key={item.id} onClick={() => { setManual(true); setIndex(i); }} className={i === index ? 'active' : ''} aria-label={`切换到${item.title}`} />)}
      </div>
      {active && <div className="hero-summary">
        <button className="hero-copy" onClick={() => onOpen(active)}><strong>{active.title}</strong><span>{active.genre} · {active.status}</span><small>{active.tagline}</small></button>
        <button className="hero-play" onClick={() => onOpen(active)} aria-label={`播放${active.title}`}><Play size={18} fill="currentColor" /></button>
      </div>}
    </section>
  );
}
