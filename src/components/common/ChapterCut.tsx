import { useEffect, useRef, useState } from 'react';

type ChapterMeta = {
  code: string;
  title: string;
  world: string;
};

const routes: Array<[RegExp, ChapterMeta]> = [
  [/^\/$/, { code: '00', title: 'WORLD GATE', world: 'NEXUS' }],
  [/^\/profile/, { code: '01', title: 'CHARACTER PROFILE', world: 'DEVELOPER WORLD' }],
  [/^\/works/, { code: '02', title: 'MISSION ARCHIVE', world: 'CREATIVE WORLD' }],
  [/^\/portfolio/, { code: '03', title: 'SYSTEM CONSOLE', world: 'DEVELOPER WORLD' }],
  [/^\/blog/, { code: '04', title: 'DIGITAL ARCHIVE', world: 'ARCHIVE WORLD' }],
  [/^\/contact/, { code: '05', title: 'CONTACT TERMINAL', world: 'COMMUNICATION GATE' }],
  [/^\/customer-harassment/, { code: '90', title: 'POLICY FILE', world: 'LEGAL ARCHIVE' }],
  [/^\/privacy/, { code: '91', title: 'PRIVACY FILE', world: 'LEGAL ARCHIVE' }],
  [/^\/terms/, { code: '92', title: 'TERMS FILE', world: 'LEGAL ARCHIVE' }],
];

const normalizePath = (pathname: string) => pathname.replace(/^\/(en|ko)(?=\/|$)/, '') || '/';

const getMeta = (pathname: string): ChapterMeta => {
  const normalized = normalizePath(pathname);
  return routes.find(([pattern]) => pattern.test(normalized))?.[1] ?? {
    code: '99',
    title: 'UNKNOWN ROUTE',
    world: 'WORLD GATE',
  };
};

export default function ChapterCut() {
  const [active, setActive] = useState(false);
  const [meta, setMeta] = useState<ChapterMeta>(() => ({
    code: '00',
    title: 'WORLD GATE',
    world: 'NEXUS',
  }));
  const timer = useRef<number | undefined>(undefined);
  const pendingPath = useRef<string | null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const clearTimer = () => {
      if (timer.current !== undefined) window.clearTimeout(timer.current);
      timer.current = undefined;
    };

    const show = (pathname: string) => {
      clearTimer();
      pendingPath.current = pathname;
      activeRef.current = true;
      setMeta(getMeta(pathname));
      setActive(true);
      document.documentElement.dataset.chapterCut = 'active';
    };

    const hide = () => {
      clearTimer();
      timer.current = window.setTimeout(
        () => {
          activeRef.current = false;
          pendingPath.current = null;
          setActive(false);
          delete document.documentElement.dataset.chapterCut;
        },
        reduced ? 80 : 620,
      );
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const target = event.target as Element | null;
      const anchor = target?.closest<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname && destination.hash) return;
      show(destination.pathname);
    };

    const onBeforePreparation = () => {
      if (!activeRef.current) show(pendingPath.current ?? window.location.pathname);
    };
    const onPageLoad = () => hide();

    document.addEventListener('click', onClick, true);
    document.addEventListener('astro:before-preparation', onBeforePreparation as EventListener);
    document.addEventListener('astro:page-load', onPageLoad as EventListener);
    document.addEventListener('astro:after-swap', onPageLoad as EventListener);

    return () => {
      clearTimer();
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('astro:before-preparation', onBeforePreparation as EventListener);
      document.removeEventListener('astro:page-load', onPageLoad as EventListener);
      document.removeEventListener('astro:after-swap', onPageLoad as EventListener);
      delete document.documentElement.dataset.chapterCut;
    };
  }, []);

  return (
    <div className="chapter-cut" data-active={active ? 'true' : 'false'} aria-hidden="true">
      <div className="chapter-cut-grid" />
      <div className="chapter-cut-line chapter-cut-line-a" />
      <div className="chapter-cut-line chapter-cut-line-b" />
      <div className="chapter-cut-copy">
        <span className="chapter-cut-code">CHAPTER / {meta.code}</span>
        <strong>{meta.title}</strong>
        <small>{meta.world} · CONNECTING</small>
      </div>
      <div className="chapter-cut-scan" />
    </div>
  );
}
