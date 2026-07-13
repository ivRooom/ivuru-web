import { useEffect, useState } from 'react';
export default function ScrollProgress() {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const onScroll = () =>
      setValue(window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight));
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="scroll-progress" aria-hidden="true" style={{ transform: `scaleX(${value})` }} />
  );
}
