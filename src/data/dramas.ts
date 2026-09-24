import { assetUrl } from '../utils/assets';

export type Channel = '推荐' | '真人短剧' | 'AI漫剧';
export type Genre = '全部' | '都市情感' | '古装' | '奇幻' | '悬疑' | '热血逆袭' | '其他';
export type ContentFormat = 'live_action_drama' | 'motion_comic' | 'short_film' | 'article';
export type AccessTier = 'free' | 'basic' | 'premium' | 'coin_reserved';
export type PublicationStatus = 'draft' | 'in_review' | 'published' | 'offline';
export type UpdateStatus = 'unknown' | 'ongoing' | 'completed';

export type Drama = {
  id: string; title: string; genre: Exclude<Genre, '全部'>; tagline: string; synopsis: string;
  cover: string; thumbnail: string; largeCover: string; status: string; channel: Channel;
  format: ContentFormat; accessTier: AccessTier; publicationStatus: PublicationStatus;
  updateStatus: UpdateStatus; original: boolean; freeEpisodes: number; episodePrice: number;
  episodeCount: number | null; crop?: string; adult?: boolean;
};

const entries = [
  [5, '凋零前，请对我偏执', '古装', '一纸姻缘，将两个人的命运悄然牵起。'],
  [8, '月色不晚', '都市情感', '把未说出口的心事，交给今晚的月色。'],
  [3, '盖世雄父', '热血逆袭', '平凡身份之下，藏着不平凡的守护。'],
  [17, '兽世重生：这次换我疼你', '奇幻', '跨越陌生世界，再一次奔向你。'],
  [4, '一日一载，武定乾坤', '热血逆袭', '于方寸之间，见少年意气与江湖风云。'],
  [14, '油门踩到底！废柴车神逆袭', '热血逆袭', '握紧方向盘，驶向属于自己的答案。'],
  [15, '皇帝微服出巡捡旧爱', '古装', '走出宫墙，一场意料之外的相逢。'],
  [23, '辣妈翻身：陆长官的强制爱', '都市情感', '生活翻开新页，也让心动重新发生。'],
  [26, '我家古董会说爱你', '奇幻', '旧物藏着时光，也藏着未完的故事。'],
  [27, '拒当顾太太后，我惊艳全城', '都市情感', '从告别开始，找回闪闪发光的自己。'],
  [29, '消失的厨神', '其他', '烟火升起的地方，总有温暖的故事。'],
  [34, '长风踏歌', '古装', '长风起，踏歌行；一程山河，一场相知。'],
  [1, '别相信完美婚姻', '悬疑', '看似完美的日常，藏着怎样的另一面？'],
  [2, '灰姑娘孕事：王子的失落后裔', '奇幻', '命运写下伏笔，故事从一次相遇开始。'],
  [6, '先婚后爱，爱你成瘾', '都市情感', '在日复一日的相处里，读懂心动。'],
  [11, '战神护妻，杀出豪门', '热血逆袭', '风云变幻之间，守护是坚定的选择。'],
  [20, '湖里真的有鳄鱼', '悬疑', '平静的水面之下，未知正在靠近。'],
  [25, '人鱼公主归海', '奇幻', '循着海的回响，寻找真正的归处。'],
] as const;

// WEB 1.4.3 preview catalog is the source of truth. Unknown release fields stay unknown.
export const dramas: Drama[] = entries.map(([n, title, genre, tagline]) => {
  const id = `drama-${String(n).padStart(2, '0')}`;
  const format: ContentFormat = [17, 4, 26, 2, 25].includes(n) ? 'motion_comic' : 'live_action_drama';
  return {
    id, title, genre, tagline, synopsis: tagline,
    cover: assetUrl(`assets/covers/${id}-large.webp`), thumbnail: assetUrl(`assets/covers/${id}-small.webp`), largeCover: assetUrl(`assets/covers/${id}-large.webp`),
    status: '状态待确认', channel: format === 'motion_comic' ? 'AI漫剧' : '真人短剧', format,
    accessTier: 'coin_reserved', publicationStatus: 'draft', updateStatus: 'unknown', original: false,
    freeEpisodes: 6, episodePrice: 5, episodeCount: null,
  };
});

export const genres: Genre[] = ['全部', '都市情感', '古装', '奇幻', '悬疑', '热血逆袭', '其他'];
export const channelContent: Record<Channel, Drama[]> = {
  推荐: dramas,
  真人短剧: dramas.filter(d => d.format === 'live_action_drama'),
  AI漫剧: dramas.filter(d => d.format === 'motion_comic'),
};
