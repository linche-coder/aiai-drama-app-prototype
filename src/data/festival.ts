export const festivalConfig = {
  id: 'midautumn-national-2026', startsAt: '2026-09-19T00:00:00+08:00', endsAt: '2026-10-08T00:00:00+08:00',
  participation: 50, invitation: 50, maxInvites: 5, appReward: 50,
  extraViewingDays: { 'view-month': 7, 'view-quarter': 30 },
} as const;
export type FestivalPhase = 'upcoming' | 'active' | 'ended';
export const festivalPhase = (now = new Date()): FestivalPhase => now < new Date(festivalConfig.startsAt) ? 'upcoming' : now >= new Date(festivalConfig.endsAt) ? 'ended' : 'active';
export const festivalTaskMaximum = festivalConfig.participation + festivalConfig.invitation * festivalConfig.maxInvites + festivalConfig.appReward;
