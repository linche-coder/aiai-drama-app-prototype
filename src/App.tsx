import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { MonitorSmartphone, RotateCcw, WifiOff } from 'lucide-react';
import { AdultScreen } from './components/AdultScreen';
import { BrandSplash } from './components/BrandSplash';
import { BottomNav, type Page } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { ProfileScreen, LibraryScreen, AccountPage } from './components/AccountScreens';
import { DramaDetailScreen, PlayerScreen, episodeCount } from './components/DramaScreens';
import { MembershipPage, CommercePage, SupportPage, PolicyPage } from './components/MoreScreens';
import { AuthSheet } from './components/AuthSheet';
import { AuthLinkPage } from './components/AuthLinkPage';
import { ReelsScreen } from './components/ReelsScreen';
import { SearchSheet } from './components/Sheets';
import { FestivalPage, PointsPage } from './components/BusinessScreens';
import { Empty, PageShell } from './components/Common';
import { adultDramas } from './data/adult';
import { dramas, type Channel, type Drama } from './data/dramas';
import { AppState, useApp, useRoute } from './state/appState';
export function App() {
  const [auth, setAuth] = useState(false);
  return <AppState login={() => setAuth(true)}><AppContent auth={auth} setAuth={setAuth}/></AppState>;
}
function AppContent({ auth, setAuth }: { auth: boolean; setAuth: (v: boolean) => void }) {
  const { records } = useApp(), { route, navigate } = useRoute();
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login'), [channel, setChannel] = useState<Channel>('推荐'), [basePage, setBasePage] = useState<Page>('home'), [search, setSearch] = useState(false), [searchAdult, setSearchAdult] = useState(false), [width, setWidth] = useState(390), [replayKey, setReplayKey] = useState(0), [online, setOnline] = useState(navigator.onLine);
  const [splash, setSplash] = useState(() => { try { return sessionStorage.getItem('aiai-app-intro-seen') !== '1'; } catch { return true; } });
  const scroller = useRef<HTMLDivElement>(null);
  const finishSplash = useCallback(() => { try { sessionStorage.setItem('aiai-app-intro-seen', '1'); } catch {} setSplash(false); }, []);
  const path = route.split('?')[0], params = new URLSearchParams(route.split('?')[1] || ''), match = path.match(/^\/(detail|play|18plus\/play|read)\/([^/]+)$/);
  let id = ''; try { id = match ? decodeURIComponent(match[2]) : ''; } catch {}
  const detail = match ? [...dramas, ...adultDramas].find(d => d.id === id) : undefined;
  const isAdult = !!detail && adultDramas.some(d => d.id === detail.id);
  const adultConfirmed = (() => { try { return sessionStorage.getItem('aiai-adult-confirmed') === '1'; } catch { return false; } })();
  useEffect(() => { if (!path.startsWith('/18plus') && !isAdult) { try { sessionStorage.removeItem('aiai-adult-confirmed'); } catch {} } }, [path, isAdult]);
  const pageMap: Record<string, Page> = { '/': 'home', '/reels': 'reels', '/18plus': 'adult', '/18plus/search': 'adult', '/18plus/wishlist': 'adult', '/following': 'following', '/me': 'me', '/search': 'home', '/videos': 'home', '/shorts': 'home', '/comics': 'home' };
  const mainPage = pageMap[path];
  const navMap: Record<Page, string> = { home: '/', reels: '/reels', adult: '/18plus', following: '/following', me: '/me' };
  const open = (d: Drama) => { setSearch(false); navigate('/detail/' + encodeURIComponent(d.id)); };
  const back = () => { if (history.state?.aiaiApp) history.back(); else navigate(match?.[1]?.includes('play') && detail ? '/detail/' + encodeURIComponent(detail.id) : navMap[basePage], true); };
  const nav = (to: string) => { if (to.startsWith('/account/')) { setAuthMode(to.includes('forgot') ? 'forgot' : to.includes('register') ? 'register' : 'login'); setAuth(true); return; } navigate(to); };
  useEffect(() => { if (mainPage) setBasePage(mainPage); }, [mainPage]);
  useEffect(() => { if (path === '/videos' || path === '/shorts') setChannel('真人短剧'); else if (path === '/comics') setChannel('AI漫剧'); }, [path]);
  useEffect(() => { if (path === '/search') { setSearchAdult(false); setSearch(true); } else if (path === '/18plus/search' && adultConfirmed) { setSearchAdult(true); setSearch(true); } }, [path, adultConfirmed]);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = 0; }, [basePage]);
  useEffect(() => { if (['/account/login', '/account/register', '/account/forgot-password', '/account/session-expired'].includes(path)) { setAuthMode(path.includes('forgot') ? 'forgot' : path.includes('register') ? 'register' : 'login'); setAuth(true); } }, [path]);
  useEffect(() => { document.title = detail ? detail.title + ' · 爱爱短剧' : '爱爱短剧 · 好故事，一眼入戏'; }, [detail]);
  useEffect(() => { const update = () => setOnline(navigator.onLine); window.addEventListener('online', update); window.addEventListener('offline', update); return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); }; }, []);
  useEffect(() => { const key = (e: KeyboardEvent) => { if (e.key !== 'Escape' || document.querySelector('[aria-modal="true"]')) return; if (path !== '/') back(); }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, [path]);
  const isPlayer = !!match?.[1]?.includes('play') && !!detail && (!isAdult || adultConfirmed);
  const common = { route, navigate: nav, onBack: back, onOpen: open };
  const ep = detail ? Math.max(1, Math.min(episodeCount(detail), Math.floor(Number(params.get('episode'))) || 1)) : 1;
  let overlay: React.ReactNode = null;
  if (match) overlay = !detail ? <PageShell title={match[1] === 'read' ? '文章暂不可用' : '剧目不存在'} onBack={back}><Empty title={match[1] === 'read' ? '暂无可阅读内容' : '没有找到这部作品'} text="内容状态以正式服务为准。"><button className="primary-button" onClick={() => navigate('/')}>返回首页</button></Empty></PageShell> : isAdult && !adultConfirmed ? <PageShell title="访问确认" onBack={back}><Empty title="请先完成专区年龄确认"><button className="primary-button" onClick={() => navigate('/18plus')}>前往专区</button></Empty></PageShell> : match[1] === 'read' ? <PageShell title={detail.title} onBack={back}><Empty title="文章正文暂未上线" text="请稍后重试。"/></PageShell> : isPlayer ? <PlayerScreen key={detail.id} item={detail} episode={ep} onBack={back} onEpisode={n => navigate((isAdult ? '/18plus/play/' : '/play/') + encId(detail.id) + '?episode=' + n, true)} onMember={() => navigate('/membership')}/> : <DramaDetailScreen key={detail.id} item={detail} onBack={back} onOpen={open} onPlay={n => navigate((isAdult ? '/18plus/play/' : '/play/') + encId(detail.id) + '?episode=' + n)}/>;
  else if (path === '/account/reset-password' || path === '/account/verify') overlay = <AuthLinkPage key={route} route={route} onBack={back} onLogin={() => { setAuthMode('login'); setAuth(true); }}/>;
  else if (path.startsWith('/account/')) overlay = null;
  else if (path === '/membership') overlay = <MembershipPage {...common}/>;
  else if (path === '/festival') overlay = <FestivalPage navigate={nav} onBack={back}/>;
  else if (path === '/me/points') overlay = <PointsPage navigate={nav} onBack={back}/>;
  else if (path === '/checkout' || path === '/payment-result' || path.startsWith('/me/orders')) overlay = <CommercePage key={route} {...common}/>;
  else if (path.startsWith('/me/')) overlay = <AccountPage key={path} kind={path.slice(4)} {...common}/>;
  else if (path.startsWith('/support') || path === '/help' || path === '/contact') overlay = <SupportPage key={path} {...common}/>;
  else if (['/about', '/terms', '/privacy', '/copyright', '/membership-guide'].includes(path)) overlay = <PolicyPage {...common}/>;
  else if (['/free', '/rankings', '/collections', '/updates', '/settings'].some(p => path === p || path.startsWith(p + '/'))) overlay = <PageShell title="页面不存在" onBack={back}><Empty title="这个页面已下线"><button className="primary-button" onClick={() => navigate('/')}>返回首页</button></Empty></PageShell>;
  else if (!mainPage) overlay = <PageShell title="页面不存在" onBack={back}><Empty title="这个页面暂不可用"><button className="primary-button" onClick={() => navigate('/')}>返回首页</button></Empty></PageShell>;
  const active = mainPage || basePage;
  return <div className="workspace" style={{ '--preview-width': width + 'px' } as CSSProperties}><div className="app-frame"><div className="phone-surface">
    {!online && <div className="offline-banner"><WifiOff size={14}/>网络不可用，请检查连接后重试</div>}
    <div ref={scroller} inert={!!overlay || search || auth} aria-hidden={!!overlay || undefined} className={'app-scroller ' + (active === 'reels' ? 'reels-host' : '')}>
      {active === 'home' ? <HomeScreen channel={channel} setChannel={setChannel} hasHistory={records.history.some(p => dramas.some(d => d.id === p.contentId))} onSearch={() => navigate('/search')} onMember={() => navigate('/membership')} onOpen={open}/> : active === 'reels' ? <ReelsScreen paused={!!overlay || auth || search} onSearch={() => navigate('/search')} onOpen={open}/> : active === 'adult' ? <AdultScreen route={route} navigate={nav} onBack={() => navigate('/')} onSearch={() => navigate('/18plus/search')} onOpen={open}/> : active === 'following' ? <LibraryScreen onOpen={open} navigate={nav}/> : <ProfileScreen navigate={nav} onOpen={open}/>}
    </div>
    <div className="route-layer" inert={auth || search}>{overlay}</div>
    {!isPlayer && <BottomNav page={path === '/membership' || path === '/membership-guide' || path === '/checkout' || path === '/payment-result' || path.startsWith('/me/') ? 'me' : active} onChange={p => { setSearch(false); navigate(navMap[p]); }}/>}
    <SearchSheet open={search} items={searchAdult ? adultDramas : dramas} onClose={() => { setSearch(false); if (path === '/search') navigate('/'); else if (path === '/18plus/search') navigate('/18plus'); }} onOpen={open}/>
    <AuthSheet initialMode={authMode} open={auth} onClose={() => { setAuth(false); if (['/account/login', '/account/register', '/account/forgot-password', '/account/session-expired'].includes(path)) { const target = params.get('returnTo') || '/'; navigate(target.startsWith('/') && !target.startsWith('//') && !target.startsWith('/account/') ? target : '/', true); } }} onPolicy={kind => { setAuth(false); navigate('/' + kind); }}/>
    {splash && <BrandSplash replayKey={replayKey} onDone={finishSplash}/>}
  </div></div><aside className="demo-controls" aria-label="预览控制"><span className="demo-label"><MonitorSmartphone size={15}/>MOBILE PREVIEW</span><h2>爱爱短剧 APP</h2><p>移动端页面与交互预览</p><button className="replay-button" onClick={() => { setReplayKey(v => v + 1); setSplash(true); }}><RotateCcw size={17}/>重播品牌开屏</button><div className="control-group"><span>预览宽度</span><div className="segmented sizes">{[360, 390, 430].map(w => <button key={w} data-active={width === w} onClick={() => setWidth(w)}>{w}</button>)}</div></div></aside></div>;
}
const encId = encodeURIComponent;
