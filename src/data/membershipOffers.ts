export type ProductId = 'view-month' | 'view-quarter' | 'view-forever' | 'points-220';
export type Product = { id: ProductId; title: string; price: number; durationDays: number | null; kind: 'membership' | 'credits'; points?: number; benefits: string[] };
export const products: Product[] = [
  { id: 'view-month', title: '畅看月卡', price: 88, durationDays: 30, kind: 'membership', benefits: ['30 天畅看，观看不扣永久积分', '每日签到获得 1 会员积分', '不自动续费'] },
  { id: 'view-quarter', title: '畅看季卡', price: 188, durationDays: 90, kind: 'membership', benefits: ['90 天畅看，观看不扣永久积分', '每日签到获得 1 会员积分', '不自动续费'] },
  { id: 'view-forever', title: '永久会员', price: 388, durationDays: null, kind: 'membership', benefits: ['无到期日，观看不扣永久积分', '历史会员积分余额与记录继续保留', '不自动续费'] },
  { id: 'points-220', title: '220 永久积分', price: 10.9, durationDays: null, kind: 'credits', points: 220, benefits: ['永久有效，可重复购买', '仅用于付费单集解锁', '不能代替畅看会员或绕过年龄确认'] },
];
export const festivalBonus: Partial<Record<ProductId, number>> = { 'view-month': 7, 'view-quarter': 30 };
export const money = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1);
