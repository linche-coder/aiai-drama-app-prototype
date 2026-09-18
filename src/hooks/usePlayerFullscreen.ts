import { useEffect, useRef, useState, type RefObject } from 'react';

type FullscreenVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void; webkitExitFullscreen?: () => void; webkitDisplayingFullscreen?: boolean };
type FullscreenElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FullscreenDocument = Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => Promise<void> | void };

export function usePlayerFullscreen(container: RefObject<HTMLElement | null>, video: RefObject<HTMLVideoElement | null>, mediaKey: unknown, notify: (message: string) => void, restoreRate: () => void) {
  const [fullscreen, setFullscreen] = useState(false);
  const restore = useRef(restoreRate); restore.current = restoreRate;
  const doc = document as FullscreenDocument;
  useEffect(() => {
    const element = video.current as FullscreenVideo | null;
    const sync = () => { setFullscreen(doc.fullscreenElement === container.current || doc.webkitFullscreenElement === container.current || !!element?.webkitDisplayingFullscreen); restore.current(); };
    const begin = () => { setFullscreen(true); restore.current(); }, end = () => { setFullscreen(false); restore.current(); };
    doc.addEventListener('fullscreenchange', sync);
    doc.addEventListener('webkitfullscreenchange', sync);
    element?.addEventListener('webkitbeginfullscreen', begin);
    element?.addEventListener('webkitendfullscreen', end);
    // Keep Escape inside the player; never navigate back when leaving fullscreen.
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !(doc.fullscreenElement === container.current || doc.webkitFullscreenElement === container.current) || container.current?.querySelector('[aria-modal="true"]')) return;
      event.preventDefault(); event.stopImmediatePropagation();
      const exit = doc.exitFullscreen?.bind(doc) ?? doc.webkitExitFullscreen?.bind(doc);
      if (exit) void Promise.resolve(exit()).catch(() => notify('退出全屏失败，请使用系统返回操作。'));
    };
    window.addEventListener('keydown', escape, true);
    sync();
    return () => { doc.removeEventListener('fullscreenchange', sync); doc.removeEventListener('webkitfullscreenchange', sync); element?.removeEventListener('webkitbeginfullscreen', begin); element?.removeEventListener('webkitendfullscreen', end); window.removeEventListener('keydown', escape, true); };
  }, [mediaKey, container, video]);
  async function toggleFullscreen() {
    const element = container.current as FullscreenElement | null, player = video.current as FullscreenVideo | null;
    try {
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        const exit = doc.exitFullscreen?.bind(doc) ?? doc.webkitExitFullscreen?.bind(doc);
        if (exit) await exit(); return;
      }
      if (player?.webkitDisplayingFullscreen) { player.webkitExitFullscreen?.(); return; }
      if (element?.requestFullscreen && doc.fullscreenEnabled) { await element.requestFullscreen(); return; }
      if (element?.webkitRequestFullscreen) { await element.webkitRequestFullscreen(); return; }
      if (player?.webkitEnterFullscreen && player.readyState > 0) { player.webkitEnterFullscreen(); return; }
      notify('此浏览器暂不支持全屏；原生视频全屏需片源加载后使用。');
    } catch { notify('无法进入全屏，请检查浏览器权限或使用支持全屏的浏览器。'); }
  }
  return { fullscreen, toggleFullscreen };
}


