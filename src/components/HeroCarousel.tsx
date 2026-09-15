import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import type { Drama } from '../data/dramas';
import { useReducedMotion } from '../hooks/useReducedMotion';

export function HeroCarousel({ items, onOpen }: { items: Drama[]; onOpen: (item: Drama) => void }) {
  const reduced = useReducedMotion();
  const frame = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(288);
  const [manual, setManual] = useState(false);
  const suppressClickUntil = useRef(0);

  useEffect(() => {
    const resize = () => {
      const width = frame.current?.clientWidth ?? 390;
      setCardWidth(Math.min(width * .74, 306));
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (frame.current) observer.observe(frame.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => setIndex(0), [items]);
  useEffect(() => {
    if (manual || reduced || items.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((value) => (value + 1) % items.length),
      4600,
    );
    return () => window.clearInterval(timer);
  }, [items.length, manual, reduced]);

  const offsetFor = (itemIndex: number) => {
    let offset = itemIndex - index;
    const half = items.length / 2;
    if (offset > half) offset -= items.length;
    if (offset < -half) offset += items.length;
    return offset;
  };
  const active = items[index];

  return (
    <section className="featured" aria-label="精选推荐">
      <div ref={frame} className="hero-frame">
        <motion.div
          className="hero-track"
          drag={items.length > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={.16}
          animate={{ x: 0 }}
          transition={{ type: 'spring', stiffness: 290, damping: 31 }}
          onDragStart={() => {
            suppressClickUntil.current = performance.now() + 700;
            setManual(true);
          }}
          onDragEnd={(_, info) => {
            if (info.offset.x < -42 || info.velocity.x < -480) {
              setIndex((value) => (value + 1) % items.length);
            } else if (info.offset.x > 42 || info.velocity.x > 480) {
              setIndex((value) => (value - 1 + items.length) % items.length);
            }
            suppressClickUntil.current = performance.now() + 250;
          }}
        >
          {items.map((item, itemIndex) => {
            const offset = offsetFor(itemIndex);
            const isActive = offset === 0;
            const isVisible = Math.abs(offset) <= 1;
            return (
              <motion.button
                key={item.id}
                className="hero-card"
                data-active={isActive}
                data-offset={offset}
                style={{
                  left: '50%',
                  width: cardWidth,
                  marginLeft: -cardWidth / 2,
                  zIndex: isActive ? 3 : isVisible ? 2 : 1,
                  pointerEvents: isVisible ? 'auto' : 'none',
                }}
                onClick={() => {
                  if (performance.now() < suppressClickUntil.current) return;
                  if (isActive) onOpen(item);
                  else {
                    setManual(true);
                    setIndex(itemIndex);
                  }
                }}
                aria-label={`查看《${item.title}》预览`}
                animate={{
                  x: offset * cardWidth * .94,
                  scale: isActive ? 1 : .91,
                  opacity: isVisible ? (isActive ? 1 : .45) : 0,
                }}
                transition={{ duration: reduced ? 0 : .3, ease: [.22, 1, .36, 1] }}
              >
                <img src={item.cover} alt={item.title} draggable={false} style={{ objectPosition: item.crop }} />
                <span className="hero-shade" />
                {isActive && <span className="hero-badge">{item.genre}</span>}
              </motion.button>
            );
          })}
        </motion.div>
      </div>
      <div className="dots" aria-label="轮播位置">
        {items.map((item, itemIndex) => (
          <button
            key={item.id}
            onClick={() => {
              setManual(true);
              setIndex(itemIndex);
            }}
            className={itemIndex === index ? 'active' : ''}
            aria-label={`切换到${item.title}`}
          />
        ))}
      </div>
      {active && (
        <div className="hero-summary">
          <button className="hero-copy" onClick={() => onOpen(active)}>
            <strong>{active.title}</strong>
            <span>{active.genre} · {active.status}</span>
            <small>{active.tagline}</small>
          </button>
          <button className="hero-play" onClick={() => onOpen(active)} aria-label={`播放${active.title}`}>
            <Play size={18} fill="currentColor" />
          </button>
        </div>
      )}
    </section>
  );
}
