import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type Progress, type Session } from '../services/api';
export function readLocal<T>(key: string, fallback: T): T { try { const v = JSON.parse(localStorage.getItem(key) ?? 'null'); return v === null ? fallback : v; } catch { return fallback; } }
function persist(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage can be unavailable; state remains usable. */ } }
type Records = { following: string[]; saved: string[]; liked: string[]; history: Progress[] };
const empty: Records = { following: [], saved: [], liked: [], history: [] };
function readRecords(key: string): Records {
  const v = readLocal<Partial<Records>>(key, empty);
  const ids = (value: unknown) => Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string'))] : [];
  const history = Array.isArray(v?.history) ? v.history.filter(p => p && typeof p.contentId === 'string' && typeof p.episodeId === 'string' && Number.isFinite(p.seconds) && Number.isFinite(p.duration) && p.seconds >= 0 && p.duration > 0 && typeof p.updatedAt === 'string') : [];
  const library = [...new Set([...ids(v?.following), ...ids(v?.saved)])];
  return { following: library, saved: library, liked: ids(v?.liked), history };
}
type State = { session: Session | null; checking: boolean; accept: (s: Session | null) => void; records: Records; toggle: (kind: 'following' | 'saved' | 'liked', id: string) => void; saveProgress: (p: Progress) => void; clearHistory: (id?: string) => void; clearRecords: (scope: 'ordinary' | 'private') => void; login: () => void };
const Context = createContext<State>(null!);
export function AppState({ children, login }: { children: ReactNode; login: () => void }) {
  const [session, setSession] = useState<Session | null>(null), [checking, setChecking] = useState(true);
  const key = 'aiai-app-records:' + (session?.subject ?? 'guest');
  const [records, setRecords] = useState<Records>(() => readRecords('aiai-app-records:guest'));
  const accept = (s: Session | null) => { setSession(s?.subject ? s : null); setRecords(readRecords('aiai-app-records:' + (s?.subject ?? 'guest'))); };
  useEffect(() => { const c = new AbortController(); api<Session>('/session', 'GET', undefined, c.signal).then(s => { if (!c.signal.aborted) accept(s); }).catch(() => {}).finally(() => { if (!c.signal.aborted) setChecking(false); }); const expire = () => accept(null); window.addEventListener('aiai-session-expired', expire); return () => { c.abort(); window.removeEventListener('aiai-session-expired', expire); }; }, []);
  const update = (fn: (current: Records) => Records) => setRecords(current => { const next = fn(current); persist(key, next); return next; });
  const toggle: State['toggle'] = (kind, id) => update(r => { if (kind === 'following' || kind === 'saved') { const list = r.following.includes(id) ? r.following.filter(v => v !== id) : [...r.following, id]; return { ...r, following: list, saved: list }; } return { ...r, liked: r.liked.includes(id) ? r.liked.filter(v => v !== id) : [...r.liked, id] }; });
  const saveProgress = (p: Progress) => { update(r => ({ ...r, history: [p, ...r.history.filter(v => v.contentId !== p.contentId)].slice(0, 200) })); if (session?.subject) void api('/me/watch-progress', 'PUT', p).catch(() => {}); };
  const clearHistory = (id?: string) => update(r => ({ ...r, history: id ? r.history.filter(p => p.contentId !== id) : [] }));
  const clearRecords: State['clearRecords'] = scope => { if (scope === 'ordinary') update(() => ({ ...empty })); else { try { sessionStorage.removeItem('aiai-adult-confirmed'); } catch {} } };
  return <Context.Provider value={{ session, checking, accept, records, toggle, saveProgress, clearHistory, clearRecords, login }}>{children}</Context.Provider>;
}
export const useApp = () => useContext(Context);
export function useRoute() {
  const read = () => location.hash.slice(1) || '/';
  const [route, setRoute] = useState(read);
  useEffect(() => { const change = () => setRoute(read()); window.addEventListener('hashchange', change); window.addEventListener('popstate', change); return () => { window.removeEventListener('hashchange', change); window.removeEventListener('popstate', change); }; }, []);
  const navigate = (to: string, replace = false) => { if (!to.startsWith('/') || to.startsWith('//')) return; if (replace) history.replaceState(history.state, '', '#' + to); else if (read() !== to) history.pushState({ aiaiApp: true }, '', '#' + to); setRoute(to); };
  return { route, navigate };
}
