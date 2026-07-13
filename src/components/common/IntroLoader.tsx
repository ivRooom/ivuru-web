import { useEffect, useState } from 'react';

export default function IntroLoader() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (
      sessionStorage.getItem('ivuru-intro-seen') ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setVisible(false);
      return;
    }
    sessionStorage.setItem('ivuru-intro-seen', '1');
    const timer = window.setTimeout(() => setVisible(false), 960);
    return () => window.clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return (
    <div className="intro-loader" aria-hidden="true">
      <div className="intro-symbol">
        <i></i>
        <i></i>
      </div>
      <strong>ivuruGG</strong>
      <div className="intro-worlds">
        <span>DEVELOPER</span>
        <b></b>
        <span>GAMER</span>
      </div>
    </div>
  );
}
