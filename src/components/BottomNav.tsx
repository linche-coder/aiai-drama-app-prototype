import { Heart, Home, PlaySquare, UserRound } from 'lucide-react';

export type Page = 'home' | 'reels' | 'adult' | 'following' | 'me';
const nav: { id: Page; label: string; icon: typeof Home | null }[] = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'reels', label: '刷剧', icon: PlaySquare },
  { id: 'adult', label: '18+专区', icon: null },
  { id: 'following', label: '追剧', icon: Heart },
  { id: 'me', label: '我的', icon: UserRound },
];

export function BottomNav({ page, onChange }: { page: Page; onChange: (page: Page) => void }) {
  return <nav className={`bottom-nav ${page === 'reels' ? 'over-video' : ''}`} aria-label="底部导航">{nav.map(({ id, label, icon: Icon }) => <button key={id} aria-label={label} data-active={page === id} data-adult={id === 'adult'} onClick={() => onChange(id)}><span className="nav-icon">{id === 'adult' ? <span className="adult-brand-icon" aria-hidden="true"><span className="adult-icon-mono" /><img src="/assets/brand/logo-mark.svg" alt="" /></span> : Icon && <Icon size={21} strokeWidth={page === id ? 2.5 : 2} />}</span><span>{label}</span></button>)}</nav>;
}
