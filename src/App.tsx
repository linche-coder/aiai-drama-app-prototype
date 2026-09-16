import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { MonitorSmartphone, RotateCcw, WifiOff } from 'lucide-react';
import { AdultScreen } from './components/AdultScreen';
import { BrandSplash } from './components/BrandSplash';
import { BottomNav, type Page } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { DramaDetailScreen, FollowingScreen, MemberContent, ProfileScreen } from './components/ProductScreens';
import { ReelsScreen } from './components/ReelsScreen';
import { SearchSheet, Sheet } from './components/Sheets';
import { adultDramas } from './data/adult';
import { dramas, type Channel, type Drama } from './data/dramas';

function readFollowing() {
  try {
    const saved = JSON.parse(sessionStorage.getItem('aiai-following') ?? '[]');
    return Array.isArray(saved) && saved.length ? saved : ['drama-08'];
  } catch { return ['drama-08']; }
}

export function App() {
  const [channel, setChannel] = useState<Channel>('推荐');
  const [page, setPage] = useState<Page>('home');
  const [detail, setDetail] = useState<Drama | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>(readFollowing);
  const [searchOpen, setSearchOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [hasHistory, setHasHistory] = useState(true);
  const [loggedIn, setLoggedIn] = useState(() => {
    try { return sessionStorage.getItem('aiai-user-login') === '1'; } catch { return false; }
  });
  const [previewWidth, setPreviewWidth] = useState(390);
  const [replayKey, setReplayKey] = useState(0);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [splash, setSplash] = useState(() => {
    try { return sessionStorage.getItem('aiai-app-intro-seen') !== '1'; }
    catch { return true; }
  });
  const scroller = useRef<HTMLDivElement>(null);
  const homeScroll = useRef(0);

  const navigate = (next: Page) => {
    if (page === 'home') homeScroll.current = scroller.current?.scrollTop ?? 0;
    setDetail(null);
    setPage(next);
    requestAnimationFrame(() => { if (scroller.current) scroller.current.scrollTop = next === 'home' ? homeScroll.current : 0; });
  };
  const replay = () => { setReplayKey((value) => value + 1); setSplash(true); };
  const finishSplash = useCallback(() => { try { sessionStorage.setItem('aiai-app-intro-seen', '1'); } catch { /* optional */ } setSplash(false); }, []);
  const toggleFollowing = (id: string) => {
    setFollowingIds((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      try { sessionStorage.setItem('aiai-following', JSON.stringify(next)); } catch { /* optional */ }
      return next;
    });
  };

  useEffect(() => {
    const updateNetwork = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);
    return () => { window.removeEventListener('online', updateNetwork); window.removeEventListener('offline', updateNetwork); };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (detail) setDetail(null);
      else if (searchOpen) setSearchOpen(false);
      else if (memberOpen) setMemberOpen(false);
      else if (page !== 'home') navigate('home');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail, searchOpen, memberOpen, page]);

  const followedItems = dramas.filter((item) => followingIds.includes(item.id));

  return <div className="workspace" style={{ '--preview-width': previewWidth + 'px' } as CSSProperties}>
    <div className="app-frame">
      <div className="phone-surface">
        {!online && <div className="offline-banner"><WifiOff size={14} />网络连接不可用，正在显示已缓存内容</div>}
        <div ref={scroller} className={'app-scroller ' + (page === 'reels' ? 'reels-host' : '')}>
          {page === 'home'
            ? <HomeScreen channel={channel} setChannel={setChannel} hasHistory={hasHistory} onSearch={() => setSearchOpen(true)} onMember={() => setMemberOpen(true)} onOpen={setDetail} />
            : page === 'reels'
              ? <ReelsScreen paused={!!detail || searchOpen || memberOpen} onSearch={() => setSearchOpen(true)} onOpen={setDetail} />
              : page === 'adult'
                ? <AdultScreen onBack={() => navigate('home')} onSearch={() => setSearchOpen(true)} onOpen={setDetail} />
                : page === 'following'
                  ? <FollowingScreen items={followedItems} onOpen={setDetail} onBrowse={() => navigate('home')} />
                  : <ProfileScreen hasHistory={hasHistory} onMember={() => setMemberOpen(true)} loggedIn={loggedIn} onLogin={() => setLoggedIn(true)} />}
        </div>
        <BottomNav page={page} onChange={navigate} />
        <SearchSheet open={searchOpen} items={page === 'adult' ? adultDramas : dramas} onClose={() => setSearchOpen(false)} onOpen={(item) => { setSearchOpen(false); setDetail(item); }} />
        <Sheet open={memberOpen} title="会员中心" onClose={() => setMemberOpen(false)}><MemberContent loggedIn={loggedIn} onClose={() => setMemberOpen(false)} /></Sheet>
        {detail && <DramaDetailScreen item={detail} following={followingIds.includes(detail.id)} onToggleFollowing={() => toggleFollowing(detail.id)} onBack={() => setDetail(null)} />}
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
