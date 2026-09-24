import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Play } from 'lucide-react';
import type { Drama } from '../data/dramas';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { assetUrl } from '../utils/assets';

type HeroSlide = { kind: 'festival'; id: string; title: string; genre: string; status: string; tagline: string; cover: string } | { kind: 'drama'; item: Drama };

export function HeroCarousel({ items, onOpen, onFestival }: { items: Drama[]; onOpen: (item: Drama) => void; onFestival: () => void }) {
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
  const slides: HeroSlide[] = [
    { kind: 'festival', id: 'festival-2026', title: '月满中秋 · 礼遇国庆', genre: '双节活动', status: '活动进行中', tagline: '任务最高领 350 永久积分，会员限时加赠畅看天数', cover: assetUrl('assets/festival/aiai-festival-v4-background-mobile.png') },
    ...items.map(item => ({ kind: 'drama' as const, item })),
  ];
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
            const item = slide.kind === 'drama' ? slide.item : slide;
            return (
              <motion.button
                key={item.id}
                className={`hero-card${slide.kind === 'festival' ? ' hero-festival-card' : ''}`}
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
                  if (isActive) slide.kind === 'festival' ? onFestival() : onOpen(slide.item);
                  else {
                    setManual(true);
                    setIndex(itemIndex);
                  }
                }}
                aria-label={slide.kind === 'festival' ? '查看中秋国庆双节活动' : `查看《${item.title}》预览`}
                animate={{
                  x: offset * cardWidth * .94,
                  scale: isActive ? 1 : .91,
                  opacity: isVisible ? (isActive ? 1 : .45) : 0,
                }}
                transition={{ duration: reduced ? 0 : .3, ease: [.22, 1, .36, 1] }}
              >
                <img src={item.cover} alt={item.title} draggable={false} style={{ objectPosition: slide.kind === 'drama' ? slide.item.crop : 'center' }} />
                {slide.kind === 'festival' && <img className="hero-festival-title" src={assetUrl('assets/festival/aiai-festival-title-350-transparent.png')} alt="月满中秋，礼遇国庆，最高领350积分" draggable={false}/>}
                <span className="hero-shade" />
                {isActive && <span className="hero-badge">{item.genre}</span>}
                {isActive && slide.kind === 'festival' && <span className="hero-festival-cta">立即查看 <ArrowRight size={14}/></span>}
              </motion.button>
            );
          })}
        </motion.div>
      </div>
      <div className="dots" aria-label="轮播位置">
        {slides.map((slide, itemIndex) => {
          const item = slide.kind === 'drama' ? slide.item : slide;
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
          <button className="hero-copy" onClick={() => active.kind === 'festival' ? onFestival() : onOpen(active.item)}>
            <strong>{active.kind === 'festival' ? active.title : active.item.title}</strong>
            <span>{active.kind === 'festival' ? active.genre : active.item.genre} · {active.kind === 'festival' ? active.status : active.item.status}</span>
            <small>{active.kind === 'festival' ? active.tagline : active.item.tagline}</small>
          </button>
          <button className="hero-play" onClick={() => active.kind === 'festival' ? onFestival() : onOpen(active.item)} aria-label={active.kind === 'festival' ? '查看双节活动' : `播放${active.item.title}`}>
            {active.kind === 'festival' ? <ArrowRight size={18}/> : <Play size={18} fill="currentColor" />}
          </button>
        </div>
      )}
    </section>
  );
}
