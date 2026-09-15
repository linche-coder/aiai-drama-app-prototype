import { useId, useLayoutEffect, useMemo, useRef } from 'react';
import groupedLogo from '../assets/intro-logo.svg?raw';
import { useReducedMotion } from '../hooks/useReducedMotion';

const REVEAL = 1550;
const HOLD = 412;
const FADE = 360;

export function BrandSplash({ replayKey, onDone }: { replayKey: number; onDone: () => void }) {
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const id = useId().replace(/[^a-z0-9]/gi, '');
  const markup = useMemo(() => {
    let value = groupedLogo;
    for (const match of groupedLogo.matchAll(/id="([^"]+)"/g)) value = value.replaceAll(`id="${match[1]}"`, `id="${id}-${match[1]}"`).replaceAll(`#${match[1]})`, `#${id}-${match[1]})`);
    return value;
  }, [id]);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const bodyOverflow = document.body.style.overflow;
    const scroller = element.closest('.phone-surface')?.querySelector<HTMLElement>('.app-scroller');
    const scrollerOverflow = scroller?.style.overflow;
    document.body.style.overflow = 'hidden';
    if (scroller) scroller.style.overflow = 'hidden';
    const animations: Animation[] = [];
    const origin = Number(document.timeline.currentTime ?? performance.now());
    let finished = false;
    let disposed = false;
    const finish = () => { if (!disposed && !finished) { finished = true; onDone(); } };
    const animate = (target: Element | null, frames: Keyframe[], delay: number, duration: number, easing = 'cubic-bezier(.22,1,.36,1)') => {
      if (!target) return undefined;
      const animation = target.animate(frames, { delay, duration, easing, fill: 'both' });
      animation.startTime = origin;
      animations.push(animation);
      return animation;
    };
    let master: Animation | undefined;
    if (reduced) {
      master = animate(element, [{ opacity: 0 }, { opacity: 1, offset: .36 }, { opacity: 1, offset: .58 }, { opacity: 0 }], 0, 220, 'linear');
    } else {
      animate(element.querySelector('.brand-icon'), [{ transform: 'translateX(360px)' }, { transform: 'translateX(0)' }], 850, 700);
      animate(element.querySelector('.brand-hearts'), [{ opacity: 0, transform: 'rotate(-4deg) scale(.86,.91)' }, { opacity: .9, transform: 'rotate(.7deg) scale(1.015,.99)', offset: .65 }, { opacity: 1, transform: 'none' }], 140, 1030);
      animate(element.querySelector('.brand-dot-left'), [{ opacity: 0, transform: 'translate(-15px,-12px) scale(.8)' }, { opacity: 1, transform: 'none' }], 410, 730);
      animate(element.querySelector('.brand-dot-right'), [{ opacity: 0, transform: 'translate(15px,-16px) scale(.8)' }, { opacity: 1, transform: 'none' }], 510, 740);
      animate(element.querySelector('.brand-wordmark'), [{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, clipPath: 'inset(0 0 0 0)' }], 900, 650);
      animate(element.querySelector('.intro-glow'), [{ opacity: 0 }, { opacity: .16, offset: .2 }, { opacity: .32, offset: .45 }, { opacity: .14, offset: .75 }, { opacity: 0 }], 40, 1900, 'linear');
      animate(element.querySelector('.brand-sheen'), [{ opacity: 0 }, { opacity: .48, offset: .42 }, { opacity: .2, offset: .7 }, { opacity: 0 }], 160, 1770, 'ease-in-out');
      animate(element.querySelector('.brand-light'), [{ transform: 'translate(-130px,35px) rotate(-18deg)' }, { transform: 'translate(360px,-25px) rotate(-18deg)' }], 160, 1770, 'cubic-bezier(.35,0,.25,1)');
      animate(element.querySelector('.splash-tagline'), [{ opacity: 0, transform: 'translateY(7px)' }, { opacity: 1, transform: 'none' }], 1010, 360);
      master = animate(element, [{ opacity: 1 }, { opacity: 0 }], REVEAL + HOLD, FADE, 'cubic-bezier(.4,0,.2,1)');
    }
    master?.finished.then(finish, finish);
    const safety = window.setTimeout(finish, reduced ? 500 : REVEAL + HOLD + FADE + 300);
    return () => {
      disposed = true;
      window.clearTimeout(safety);
      animations.forEach((animation) => animation.cancel());
      document.body.style.overflow = bodyOverflow;
      if (scroller) scroller.style.overflow = scrollerOverflow ?? '';
    };
  }, [onDone, reduced, replayKey]);

  return <div key={replayKey} ref={root} className={`splash ${reduced ? 'splash-reduced' : ''}`} aria-label="爱爱短剧品牌开屏">
    <div className="splash-curtain" />
    <div className="splash-brand"><div className="splash-svg" dangerouslySetInnerHTML={{ __html: markup }} /><p className="splash-tagline">好故事，一眼入戏</p></div>
  </div>;
}
