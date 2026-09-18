// Product proposal supplied by the user. These IDs must NEVER be sent to checkout.
export type OfferFamily = 'joy' | 'prestige';
export type OfferPeriod = 'month' | 'year';
export type DemoOffer = { id: string; kind: 'membership' | 'credits'; title: string; price: number; period: string; credits: number; benefits: string[]; demo: true };
export const families = {
  joy: { name: '悦享会员', credits: 320, monthly: 19.9, yearly: 168, yearlyComparison: 238.8, benefits: ['短剧、漫剧、18+专区访问资格', '无广告观看', '最高 1080P', '1 台设备'] },
  prestige: { name: '尊享会员', credits: 960, monthly: 39.9, yearly: 328, yearlyComparison: 478.8, benefits: ['积分解锁享 8 折', '每月 1 张整剧畅看券', '新剧提前 48 小时', '2 台设备'] },
} as const;
export const creditPacks = [{ credits: 60, price: 6 }, { credits: 200, price: 18 }, { credits: 580, price: 45 }, { credits: 1500, price: 98 }];
export function membershipOffer(family: OfferFamily, period: OfferPeriod): DemoOffer {
  const value = families[family];
  return { id: 'demo-v2-' + family + '-' + period, kind: 'membership', title: value.name + (period === 'year' ? '年卡' : '月卡'), price: period === 'year' ? value.yearly : value.monthly, period: period === 'year' ? '1 年' : '1 个月', credits: value.credits, benefits: [...value.benefits], demo: true };
}
export function creditsOffer(index: number): DemoOffer {
  const pack = creditPacks[index] ?? creditPacks[0];
  return { id: 'demo-v2-credits-' + pack.credits, kind: 'credits', title: pack.credits.toLocaleString() + ' 积分包', price: pack.price, period: '一次性积分补充', credits: pack.credits, benefits: ['仅补充积分，不开通或续费会员', '有效期及可用范围待正式配置确认'], demo: true };
}
export const legacyPlans = [
  { id: 'basic-month', title: '基础月卡', description: '1 个月基础会员内容权益' },
  { id: 'premium-month', title: '高级月卡', description: '1 个月高级会员内容权益' },
  { id: 'premium-quarter', title: '高级季卡', description: '3 个月高级会员内容权益' },
];
export const money = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1);

