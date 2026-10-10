import { ArrowRight, Check, Clock3, Coins, Gift, Play, Users } from 'lucide-react';
import { autumnActive } from '../data/membershipOffers';
import { useApp } from '../state/appState';
import { PageShell } from './Common';
import { assetUrl } from '../utils/assets';

type Props = { navigate: (path: string) => void; onBack: () => void };

const offers = [
  { name: '永久积分包', base: '220 积分', bonus: '再送 50 积分', kind: 'points' },
  { name: '畅看月卡', base: '30 天', bonus: '再送 7 天', kind: 'month' },
  { name: '畅看季卡', base: '90 天', bonus: '再送 15 天', kind: 'quarter' },
];

export function AutumnPage({ navigate, onBack }: Props) {
  const { session, login } = useApp();
  const active = autumnActive();

  return <PageShell title="金秋活动" onBack={onBack}>
    <div className="autumn-campaign">
      {active && <button type="button" className="autumn-mobile-hero" onClick={() => document.getElementById('autumn-offers')?.scrollIntoView({ behavior: 'smooth' })} aria-label="查看金秋充值加赠">
        <img src={assetUrl('assets/autumn/recharge-kv-mobile-v3.webp')} alt="金秋充值，加赠好礼"/>
        <span className="autumn-hero-hint">下滑了解活动福利 <ArrowRight size={15} aria-hidden="true"/></span>
      </button>}

      <div className="autumn-intro">
        <span className="autumn-eyebrow">THE GOLDEN SEASON <i/></span>
        <h2>这个秋天，好剧与好礼一起到来</h2>
        <p>绿色剧集从现在起永久免费。{active ? '限时福利持续至 10 月 31 日。' : '本次限时活动已结束。'}</p>
      </div>

      <section className="autumn-feature" aria-labelledby="autumn-free-title">
        <div className="autumn-feature-icon"><Play size={23} fill="currentColor" aria-hidden="true"/></div>
        <div className="autumn-feature-copy">
          <small>永久开放 · 无需积分解锁</small>
          <h2 id="autumn-free-title">绿色剧集，全剧免费追</h2>
          <p>从第一集看到大结局。喜欢的故事，随时打开继续看。</p>
        </div>
        <button className="autumn-link-button" onClick={() => navigate('/videos')}>去看免费剧集 <ArrowRight size={17} aria-hidden="true"/></button>
      </section>

      {active && <>
        <section className="autumn-offers" id="autumn-offers" aria-labelledby="autumn-offers-title">
          <div className="autumn-section-heading">
            <span className="autumn-eyebrow">GOLDEN BENEFITS <i/></span>
            <h2 id="autumn-offers-title">充值加赠，挑一份秋日好礼</h2>
            <p>新老用户都可参加。积分包、月卡或季卡，每个账号限享一次加赠。</p>
          </div>
          <div className="autumn-offer-grid">
            {offers.map((offer, index) => <article key={offer.name} className={'autumn-offer-card autumn-offer-' + offer.kind}>
              {index === 0 && <span className="autumn-offer-tag">本期主推</span>}
              <div className="autumn-offer-top">
                <div><small>{offer.name}</small><h3>{offer.base}</h3></div>
                <Gift size={index === 0 ? 30 : 24} aria-hidden="true"/>
              </div>
              <div className="autumn-offer-bonus"><span>限时加赠</span><strong>{offer.bonus}</strong></div>
              <button onClick={() => navigate('/membership')}>查看方案 <ArrowRight size={16} aria-hidden="true"/></button>
            </article>)}
          </div>
          <p className="autumn-note"><Check size={15} aria-hidden="true"/>永久卡原有权益保持不变；加赠以支付成功后的账号资格为准。</p>
        </section>

        <section className="autumn-tasks" aria-labelledby="autumn-tasks-title">
          <div className="autumn-section-heading">
            <span className="autumn-eyebrow">MORE TO ENJOY <i/></span>
            <h2 id="autumn-tasks-title">更多好礼，和朋友一起享</h2>
          </div>
          <div className="autumn-task-list">
            <article className="autumn-task-card">
              <div className="autumn-task-icon"><Users size={22} aria-hidden="true"/></div>
              <div className="autumn-task-copy"><small>邀请好友</small><h3>邀好友，收好礼</h3><p>好友通过专属链接注册，并累计观看绿色剧集满 3 分钟，即成为有效邀请。</p></div>
              <div className="autumn-reward-row">
                <div><small>免费用户 · 每位</small><strong>+20 <em>积分</em></strong><span>最高 100 积分</span></div>
                <div><small>付费用户 · 每位</small><strong>+1 <em>天畅看</em></strong><span>最多加 5 天</span></div>
              </div>
              <button className="autumn-link-button" onClick={() => !session?.subject ? login() : document.getElementById('autumn-rules')?.scrollIntoView({ behavior: 'smooth' })}>{session?.subject ? '查看邀请规则' : '登录后参与'} <ArrowRight size={17} aria-hidden="true"/></button>
            </article>
            <article className="autumn-task-card autumn-login-card">
              <div className="autumn-task-icon"><Coins size={22} aria-hidden="true"/></div>
              <div className="autumn-task-copy"><small>登录体验礼</small><h3>免费用户，领 10 积分</h3><p>活动期间，免费用户登录后可领取一次。每个账号限领一次。</p></div>
              <strong className="autumn-login-number">+10 <small>永久积分</small></strong>
              <button className="autumn-link-button" onClick={() => !session?.subject ? login() : navigate('/me/points')}>{session?.subject ? '查看我的积分' : '登录查看资格'} <ArrowRight size={17} aria-hidden="true"/></button>
            </article>
          </div>
        </section>

        <section className="autumn-rules" id="autumn-rules">
          <h2><Clock3 size={19} aria-hidden="true"/>活动规则</h2>
          <ol>
            <li>金秋加赠、邀请及体验奖励持续至 2026 年 10 月 31 日 23:59:59（北京时间）；绿色剧集永久免费。</li>
            <li>积分包、月卡、季卡的加赠每个账号合计限享一次，永久卡保持原有权益。</li>
            <li>好友须经专属邀请链接注册新账号，并累计有效观看绿色剧集满 3 分钟，才计为一次有效邀请；同一好友只计一次。</li>
            <li>免费用户每次有效邀请获 20 永久积分，最多 5 次；付费用户每次获 1 天畅看，最多 5 次。</li>
            <li>免费用户登录可领 10 永久积分，每个账号限领一次。</li>
          </ol>
        </section>
      </>}
    </div>
  </PageShell>;
}
