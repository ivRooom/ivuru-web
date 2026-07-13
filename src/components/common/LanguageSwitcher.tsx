import { useEffect, useRef, useState } from 'react';
import { Languages } from 'lucide-react';

const locales = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
];

function localizedPath(code: string) {
  const path = window.location.pathname.replace(/^\/(en|ko)(?=\/|$)/, '') || '/';
  return code === 'ja' ? path : `/${code}${path === '/' ? '' : path}`;
}

export default function LanguageSwitcher({ current }: { current: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const choose = (code: string) => {
    if (code === current) {
      setOpen(false);
      return;
    }
    localStorage.setItem('ivuru-locale', code);
    window.location.assign(localizedPath(code));
  };

  return (
    <div ref={root} className="language-switcher">
      <button
        ref={button}
        className="icon-button language-button"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="language-menu"
        aria-label="Language"
      >
        <Languages size={18} aria-hidden="true" />
        <span>{current.toUpperCase()}</span>
      </button>
      {open && (
        <div id="language-menu" className="language-menu" role="menu">
          {locales.map((locale) => (
            <button
              key={locale.code}
              type="button"
              role="menuitem"
              aria-current={current === locale.code ? 'true' : undefined}
              onClick={() => choose(locale.code)}
            >
              <span>{locale.label}</span>
              <small>{locale.code.toUpperCase()}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}