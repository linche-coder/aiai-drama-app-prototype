import type { Drama } from './dramas';

export type AdultTab = '首页' | '成人短剧' | '成人漫剧' | '原创' | '最新' | '热门';
export type AdultDrama = Drama & { original: boolean };

const adultItem = (
  id: string,
  title: string,
  cover: string,
  genre: Drama['genre'],
  channel: Drama['channel'],
  original = false,
): AdultDrama => ({
  id,
  title,
  cover: `/assets/adult/covers/${cover}`,
  genre,
  channel,
  original,
  tagline: '一封迟到的信，让原本平静的生活发生了变化。',
  synopsis:
    '一封迟到的信，让原本平静的生活发生了变化。追寻线索的途中，他们与旧友重逢，也遇见新的伙伴，在误会与理解之间寻找真相。专区内容为本地结构演示。',
  status: '剧集信息待确认 · 演示',
});

export const adultDramas: AdultDrama[] = [
  adultItem('private-preview-1', '高三爱情故事', 'ui-0.jpg', '都市', '短剧', true),
  adultItem('private-preview-2', '神瞳觉醒 第一季', 'ui-1.jpg', '悬疑', '短剧'),
  adultItem('private-preview-3', '半兽人公司', 'ui-2.jpg', '奇幻', '短剧', true),
  adultItem('private-preview-4', '鸡榜啼鸣', 'ui-3.jpg', '都市', '短剧'),
  adultItem('private-preview-5', '日勤病栋', 'ui-4.jpg', '悬疑', '短剧', true),
  adultItem('private-preview-6', '末日神舟', 'ui-5.jpg', '奇幻', '短剧'),
  adultItem('adult-cover-6', '朱颜血系列之长途列车', 'ui-10.jpg', '悬疑', '漫剧', true),
  adultItem('adult-cover-7', '出差', 'ui-11.jpg', '奇幻', '漫剧'),
];

export const adultBanners = [
  {
    id: 'adult-banner-1',
    title: '全班地铁求生，只有我一个男生',
    image: '/assets/adult/banners/banner-1.jpg',
    genre: '悬疑 · 生存',
    synopsis:
      '末班地铁突然停驶，倒计时在车厢里亮起。一群同行者必须放下分歧，在未知站台与重重线索之间寻找出口。',
  },
  {
    id: 'adult-banner-2',
    title: '琼明神女录',
    image: '/assets/adult/banners/banner-2.jpg',
    genre: '古装 · 奇幻',
    synopsis:
      '一卷旧录牵动尘封往事，两位旅人在月下相遇，从山门到江湖，循着散落的线索前行。',
  },
];
