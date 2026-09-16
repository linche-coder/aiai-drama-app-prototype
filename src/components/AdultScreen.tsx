import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, Heart, Play, Search, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { adultBanners, adultDramas, type AdultDrama, type AdultTab } from '../data/adult';
import { useReducedMotion } from '../hooks/useReducedMotion';

function AdultPosterGrid({
  items,
  saved,
  onSave,
  onOpen,
}: {
  items: AdultDrama[];
  saved: string[];
  onSave: (id: string) => void;
  onOpen: (item: AdultDrama) => void;
}) {
  return (
    <div className="adult-grid">
      {items.map((item) => (
        <article className="adult-card" key={item.id}>
          <button className="adult-cover" onClick={() => onOpen(item)} aria-label={`查看《${item.title}》`}>
            <img src={item.cover} alt={item.title} loading="lazy" />
            <span className="adult-cover-shade" />
            {item.original && <span className="adult-original">原创</span>}
            <span className="adult-status">{item.status}</span>
          </button>
          <div className="adult-card-copy">
            <button onClick={() => onOpen(item)}><strong>{item.title}</strong><small>{item.genre} · {item.channel}</small></button>
            <button
              className="adult-save"
              aria-label={saved.includes(item.id) ? `取消收藏${item.title}` : `收藏${item.title}`}
              aria-pressed={saved.includes(item.id)}
              onClick={() => onSave(item.id)}
            ><Heart size={18} fill={saved.includes(item.id) ? 'currentColor' : 'none'} /></button>
          </div>
        </article>
      ))}
    </div>
  );
}

function AdultHero({ onOpen }: { onOpen: (item: AdultDrama) => void }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [manual, setManual] = useState(false);
  const banner = adultBanners[index];

  useEffect(() => {
    if (manual || reduced) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % adultBanners.length), 6000);
    return () => window.clearInterval(timer);
  }, [manual, reduced]);

  const change = (next: number) => {
    setManual(true);
    setIndex(next);
  };

  return (
    <section className="adult-hero" aria-label="今夜精选">
      <AnimatePresence mode="wait">
        <motion.button
          className="adult-hero-card"
          key={banner.id}
          onClick={() => onOpen(adultDramas[index])}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : .3 }}
        >
          <img src={banner.image} alt="" />
          <span className="adult-hero-shade" />
          <span className="adult-hero-copy">
            <small>今夜精选 · {banner.genre}</small>
            <strong>{banner.title}</strong>
            <span>{banner.synopsis}</span>
            <i><Play size={14} fill="currentColor" />立即观看</i>
          </span>
        </motion.button>
      </AnimatePresence>
      <div className="adult-hero-dots">
        {adultBanners.map((item, itemIndex) => (
          <button
            className={itemIndex === index ? 'active' : ''}
            key={item.id}
            onClick={() => change(itemIndex)}
            aria-label={`切换到${item.title}`}
          />
        ))}
      </div>
    </section>
  );
}

