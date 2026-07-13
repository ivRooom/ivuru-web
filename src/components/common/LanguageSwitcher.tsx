import { useState } from 'react';
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
  const choose = (code: string) => {
    localStorage.setItem('ivuru-locale', code);
    window.location.assign(localizedPath(code));
  };
  return (
    <div className="language-switcher">
      <button
        className="icon-button language-button"
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Language"
      >
        <Languages size={18} aria-hidden="true" />
        <span>{current.toUpperCase()}</span>
      </button>
      {open && (
        <div className="language-menu" role="menu">
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
