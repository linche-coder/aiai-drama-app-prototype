import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import type { Drama } from '../data/dramas';
import { useReducedMotion } from '../hooks/useReducedMotion';

type HeroSlide = { item: Drama };

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
  const slides: HeroSlide[] = items.map(item => ({ item }));
  useEffect(() => setIndex(0), [items]);
  useEffect(() => {
    if (manual || reduced || slides.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((value) => (value + 1) % slides.length),
      4600,
    );
    return () => window.clearInterval(timer);
  }, [slides.length, manual, reduced]);

  const offsetFor = (itemIndex: number) => {
    let offset = itemIndex - index;
    const half = slides.length / 2;
    if (offset > half) offset -= slides.length;
    if (offset < -half) offset += slides.length;
    return offset;
  };
  const active = slides[index];

  return (
    <section className="featured" aria-label="精选推荐">
      <div ref={frame} className="hero-frame">
        <motion.div
          className="hero-track"
          drag={slides.length > 1 ? 'x' : false}
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
              setIndex((value) => (value + 1) % slides.length);
            } else if (info.offset.x > 42 || info.velocity.x > 480) {
              setIndex((value) => (value - 1 + slides.length) % slides.length);
            }
            suppressClickUntil.current = performance.now() + 250;
          }}
        >
          {slides.map((slide, itemIndex) => {
            const offset = offsetFor(itemIndex);
            const isActive = offset === 0;
            const isVisible = Math.abs(offset) <= 1;
            const item = slide.item;
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
                  if (isActive) onOpen(slide.item);
                  else {
                    setManual(true);
                    setIndex(itemIndex);
                  }
                }}
                aria-label={'查看《' + item.title + '》'}
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
        {slides.map((slide, itemIndex) => {
          const item = slide.item;
          return (
          <button
            key={item.id}
            onClick={() => {
              setManual(true);
              setIndex(itemIndex);
            }}
            className={itemIndex === index ? 'active' : ''}
            aria-label={`切换到${item.title}`}
          />
        )})}
      </div>
      {active && (
        <div className="hero-summary">
          <button className="hero-copy" onClick={() => onOpen(active.item)}>
            <strong>{active.item.title}</strong>
            <span>{active.item.genre} · {active.item.status}</span>
            <small>{active.item.tagline}</small>
          </button>
          <button className="hero-play" onClick={() => onOpen(active.item)} aria-label={'播放' + active.item.title}>
            <Play size={18} fill="currentColor" />
          </button>
        </div>
      )}
    </section>
  );
}
