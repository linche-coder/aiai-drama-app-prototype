export type Channel = '推荐' | '短剧' | '漫剧';
export type Genre = '全部' | '都市' | '古装' | '奇幻' | '悬疑' | '逆袭';

export type Drama = {
  id: string;
  title: string;
  genre: Exclude<Genre, '全部'>;
  tagline: string;
  synopsis: string;
  cover: string;
  status: string;
  channel: Channel;
  crop?: string;
};

const item = (n: number, title: string, genre: Drama['genre'], tagline: string, status: string, channel: Channel = '短剧', crop = '50% 50%'): Drama => ({
  id: `drama-${String(n).padStart(2, '0')}`,
  title,
  genre,
  tagline,
  synopsis: `${tagline} 本原型仅展示选剧与预览交互，正片内容及正式剧集信息待业务服务接入。`,
  cover: `/assets/covers/drama-${String(n).padStart(2, '0')}-large.webp`,
  status,
  channel,
  crop,
});

export const dramas: Drama[] = [
  item(1, '别相信完美婚姻', '悬疑', '看似完美的日常，藏着怎样的另一面？', '共 48 集 · 演示'),
  item(8, '月色不晚', '都市', '把未说出口的心事，交给今晚的月色。', '更新至 32 集 · 演示'),
  item(5, '凋零前，请对我偏执', '古装', '一纸姻缘，将两个人的命运悄然牵起。', '共 60 集 · 演示'),
  item(17, '兽世重生：这次换我疼你', '奇幻', '跨越陌生世界，再一次奔向你。', '更新至 24 集 · 演示', '漫剧'),
  item(34, '长风踏歌', '古装', '长风起，踏歌行；一程山河，一场相知。', '共 40 集 · 演示'),
  item(3, '盖世雄父', '逆袭', '平凡身份之下，藏着不平凡的守护。', '共 72 集 · 演示'),
  item(4, '一日一载，武定乾坤', '逆袭', '于方寸之间，见少年意气与江湖风云。', '更新至 36 集 · 演示', '漫剧'),
  item(14, '油门踩到底！废柴车神逆袭', '逆袭', '握紧方向盘，驶向属于自己的答案。', '共 54 集 · 演示'),
  item(15, '皇帝微服出巡捡旧爱', '古装', '走出宫墙，一场意料之外的相逢。', '更新至 28 集 · 演示'),
  item(23, '辣妈翻身：陆长官的强制爱', '都市', '生活翻开新页，也让心动重新发生。', '共 66 集 · 演示'),
  item(26, '我家古董会说爱你', '奇幻', '旧物藏着时光，也藏着未完的故事。', '更新至 18 集 · 演示', '漫剧'),
  item(27, '拒当顾太太后，我惊艳全城', '都市', '从告别开始，找回闪闪发光的自己。', '共 50 集 · 演示'),
  item(29, '消失的厨神', '悬疑', '烟火升起的地方，总有温暖的故事。', '更新至 20 集 · 演示'),
  item(2, '灰姑娘孕事：王子的失落后裔', '奇幻', '命运写下伏笔，故事从一次相遇开始。', '共 42 集 · 演示', '漫剧'),
  item(6, '先婚后爱，爱你成瘾', '都市', '在日复一日的相处里，读懂心动。', '共 64 集 · 演示'),
  item(11, '战神护妻，杀出豪门', '逆袭', '风云变幻之间，守护是坚定的选择。', '更新至 45 集 · 演示'),
  item(20, '湖里真的有鳄鱼', '悬疑', '平静的水面之下，未知正在靠近。', '共 30 集 · 演示'),
  item(25, '人鱼公主归海', '奇幻', '循着海的回响，寻找真正的归处。', '更新至 22 集 · 演示', '漫剧'),
];

export const channelContent: Record<Channel, Drama[]> = {
  推荐: dramas,
  短剧: dramas.filter((d) => d.channel === '短剧'),
  漫剧: dramas.filter((d) => d.channel === '漫剧'),
};
