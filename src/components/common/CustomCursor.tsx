import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (
      matchMedia('(pointer: coarse)').matches ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        dot.current?.style.setProperty(
          'transform',
          `translate(${event.clientX}px,${event.clientY}px)`,
        );
        ring.current?.style.setProperty(
          'transform',
          `translate(${event.clientX}px,${event.clientY}px)`,
        );
      });
    };
    const onOver = (event: PointerEvent) =>
      ring.current?.classList.toggle(
        'active',
        event.target instanceof Element && Boolean(event.target.closest('a,button,input')),
      );
    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('pointerover', onOver, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerover', onOver);
    };
  }, []);
  return (
    <div className="custom-cursor" aria-hidden="true" data-cursor>
      <div className="cursor-dot" ref={dot}></div>
      <div className="cursor-ring" ref={ring}></div>
    </div>
  );
}