export function AdultScreen({
  onBack,
  onSearch,
  onOpen,
}: {
  onBack: () => void;
  onSearch: () => void;
  onOpen: (item: AdultDrama) => void;
}) {
  const [confirmed, setConfirmed] = useState(() => {
    try { return sessionStorage.getItem('aiai-adult-confirmed') === '1'; }
    catch { return false; }
  });
  const [tab, setTab] = useState<AdultTab>('首页');
  const [saved, setSaved] = useState<string[]>(() => {
    try { return JSON.parse(sessionStorage.getItem('aiai-adult-saved') ?? '[]'); }
    catch { return []; }
  });

  const visible = useMemo(() => {
    if (tab === '成人短剧') return adultDramas.filter((item) => item.channel === '短剧');
    if (tab === '成人漫剧') return adultDramas.filter((item) => item.channel === '漫剧');
    if (tab === '原创') return adultDramas.filter((item) => item.original);
    if (tab === '最新') return [...adultDramas].reverse();
    return adultDramas;
  }, [tab]);

  const confirm = () => {
    try { sessionStorage.setItem('aiai-adult-confirmed', '1'); } catch { /* session persistence is optional */ }
    setConfirmed(true);
  };
  const leaveZone = () => {
    try { sessionStorage.removeItem('aiai-adult-confirmed'); } catch { /* session persistence is optional */ }
    setConfirmed(false);
    setTab('首页');
  };
  const toggleSave = (id: string) => {
    setSaved((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      try { sessionStorage.setItem('aiai-adult-saved', JSON.stringify(next)); } catch { /* session persistence is optional */ }
      return next;
    });
  };

  if (!confirmed) {
    return (
      <main className="adult-gate">
        <button className="adult-gate-back" onClick={onBack}><ArrowLeft size={18} />返回普通区</button>
        <div className="adult-gate-mark"><ShieldCheck size={31} /></div>
        <span>仅限成年人</span>
        <h1>进入18+专区</h1>
        <p>本专区仅面向已满18周岁的用户。点击“确认并进入”，即表示你确认已满18周岁并主动进入。</p>
        <button className="adult-confirm" onClick={confirm}>确认并进入 <ChevronRight size={17} /></button>
        <button className="adult-cancel" onClick={onBack}>返回普通区</button>
      </main>
    );
  }

  return (
    <main className="adult-screen">
      <header className="adult-topbar">
        <button className="adult-icon-button" onClick={onBack} aria-label="返回首页"><ArrowLeft size={20} /></button>
        <div className="adult-title"><img src="/assets/brand/logo-mark.svg" alt="" /><span><strong>18+专区</strong><small>私密精选</small></span></div>
        <button className="adult-icon-button" onClick={onSearch} aria-label="搜索专区内容"><Search size={20} /></button>
      </header>
      <div className="adult-tabs" role="tablist" aria-label="专区频道">
        {(['首页', '成人短剧', '成人漫剧', '原创', '最新', '热门'] as AdultTab[]).map((name) => (
          <button role="tab" aria-selected={tab === name} key={name} onClick={() => setTab(name)}>{name}</button>
        ))}
      </div>
      {tab === '首页' ? (
        <>
          <AdultHero onOpen={onOpen} />
          <section className="adult-section">
            <div className="adult-section-heading"><span><small>为你精选</small><h2>精选推荐</h2></span><button onClick={() => setTab('热门')}>更多 <ChevronRight size={15} /></button></div>
            <AdultPosterGrid items={adultDramas.slice(0, 4)} saved={saved} onSave={toggleSave} onOpen={onOpen} />
          </section>
          <section className="adult-section">
            <div className="adult-section-heading"><span><small>最近更新</small><h2>最近上新</h2></span><button onClick={() => setTab('最新')}>全部 <ChevronRight size={15} /></button></div>
            <AdultPosterGrid items={adultDramas.slice(4, 8)} saved={saved} onSave={toggleSave} onOpen={onOpen} />
          </section>
          <button className="adult-wishlist" onClick={() => setTab('热门')}>
            <span><small>我的私密收藏</small><strong>把心动，留到下一场。</strong><i>{saved.length ? `已收藏 ${saved.length} 部内容` : '私密收藏 · 保存在此设备'}</i></span>
            <ChevronRight size={20} />
          </button>
        </>
      ) : (
        <section className="adult-section adult-filtered">
          <div className="adult-section-heading"><span><small>私密精选</small><h2>{tab}</h2></span><em>{visible.length} 部内容</em></div>
          <AdultPosterGrid items={visible} saved={saved} onSave={toggleSave} onOpen={onOpen} />
        </section>
      )}
      <footer className="adult-footer">
        <img src="/assets/brand/logo-mark.svg" alt="" />
        <strong>爱爱短剧 · 故事留在这里</strong>
        <span>私密收藏 · 自主选择 · 随时离开</span>
        <button onClick={leaveZone}>退出专区</button>
      </footer>
    </main>
  );
}
