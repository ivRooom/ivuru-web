import { useEffect, useRef, useState } from 'react';
import { Code2, Gamepad2, Menu, Radio, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { createPortal } from 'react-dom';

type Locale = 'ja' | 'en' | 'ko';
type Item = { label: string; href: string; active?: boolean };
type Props = {
  items: Item[];
  xUrl: string;
  xHandle: string;
  displayName: string;
  idName: string;
  locale?: Locale;
};

const menuCopy = {
  ja: {
    open: 'Open menu / メニューを開く',
    close: 'Close menu / メニューを閉じる',
    navigation: 'Mobile navigation / モバイルナビゲーション',
    developer: 'Developer World',
    gamer: 'Gamer World',
    signal: 'BLUE MEDIA NAVIGATION',
  },
  en: {
    open: 'Open menu',
    close: 'Close menu',
    navigation: 'Mobile navigation',
    developer: 'Developer World',
    gamer: 'Gamer World',
    signal: 'BLUE MEDIA NAVIGATION',
  },
  ko: {
    open: 'Open menu / 메뉴 열기',
    close: 'Close menu / 메뉴 닫기',
    navigation: 'Mobile navigation / 모바일 내비게이션',
    developer: 'Developer World',
    gamer: 'Gamer World',
    signal: 'BLUE MEDIA NAVIGATION',
  },
} as const;

export default function MobileMenu({
  items,
  xUrl,
  xHandle,
  displayName,
  idName,
  locale = 'ja',
}: Props) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const copy = menuCopy[locale];

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    const closeForNavigation = () => setOpen(false);
    const closeForDesktop = () => {
      if (window.matchMedia('(min-width: 1181px)').matches) setOpen(false);
    };

    document.addEventListener('astro:before-preparation', closeForNavigation);
    window.addEventListener('resize', closeForDesktop, { passive: true });

    return () => {
      document.removeEventListener('astro:before-preparation', closeForNavigation);
      window.removeEventListener('resize', closeForDesktop);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const triggerElement = trigger.current;
    const previousGap = document.body.style.getPropertyValue('--menu-scrollbar-gap');
    const scrollbarGap = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.body.style.setProperty('--menu-scrollbar-gap', `${scrollbarGap}px`);
    document.body.classList.add('menu-open');
    document.dispatchEvent(new CustomEvent('ivuru:menu-state', { detail: { open: true } }));

    const focusFrame = window.requestAnimationFrame(() => {
      panel.current?.querySelector<HTMLElement>('.menu-close')?.focus();
    });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !panel.current) return;

      const focusable = Array.from(
        panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
      ).filter((element) => !element.hasAttribute('hidden'));
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('menu-open');
      if (previousGap) document.body.style.setProperty('--menu-scrollbar-gap', previousGap);
      else document.body.style.removeProperty('--menu-scrollbar-gap');
      document.dispatchEvent(new CustomEvent('ivuru:menu-state', { detail: { open: false } }));
      window.requestAnimationFrame(() => triggerElement?.focus());
    };
  }, [open]);

  useEffect(
    () => () => {
      document.body.classList.remove('menu-open');
      document.body.style.removeProperty('--menu-scrollbar-gap');
    },
    [],
  );

  const layerMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { clipPath: 'circle(0% at calc(100% - 48px) 48px)' },
        animate: { clipPath: 'circle(150% at calc(100% - 48px) 48px)' },
        exit: { clipPath: 'circle(0% at calc(100% - 48px) 48px)' },
      };

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="mobile-menu-layer"
          {...layerMotion}
          transition={{ duration: reduceMotion ? 0.12 : 0.72, ease: [0.76, 0, 0.24, 1] }}
          onPointerDown={(event) => event.target === event.currentTarget && setOpen(false)}
        >
          <motion.div
            id="mobile-menu"
            ref={panel}
            className="mobile-menu-panel"
            role="dialog"
            aria-modal="true"
            aria-label={copy.navigation}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reduceMotion ? 0.12 : 0.4,
              delay: reduceMotion ? 0 : 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="menu-atmosphere" aria-hidden="true">
              <i></i>
              <i></i>
              <i></i>
            </div>
            <div className="mobile-menu-signal" aria-hidden="true" />
            <div className="mobile-menu-visual mobile-menu-signal-core" aria-hidden="true">
              <span className="mobile-menu-core-grid" />
              <span className="mobile-menu-core-orbit orbit-a" />
              <span className="mobile-menu-core-orbit orbit-b" />
              <span className="mobile-menu-core-scan" />
              <div className="mobile-menu-core-mark">
                <strong>IV</strong>
                <small>NAV / NODE</small>
              </div>
            </div>

            <header className="mobile-menu-topbar">
              <div className="mobile-menu-brand">
                <strong>{displayName}</strong>
                <span>
                  {idName} / {copy.signal}
                </span>
              </div>
              <button
                className="menu-close"
                type="button"
                onClick={() => setOpen(false)}
                aria-label={copy.close}
              >
                <X aria-hidden="true" />
              </button>
            </header>

            <div className="mobile-menu-worlds" aria-hidden="true">
              <motion.div
                className="menu-world-card developer"
                initial={reduceMotion ? false : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.24, duration: 0.42 }}
              >
                <Code2 />
                <span>{copy.developer}</span>
                <small>BUILD / 01</small>
              </motion.div>
              <div className="menu-world-signal">
                <Radio />
              </div>
              <motion.div
                className="menu-world-card gamer"
                initial={reduceMotion ? false : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.29, duration: 0.42 }}
              >
                <Gamepad2 />
                <span>{copy.gamer}</span>
                <small>PLAY / 02</small>
              </motion.div>
            </div>

            <nav aria-label={copy.navigation}>
              {items.map((item, index) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  className={item.active ? 'active' : undefined}
                  aria-current={item.active ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                  initial={reduceMotion ? false : { opacity: 0, y: 28, skewY: 3 }}
                  animate={{ opacity: 1, y: 0, skewY: 0 }}
                  transition={{
                    delay: reduceMotion ? 0 : 0.22 + index * 0.055,
                    duration: 0.46,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <small>{String(index + 1).padStart(2, '0')}</small>
                  <span>{item.label}</span>
                  <Sparkles aria-hidden="true" />
                </motion.a>
              ))}
            </nav>

            <footer className="mobile-menu-footer">
              <span>BUILD. PLAY. CONNECT.</span>
              <a href={xUrl} target="_blank" rel="noopener noreferrer">
                X / {xHandle} ↗
              </a>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={trigger}
        className="menu-trigger"
        type="button"
        disabled={!ready}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? copy.close : copy.open}
      >
        <motion.span
          key={open ? 'close' : 'open'}
          initial={reduceMotion ? false : { opacity: 0, rotate: -90, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </motion.span>
      </button>
      {typeof document === 'undefined' ? null : createPortal(overlay, document.body)}
    </>
  );
}
