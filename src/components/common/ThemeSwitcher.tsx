import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

export default function ThemeSwitcher({ label = 'Theme' }: { label?: string }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    setTheme((localStorage.getItem('ivuru-theme') as Theme) || 'system');
  }, []);

  const cycle = () => {
    const next: Theme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setTheme(next);
    localStorage.setItem('ivuru-theme', next);
    const resolved =
      next === 'system'
        ? matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : next;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themeMode = next;
    window.dispatchEvent(new CustomEvent('ivuru-theme-change', { detail: resolved }));
  };

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  return (
    <button
      className="icon-button"
      type="button"
      onClick={cycle}
      aria-label={`${label}: ${theme}`}
      title={`${label}: ${theme}`}
    >
      <Icon size={18} aria-hidden="true" />
      <span className="sr-only">{theme}</span>
    </button>
  );
}
