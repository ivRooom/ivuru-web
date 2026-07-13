import { useEffect, useRef, useState } from 'react';
import { Code2, Gamepad2, Menu, Radio, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

type Item = { label: string; href: string; active?: boolean };
type Props = {
  items: Item[];
  xUrl: string;
  xHandle: string;
  displayName: string;
  idName: string;
};

export default function MobileMenu({ items, xUrl, xHandle, displayName, idName }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

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

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="mobile-menu-layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onPointerDown={(event) => event.target === event.currentTarget && setOpen(false)}
        >
          <motion.div
            id="mobile-menu"
            ref={panel}
            className="mobile-menu-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            initial={{ opacity: 0, y: -20, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.995 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="menu-atmosphere" aria-hidden="true">
              <i></i><i></i><i></i>
            </div>

            <header className="mobile-menu-topbar">
              <div className="mobile-menu-brand">
                <strong>{displayName}</strong>
                <span>{idName} / WORLD NAVIGATOR</span>
              </div>
              <button
                className="menu-close"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X aria-hidden="true" />
              </button>
            </header>

            <div className="mobile-menu-worlds" aria-hidden="true">
              <div className="menu-world-card developer">
                <Code2 />
                <span>Developer World</span>
                <small>BUILD / 01</small>
              </div>
              <div className="menu-world-signal"><Radio /></div>
              <div className="menu-world-card gamer">
                <Gamepad2 />
                <span>Gamer World</span>
                <small>PLAY / 02</small>
              </div>
            </div>

            <nav aria-label="Mobile navigation">
              {items.map((item, index) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  className={item.active ? 'active' : undefined}
                  aria-current={item.active ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + index * 0.035, duration: 0.3 }}
                >
                  <small>{String(index + 1).padStart(2, '0')}</small>
                  <span>{item.label}</span>
                  <Sparkles aria-hidden="true" />
                </motion.a>
              ))}
            </nav>

            <footer className="mobile-menu-footer">
              <span>BUILD. PLAY. CREATE.</span>
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
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      {mounted ? createPortal(overlay, document.body) : null}
    </>
  );
}
