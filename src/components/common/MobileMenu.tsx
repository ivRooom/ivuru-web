import { useEffect, useRef, useState } from 'react';
import { Code2, Gamepad2, Menu, Radio, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { MOTION_DURATION, MOTION_EASE, MOTION_SCALE, MOTION_STAGGER } from '@/lib/motion';

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

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

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
    document.addEventListener('ivuru:route-start', closeForNavigation);
    window.addEventListener('resize', closeForDesktop, { passive: true });

    return () => {
      document.removeEventListener('astro:before-preparation', closeForNavigation);
      document.removeEventListener('ivuru:route-start', closeForNavigation);
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

    const layer = document.querySelector<HTMLElement>('.mobile-menu-layer');
    const inertedSiblings = Array.from(document.body.children)
      .filter(
        (element): element is HTMLElement =>
          element instanceof HTMLElement && element !== layer && !element.contains(layer),
      )
      .map((element) => ({ element, previous: element.inert }));
    inertedSiblings.forEach(({ element }) => {
      element.inert = true;
    });

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
        panel.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter(
        (element) =>
          !element.hasAttribute('hidden') &&
          element.getAttribute('aria-hidden') !== 'true' &&
          !element.inert,
      );
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
      inertedSiblings.forEach(({ element, previous }) => {
        element.inert = previous;
      });
      document.body.classList.remove('menu-open');
      if (previousGap) document.body.style.setProperty('--menu-scrollbar-gap', previousGap);
      else document.body.style.removeProperty('--menu-scrollbar-gap');
      document.dispatchEvent(new CustomEvent('ivuru:menu-state', { detail: { open: false } }));
      window.requestAnimationFrame(() => {
        if (triggerElement?.isConnected) triggerElement.focus();
      });
    };
  }, [open]);

  useEffect(
    () => () => {
      document.body.classList.remove('menu-open');
      document.body.style.removeProperty('--menu-scrollbar-gap');
    },
    [],
  );

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="mobile-menu-layer"
          initial={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: MOTION_SCALE.enter, y: -8 }
          }
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.995, y: -4 }}
          transition={{
            duration: reduceMotion ? 0.001 : MOTION_DURATION.standard,
            ease: MOTION_EASE.apple,
          }}
          onPointerDown={(event) => event.target === event.currentTarget && setOpen(false)}
        >
          <motion.div
            id="mobile-menu"
            ref={panel}
            className="mobile-menu-panel"
            role="dialog"
            aria-modal="true"
            aria-label={copy.navigation}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            transition={{
              duration: reduceMotion ? 0.001 : MOTION_DURATION.standard,
              ease: MOTION_EASE.apple,
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
                data-ui-action
              >
                <X aria-hidden="true" />
              </button>
            </header>

            <div className="mobile-menu-worlds" aria-hidden="true">
              <motion.div
                className="menu-world-card developer"
                initial={reduceMotion ? false : { opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: reduceMotion ? 0 : MOTION_STAGGER * 2,
                  duration: reduceMotion ? 0.001 : MOTION_DURATION.standard,
                  ease: MOTION_EASE.apple,
                }}
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
                initial={reduceMotion ? false : { opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: reduceMotion ? 0 : MOTION_STAGGER * 3,
                  duration: reduceMotion ? 0.001 : MOTION_DURATION.standard,
                  ease: MOTION_EASE.apple,
                }}
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
                  initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: reduceMotion ? 0 : MOTION_STAGGER * (index + 2),
                    duration: reduceMotion ? 0.001 : MOTION_DURATION.standard,
                    ease: MOTION_EASE.apple,
                  }}
                  data-ui-action
                >
                  <small>{String(index + 1).padStart(2, '0')}</small>
                  <span>{item.label}</span>
                  <Sparkles aria-hidden="true" />
                </motion.a>
              ))}
            </nav>

            <footer className="mobile-menu-footer">
              <span>BUILD. PLAY. CONNECT.</span>
              <a
                href={xUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-ui-external="true"
              >
                X / {xHandle}
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
        data-ui-action
      >
        <motion.span
          key={open ? 'close' : 'open'}
          initial={reduceMotion ? false : { opacity: 0, rotate: -45, scale: 0.84 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          transition={{
            duration: reduceMotion ? 0.001 : MOTION_DURATION.fast,
            ease: MOTION_EASE.spring,
          }}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </motion.span>
      </button>
      {typeof document === 'undefined' ? null : createPortal(overlay, document.body)}
    </>
  );
}
