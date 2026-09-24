import type { Drama } from './dramas';
import { assetUrl } from '../utils/assets';
export type AdultTab = '首页' | '成人短剧' | '成人漫剧' | '原创' | '最新' | '热门';
export type AdultDrama = Drama & { adult: true };
const titles = [
  '盲人的秘密','黑白之夜','真实的缅北','婊子谁都能上','玩元神救了我一命','禽满四合院：嫂子跪着要肉棒','全班地铁求生只有我一男生','共享逼时代','捉妖师：但是专捉美艳的妖妇','jiojio的禁忌之门','母上攻略','棋牌店的美女老板','全班地铁求生只有我一个男生','奸尸法医3','深夜加班绝望办公室','夜神月vs富江02','深夜加班绝望办公室单集','情侣主的清理工具','拼鸡鸡','流落荒岛全岛的女人都追着我要精液',
];
export const adultDramas: AdultDrama[] = titles.map((title, index) => {
  const n = index + 1, id = `landscape-${String(n).padStart(2, '0')}`, cover = assetUrl(`assets/adult/landscape/${id}.webp`);
  return { id, title, cover, thumbnail: cover, largeCover: cover, genre: '其他', channel: '真人短剧', format: 'live_action_drama', original: false, tagline: '', synopsis: '封面预览，剧情资料待补充。', status: '状态待确认', accessTier: 'coin_reserved', publicationStatus: 'draft', updateStatus: 'unknown', freeEpisodes: 0, episodePrice: 5, episodeCount: null, adult: true };
});
export const adultBanners = adultDramas.slice(0, 6).map(item => ({ id: item.id, title: item.title, image: item.cover, genre: '成人短剧', synopsis: '' }));
