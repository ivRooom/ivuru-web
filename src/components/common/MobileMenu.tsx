import { useEffect, useRef, useState } from 'react';
import { Code2, Gamepad2, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type Item = { label: string; href: string };

export default function MobileMenu({ items, xUrl }: { items: Item[]; xUrl: string }) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    document.body.classList.toggle('menu-open', open);
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key !== 'Tab' || !panel.current) return;
      const focusable = Array.from(panel.current.querySelectorAll<HTMLElement>('a,button'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    panel.current?.querySelector<HTMLElement>('a')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        className="menu-trigger"
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label="Open menu"
      >
        <Menu />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-menu-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              id="mobile-menu"
              ref={panel}
              className="mobile-menu-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={{ clipPath: 'inset(0 0 100% 0)' }}
              animate={{ clipPath: 'inset(0 0 0% 0)' }}
              exit={{ clipPath: 'inset(0 0 100% 0)' }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mobile-world developer-world">
                <Code2 />
                <span>Developer World</span>
              </div>
              <div className="mobile-world gamer-world">
                <Gamepad2 />
                <span>Gamer World</span>
              </div>
              <button
                className="menu-close"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X />
              </button>
              <nav>
                {items.map((item, index) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <small>0{index + 1}</small>
                    {item.label}
                  </motion.a>
                ))}
              </nav>
              <a className="menu-x" href={xUrl} target="_blank" rel="noopener noreferrer">
                X / @ivuruGG
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
