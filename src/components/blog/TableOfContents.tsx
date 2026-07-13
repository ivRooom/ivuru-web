import { useEffect, useState } from 'react';
export default function TableOfContents({ label }: { label: string }) {
  const [items, setItems] = useState<{ id: string; text: string; level: number }[]>([]);
  useEffect(() => {
    setItems(
      [...document.querySelectorAll<HTMLElement>('.article-body h2,.article-body h3')].map(
        (heading, index) => {
          if (!heading.id) heading.id = `section-${index + 1}`;
          return {
            id: heading.id,
            text: heading.textContent || '',
            level: Number(heading.tagName[1]),
          };
        },
      ),
    );
  }, []);
  if (!items.length) return null;
  return (
    <nav className="article-toc" aria-label={label}>
      <p>{label}</p>
      {items.map((item) => (
        <a key={item.id} href={`#${item.id}`} data-level={item.level}>
          {item.text}
        </a>
      ))}
    </nav>
  );
}
