import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, Crown, Heart, MonitorSmartphone, RotateCcw, UserRound } from 'lucide-react';
import { AdultScreen } from './components/AdultScreen';
import { BrandSplash } from './components/BrandSplash';
import { BottomNav, type Page } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { ReelsScreen } from './components/ReelsScreen';
import { PreviewSheet, SearchSheet, Sheet } from './components/Sheets';
import { adultDramas } from './data/adult';
import { dramas, type Channel, type Drama } from './data/dramas';

function Placeholder({ page, onBack }: { page: Exclude<Page, 'home' | 'reels' | 'adult'>; onBack: () => void }) {
  const map = {
    following: { icon: Heart, eyebrow: '我的追剧', title: '还没有追剧记录', copy: '收藏与更新提醒会在正式业务接入后显示在这里。' },
    me: { icon: UserRound, eyebrow: '个人中心', title: '我的页面筹备中', copy: '登录、会员、订单与设置不在本期原型范围内。' },
  } as const;
  const content = map[page];
  const Icon = content.icon;
  return <main className="placeholder-page"><button className="back-button" onClick={onBack}><ArrowLeft size={19} />返回首页</button><div className="placeholder-mark"><Icon size={34} /></div><span className="eyebrow">{content.eyebrow}</span><h1>{content.title}</h1><p>{content.copy}</p><button className="primary-button" onClick={onBack}>回到首页</button></main>;
}

export function App() {
  const [channel, setChannel] = useState<Channel>('推荐');
  const [page, setPage] = useState<Page>('home');
  const [preview, setPreview] = useState<Drama | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [hasHistory, setHasHistory] = useState(true);
  const [previewWidth, setPreviewWidth] = useState(390);
  const [replayKey, setReplayKey] = useState(0);
  const [splash, setSplash] = useState(() => {
    try { return sessionStorage.getItem('aiai-app-intro-seen') !== '1'; }
    catch { return true; }
  });
  const scroller = useRef<HTMLDivElement>(null);
  const homeScroll = useRef(0);

  const navigate = (next: Page) => {
    if (page === 'home') homeScroll.current = scroller.current?.scrollTop ?? 0;
    setPage(next);
    requestAnimationFrame(() => { if (scroller.current) scroller.current.scrollTop = next === 'home' ? homeScroll.current : 0; });
  };
  const replay = () => { setReplayKey((value) => value + 1); setSplash(true); };
  const finishSplash = useCallback(() => { try { sessionStorage.setItem('aiai-app-intro-seen', '1'); } catch { /* optional */ } setSplash(false); }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (preview) setPreview(null);
      else if (searchOpen) setSearchOpen(false);
      else if (memberOpen) setMemberOpen(false);
      else if (page !== 'home') navigate('home');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [preview, searchOpen, memberOpen, page]);

  return <div className="workspace" style={{ '--preview-width': `${previewWidth}px` } as CSSProperties}>
    <div className="app-frame">
      <div className="phone-surface">
        <div ref={scroller} className={`app-scroller ${page === 'reels' ? 'reels-host' : ''}`}>
          {page === 'home'
            ? <HomeScreen channel={channel} setChannel={setChannel} hasHistory={hasHistory} onSearch={() => setSearchOpen(true)} onMember={() => setMemberOpen(true)} onOpen={setPreview} />
            : page === 'reels'
              ? <ReelsScreen paused={!!preview || searchOpen || memberOpen} onSearch={() => setSearchOpen(true)} onOpen={setPreview} />
              : page === 'adult'
                ? <AdultScreen onBack={() => navigate('home')} onSearch={() => setSearchOpen(true)} onOpen={setPreview} />
                : <Placeholder page={page} onBack={() => navigate('home')} />}
        </div>
        <BottomNav page={page} onChange={navigate} />
        <SearchSheet open={searchOpen} items={page === 'adult' ? adultDramas : dramas} onClose={() => setSearchOpen(false)} onOpen={(item) => { setSearchOpen(false); setPreview(item); }} />
        <PreviewSheet item={preview} onClose={() => setPreview(null)} />
        <Sheet open={memberOpen} title="会员中心" onClose={() => setMemberOpen(false)}><div className="member-placeholder"><Crown size={30} /><h3>会员功能暂未接入</h3><p>本期仅确认入口位置和弹层样式，不提供购买、支付或权益开通流程。</p><button className="primary-button" onClick={() => setMemberOpen(false)}>我知道了</button></div></Sheet>
        {splash && <BrandSplash replayKey={replayKey} onDone={finishSplash} />}
      </div>
    </div>
    <aside className="demo-controls" aria-label="原型演示控制">
      <span className="demo-label"><MonitorSmartphone size={15} />PROTOTYPE TOOLS</span>
      <h2>演示控制</h2>
      <p>这些控制不属于 APP 产品界面。</p>
      <button className="replay-button" onClick={replay}><RotateCcw size={17} />重播品牌开屏</button>
      <div className="control-group"><span>首页状态</span><div className="segmented"><button data-active={hasHistory} onClick={() => setHasHistory(true)}>有记录</button><button data-active={!hasHistory} onClick={() => setHasHistory(false)}>新用户</button></div></div>
      <div className="control-group"><span>预览宽度</span><div className="segmented sizes">{[360, 390, 430].map((width) => <button key={width} data-active={previewWidth === width} onClick={() => setPreviewWidth(width)}>{width}</button>)}</div></div>
      <div className="demo-state"><i />当前：{channel}频道 · {hasHistory ? '有观看记录' : '新用户'}</div>
    </aside>
  </div>;
}
