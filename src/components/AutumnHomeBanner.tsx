import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { autumnActive } from '../data/membershipOffers';
import { assetUrl } from '../utils/assets';

type Phase = 'hidden' | 'expanded' | 'collapsed';

export function AutumnHomeBanner({ onOpen }: { onOpen: () => void }) {
  const [phase, setPhase] = useState<Phase>('hidden');
  useEffect(() => {
    if (!autumnActive()) return;
    const frame = requestAnimationFrame(() => setPhase('expanded'));
    return () => cancelAnimationFrame(frame);
  }, []);
  if (!autumnActive()) return null;
  const collapsed = phase === 'collapsed';
  return <section className={'autumn-home-drawer is-' + phase} aria-label="金秋充值加赠活动">
    <div className="autumn-home-drawer-full" aria-hidden={phase !== 'expanded'} inert={phase !== 'expanded'}>
      <button type="button" className="autumn-home-banner-link" onClick={onOpen} aria-label="查看金秋活动详情" tabIndex={phase === 'expanded' ? 0 : -1}>
        <img src={assetUrl('assets/autumn/recharge-kv-mobile-v3.webp')} alt="金秋充值，加赠好礼"/>
      </button>
    </div>
    <div className="autumn-home-drawer-mini" aria-hidden={!collapsed} inert={!collapsed}>
      <button type="button" className="autumn-home-banner-link" onClick={onOpen} aria-label="查看金秋活动详情" tabIndex={collapsed ? 0 : -1}>
        <img src={assetUrl('assets/autumn/recharge-strip-mobile-v3.webp')} alt="金秋充值，加赠好礼"/>
      </button>
    </div>
    <button type="button" className={'autumn-home-toggle' + (collapsed ? ' is-collapsed' : '')} aria-label={collapsed ? '展开金秋活动横幅' : '收起金秋活动横幅'} aria-expanded={!collapsed} disabled={phase === 'hidden'} onClick={() => setPhase(value => value === 'collapsed' ? 'expanded' : 'collapsed')}>
      {collapsed ? <ChevronDown size={21} aria-hidden="true"/> : <ChevronUp size={21} aria-hidden="true"/>}
    </button>
  </section>;
}
